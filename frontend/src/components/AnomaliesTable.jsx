

export default function AnomaliesTable( {rows=[], anoms, error}){


    
    
    {/* Anomalies Table */};

    return (

    
    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
    <div className="flex items-center justify-between mb-3">
    <h2 className="font-medium">Anomalies</h2>
    <div className="text-xs text-neutral-400">{rows.length} rows</div>
    </div>
    <div className="overflow-x-auto">
    <table className="w-full text-sm border-collapse">
    <thead>
    <tr className="text-left border-b border-neutral-800">
    <th className="py-2 pr-4">userId</th>
    <th className="py-2 pr-4">post id</th>
    <th className="py-2 pr-4">title</th>
    <th className="py-2 pr-4">reason(s)</th>
    </tr>
    </thead>
    <tbody>
    {!anoms && (
        <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-400">Loading…</td>
                  </tr>
                )}
                {anoms && rows.length === 0 && (
                    <tr>
                    <td colSpan={4} className="py-6 text-center text-neutral-400">No anomalies with current filters.</td>
                  </tr>
                )}
                {rows.map((r) => (
                    <tr key={`${r.userId}:${r.id}`} className="border-b border-neutral-900">
                    <td className="py-2 pr-4 align-top text-neutral-300">{r.userId}</td>
                    <td className="py-2 pr-4 align-top text-neutral-300">{r.id}</td>
                    <td className="py-2 pr-4 align-top">
                      <div className="text-neutral-100">{r.title}</div>
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        {r.reasons.map((rsn, i) => (
                            <span key={i} className="px-2 py-1 rounded-full bg-indigo-600/20 border border-indigo-600/30 text-indigo-200">
                            {rsn}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
                </table>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}
          </div>
    )
}