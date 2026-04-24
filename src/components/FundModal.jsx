import React, { useState, useEffect } from "react";
import { Copy, Check, X, Wallet } from "lucide-react";
import { api, apiAgents } from "../lib/api";

export default function FundModal({ open, onClose, agentId, onFunded }) {
  const [addr, setAddr] = useState("6BFohrAmiSwkn3xi6a4MsezQbeKmBAhG6ToJ3uR3Qcao");
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("0.5");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      api.get("/funding").then((r) => setAddr(r.data.address)).catch(() => {});
      setErr(""); setCopied(false);
    }
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const submit = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return setErr("amount must be > 0");
    setLoading(true); setErr("");
    try {
      const updated = await apiAgents.fund(agentId, n);
      onFunded?.(updated);
      onClose?.();
    } catch (e) {
      setErr(e?.response?.data?.detail || "funding failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=0a0e1a&color=ffffff&margin=8&data=solana:${addr}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[460px] rounded-xl border border-white/10 bg-[#0b0f1a] p-6 shadow-[0_20px_60px_-10px_rgba(59,130,246,0.2)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-[#3b82f6]/15 border border-[#3b82f6]/25 flex items-center justify-center text-[#60a5fa]">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="font-display text-white text-[18px]">Fund agent</div>
              <div className="font-mono text-[11px] text-white/45">solana · sol</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/55"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center justify-center mb-4">
          <div className="p-2 rounded-md border border-white/10 bg-[#0a0e1a]">
            <img src={qrUrl} alt="deposit qr" className="w-[180px] h-[180px]" />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-mono text-[10px] uppercase tracking-wider text-white/45">deposit address</label>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-white/10 bg-[#0a0e1a] px-3 py-2">
            <code className="flex-1 min-w-0 truncate font-mono text-[12px] text-white/80">{addr}</code>
            <button onClick={copy} className="p-1.5 rounded hover:bg-white/[0.08] text-white/60" title="copy">
              {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="font-mono text-[11px] text-white/35 mt-1">send SOL to this address — the platform wallet pays all gas.</div>
        </div>

        <div className="mb-4">
          <label className="font-mono text-[10px] uppercase tracking-wider text-white/45">simulate deposit (for demo)</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.1"
              min="0"
              className="flex-1 bg-[#0a0e1a] border border-white/10 rounded-md px-3 py-2 text-[14px] font-mono focus:outline-none focus:border-[#3b82f6]/60"
            />
            <span className="font-mono text-[12px] text-white/50">SOL</span>
          </div>
          {err && <div className="font-mono text-[11px] text-[#ef4444] mt-1">{err}</div>}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[13px] text-white/70">close</button>
          <button onClick={submit} disabled={loading} className="px-4 py-2 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] disabled:opacity-60 text-white text-[13px] font-medium">
            {loading ? "crediting\u2026" : "credit balance"}
          </button>
        </div>
      </div>
    </div>
  );
}
