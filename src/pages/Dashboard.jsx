import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Bot, Trash2, TrendingUp } from "lucide-react";
import { apiAgents } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const a = await apiAgents.list();
      setAgents(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("delete this agent?")) return;
    await apiAgents.del(id);
    load();
  };

  return (
    <div className="text-white">
      <div className="max-w-[1280px] mx-auto px-6 pt-12 pb-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-wider text-[#3b82f6] mb-3">
              welcome, {user?.name?.split(" ")[0] || "trader"}
            </div>
            <h1 className="font-display text-[42px] leading-[1.05]">Your trading agents</h1>
            <p className="text-white/55 mt-2">
              Spin up autonomous agents, chat with them in a live terminal, and watch them trade.
            </p>
          </div>
          <Link
            to="/dashboard/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white font-medium text-[14px] transition-colors"
          >
            <Plus className="w-4 h-4" /> new agent
          </Link>
        </div>

        {loading ? (
          <div className="text-center font-mono text-white/40 py-20">loading…</div>
        ) : agents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a) => (
              <AgentCard key={a.agent_id} a={a} onDelete={() => del(a.agent_id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ a, onDelete }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d1220]/70 hover:border-white/20 hover:bg-[#0f1425] transition-all p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display text-[18px]">{a.name}</div>
            <div className="font-mono text-[11px] text-white/45">{a.model}</div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md hover:bg-[#ef4444]/15 text-white/40 hover:text-[#ef4444] transition-colors"
          title="delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-white/55 text-[13px] leading-relaxed min-h-[42px] line-clamp-2">
        {a.thesis || "(no thesis set)"}
      </p>
      <div className="flex items-center gap-4 mt-4 font-mono text-[12px]">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-white/40" />
          <span className={a.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
            {a.pnl >= 0 ? "+" : ""}{(a.pnl || 0).toFixed(2)} SOL
          </span>
        </div>
        <div className="text-white/50">{a.trades_count || 0} trades</div>
      </div>
      <Link
        to={`/dashboard/agent/${a.agent_id}`}
        className="mt-4 block text-center px-3 py-2 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-[13px] text-white/80"
      >
        open terminal →
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-16 text-center">
      <div className="w-14 h-14 mx-auto rounded-md bg-[#3b82f6]/15 border border-[#3b82f6]/25 flex items-center justify-center text-[#60a5fa] mb-5">
        <Bot className="w-7 h-7" />
      </div>
      <h3 className="font-display text-[24px] mb-2">No agents yet</h3>
      <p className="text-white/50 text-[14px] max-w-[420px] mx-auto">
        Deploy your first autonomous agent. Give it a name, a thesis, and a model — it'll start chatting and simulating trades on live Polymarket markets.
      </p>
      <Link
        to="/dashboard/new"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white font-medium text-[14px]"
      >
        <Plus className="w-4 h-4" /> deploy your first agent
      </Link>
    </div>
  );
}
