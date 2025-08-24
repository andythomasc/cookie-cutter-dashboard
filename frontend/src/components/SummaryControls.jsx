import React from "react";

export default function SummaryControls({
  topN, setTopN,
  dropStopwords, setDropStopwords,
  maxScan, setMaxScan,
  onApply, loading,
}) {
  return (
    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
      <h2 className="font-medium mb-3">Summary Controls</h2>
      <div className="flex flex-col gap-3 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span>Top N users</span>
          <input
            type="number"
            min={1}
            max={50}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 w-28 text-right"
            value={topN}
            onChange={(e) => setTopN(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span>Drop stopwords</span>
          <input
            type="checkbox"
            checked={dropStopwords}
            onChange={(e) => setDropStopwords(e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span>Max scan</span>
          <input
            type="number"
            min={1}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 w-28 text-right"
            value={maxScan}
            onChange={(e) => setMaxScan(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>

        <button
          onClick={onApply}
          className="mt-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-sm"
          disabled={loading}
        >
          {loading ? "Loading…" : "Apply"}
        </button>
      </div>
    </div>
  );
}
