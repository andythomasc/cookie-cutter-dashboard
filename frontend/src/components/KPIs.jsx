export default function KPIs({ anoms, summary }) {
  const loading = !anoms || !summary;

  const kpis = [
    { label: "Posts scanned",      value: summary?.meta?.max_scan ?? "—" },
    { label: "Short titles",       value: anoms?.short_titles?.length ?? 0 },
    { label: "Duplicate clusters", value: anoms?.duplicate_titles?.length ?? 0 },
    { label: "Suspicious users",   value: anoms?.suspicious_users?.length ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-xs text-neutral-400">{k.label}</div>
          <div className="text-2xl font-semibold mt-1">
            {loading ? (
              <span className="inline-block h-6 w-16 rounded bg-neutral-800 animate-pulse" />
            ) : (
              k.value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
