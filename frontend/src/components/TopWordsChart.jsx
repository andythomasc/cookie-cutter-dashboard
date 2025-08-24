import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";


export default function TopWordsChart({
  apiBase,
  summary,
  title = "Most Used Words",
  limit = 15,
  height = 280,
  className = "",
}) {
  const [localSummary, setLocalSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // fetch only if summary prop not supplied
  useEffect(() => {
    if (summary) return; // reuse prop, no fetch
    if (!apiBase) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const r = await fetch(
          `${apiBase}/summary?drop_stopwords=true&max_scan=1000`,
          { signal: ctrl.signal }
        );
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const json = await r.json();
        setLocalSummary(json);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [apiBase, summary]);

  const topWords = useMemo(() => {
    const src = summary || localSummary;
    const words = src?.top_words || [];
    return words.slice(0, limit).map((w) => ({
      word: w.word,
      count: w.count,
    }));
  }, [summary, localSummary, limit]);

  return (
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">{title}</h2>
          {loading && <span className="text-xs text-neutral-400">Loading…</span>}
        </div>

        {err && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
            {err}
          </div>
        )}

        {!loading && topWords.length === 0 ? (
          <p className="text-sm text-neutral-400">No word data.</p>
        ) : (
          <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
              <BarChart data={topWords} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="word"
                  tick={{ fill: "#d4d4d8", fontSize: 12 }}
                  interval={0}
                  angle={-30}
                  dy={10}
                  height={50}
                />
                <YAxis tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "0.75rem",
                    color: "#e5e7eb",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
  );
}
