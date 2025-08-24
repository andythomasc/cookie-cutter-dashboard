import React from "react";
import { Filter as FilterIcon, ArrowUpDown, X } from "lucide-react";

export function AnomaliesFilterSort({ filterUserId, sortBy, setFilterUserId, setSortBy }) {
  const input = "px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/40";

  return (
    <div className="h-full flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-neutral-700">
            <ArrowUpDown className="h-4 w-4 text-neutral-300" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-medium text-neutral-200">Filter & Sort</div>
            <div className="text-xs text-neutral-400">Instant client-side changes</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 grid gap-4">
        {/* Filter by userId */}
        <div className="space-y-2">
          <div className="text-sm text-neutral-300">Filter by userId</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/5 border border-neutral-700">
              <FilterIcon className="h-4 w-4 text-neutral-400" />
            </span>
            <input
              type="number"
              placeholder="e.g., 1"
              className={`${input} w-40`}
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            />
            {String(filterUserId).trim() !== "" && (
              <button
                type="button"
                onClick={() => setFilterUserId("")}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-neutral-700 text-xs text-neutral-300"
                title="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500">Leave empty to include all users.</p>
        </div>

        {/* Sort by */}
        <div className="space-y-2">
          <div className="text-sm text-neutral-300">Sort by</div>
          <select
            className={`${input} w-56`}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="userId">userId</option>
            <option value="id">post id</option>
            <option value="title">title</option>
            <option value="reasonCount"># of reasons</option>
          </select>
          <p className="text-xs text-neutral-500">Sorting is applied to the current table rows.</p>
        </div>
      </div>
    </div>
  );
}
