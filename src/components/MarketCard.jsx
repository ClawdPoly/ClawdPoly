import React from "react";
import { ExternalLink, TrendingUp } from "lucide-react";

export default function MarketCard({ market }) {
  const { img, cat, q, yes, vol, slug } = market;
  const no = 100 - yes;
  return (
    <div className="group rounded-xl border border-white/[0.08] bg-[#0d1220]/70 hover:border-white/20 hover:bg-[#0f1425] transition-all p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">
            {cat}
          </div>
          <h3 className="text-white text-[15px] font-semibold leading-snug line-clamp-2">
            {q}
          </h3>
        </div>
      </div>

      {/* probability row */}
      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px]">
        <span className="text-[#22c55e]">YES {yes}%</span>
        <span className="text-[#ef4444]">NO {no}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-[#ef4444]/80 flex">
        <div
          className="h-full bg-[#22c55e]"
          style={{ width: `${yes}%` }}
        />
      </div>

      {/* footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[12px] text-white/55">
          <TrendingUp className="w-3.5 h-3.5" />
          vol ${vol}
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={`https://polymarket.com/market/${slug}`}
            target="_blank"
            rel="noreferrer"
            title="Open on Polymarket"
            className="w-7 h-7 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] flex items-center justify-center text-[#3b82f6]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button className="px-2.5 py-1 rounded-md bg-[#22c55e]/15 text-[#22c55e] font-mono text-[11px] hover:bg-[#22c55e]/25 transition-colors">
            YES
          </button>
          <button className="px-2.5 py-1 rounded-md bg-[#ef4444]/15 text-[#ef4444] font-mono text-[11px] hover:bg-[#ef4444]/25 transition-colors">
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
