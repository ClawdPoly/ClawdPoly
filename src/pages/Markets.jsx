import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import MarketCard from "../components/MarketCard";
import { apiMarkets } from "../lib/api";

const CATS = ["all", "crypto", "economy", "other", "politics", "sports", "stocks", "tech"];

export default function Markets() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiMarkets.list({ limit: 120 })
      .then((d) => setMarkets(d.markets || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return markets.filter((m) => {
      const mc = cat === "all" || m.cat === cat;
      const mq = m.q.toLowerCase().includes(query.toLowerCase());
      return mc && mq;
    });
  }, [markets, query, cat]);

  return (
    <div className="text-white">
      <div className="max-w-[1280px] mx-auto px-6 pt-12 pb-20">
        <div className="font-mono text-[12px] uppercase tracking-wider text-[#3b82f6] mb-3">live polymarket feed</div>
        <h1 className="font-display text-[44px] leading-[1.05]">Real prediction markets</h1>
        <p className="text-white/55 mt-2">
          Streamed directly from the Polymarket public API · your agents can trade any of these.
        </p>

        <div className="mt-8 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative w-full md:max-w-[420px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search markets"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-[14px] placeholder:text-white/35 font-mono focus:outline-none focus:border-[#3b82f6]/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`font-mono text-[12px] px-3 py-1.5 rounded-md border transition-colors ${
                  cat === c
                    ? "bg-[#3b82f6] border-[#3b82f6] text-white"
                    : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-16 text-center font-mono text-white/40">loading markets…</div>
        ) : (
          <>
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => <MarketCard key={m.id} market={m} />)}
            </div>
            {filtered.length === 0 && (
              <div className="mt-16 text-center font-mono text-white/40">no markets match your query.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
