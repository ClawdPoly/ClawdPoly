from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging
import httpx
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage
import nacl.signing
import base58 as b58
import secrets

import solana_service as sol

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Helpers ----------
def now_utc():
    return datetime.now(timezone.utc)

async def get_current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get('session_token')
    if not token:
        auth = request.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            token = auth[7:]
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    exp = sess.get('expires_at')
    if isinstance(exp, str):
        try:
            exp = datetime.fromisoformat(exp)
        except Exception:
            return None
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp and exp < now_utc():
        return None
    user = await db.users.find_one({"user_id": sess['user_id']}, {"_id": 0})
    return user

async def require_user(request: Request) -> dict:
    u = await get_current_user(request)
    if not u:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return u

# ---------- AUTH ----------
class SessionPayload(BaseModel):
    session_id: str

@api.post('/auth/session')
async def auth_session(payload: SessionPayload, response: Response):
    try:
        async with httpx.AsyncClient(timeout=15.0) as cli:
            r = await cli.get(
                'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
                headers={'X-Session-ID': payload.session_id}
            )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail='Invalid session')
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'auth error: {e}')
        raise HTTPException(status_code=500, detail='Auth failure')

    email = data.get('email')
    name = data.get('name')
    picture = data.get('picture')
    session_token = data.get('session_token')
    if not email or not session_token:
        raise HTTPException(status_code=400, detail='Invalid session data')

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing['user_id']
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "last_login": now_utc()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": now_utc(),
            "last_login": now_utc(),
        })

    expires_at = now_utc() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": now_utc(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 3600,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc}

@api.get('/auth/me')
async def auth_me(request: Request):
    u = await require_user(request)
    return u

@api.post('/auth/logout')
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get('session_token')
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie('session_token', path='/', samesite='none', secure=True)
    return {"ok": True}

# ---------- PHANTOM WALLET AUTH ----------
class PhantomChallengeIn(BaseModel):
    pubkey: str

class PhantomVerifyIn(BaseModel):
    pubkey: str
    signature: str  # base58-encoded signature
    nonce: str      # the original message that was signed

@api.post('/auth/phantom/challenge')
async def phantom_challenge(payload: PhantomChallengeIn):
    try:
        b58.b58decode(payload.pubkey)
    except Exception:
        raise HTTPException(400, "invalid pubkey")
    nonce = f"Sign in to ClawdPoly\n\nnonce: {secrets.token_hex(16)}\nissued: {now_utc().isoformat()}"
    await db.phantom_challenges.insert_one({
        "pubkey": payload.pubkey,
        "nonce": nonce,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(minutes=5),
    })
    return {"nonce": nonce}

@api.post('/auth/phantom/verify')
async def phantom_verify(payload: PhantomVerifyIn, response: Response):
    # pull most recent challenge for this pubkey + nonce
    chal = await db.phantom_challenges.find_one(
        {"pubkey": payload.pubkey, "nonce": payload.nonce}, {"_id": 0}
    )
    if not chal:
        raise HTTPException(400, "no matching challenge")
    exp = chal.get('expires_at')
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now_utc():
        raise HTTPException(400, "challenge expired")

    # verify ed25519 signature
    try:
        pk_bytes = b58.b58decode(payload.pubkey)
        sig_bytes = b58.b58decode(payload.signature)
        vk = nacl.signing.VerifyKey(pk_bytes)
        vk.verify(payload.nonce.encode('utf-8'), sig_bytes)
    except Exception as e:
        logger.warning(f"phantom sig verify failed: {e}")
        raise HTTPException(401, "invalid signature")

    # consume challenge
    await db.phantom_challenges.delete_many({"pubkey": payload.pubkey})

    # upsert user
    wallet_email = f"{payload.pubkey[:8]}.phantom@wallet.local"
    existing = await db.users.find_one({"wallet_address": payload.pubkey}, {"_id": 0})
    if existing:
        user_id = existing['user_id']
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"last_login": now_utc()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        short = payload.pubkey[:4] + "..." + payload.pubkey[-4:]
        await db.users.insert_one({
            "user_id": user_id,
            "email": wallet_email,
            "name": f"phantom {short}",
            "picture": None,
            "wallet_address": payload.pubkey,
            "auth_method": "phantom",
            "created_at": now_utc(),
            "last_login": now_utc(),
        })

    session_token = f"phantom_{secrets.token_urlsafe(32)}"
    expires_at = now_utc() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": now_utc(),
    })
    response.set_cookie(
        key="session_token", value=session_token,
        max_age=7 * 24 * 3600, httponly=True, secure=True, samesite="none", path="/",
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc}

