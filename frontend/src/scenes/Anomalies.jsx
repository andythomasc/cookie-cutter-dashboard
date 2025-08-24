import React from "react";

export default function AnomaliesScene({
  // controls
  method, minLen, threshold, setMethod, setMinLen, setThreshold,
  filterUserId, setFilterUserId, sortBy, setSortBy,
  // data
  anoms, rows, error, loading,
  // injected components
  AnomaliesControlComponent,
  AnomaliesFilterSortComponent,
  AnomaliesTableComponent,
  // actions
  onApply,
}) {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2 items-stretch">
          <div className="h-full">
            <AnomaliesControlComponent
              method={method}
              minLen={minLen}
              threshold={threshold}
              setMethod={setMethod}
              setMinLen={setMinLen}
              setThreshold={setThreshold}
              loadAll={onApply}
              loading={loading}
            />
          </div>
          <div className="h-full">
            <AnomaliesFilterSortComponent
              filterUserId={filterUserId}
              sortBy={sortBy}
              setFilterUserId={setFilterUserId}
              setSortBy={setSortBy}
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <AnomaliesTableComponent
          rows={rows}
          anoms={anoms}
          error={error}
          filterUserId={filterUserId}
          setSortBy={setSortBy}
          sortBy={sortBy}
        />
      </section>
    </>
  );
}
