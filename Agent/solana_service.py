"""Solana service: wallet operations, deposit monitoring, withdrawals."""
import os
import logging
import base64
from typing import Optional, List, Dict, Any
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.transaction import Transaction
from solders.message import Message
from solders.signature import Signature
from solders.instruction import Instruction, AccountMeta
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed, Finalized
from solana.rpc.types import TxOpts

logger = logging.getLogger(__name__)

LAMPORTS_PER_SOL = 1_000_000_000
MEMO_PROGRAM_ID = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")

PRIVATE_KEY = os.environ.get("SOLANA_PRIVATE_KEY", "")
RPC_URL = os.environ.get("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")

_keypair: Optional[Keypair] = None
if PRIVATE_KEY:
    try:
        _keypair = Keypair.from_base58_string(PRIVATE_KEY)
        logger.info(f"Solana wallet loaded: {_keypair.pubkey()}")
    except Exception as e:
        logger.error(f"Failed to load Solana keypair: {e}")


def get_pubkey() -> str:
    if not _keypair:
        return ""
    return str(_keypair.pubkey())


def lamports_to_sol(lamports: int) -> float:
    return lamports / LAMPORTS_PER_SOL


def sol_to_lamports(sol: float) -> int:
    return int(round(sol * LAMPORTS_PER_SOL))


async def get_balance_sol() -> float:
    if not _keypair:
        return 0.0
    async with AsyncClient(RPC_URL) as cli:
        r = await cli.get_balance(_keypair.pubkey(), commitment=Confirmed)
        return lamports_to_sol(r.value)


async def get_recent_signatures(limit: int = 25) -> List[Dict[str, Any]]:
    """Return recent inbound transactions to our wallet with memo + amount parsed."""
    if not _keypair:
        return []
    async with AsyncClient(RPC_URL) as cli:
        sigs = await cli.get_signatures_for_address(
            _keypair.pubkey(), limit=limit, commitment=Confirmed
        )
        result = []
        for s in sigs.value:
            if s.err is not None:
                continue
            sig_str = str(s.signature)
            memo_text = None
            amount_lamports = 0
            try:
                tx = await cli.get_transaction(
                    s.signature,
                    commitment=Confirmed,
                    max_supported_transaction_version=0,
                )
                if not tx.value or not tx.value.transaction:
                    continue
                tx_meta = tx.value.transaction.meta
                tx_msg = tx.value.transaction.transaction.message

                # find our account index in the static keys
                our_key_str = str(_keypair.pubkey())
                account_keys = [str(k) for k in tx_msg.account_keys]
                if our_key_str not in account_keys:
                    continue
                idx = account_keys.index(our_key_str)

                pre = tx_meta.pre_balances[idx] if tx_meta and tx_meta.pre_balances else 0
                post = tx_meta.post_balances[idx] if tx_meta and tx_meta.post_balances else 0
                diff = post - pre
                if diff <= 0:
                    continue  # not an inbound
                amount_lamports = diff

                # parse memo from log messages (look for "Memo (len xx): \"...\"")
                if tx_meta and tx_meta.log_messages:
                    for log in tx_meta.log_messages:
                        if "Memo" in log and '"' in log:
                            # pattern: Program log: Memo (len 8): "clp_abcd1234"
                            start = log.find('"')
                            end = log.rfind('"')
                            if start >= 0 and end > start:
                                memo_text = log[start + 1 : end]
                                break
            except Exception as e:
                logger.debug(f"tx parse failed {sig_str}: {e}")
                continue

            result.append({
                "signature": sig_str,
                "slot": s.slot,
                "block_time": s.block_time,
                "memo": memo_text,
                "amount_lamports": amount_lamports,
                "amount_sol": lamports_to_sol(amount_lamports),
            })
        return result


async def send_sol(to_address: str, amount_sol: float) -> Dict[str, Any]:
    """Transfer SOL from the platform wallet to `to_address`. Returns signature."""
    if not _keypair:
        raise RuntimeError("wallet not loaded")
    try:
        dest = Pubkey.from_string(to_address)
    except Exception:
        raise ValueError("invalid destination address")

    lamports = sol_to_lamports(amount_sol)
    if lamports <= 0:
        raise ValueError("amount must be > 0")

    async with AsyncClient(RPC_URL) as cli:
        # check our balance
        bal = await cli.get_balance(_keypair.pubkey(), commitment=Confirmed)
        # reserve ~5000 lamports for fee
        if bal.value < lamports + 10_000:
            raise ValueError(f"insufficient platform balance ({lamports_to_sol(bal.value):.4f} SOL)")

        bh = await cli.get_latest_blockhash(commitment=Confirmed)
        recent_bh = bh.value.blockhash

        ix = transfer(TransferParams(
            from_pubkey=_keypair.pubkey(),
            to_pubkey=dest,
            lamports=lamports,
        ))
        msg = Message.new_with_blockhash([ix], _keypair.pubkey(), recent_bh)
        tx = Transaction([_keypair], msg, recent_bh)

        resp = await cli.send_transaction(tx, opts=TxOpts(skip_preflight=False, preflight_commitment=Confirmed))
        sig = str(resp.value)
        logger.info(f"sent {amount_sol} SOL to {to_address}: {sig}")
        return {"signature": sig, "amount_sol": amount_sol, "to": to_address}
