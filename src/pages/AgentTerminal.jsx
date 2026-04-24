import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Bot, User as UserIcon, TrendingUp, Wallet, Target, Plus, ArrowDownLeft } from "lucide-react";
import { apiAgents } from "../lib/api";
import DepositModal from "../components/DepositModal";
import WithdrawModal from "../components/WithdrawModal";
import MarketPicker from "../components/MarketPicker";

const ansi = {
  SCAN: "text-[#60a5fa]",
  INFO: "text-[#22d3ee]",
  TRADE: "text-[#22c55e]",
  SIGNAL: "text-[#eab308]",
  MODEL: "text-[#a78bfa]",
  WALLET: "text-[#f97316]",
  ERROR: "text-[#ef4444]",
};

function RenderAssistant({ text }) {
  const lines = (text || "").split("\n");
  return (
    <div className="font-mono text-[13px] leading-relaxed text-white/85 whitespace-pre-wrap">
      {lines.map((ln, i) => {
        if (/^TRADE:\s*/i.test(ln)) {
          return (
            <div key={i} className="mt-2 px-2 py-1.5 rounded bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]">
              {ln}
            </div>
          );
        }
        const tagMatch = ln.match(/^(SCAN|INFO|TRADE|SIGNAL|MODEL|WALLET|ERROR)\b/);
        if (tagMatch) {
          const tag = tagMatch[1];
          return (
            <div key={i}>
              <span className={`${ansi[tag]} font-semibold`}>{tag}</span>
              <span>{ln.slice(tag.length)}</span>
            </div>
          );
        }
        return <div key={i}>{ln || "\u00a0"}</div>;
      })}
    </div>
  );
}

