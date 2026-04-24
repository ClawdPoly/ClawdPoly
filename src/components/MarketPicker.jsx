import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { apiMarkets } from "../lib/api";

export default function MarketPicker({ open, onClose, initial = [], onSave }) {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [picked, setPicked] = useState(new Set(initial));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiMarkets.list({ limit: 120 }).then((d) => {
      setAll(d.markets || []);
    }).finally(() => setLoading(false));
    setPicked(new Set(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cats = ["all", "crypto", "economy", "other", "politics", "sports", "stocks", "tech"];

  const filtered = useMemo(() => {
    return all.filter((m) => {
      const mc = cat === "all" || m.cat === cat;
      const mq = m.q.toLowerCase().includes(q.toLowerCase());
      return mc && mq;
    });
  }, [all, q, cat]);

  const toggle = (slug) => {
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(slug)) n.delete(slug); else { if (n.size < 25) n.add(slug); }
      return n;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[880px] max-h-[85vh] flex flex-col rounded-xl border border-white/10 bg-[#0b0f1a] shadow-[0_20px_60px_-10px_rgba(59,130,246,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <div className="font-display text-white text-[20px]">Pick live markets</div>
            <div className="font-mono text-[11px] text-white/50">selected {picked.size}/25 · live from Polymarket</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/[0.06] text-white/55"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search…"
              className="w-full bg-[#0a0e1a] border border-white/10 rounded-md pl-9 pr-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[#3b82f6]/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`font-mono text-[11px] px-2.5 py-1 rounded-md border ${
                  cat === c
                    ? "bg-[#3b82f6] border-[#3b82f6] text-white"
                    : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center font-mono text-white/40 py-10">loading live markets…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center font-mono text-white/40 py-10">no markets match.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filtered.map((m) => {
                const on = picked.has(m.slug);
                return (
                  <button
                    key={m.slug}
                    onClick={() => toggle(m.slug)}
                    className={`text-left flex items-start gap-3 rounded-md border p-3 transition-colors ${
                      on
                        ? "border-[#3b82f6]/60 bg-[#3b82f6]/10"
                        : "border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/15"
                    }`}
                  >
                    <div className="w-9 h-9 rounded overflow-hidden bg-white/5 flex-shrink-0">
                      {m.img && <img src={m.img} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] uppercase text-white/40">{m.cat}</div>
                      <div className="text-white text-[13px] leading-snug line-clamp-2">{m.q}</div>
                      <div className="mt-1 font-mono text-[11px]">
                        <span className="text-[#22c55e]">YES {m.yes}%</span>
                        <span className="text-white/30 mx-2">·</span>
                        <span className="text-white/50">vol ${m.vol}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${on ? "bg-[#3b82f6] border-[#3b82f6]" : "border-white/20"}`}>
                      {on && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <div className="font-mono text-[11px] text-white/45">{picked.size} selected</div>
          <div className="flex gap-2">
            <button onClick={() => setPicked(new Set())} className="px-3 py-1.5 rounded-md text-[12px] text-white/60 hover:text-white font-mono">clear</button>
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[13px] text-white/70">cancel</button>
            <button
              onClick={() => { onSave?.(Array.from(picked)); onClose?.(); }}
              className="px-4 py-2 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white text-[13px] font-medium"
            >save selection</button>
          </div>
        </div>
      </div>
    </div>
  );
}
