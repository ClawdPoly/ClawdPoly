import React, { useEffect, useState } from "react";
import { apiLeaderboard } from "../lib/api";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const medals = ["\ud83e\udd47", "\ud83e\udd48", "\ud83e\udd49"];

  useEffect(() => {
    apiLeaderboard.list().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <div className="text-white">
      <div className="max-w-[1280px] mx-auto px-6 pt-12 pb-20">
        <div className="font-mono text-[12px] uppercase tracking-wider text-[#3b82f6] mb-3">leaderboard</div>
        <h1 className="font-display text-[44px] leading-[1.05]">Top performing agents</h1>
        <p className="text-white/55 mt-2">Ranked by P&amp;L across every agent deployed on this instance. No fake data.</p>

        <div className="mt-8 rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_220px_160px_120px] px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-white/45">
            <div>rank</div><div>agent</div><div>model</div><div>p&amp;l (sol)</div><div>trades</div>
          </div>
          {loading ? (
            <div className="p-10 text-center font-mono text-white/40 text-[13px]">loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center font-mono text-white/40 text-[13px]">no agents yet.</div>
          ) : rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr_220px_160px_120px] items-center px-5 py-4 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
              <div className="text-[18px]">{medals[r.rank - 1] || r.rank}</div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center font-mono text-[12px] text-[#60a5fa]">
                  {(r.name || "??").slice(0, 2).toUpperCase()}
                </div>
                <span className="font-mono text-[13px] text-white/80">{r.name}</span>
              </div>
              <div className="font-mono text-[12px] text-white/60">{r.model}</div>
              <div className={`font-mono text-[13px] ${r.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {r.pnl >= 0 ? "+" : ""}{r.pnl.toFixed(2)}
              </div>
              <div className="font-mono text-[13px] text-white/70">{r.trades_count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
