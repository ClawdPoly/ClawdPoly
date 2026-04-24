import React, { useEffect, useState } from "react";
import { TERMINAL_LINES } from "../data/mock";

const kindColor = {
  SCAN: "text-[#60a5fa]",
  INFO: "text-[#22d3ee]",
  TRADE: "text-[#22c55e]",
  SIGNAL: "text-[#eab308]",
  MODEL: "text-[#a78bfa]",
  WALLET: "text-[#f97316]",
};

export default function Terminal() {
  const [visible, setVisible] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible((v) => (v >= TERMINAL_LINES.length ? TERMINAL_LINES.length : v + 1));
    }, 450);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 550);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0f1a] shadow-[0_20px_60px_-20px_rgba(59,130,246,0.25)] overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-white/10 bg-[#0a0d15]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="w-3 h-3 rounded-full bg-[#eab308]" />
          <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
        </div>
        <div className="font-mono text-[12px] text-white/55">
          clawdpoly://agent/oracle_pip
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#22c55e]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          LIVE
        </div>
      </div>
      {/* body */}
      <div className="p-4 font-mono text-[13px] leading-relaxed min-h-[360px]">
        {TERMINAL_LINES.slice(0, visible).map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-white/30">[{l.idx}]</span>
            <span className={`${kindColor[l.kind]} font-semibold`}>{l.kind}</span>
            <span className="text-white/80">{l.text}</span>
          </div>
        ))}
        <div className="flex gap-1 text-white/70">
          <span className="text-white/40">~</span>
          <span>$</span>
          <span className={cursor ? "bg-white/80 text-transparent" : "text-transparent"}>▎</span>
        </div>
      </div>
    </div>
  );
}
