import React from "react";
import AnomaliesTable from "../components/AnomaliesTable";
import { Link } from "react-router-dom";

export default function Overview({
  anoms, rows, apiBase, summary, topUsers, topWords, maxWordCount,
  KPIsComponent, SummaryPanelComponent, TopWordsChartComponent, AnomaliesTableComponent,
  onReloadOverview,
}) {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-4">
        <KPIsComponent anoms={anoms} summary={summary} />
      </section>

      <section className="max-w-6xl mx-auto px-4 py-4">
        <SummaryPanelComponent
          summary={summary}
          topUsers={topUsers}
          topWords={topWords}
          maxWordCount={maxWordCount}
        />
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <TopWordsChartComponent
          apiBase={apiBase}
          summary={summary}
          title="Common Words — Bar Chart"
          limit={15}
          height={300}
        />
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Anomalies (quick view)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onReloadOverview}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm"
            >
              Refresh
            </button>
            <Link
              to="/anomalies"
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-sm"
            >
              Open Advanced
            </Link>
          </div>
        </div>

        <AnomaliesTableComponent
          rows={rows}    // first 25 rows from App.jsx
          anoms={anoms}
          error={null}
          filterUserId={""}
          setSortBy={() => {}}
          sortBy={"userId"}
        />
      </section>

    
    </>
  );
}