# ---------- POLYMARKET ----------
_market_cache = {"data": [], "ts": 0}
CACHE_TTL = 300  # 5 min

async def _fetch_polymarket():
    """Fetch live prediction markets from Polymarket Gamma API."""
    url = "https://gamma-api.polymarket.com/markets"
    params = {
        "closed": "false",
        "active": "true",
        "archived": "false",
        "limit": 120,
        "order": "volumeNum",
        "ascending": "false",
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as cli:
            r = await cli.get(url, params=params)
            r.raise_for_status()
            raw = r.json()
    except Exception as e:
        logger.error(f'polymarket fetch failed: {e}')
        return []

    markets = []
    for m in raw:
        try:
            # Pull YES probability from outcomePrices
            yes_price = None
            op = m.get('outcomePrices')
            if isinstance(op, str):
                import json as _json
                try:
                    op = _json.loads(op)
                except Exception:
                    op = None
            if isinstance(op, list) and len(op) >= 1:
                try:
                    yes_price = float(op[0])
                except Exception:
                    yes_price = None
            yes_pct = int(round((yes_price or 0) * 100)) if yes_price is not None else 0

            vol = m.get('volumeNum') or m.get('volume') or 0
            try:
                vol = float(vol)
            except Exception:
                vol = 0.0

            slug = m.get('slug') or m.get('marketMakerAddress') or ''
            category = (m.get('category') or m.get('groupItemTitle') or 'other')
            if isinstance(category, str):
                category = category.lower()
            # normalize cats
            mapcat = {
                'politics': 'politics', 'election': 'politics', 'elections': 'politics',
                'crypto': 'crypto', 'bitcoin': 'crypto', 'ethereum': 'crypto',
                'sports': 'sports', 'nba': 'sports', 'nfl': 'sports', 'mlb': 'sports', 'soccer': 'sports',
                'economy': 'economy', 'business': 'economy', 'macro': 'economy', 'fed': 'economy',
                'tech': 'tech', 'technology': 'tech', 'ai': 'tech',
                'stocks': 'stocks', 'finance': 'stocks',
            }
            cat_key = mapcat.get(category, None)
            if not cat_key:
                q_lower = (m.get('question') or '').lower()
                for k, v in mapcat.items():
                    if k in q_lower:
                        cat_key = v
                        break
            cat_key = cat_key or 'other'

            markets.append({
                "id": m.get('id') or slug,
                "slug": slug,
                "cat": cat_key,
                "q": m.get('question') or m.get('title') or '',
                "img": m.get('image') or m.get('icon') or '',
                "yes": yes_pct,
                "vol_num": vol,
                "vol": _fmt_money(vol),
                "end_date": m.get('endDate'),
            })
        except Exception:
            continue
    # filter out empty and sort by volume
    markets = [mm for mm in markets if mm['q']]
    markets.sort(key=lambda x: -x['vol_num'])
    return markets

def _fmt_money(n: float) -> str:
    if n >= 1_000_000_000:
        return f"{n/1_000_000_000:.2f}B"
    if n >= 1_000_000:
        return f"{n/1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n/1_000:.1f}K"
    return f"{n:.0f}"

async def get_markets():
    now = datetime.now().timestamp()
    if _market_cache['data'] and (now - _market_cache['ts']) < CACHE_TTL:
        return _market_cache['data']
    data = await _fetch_polymarket()
    if data:
        _market_cache['data'] = data
        _market_cache['ts'] = now
    return _market_cache['data']

@api.get('/markets')
async def list_markets(category: Optional[str] = None, search: Optional[str] = None, limit: int = 60):
    data = await get_markets()
    out = data
    if category and category != 'all':
        out = [m for m in out if m['cat'] == category.lower()]
    if search:
        s = search.lower()
        out = [m for m in out if s in m['q'].lower()]
    return {"markets": out[:limit], "total": len(out)}

@api.get('/stats')
async def stats():
    data = await get_markets()
    total_vol = sum(m['vol_num'] for m in data)
    agents_count = await db.agents.count_documents({})
    return {
        "volume": _fmt_money(total_vol) if total_vol else "$0",
        "volume_raw": total_vol,
        "markets_live": len(data),
        "liquidity": _fmt_money(total_vol * 0.08) if total_vol else "$0",
        "agents_deployed": agents_count,
    }

# ---------- AGENTS ----------
AVAILABLE_MODELS = [
    {"provider": "openai", "model": "gpt-5.2", "label": "GPT-5.2"},
    {"provider": "openai", "model": "gpt-5.1", "label": "GPT-5.1"},
    {"provider": "openai", "model": "gpt-5", "label": "GPT-5"},
    {"provider": "openai", "model": "gpt-5-mini", "label": "GPT-5 Mini"},
    {"provider": "openai", "model": "gpt-4.1", "label": "GPT-4.1"},
    {"provider": "openai", "model": "gpt-4o", "label": "GPT-4o"},
    {"provider": "openai", "model": "o3", "label": "o3"},
    {"provider": "openai", "model": "o4-mini", "label": "o4-mini"},
    {"provider": "anthropic", "model": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6"},
    {"provider": "anthropic", "model": "claude-opus-4-6", "label": "Claude Opus 4.6"},
    {"provider": "anthropic", "model": "claude-sonnet-4-5-20250929", "label": "Claude Sonnet 4.5"},
    {"provider": "anthropic", "model": "claude-opus-4-5-20251101", "label": "Claude Opus 4.5"},
    {"provider": "anthropic", "model": "claude-haiku-4-5-20251001", "label": "Claude Haiku 4.5"},
    {"provider": "gemini", "model": "gemini-3.1-pro-preview", "label": "Gemini 3.1 Pro"},
    {"provider": "gemini", "model": "gemini-3-flash-preview", "label": "Gemini 3 Flash"},
    {"provider": "gemini", "model": "gemini-2.5-pro", "label": "Gemini 2.5 Pro"},
    {"provider": "gemini", "model": "gemini-2.5-flash", "label": "Gemini 2.5 Flash"},
]

@api.get('/models')
async def list_models():
    return AVAILABLE_MODELS

FUNDING_ADDRESS = sol.get_pubkey() or "6BFohrAmiSwkn3xi6a4MsezQbeKmBAhG6ToJ3uR3Qcao"
MIN_DEPOSIT_SOL = 0.1
MIN_WITHDRAW_SOL = 0.01

class AgentCreate(BaseModel):
    name: str
    thesis: str = ''
    provider: str
    model: str
    watched_markets: List[str] = []  # list of polymarket slugs

class FundPayload(BaseModel):
    amount: float

class DepositIntent(BaseModel):
    agent_id: str
    amount: float

class WithdrawPayload(BaseModel):
    agent_id: str
    amount: float
    destination: str

@api.get('/funding')
async def funding_info():
    return {
        "address": FUNDING_ADDRESS,
        "chain": "solana",
        "network": os.environ.get("SOLANA_NETWORK", "mainnet-beta"),
        "symbol": "SOL",
        "min_deposit": MIN_DEPOSIT_SOL,
        "min_withdraw": MIN_WITHDRAW_SOL,
    }

@api.get('/wallet/status')
async def wallet_status():
    try:
        bal = await sol.get_balance_sol()
    except Exception:
        bal = None
    return {"address": FUNDING_ADDRESS, "platform_balance_sol": bal}

class AgentOut(BaseModel):
    agent_id: str
    user_id: str
    name: str
    thesis: str
    provider: str
    model: str
    created_at: datetime
    pnl: float = 0.0
    trades_count: int = 0

@api.post('/agents')
async def create_agent(payload: AgentCreate, request: Request):
    user = await require_user(request)
    agent_id = f"agent_{uuid.uuid4().hex[:10]}"
    doc = {
        "agent_id": agent_id,
        "user_id": user['user_id'],
        "name": payload.name.strip()[:48] or 'oracle',
        "thesis": payload.thesis.strip()[:500],
        "provider": payload.provider,
        "model": payload.model,
        "watched_markets": payload.watched_markets[:25] if payload.watched_markets else [],
        "balance": 0.0,
        "created_at": now_utc(),
        "pnl": 0.0,
        "trades_count": 0,
    }
    await db.agents.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api.get('/agents')
async def list_agents(request: Request):
    user = await require_user(request)
    cur = db.agents.find({"user_id": user['user_id']}, {"_id": 0}).sort('created_at', -1)
    return await cur.to_list(200)

@api.get('/agents/{agent_id}')
async def get_agent(agent_id: str, request: Request):
    user = await require_user(request)
    a = await db.agents.find_one({"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0})
    if not a:
        raise HTTPException(404, 'Not found')
    return a

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    thesis: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    watched_markets: Optional[List[str]] = None

@api.patch('/agents/{agent_id}')
async def update_agent(agent_id: str, payload: AgentUpdate, request: Request):
    user = await require_user(request)
    agent = await db.agents.find_one({"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0})
    if not agent:
        raise HTTPException(404, 'Not found')
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if 'watched_markets' in updates:
        updates['watched_markets'] = updates['watched_markets'][:25]
    if 'name' in updates:
        updates['name'] = updates['name'].strip()[:48] or agent['name']
    if 'thesis' in updates:
        updates['thesis'] = updates['thesis'].strip()[:500]
    if updates:
        await db.agents.update_one({"agent_id": agent_id}, {"$set": updates})
    doc = await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})
    return doc

@api.post('/agents/{agent_id}/deposit-intent')
async def create_deposit_intent(agent_id: str, payload: DepositIntent, request: Request):
    """Create a deposit intent. User must send `amount` SOL to FUNDING_ADDRESS with the returned memo."""
    user = await require_user(request)
    agent = await db.agents.find_one({"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0})
    if not agent:
        raise HTTPException(404, 'Not found')
    amt = float(payload.amount)
    if amt < MIN_DEPOSIT_SOL:
        raise HTTPException(400, f"minimum deposit is {MIN_DEPOSIT_SOL} SOL")
    if amt > 1000:
        raise HTTPException(400, "amount too large")
    memo = f"clp_{secrets.token_hex(4)}"  # 8 hex chars
    intent = {
        "intent_id": f"dep_{uuid.uuid4().hex[:10]}",
        "agent_id": agent_id,
        "user_id": user['user_id'],
        "amount_sol": amt,
        "memo": memo,
        "status": "pending",  # pending | confirmed | expired
        "address": FUNDING_ADDRESS,
        "signature": None,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(hours=2),
    }
    await db.deposit_intents.insert_one(intent)
    intent.pop('_id', None)
    return intent

@api.get('/agents/{agent_id}/deposits')
async def list_agent_deposits(agent_id: str, request: Request):
    user = await require_user(request)
    cur = db.deposit_intents.find(
        {"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0}
    ).sort("created_at", -1).limit(50)
    return await cur.to_list(50)

@api.get('/deposits/{intent_id}')
async def get_deposit(intent_id: str, request: Request):
    user = await require_user(request)
    d = await db.deposit_intents.find_one({"intent_id": intent_id, "user_id": user['user_id']}, {"_id": 0})
    if not d:
        raise HTTPException(404, 'Not found')
    return d

@api.post('/agents/{agent_id}/withdraw')
async def withdraw(agent_id: str, payload: WithdrawPayload, request: Request):
    user = await require_user(request)
    agent = await db.agents.find_one({"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0})
    if not agent:
        raise HTTPException(404, 'Not found')
    amt = float(payload.amount)
    if amt < MIN_WITHDRAW_SOL:
        raise HTTPException(400, f"minimum withdraw is {MIN_WITHDRAW_SOL} SOL")
    bal = float(agent.get('balance', 0.0))
    if amt > bal:
        raise HTTPException(400, f"insufficient agent balance ({bal:.4f} SOL)")
    try:
        # validate address
        from solders.pubkey import Pubkey
        Pubkey.from_string(payload.destination.strip())
    except Exception:
        raise HTTPException(400, "invalid destination address")

    try:
        res = await sol.send_sol(payload.destination.strip(), amt)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("withdraw failed")
        raise HTTPException(500, f"withdraw failed: {str(e)[:200]}")

    # debit agent balance
    await db.agents.update_one({"agent_id": agent_id}, {"$inc": {"balance": -amt}})

    ev = {
        "event_id": f"w_{uuid.uuid4().hex[:10]}",
        "agent_id": agent_id,
        "user_id": user['user_id'],
        "amount_sol": amt,
        "destination": payload.destination.strip(),
        "signature": res['signature'],
        "ts": now_utc(),
    }
    await db.withdrawals.insert_one(ev)
    doc = await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})
    ev.pop('_id', None)
    return {"agent": doc, "withdrawal": ev}

@api.get('/agents/{agent_id}/withdrawals')
async def list_withdrawals(agent_id: str, request: Request):
    user = await require_user(request)
    cur = db.withdrawals.find(
        {"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0}
    ).sort("ts", -1).limit(50)
    return await cur.to_list(50)

@api.delete('/agents/{agent_id}')
async def delete_agent(agent_id: str, request: Request):
    user = await require_user(request)
    await db.agents.delete_one({"agent_id": agent_id, "user_id": user['user_id']})
    await db.messages.delete_many({"agent_id": agent_id})
    await db.trades.delete_many({"agent_id": agent_id})
    return {"ok": True}

# ---------- CHAT ----------
class ChatIn(BaseModel):
    message: str

def _agent_system_prompt(agent: dict, markets: list) -> str:
    watched = agent.get('watched_markets') or []
    if watched:
        focus = [m for m in markets if m['slug'] in watched][:15]
        pool = focus if focus else markets[:12]
    else:
        pool = markets[:12]
    lines = []
    for m in pool:
        lines.append(f"- [{m['cat']}] {m['q']} | YES {m['yes']}% NO {100-m['yes']}% | vol ${m['vol']}")
    market_block = "\n".join(lines) if lines else "(no live markets right now)"
    balance = agent.get('balance', 0.0)
    return f"""You are {agent['name']}, an autonomous AI trading agent on ClawdPoly, a Polymarket trading platform.

Your thesis / personality:
{agent.get('thesis') or 'Find edge in binary YES/NO prediction markets. Be sharp, terse, and data-driven.'}

Trading balance: {balance:.3f} SOL (simulated). Funding address: {FUNDING_ADDRESS}

You chat with your owner in a live terminal. Respond like a senior quant trader. Use short sentences, monospace-friendly formatting, bullet lists with `-`, and occasional ticker-style lines like `SIGNAL edge detected: +3.1% on 'X'`.

When the user asks for a trade idea, pick from the LIVE markets below, pick YES or NO, explain your edge in 1-2 lines, and state a suggested size (0-100 units). Do NOT invent markets — only reference these:

LIVE MARKETS{' (watched by this agent)' if watched else ' (top by 24h volume)'}:
{market_block}

Rules:
- Never claim you executed an on-chain trade. All trades are SIMULATED for MVP.
- If uncertain, say so explicitly.
- Keep responses under 160 words unless asked for depth.
- When you propose a trade, end with a single line:
  TRADE: SIDE=YES|NO MARKET="<question>" PRICE=<0-1> SIZE=<int>
"""

@api.post('/agents/{agent_id}/chat')
async def chat_with_agent(agent_id: str, payload: ChatIn, request: Request):
    user = await require_user(request)
    agent = await db.agents.find_one({"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0})
    if not agent:
        raise HTTPException(404, 'Not found')

    msg_text = (payload.message or '').strip()
    if not msg_text:
        raise HTTPException(400, 'Empty message')

    await db.messages.insert_one({
        "agent_id": agent_id,
        "user_id": user['user_id'],
        "role": "user",
        "text": msg_text,
        "ts": now_utc(),
    })

    markets = await get_markets()
    system_msg = _agent_system_prompt(agent, markets)

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"{agent_id}",
            system_message=system_msg,
        ).with_model(agent['provider'], agent['model'])

        # Rehydrate prior conversation for context (last 16 messages)
        prior = await db.messages.find({"agent_id": agent_id}, {"_id": 0}).sort('ts', 1).to_list(200)
        # emergentintegrations manages history by session_id; we rely on it for continuity.
        # We still send only the latest user message.
        reply = await chat.send_message(UserMessage(text=msg_text))
    except Exception as e:
        logger.exception('llm error')
        reply = f"[model error] {str(e)[:240]}"

    # Parse trade line if present
    trade = _parse_trade(reply, markets)
    if trade:
        trade_doc = {
            "trade_id": f"t_{uuid.uuid4().hex[:10]}",
            "agent_id": agent_id,
            "user_id": user['user_id'],
            "side": trade['side'],
            "market": trade['market'],
            "price": trade['price'],
            "size": trade['size'],
            "ts": now_utc(),
        }
        await db.trades.insert_one(trade_doc)
        await db.agents.update_one(
            {"agent_id": agent_id},
            {"$inc": {"trades_count": 1, "pnl": round((0.5 - trade['price']) * trade['size'] * 0.01, 3)}}
        )

    await db.messages.insert_one({
        "agent_id": agent_id,
        "user_id": user['user_id'],
        "role": "assistant",
        "text": reply,
        "ts": now_utc(),
        "trade": trade,
    })

    return {"reply": reply, "trade": trade}

import re
def _parse_trade(text: str, markets: list):
    m = re.search(r'TRADE:\s*SIDE=(YES|NO)\s+MARKET="([^"]+)"\s+PRICE=([0-9.]+)\s+SIZE=(\d+)', text, re.I)
    if not m:
        return None
    side, market_q, price, size = m.group(1).upper(), m.group(2), float(m.group(3)), int(m.group(4))
    return {"side": side, "market": market_q, "price": max(0.0, min(1.0, price)), "size": max(0, min(size, 500))}

@api.get('/agents/{agent_id}/messages')
async def list_messages(agent_id: str, request: Request):
    user = await require_user(request)
    agent = await db.agents.find_one({"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0})
    if not agent:
        raise HTTPException(404, 'Not found')
    cur = db.messages.find({"agent_id": agent_id}, {"_id": 0}).sort('ts', 1)
    return await cur.to_list(500)

@api.get('/agents/{agent_id}/trades')
async def list_trades(agent_id: str, request: Request):
    user = await require_user(request)
    cur = db.trades.find({"agent_id": agent_id, "user_id": user['user_id']}, {"_id": 0}).sort('ts', -1)
    return await cur.to_list(100)

# ---------- LEADERBOARD ----------
@api.get('/leaderboard')
async def leaderboard():
    cur = db.agents.find({}, {"_id": 0}).sort('pnl', -1).limit(50)
    rows = await cur.to_list(50)
    # join user names
    user_ids = list({r['user_id'] for r in rows})
    users = {}
    if user_ids:
        async for u in db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1}):
            users[u['user_id']] = u
    out = []
    for i, r in enumerate(rows):
        owner = users.get(r['user_id'], {})
        out.append({
            "rank": i + 1,
            "agent_id": r['agent_id'],
            "name": r['name'],
            "model": r['model'],
            "provider": r['provider'],
            "pnl": round(r.get('pnl', 0.0), 3),
            "trades_count": r.get('trades_count', 0),
            "owner_name": owner.get('name', 'anon'),
        })
    return out

# ---------- Root ----------
@api.get('/')
async def root():
    return {"ok": True, "service": "clawdpoly"}

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event('shutdown')
async def _shutdown():
    client.close()


# ---------- BACKGROUND DEPOSIT POLLER ----------
async def _process_new_deposits():
    """Check chain for inbound txs with memos matching pending deposit intents."""
    try:
        sigs = await sol.get_recent_signatures(limit=40)
    except Exception as e:
        logger.debug(f"poll err: {e}")
        return
    for s in sigs:
        memo = s.get('memo')
        sig = s.get('signature')
        amt = s.get('amount_sol', 0.0)
        if not memo or amt <= 0:
            continue
        # find matching pending intent
        intent = await db.deposit_intents.find_one(
            {"memo": memo, "status": "pending"}, {"_id": 0}
        )
        if not intent:
            continue
        # require received amount >= requested amount minus small tolerance
        if amt + 1e-6 < float(intent['amount_sol']) * 0.99:
            logger.info(f"deposit memo {memo} received {amt} < expected {intent['amount_sol']}, skipping")
            continue
        # already processed? (idempotent by signature)
        already = await db.deposit_intents.find_one({"signature": sig}, {"_id": 0})
        if already:
            continue
        # credit agent balance
        await db.agents.update_one(
            {"agent_id": intent['agent_id']},
            {"$inc": {"balance": amt}},
        )
        await db.deposit_intents.update_one(
            {"intent_id": intent['intent_id']},
            {"$set": {
                "status": "confirmed",
                "signature": sig,
                "received_amount_sol": amt,
                "confirmed_at": now_utc(),
            }},
        )
        logger.info(f"deposit CONFIRMED agent={intent['agent_id']} amt={amt} sig={sig}")


async def _deposit_poll_loop():
    await asyncio.sleep(5)
    while True:
        try:
            await _process_new_deposits()
        except Exception as e:
            logger.error(f"deposit poller err: {e}")
        await asyncio.sleep(25)


@app.on_event('startup')
async def _startup():
    try:
        asyncio.create_task(_deposit_poll_loop())
        logger.info("deposit poller started")
    except Exception as e:
        logger.error(f"failed to start deposit poller: {e}")
