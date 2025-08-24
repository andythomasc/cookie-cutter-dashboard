import React from "react";
import SummaryControls from "../components/SummaryControls.jsx";

export default function SummaryScene({
  // data to render
  summary, apiBase, topUsers, topWords, maxWordCount,
  // components to render UI
  SummaryPanelComponent, TopWordsChartComponent,
  // controls + actions
  sumTopN, setSumTopN,
  sumDropStops, setSumDropStops,
  sumMaxScan, setSumMaxScan,
  onApplySummary,
  loading,
}) {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-4 grid md:grid-cols-3 gap-4">
        <SummaryControls
          topN={sumTopN}
          setTopN={setSumTopN}
          dropStopwords={sumDropStops}
          setDropStopwords={setSumDropStops}
          maxScan={sumMaxScan}
          setMaxScan={setSumMaxScan}
          onApply={onApplySummary}
          loading={loading}
        />
        <div className="md:col-span-2 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <SummaryPanelComponent
            summary={summary}
            topUsers={topUsers}
            topWords={topWords}
            maxWordCount={maxWordCount}
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <TopWordsChartComponent
          apiBase={apiBase}
          summary={summary}
          title="Common Words — Summary"
          limit={30}
          height={360}
        />
      </section>
    </>
  );
}
