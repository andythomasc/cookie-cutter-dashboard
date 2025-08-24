import React from "react";
import { SlidersHorizontal, Check, RotateCcw } from "lucide-react";

export default function AnomaliesControl({
  method, minLen, threshold,
  setMethod, setMinLen, setThreshold,
  loadAll, loading,
}) {
  const input = "px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/40";
  const num   = `${input} w-28 text-right`;

  const reset = () => {
    setMethod("fuzzy");
    setMinLen(15);
    setThreshold(0.4);
  };

  return (
    <div className="h-full flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30">
            <SlidersHorizontal className="h-4 w-4 text-indigo-300" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-medium text-neutral-200">Anomalies Controls</div>
            <div className="text-xs text-neutral-400">Change method & sensitivity, then Apply</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-neutral-700 text-neutral-300 text-sm transition"
            title="Reset to defaults"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition"
          >
            <Check className="h-4 w-4" />
            Apply
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 grid gap-4">
        {/* Method pills */}
        <div className="space-y-2">
          <div className="text-sm text-neutral-300">Method</div>
          <div className="flex flex-wrap gap-2">
            {["exact", "fuzzy", "cosine", "embedding"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`px-3 py-1.5 rounded-xl border transition text-sm select-none ${
                  method === m
                    ? "bg-indigo-600/20 border-indigo-400/50 text-indigo-300"
                    : "bg-neutral-950 border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Min title length */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-300">Min title length</div>
            <div className="text-xs text-neutral-400">{minLen}</div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={60}
              value={Number(minLen) || 0}
              onChange={(e) => setMinLen(Number(e.target.value) || 0)}
              className="w-full accent-indigo-600"
            />
            <input
              type="number"
              className={num}
              value={minLen}
              onChange={(e) => setMinLen(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-300">Similarity threshold</div>
            <div className="text-xs text-neutral-400">{Number(threshold).toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={Number(threshold) || 0}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
              className="w-full accent-indigo-600"
            />
            <input
              type="number"
              step={0.05}
              min={0}
              max={1}
              className={num}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