export default function AgentTerminal() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [trades, setTrades] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const scroll = useRef(null);

  const load = async () => {
    try {
      const [a, msgs, tr] = await Promise.all([
        apiAgents.get(id), apiAgents.messages(id), apiAgents.trades(id),
      ]);
      setAgent(a);
      setMessages(msgs);
      setTrades(tr);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e?.preventDefault();
    const t = input.trim();
    if (!t || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: t, ts: new Date().toISOString() }]);
    setSending(true);
    try {
      await apiAgents.chat(id, t);
      const [msgs, tr, a] = await Promise.all([
        apiAgents.messages(id), apiAgents.trades(id), apiAgents.get(id),
      ]);
      setMessages(msgs); setTrades(tr); setAgent(a);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `ERROR ${err?.response?.data?.detail || err.message}`, ts: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const saveMarkets = async (slugs) => {
    const updated = await apiAgents.update(id, { watched_markets: slugs });
    setAgent(updated);
  };

  if (!agent) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-mono text-white/40 text-sm">
        loading agent…
      </div>
    );
  }

  const watchedCount = (agent.watched_markets || []).length;

  return (
    <div className="text-white">
      <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-20">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-[13px] text-white/50 hover:text-white font-mono mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> all agents
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-[30px] leading-tight">{agent.name}</h1>
              <div className="font-mono text-[12px] text-white/45 mt-0.5">
                {agent.provider} · {agent.model}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5">
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">balance</div>
              <div className="font-mono text-[14px] text-white/90">{(agent.balance || 0).toFixed(3)} SOL</div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5">
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">P&amp;L</div>
              <div className={`font-mono text-[14px] ${agent.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {agent.pnl >= 0 ? "+" : ""}{(agent.pnl || 0).toFixed(3)}
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5">
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/40">trades</div>
              <div className="font-mono text-[14px] text-white/90">{agent.trades_count || 0}</div>
            </div>
            <button
              onClick={() => setFundOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white text-[13px] font-medium"
            >
              <Wallet className="w-4 h-4" /> deposit
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              disabled={(agent.balance || 0) <= 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] disabled:opacity-40 disabled:hover:bg-white/[0.03] text-white text-[13px] font-medium"
            >
              <ArrowDownLeft className="w-4 h-4" /> withdraw
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          {/* TERMINAL */}
          <div className="rounded-xl border border-white/10 bg-[#0b0f1a] overflow-hidden flex flex-col min-h-[560px]">
            <div className="flex items-center justify-between px-4 h-10 border-b border-white/10 bg-[#0a0d15]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <span className="w-3 h-3 rounded-full bg-[#eab308]" />
                <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
              </div>
              <div className="font-mono text-[12px] text-white/55">clawdpoly://agent/{agent.name}</div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#22c55e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" /> LIVE
              </div>
            </div>

            <div ref={scroll} className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                <div className="font-mono text-[13px] text-white/50 space-y-1">
                  <div><span className="text-[#60a5fa] font-semibold">SCAN</span> {" "}agent <span className="text-[#22c55e]">{agent.name}</span> online — monitoring {watchedCount > 0 ? `${watchedCount} watched markets` : "live markets"}</div>
                  <div><span className="text-[#22d3ee] font-semibold">INFO</span> {" "}ask me for trade ideas, or let me know your thesis.</div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center">
                    {m.role === "user" ? (
                      <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-white/35 mb-1">
                      {m.role === "user" ? "you" : agent.name}
                    </div>
                    {m.role === "user" ? (
                      <div className="font-mono text-[13px] text-white/85 whitespace-pre-wrap">{m.text}</div>
                    ) : (
                      <RenderAssistant text={m.text} />
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-md bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-mono text-[13px] text-white/50 animate-pulse">
                    {agent.name} is thinking…
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={send} className="border-t border-white/10 p-3 flex items-center gap-2 bg-[#0a0d15]">
              <span className="font-mono text-[13px] text-[#60a5fa]">~ $</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={sending ? "waiting on model…" : "ask your agent for a trade idea…"}
                disabled={sending}
                className="flex-1 bg-transparent font-mono text-[13px] placeholder:text-white/30 focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] disabled:opacity-40 text-white text-[12px] font-medium"
              >
                <Send className="w-3.5 h-3.5" /> send
              </button>
            </form>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            {/* Markets */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[11px] uppercase tracking-wider text-white/45 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#3b82f6]" /> focus markets
                </div>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                >
                  <Plus className="w-3 h-3" /> {watchedCount > 0 ? "edit" : "pick"}
                </button>
              </div>
              {watchedCount === 0 ? (
                <div className="font-mono text-[11px] text-white/45">
                  top 12 by 24h volume (default)
                </div>
              ) : (
                <div className="font-mono text-[11px] text-white/70">
                  {watchedCount} market{watchedCount === 1 ? "" : "s"} watched
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-white/45 mb-3">thesis</div>
              <p className="text-white/70 text-[13px] leading-relaxed">
                {agent.thesis || "(no thesis set)"}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-[11px] uppercase tracking-wider text-white/45">recent trades</div>
                <TrendingUp className="w-3.5 h-3.5 text-white/40" />
              </div>
              {trades.length === 0 ? (
                <div className="font-mono text-[12px] text-white/35 py-6 text-center">no trades yet</div>
              ) : (
                <div className="space-y-2">
                  {trades.slice(0, 12).map((t, i) => (
                    <div key={i} className="font-mono text-[11px] p-2 rounded border border-white/[0.06] bg-[#0a0e1a]">
                      <div className="flex items-center justify-between">
                        <span className={t.side === "YES" ? "text-[#22c55e]" : "text-[#ef4444]"}>
                          {t.side} @ {t.price?.toFixed(2)}
                        </span>
                        <span className="text-white/40">×{t.size}</span>
                      </div>
                      <div className="text-white/60 mt-1 line-clamp-2">{t.market}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-white/45 mb-2">prompts</div>
              <div className="space-y-1.5">
                {[
                  "give me your top trade idea right now",
                  "what edge do you see on crypto markets?",
                  "size a YES bet on the highest conviction market",
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(p)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/[0.04] text-[12px] text-white/65 font-mono"
                  >
                    <span className="text-[#3b82f6]">▸</span> {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DepositModal
        open={fundOpen}
        onClose={() => setFundOpen(false)}
        agentId={id}
        onConfirmed={() => load()}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        agent={agent}
        onDone={(a) => setAgent(a)}
      />
      <MarketPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={agent.watched_markets || []}
        onSave={saveMarkets}
      />
    </div>
  );
}
