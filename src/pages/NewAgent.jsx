import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bot, Check, ChevronDown, Search, Target, Plus } from "lucide-react";
import { apiAgents, apiModels } from "../lib/api";
import MarketPicker from "../components/MarketPicker";

export default function NewAgent() {
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [name, setName] = useState("");
  const [thesis, setThesis] = useState("");
  const [model, setModel] = useState(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [watched, setWatched] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    apiModels.list().then((m) => {
      setModels(m);
      const def = m.find((x) => x.model === "gpt-5.2") || m[0];
      setModel(def);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!query) return models;
    const q = query.toLowerCase();
    return models.filter(
      (m) => m.model.toLowerCase().includes(q) || m.label.toLowerCase().includes(q) || m.provider.includes(q)
    );
  }, [query, models]);

  const submit = async () => {
    setErr("");
    if (!name.trim()) return setErr("name is required");
    if (!model) return setErr("choose a model");
    setSaving(true);
    try {
      const a = await apiAgents.create({
        name: name.trim(),
        thesis: thesis.trim(),
        provider: model.provider,
        model: model.model,
        watched_markets: watched,
      });
      navigate(`/dashboard/agent/${a.agent_id}`);
    } catch (e) {
      setErr(e?.response?.data?.detail || "failed to create agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="text-white">
      <div className="max-w-[780px] mx-auto px-6 pt-12 pb-20">
        <div className="font-mono text-[12px] uppercase tracking-wider text-[#3b82f6] mb-3">setup</div>
        <h1 className="font-display text-[40px] leading-[1.05]">Deploy a new agent</h1>
        <p className="text-white/55 mt-2">Name it, give it a thesis, pick a model, and (optionally) select the live Polymarket markets it should focus on.</p>

        <div className="mt-10 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 md:p-8 space-y-6">
          {/* Name */}
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/45">agent name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. oracle_pip"
              maxLength={48}
              className="mt-2 w-full bg-[#0a0e1a] border border-white/10 rounded-md px-3 py-2.5 text-[15px] placeholder:text-white/30 font-mono focus:outline-none focus:border-[#3b82f6]/60"
            />
          </div>

          {/* Thesis */}
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/45">thesis / description</label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="e.g. Fade overconfident YES positions on long-shot 2028 candidates. Buy underpriced macro-fed outcomes."
              maxLength={500}
              rows={4}
              className="mt-2 w-full bg-[#0a0e1a] border border-white/10 rounded-md px-3 py-2.5 text-[14px] placeholder:text-white/30 focus:outline-none focus:border-[#3b82f6]/60 resize-none"
            />
            <div className="text-right font-mono text-[10px] text-white/30 mt-1">{thesis.length}/500</div>
          </div>

          {/* Model dropdown */}
          <div className="relative">
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/45">model</label>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-2 w-full flex items-center justify-between bg-[#0a0e1a] border border-white/10 rounded-md px-3 py-2.5 text-[14px] hover:border-white/20"
            >
              {model ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-white/10 text-white/60 uppercase">{model.provider}</span>
                  <span>{model.label}</span>
                  <span className="font-mono text-[11px] text-white/40">{model.model}</span>
                </span>
              ) : (
                <span className="text-white/40">select a model</span>
              )}
              <ChevronDown className="w-4 h-4 text-white/50" />
            </button>
            {open && (
              <div className="absolute z-30 mt-2 w-full rounded-md border border-white/10 bg-[#0b1020] shadow-xl max-h-[360px] overflow-hidden">
                <div className="p-2 border-b border-white/5 relative">
                  <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="search 30+ models"
                    className="w-full bg-transparent pl-7 pr-2 py-1.5 text-[13px] font-mono placeholder:text-white/30 focus:outline-none"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {filtered.map((m) => (
                    <button
                      type="button"
                      key={m.model}
                      onClick={() => { setModel(m); setOpen(false); setQuery(""); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.04] text-[13px]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] w-16 text-white/45 uppercase">{m.provider}</span>
                        <span className="text-white/85">{m.label}</span>
                        <span className="font-mono text-[10px] text-white/35">{m.model}</span>
                      </span>
                      {model?.model === m.model && <Check className="w-3.5 h-3.5 text-[#22c55e]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Watched markets */}
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-white/45">focus markets (optional)</label>
            <div className="mt-2 rounded-md border border-white/10 bg-[#0a0e1a] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px]">
                  <Target className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-white/70">
                    {watched.length === 0 ? "All markets (default)" : `${watched.length} market${watched.length === 1 ? "" : "s"} selected`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-[12px] font-mono"
                >
                  <Plus className="w-3.5 h-3.5" /> pick markets
                </button>
              </div>
              <div className="font-mono text-[10px] text-white/40 mt-2">
                if left empty, your agent considers the top 12 markets by 24h volume.
              </div>
            </div>
          </div>

          {err && <div className="font-mono text-[12px] text-[#ef4444]">{err}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={() => navigate("/dashboard")} className="px-4 py-2 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[14px] text-white/70">cancel</button>
            <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#3b82f6] hover:bg-[#2f6fe0] disabled:opacity-60 text-white text-[14px] font-medium">
              {saving ? "deploying…" : (<><Bot className="w-4 h-4" /> deploy agent <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </div>
        </div>
      </div>

      <MarketPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={watched}
        onSave={setWatched}
      />
    </div>
  );
}
