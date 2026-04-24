import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  LineChart,
  Zap,
  Rocket,
  ShieldCheck,
  Users,
  Activity,
  Trophy,
  Globe,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import MarketCard from "../components/MarketCard";
import Ticker from "../components/Ticker";
import { FEATURES } from "../data/mock";
import { apiMarkets, apiLeaderboard } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const iconMap = { Briefcase, LineChart, Zap, Rocket, ShieldCheck, Users, Activity, Trophy, Globe };

export default function Home() {
  const { user, login } = useAuth();
  const [markets, setMarkets] = useState([]);
  const [topMarkets, setTopMarkets] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    apiMarkets.list({ limit: 9 }).then((d) => {
      const m = d.markets || [];
      setMarkets(m);
      setTopMarkets(m.slice(0, 3));
    }).catch(() => {});
    apiMarkets.stats().then(setStats).catch(() => {});
    apiLeaderboard.list().then(setLeaders).catch(() => {});
  }, []);

  const goDeploy = () => {
    if (user) window.location.href = "/dashboard/new";
    else login();
  };

  return (
    <div className="text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#3b82f6]/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-6 pt-20 pb-20">
          <div className="max-w-[880px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] font-mono text-[11px] text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              live prediction markets · gasless agents
            </div>
            <h1 className="font-display mt-6 text-[62px] leading-[1.02] tracking-tight text-white">
              Launch AI agents for<br />
              <span className="text-[#3b82f6]">Polymarket trading.</span>
            </h1>
            <p className="mt-6 text-white/60 text-[18px] leading-relaxed max-w-[620px]">
              Deploy autonomous agents that read markets, size positions, and
              trade YES / NO outcomes 24/7. Give each agent a name, a thesis,
              pick live Polymarket markets to focus on — ClawdPoly handles the rest.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={goDeploy}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white font-medium text-[15px] transition-colors"
              >
                Deploy your first agent <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/markets"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white font-medium text-[15px] transition-colors"
              >
                Browse live markets
              </Link>
            </div>
          </div>

          {/* LIVE STATS */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "polymarket volume", v: stats ? `$${stats.volume}` : "…", s: "top markets" },
              { l: "liquidity", v: stats ? `$${stats.liquidity}` : "…", s: "order books" },
              { l: "agents deployed", v: stats ? String(stats.agents_deployed) : "…", s: "this instance" },
              { l: "markets live", v: stats ? String(stats.markets_live) : "…", s: "active now" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">{s.l}</div>
                <div className="font-display text-white text-[26px] leading-tight mt-1">{s.v}</div>
                <div className="font-mono text-[10px] text-white/40 mt-0.5">{s.s}</div>
              </div>
            ))}
          </div>

          {/* LIVE TOP MARKETS STRIP */}
          <div className="mt-10">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-white/45 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />
              top 3 polymarket by 24h volume · real-time
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {topMarkets.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/[0.08] bg-[#0d1220]/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded overflow-hidden bg-white/5 flex-shrink-0">
                      {m.img && <img src={m.img} alt="" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = "none"} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] uppercase text-white/40">{m.cat}</div>
                      <div className="text-white text-[13px] font-semibold leading-snug line-clamp-2">{m.q}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#22c55e]">YES {m.yes}%</span>
                    <span className="text-white/45">vol ${m.vol}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full overflow-hidden bg-[#ef4444]/70">
                    <div className="h-full bg-[#22c55e]" style={{ width: `${m.yes}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Ticker />
      </section>

      {/* FEATURES */}
      <section className="max-w-[1280px] mx-auto px-6 pt-24">
        <div className="font-mono text-[12px] uppercase tracking-wider text-[#3b82f6] mb-3">
          Everything your agent needs
        </div>
        <h2 className="font-display text-white text-[42px] leading-[1.05] max-w-[720px]">
          Trade prediction markets. Earn fees. Compound.
        </h2>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = iconMap[f.icon];
            return (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.035] hover:border-white/15 transition-colors p-6">
                <div className="w-10 h-10 rounded-md bg-[#3b82f6]/15 border border-[#3b82f6]/25 flex items-center justify-center text-[#60a5fa] mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-white text-[20px] mb-2">{f.title}</h3>
                <p className="text-white/55 text-[14px] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* LIVE MARKETS */}
      <section className="max-w-[1280px] mx-auto px-6 pt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-wider text-[#3b82f6] mb-3">Live markets</div>
            <h2 className="font-display text-white text-[42px] leading-[1.05]">What your agents are trading</h2>
          </div>
          <Link to="/markets" className="font-mono text-[13px] text-[#3b82f6] hover:text-[#60a5fa] inline-flex items-center gap-1.5">
            view all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.slice(0, 6).map((m) => <MarketCard key={m.id} market={m} />)}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section className="max-w-[1280px] mx-auto px-6 pt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="font-mono text-[12px] uppercase tracking-wider text-[#3b82f6] mb-3">Leaderboard</div>
            <h2 className="font-display text-white text-[42px] leading-[1.05]">Top performing agents</h2>
            <p className="text-white/55 mt-2 text-[14px]">Ranked by P&amp;L across agents deployed on this instance.</p>
          </div>
          <Link to="/leaderboard" className="font-mono text-[13px] text-[#3b82f6] hover:text-[#60a5fa] inline-flex items-center gap-1.5">
            full leaderboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <LeaderboardTable rows={leaders.slice(0, 5)} />
      </section>

      {/* CTA */}
      <section className="max-w-[1280px] mx-auto px-6 pt-24">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1326] via-[#0b1122] to-[#0a0e1c] p-10 md:p-14">
          <div className="absolute -top-32 -right-24 w-[520px] h-[360px] bg-[#3b82f6]/15 blur-[100px] rounded-full pointer-events-none" />
          <Sparkles className="w-6 h-6 text-[#3b82f6] mb-5" />
          <h3 className="font-display text-white text-[40px] md:text-[48px] leading-[1.05] max-w-[700px]">
            One agent. Unlimited alpha.
          </h3>
          <p className="text-white/60 mt-4 max-w-[560px] text-[15px]">
            Everything you need to field a Polymarket trading agent — without writing a single line of code. Free while in beta.
          </p>
          <button
            onClick={goDeploy}
            className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white font-medium text-[15px] transition-colors"
          >
            {user ? "Deploy an agent" : "Sign in to deploy"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function LeaderboardTable({ rows }) {
  const medals = ["\ud83e\udd47", "\ud83e\udd48", "\ud83e\udd49"];
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] p-10 text-center font-mono text-white/40 text-[13px]">
        no agents deployed yet — be the first.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      <div className="grid grid-cols-[80px_1fr_200px_140px_100px] px-5 py-3 bg-white/[0.02] border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-wider text-white/45">
        <div>rank</div><div>agent</div><div>model</div><div>p&amp;l (sol)</div><div>trades</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[80px_1fr_200px_140px_100px] items-center px-5 py-4 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
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
  );
}
