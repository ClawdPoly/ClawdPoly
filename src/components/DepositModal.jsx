import React, { useEffect, useState, useCallback } from "react";
import { Copy, Check, X, Wallet, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import { apiAgents, apiWallet } from "../lib/api";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export default function DepositModal({ open, onClose, agentId, onConfirmed }) {
  const [funding, setFunding] = useState(null);
  const [amount, setAmount] = useState("0.1");
  const [intent, setIntent] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const [txSig, setTxSig] = useState(null);
  const [paying, setPaying] = useState(false);

  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (open) {
      setIntent(null); setErr(""); setCopied(false); setTxSig(null); setPolling(false);
      apiWallet.funding().then(setFunding).catch(() => {});
    }
  }, [open]);

  const generate = async () => {
    setErr("");
    const n = parseFloat(amount);
    if (!n || n < (funding?.min_deposit || 0.1)) {
      return setErr(`minimum deposit is ${funding?.min_deposit || 0.1} SOL`);
    }
    try {
      const it = await apiAgents.depositIntent(agentId, n);
      setIntent(it);
    } catch (e) {
      setErr(e?.response?.data?.detail || "failed to create deposit");
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Poll for confirmation
  const poll = useCallback(async () => {
    if (!intent) return;
    try {
      const d = await apiWallet.depositStatus(intent.intent_id);
      setIntent(d);
      if (d.status === "confirmed") {
        setPolling(false);
        onConfirmed?.();
      }
    } catch {}
  }, [intent, onConfirmed]);

  useEffect(() => {
    if (!intent || intent.status === "confirmed") return;
    setPolling(true);
    const t = setInterval(poll, 6000);
    return () => clearInterval(t);
  }, [intent, poll]);

  const payWithPhantom = async () => {
    if (!intent || !connected || !publicKey) return;
    setErr(""); setPaying(true);
    try {
      const dest = new PublicKey(intent.address);
      const lamports = Math.round(parseFloat(intent.amount_sol) * LAMPORTS_PER_SOL);
      const tx = new Transaction();
      tx.add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: dest,
        lamports,
      }));
      tx.add(new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(intent.memo, "utf-8"),
      }));
      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
      // backend poller will pick it up once confirmed
    } catch (e) {
      setErr(e?.message || "transaction failed");
    } finally {
      setPaying(false);
    }
  };

  if (!open) return null;

  const confirmed = intent?.status === "confirmed";
  const qrUri = intent
    ? `solana:${intent.address}?amount=${intent.amount_sol}&memo=${encodeURIComponent(intent.memo)}`
    : null;
  const qrUrl = qrUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=0a0e1a&color=ffffff&margin=8&data=${encodeURIComponent(qrUri)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0b0f1a] p-6 shadow-[0_20px_60px_-10px_rgba(59,130,246,0.2)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-[#3b82f6]/15 border border-[#3b82f6]/25 flex items-center justify-center text-[#60a5fa]">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="font-display text-white text-[18px]">Deposit SOL</div>
              <div className="font-mono text-[11px] text-white/45">solana · mainnet</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/55"><X className="w-4 h-4" /></button>
        </div>

        {!intent ? (
          <>
            <div className="mb-4">
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/45">amount (SOL)</label>
              <input
                type="number"
                step="0.1"
                min={funding?.min_deposit || 0.1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 w-full bg-[#0a0e1a] border border-white/10 rounded-md px-3 py-2.5 text-[15px] font-mono focus:outline-none focus:border-[#3b82f6]/60"
              />
              <div className="font-mono text-[11px] text-white/40 mt-1">minimum {funding?.min_deposit || 0.1} SOL</div>
            </div>
            {err && <div className="font-mono text-[12px] text-[#ef4444] mb-3">{err}</div>}
            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[13px] text-white/70">cancel</button>
              <button onClick={generate} className="px-4 py-2 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white text-[13px] font-medium">generate deposit</button>
            </div>
          </>
        ) : (
          <>
            {confirmed ? (
              <div className="rounded-md border border-[#22c55e]/40 bg-[#22c55e]/10 p-4 flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-display text-[15px] text-white">Deposit received</div>
                  <div className="font-mono text-[11px] text-white/60 mt-1">
                    +{intent.received_amount_sol?.toFixed(4) || intent.amount_sol} SOL credited to agent
                  </div>
                  {intent.signature && (
                    <a
                      href={`https://solscan.io/tx/${intent.signature}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 font-mono text-[11px] text-[#60a5fa] hover:text-[#3b82f6]"
                    >
                      view on solscan <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-2 rounded-md border border-white/10 bg-[#0a0e1a]">
                    <img src={qrUrl} alt="qr" className="w-[200px] h-[200px]" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/45 mb-1">
                    <span>send exactly</span>
                    {polling && <span className="inline-flex items-center gap-1 text-[#60a5fa] normal-case"><Loader2 className="w-3 h-3 animate-spin" /> watching chain…</span>}
                  </div>
                  <div className="rounded-md border border-white/10 bg-[#0a0e1a] px-3 py-2.5 font-mono text-white text-[18px]">
                    {intent.amount_sol} <span className="text-white/40 text-[13px]">SOL</span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-white/45">to address</label>
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-white/10 bg-[#0a0e1a] px-3 py-2">
                    <code className="flex-1 truncate font-mono text-[12px] text-white/80">{intent.address}</code>
                    <button onClick={() => copy(intent.address)} className="p-1.5 rounded hover:bg-white/[0.08] text-white/60">
                      {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-white/45">memo (required)</label>
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-[#eab308]/40 bg-[#eab308]/5 px-3 py-2">
                    <code className="flex-1 truncate font-mono text-[12px] text-[#eab308]">{intent.memo}</code>
                    <button onClick={() => copy(intent.memo)} className="p-1.5 rounded hover:bg-white/[0.08] text-white/60">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-white/45 mt-1">
                    must be included in the transfer's memo so we credit the right agent.
                  </div>
                </div>

                {connected && publicKey ? (
                  <button
                    onClick={payWithPhantom}
                    disabled={paying || !!txSig}
                    className="w-full px-4 py-2.5 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] disabled:opacity-60 text-white text-[13px] font-medium flex items-center justify-center gap-2"
                  >
                    {paying ? (<><Loader2 className="w-4 h-4 animate-spin" /> signing…</>) :
                      txSig ? "sent — waiting for confirmation…" :
                      (<><Wallet className="w-4 h-4" /> pay with Phantom</>)}
                  </button>
                ) : (
                  <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-white/50">
                    Or connect Phantom at the top of the page to pay in one click.
                  </div>
                )}
                {txSig && (
                  <a
                    href={`https://solscan.io/tx/${txSig}`} target="_blank" rel="noreferrer"
                    className="mt-2 block font-mono text-[11px] text-[#60a5fa] hover:text-[#3b82f6] truncate"
                  >tx: {txSig.slice(0, 12)}… → solscan</a>
                )}
                {err && <div className="font-mono text-[12px] text-[#ef4444] mt-2">{err}</div>}
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[13px] text-white/70">
                {confirmed ? "done" : "close"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
