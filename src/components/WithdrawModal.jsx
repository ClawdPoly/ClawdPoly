import React, { useEffect, useState } from "react";
import { X, ArrowDownLeft, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { apiAgents, apiWallet } from "../lib/api";

export default function WithdrawModal({ open, onClose, agent, onDone }) {
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [funding, setFunding] = useState(null);
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (open) {
      setErr(""); setResult(null); setAmount(""); setDest("");
      apiWallet.funding().then(setFunding).catch(() => {});
      if (connected && publicKey) setDest(publicKey.toBase58());
    }
  }, [open, connected, publicKey]);

  const submit = async () => {
    setErr("");
    const n = parseFloat(amount);
    if (!n || n < (funding?.min_withdraw || 0.01)) {
      return setErr(`minimum withdraw is ${funding?.min_withdraw || 0.01} SOL`);
    }
    if (n > (agent?.balance || 0)) {
      return setErr(`insufficient balance (${(agent?.balance || 0).toFixed(4)} SOL)`);
    }
    if (!dest.trim() || dest.trim().length < 32) {
      return setErr("invalid destination address");
    }
    setLoading(true);
    try {
      const r = await apiAgents.withdraw(agent.agent_id, n, dest.trim());
      setResult(r);
      onDone?.(r.agent);
    } catch (e) {
      setErr(e?.response?.data?.detail || "withdraw failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[460px] rounded-xl border border-white/10 bg-[#0b0f1a] p-6 shadow-[0_20px_60px_-10px_rgba(59,130,246,0.2)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-[#ef4444]/15 border border-[#ef4444]/25 flex items-center justify-center text-[#f87171]">
              <ArrowDownLeft className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="font-display text-white text-[18px]">Withdraw SOL</div>
              <div className="font-mono text-[11px] text-white/45">agent balance: {(agent?.balance || 0).toFixed(4)} SOL</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/55"><X className="w-4 h-4" /></button>
        </div>

        {result ? (
          <div className="rounded-md border border-[#22c55e]/40 bg-[#22c55e]/10 p-4 flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-display text-[15px] text-white">Withdrawal sent</div>
              <div className="font-mono text-[11px] text-white/60 mt-1">
                {result.withdrawal.amount_sol} SOL → <span className="text-white/80">{result.withdrawal.destination.slice(0, 6)}…{result.withdrawal.destination.slice(-4)}</span>
              </div>
              <a
                href={`https://solscan.io/tx/${result.withdrawal.signature}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 font-mono text-[11px] text-[#60a5fa] hover:text-[#3b82f6]"
              >
                view on solscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/45">amount (SOL)</label>
              <div className="relative mt-2">
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-md px-3 py-2.5 text-[15px] font-mono focus:outline-none focus:border-[#3b82f6]/60"
                />
                <button
                  onClick={() => setAmount(((agent?.balance || 0) - 0.0001).toFixed(4))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-mono text-[#60a5fa] hover:bg-white/[0.06]"
                >max</button>
              </div>
              <div className="font-mono text-[10px] text-white/40 mt-1">minimum {funding?.min_withdraw || 0.01} SOL</div>
            </div>
            <div className="mb-4">
              <label className="font-mono text-[11px] uppercase tracking-wider text-white/45">destination wallet</label>
              <input
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="solana address"
                className="mt-2 w-full bg-[#0a0e1a] border border-white/10 rounded-md px-3 py-2.5 text-[13px] font-mono focus:outline-none focus:border-[#3b82f6]/60"
              />
              {connected && publicKey && (
                <button
                  onClick={() => setDest(publicKey.toBase58())}
                  className="mt-1 font-mono text-[10px] text-[#60a5fa] hover:text-[#3b82f6]"
                >use connected Phantom: {publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-4)}</button>
              )}
            </div>
            {err && <div className="font-mono text-[12px] text-[#ef4444] mb-3">{err}</div>}
            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[13px] text-white/70">cancel</button>
              <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-md bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-60 text-white text-[13px] font-medium flex items-center gap-2">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> sending…</>) : "withdraw"}
              </button>
            </div>
          </>
        )}

        {result && (
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] text-white text-[13px] font-medium">done</button>
          </div>
        )}
      </div>
    </div>
  );
}
