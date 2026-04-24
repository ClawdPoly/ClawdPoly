import React, { useEffect, useState } from "react";
import { apiMarkets } from "../lib/api";

export default function Ticker() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let mounted = true;
    apiMarkets.list({ limit: 20 }).then((d) => {
      if (mounted) setItems((d.markets || []).slice(0, 18));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  const doubled = [...items, ...items];
  if (!items.length) return null;
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-[#080b14]/60 py-3">
      <div className="flex gap-10 whitespace-nowrap animate-ticker font-mono text-[13px] text-white/55">
        {doubled.map((it, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-white/30">▎</span>
            <span className="truncate">{it.q.slice(0, 60)}{it.q.length > 60 ? "\u2026" : ""}</span>
            <span className="text-[#22c55e]">YES {it.yes}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
