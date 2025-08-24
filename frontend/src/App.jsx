import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./scenes/global/Sidebar.jsx";

// scenes
import Overview from "./scenes/Overview.jsx";
import AnomaliesScene from "./scenes/Anomalies.jsx";
import SummaryScene from "./scenes/Summary.jsx";

// components 
import KPIs from "./components/KPIs.jsx";                  // used in Overview
import TopWordsChart from "./components/TopWordsChart.jsx"; // used in Overview/Summary
import SummaryPanel from "./components/SummaryPanel.jsx";   // used in Overview/Summary
import AnomaliesControl from "./components/AnomaliesControl.jsx"; // used in AnomaliesScene
import { AnomaliesFilterSort } from "./components/AnomaliesFilter.jsx"; // used in AnomaliesScene
import AnomaliesTable from "./components/AnomaliesTable.jsx"; // used in AnomaliesScene

const DEFAULT_BASE = "http://localhost:8000";
function getInitialBaseUrl() {
  const w = typeof window !== "undefined" ? window : {};
  return (
    // eslint-disable-next-line no-underscore-dangle
    w.__API_BASE_URL__ ||
    import.meta?.env?.VITE_API_BASE_URL ||
    localStorage.getItem("apiBaseUrl") ||
    DEFAULT_BASE
  );
}

export default function App() {
  // shared state/data
  const [apiBase, setApiBase] = useState(getInitialBaseUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [anoms, setAnoms] = useState(null);
  const [summary, setSummary] = useState(null);
  const [postsIndex, setPostsIndex] = useState(new Map());

  // controls (used by Anomalies scene)
  const [filterUserId, setFilterUserId] = useState("");
  const [sortBy, setSortBy] = useState("userId");
  const [method, setMethod] = useState("fuzzy");
  const [minLen, setMinLen] = useState(15);
  const [threshold, setThreshold] = useState(0.4);

  
  // summary controls state
const [sumTopN, setSumTopN] = useState(3);
const [sumDropStops, setSumDropStops] = useState(true);
const [sumMaxScan, setSumMaxScan] = useState(100); // align with backend SCAN_MAX default

async function loadSummaryOnly() {
  try {
    const params = new URLSearchParams({
      top_n_users: String(sumTopN),
      drop_stopwords: sumDropStops ? "true" : "false",
      max_scan: String(sumMaxScan),
      cache: "true",
    });
    const data = await safeFetch(`${apiBase}/summary?${params.toString()}`);
    setSummary(data);
  } catch (e) {
    setError(e.message || String(e));
  }
}

async function loadAnomaliesOnly() {
  const params = new URLSearchParams({
    method,
    min_title_len: String(minLen),
    similar_threshold: String(threshold),
    cache: "true",
  });
  const data = await safeFetch(`${apiBase}/anomalies?${params.toString()}`);
  setAnoms(data);
}


  useEffect(() => {
    localStorage.setItem("apiBaseUrl", apiBase);
  }, [apiBase]);

  async function safeFetch(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  }

  async function loadAll() {
    setError("");
    setLoading(true);
    try {
      // posts slice for mapping ids -> titles
      const postsRes = await safeFetch(`${apiBase}/posts?limit=200&offset=0`);
      const posts = Array.isArray(postsRes) ? postsRes : postsRes.data;
      const idx = new Map(posts.map((p) => [p.id, { id: p.id, userId: p.userId, title: p.title }]));
      setPostsIndex(idx);

      const params = new URLSearchParams({
        method,
        min_title_len: String(minLen),
        similar_threshold: String(threshold),
        cache: "true",
      });
      setAnoms(await safeFetch(`${apiBase}/anomalies?${params.toString()}`));

      //anomalies
      await loadAnomaliesOnly();
      // summary
      await loadSummaryOnly();
  } catch (e) {
    setError(e.message || String(e));
  } finally {
    setLoading(false);
  }
}

  useEffect(() => { loadAll(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  // build anomaly rows once
  const rows = useMemo(() => {
    if (!anoms) return [];
    const byKey = new Map();
    const addFlag = (userId, id, title, reason) => {
      const key = `${userId}:${id}`;
      if (!byKey.has(key)) byKey.set(key, { userId, id, title, reasons: [] });
      byKey.get(key).reasons.push(reason);
    };

    for (const p of anoms.short_titles || []) {
      const title = p.title ?? postsIndex.get(p.id)?.title ?? "(unknown title)";
      addFlag(p.userId, p.id, title, `short title (< ${minLen})`);
    }
    for (const g of anoms.duplicate_titles || []) {
      for (const pid of g.postIds || []) {
        const meta = postsIndex.get(pid);
        const title = meta?.title ?? g.title ?? "(duplicate)";
        const userId = meta?.userId ?? g.userId;
        addFlag(userId, pid, title, `duplicate title (count ${g.count})`);
      }
    }
    for (const s of anoms.suspicious_users || []) {
      for (const g of s.groups || []) {
        for (const pid of g.postIds || []) {
          const meta = postsIndex.get(pid);
          const title = meta?.title ?? g.rep_title ?? "(similar group)";
          const userId = meta?.userId ?? s.userId;
          addFlag(userId, pid, title, `similar group (size ${g.count})`);
        }
      }
    }

    let arr = Array.from(byKey.values());
    if (String(filterUserId).trim() !== "") {
      const f = Number(filterUserId);
      if (!Number.isNaN(f)) arr = arr.filter((r) => r.userId === f);
    }
    const comparators = {
      userId: (a, b) => a.userId - b.userId || a.id - b.id,
      id: (a, b) => a.id - b.id,
      title: (a, b) => a.title.localeCompare(b.title),
      reasonCount: (a, b) => b.reasons.length - a.reasons.length || a.id - b.id,
    };
    arr.sort(comparators[sortBy] || comparators.userId);
    return arr;
  }, [anoms, postsIndex, filterUserId, sortBy, minLen]);

  // summary helpers
  const topUsers = summary?.top_users_by_unique_words || [];
  const topWords = summary?.top_words || [];
  const maxWordCount = Math.max(1, ...topWords.map((w) => w.count));

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <Sidebar />  {/* uses router links */}
      <main className="flex-1 min-h-screen">
        {/* Header (kept global) */}
        <header className="sticky top-0 z-10 backdrop-blur bg-neutral-950/70 border-b border-neutral-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Posts Dashboard</h1>
            
          </div>
        </header>

        {/* Routes -> scenes */}
        <Routes>
          <Route
            path="/"
            element={
              <Overview
                anoms={anoms}
                rows={rows.slice(0, 25)}    // quick table on Overview
                apiBase={apiBase}
                summary={summary}
                topUsers={topUsers}
                topWords={topWords}
                maxWordCount={maxWordCount}
                KPIsComponent={KPIs}
                SummaryPanelComponent={SummaryPanel}
                TopWordsChartComponent={TopWordsChart}
                AnomaliesTableComponent={AnomaliesTable}
                onReloadOverview={loadAnomaliesOnly}
              />

            }
          />
          <Route
            path="/anomalies"
            element={
              <AnomaliesScene
                // controls
                method={method}
                minLen={minLen}
                threshold={threshold}
                setMethod={setMethod}
                setMinLen={setMinLen}
                setThreshold={setThreshold}
                filterUserId={filterUserId}
                setFilterUserId={setFilterUserId}
                sortBy={sortBy}
                setSortBy={setSortBy}
                // data
                anoms={anoms}
                rows={rows}
                error={error}
                loading={loading}
                // components (so you don’t change the scene file if you swap them)
                AnomaliesControlComponent={AnomaliesControl}
                AnomaliesFilterSortComponent={AnomaliesFilterSort}
                AnomaliesTableComponent={AnomaliesTable}
                onApply={loadAnomaliesOnly}
              />
            }
          />
           <Route
            path="/summary"
            element={
              <SummaryScene
                // data
                summary={summary}
                apiBase={apiBase}
                topUsers={topUsers}
                topWords={topWords}
                maxWordCount={maxWordCount}
                // render components
                SummaryPanelComponent={SummaryPanel}
                TopWordsChartComponent={TopWordsChart}
                // controls + actions (parameterized summary)
                sumTopN={sumTopN}
                setSumTopN={setSumTopN}
                sumDropStops={sumDropStops}
                setSumDropStops={setSumDropStops}
                sumMaxScan={sumMaxScan}
                setSumMaxScan={setSumMaxScan}
                onApplySummary={loadSummaryOnly}
                loading={loading}
              />
            }
          />
        </Routes>


        {/* global errors & footer */}
        {error && (
          <div className="max-w-6xl mx-auto px-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}
        
      </main>
    </div>
  );
}
