

export default function SummaryPanel({summary, maxWordCount, topUsers=[], topWords=[]}) {


    return (
    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <h2 className="font-medium mb-3">Summary Panel</h2>
          {!summary ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm uppercase tracking-wide text-neutral-400 mb-2">Top Users (unique title words)</h3>
                <ul className="text-sm grid grid-cols-3 gap-2">
                  {topUsers.map((u) => (
                    <li key={u.userId} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
                      <div className="text-neutral-300">userId {u.userId}</div>
                      <div className="text-xs text-neutral-500">{u.unique_word_count} unique words</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-wide text-neutral-400 mb-2">Common Words</h3>
                <div className="flex flex-wrap gap-2">
                  {topWords.map((w) => {
                    const scale = 0.9 + 1.1 * (w.count / maxWordCount); // 0.9x..2.0x
                    const style = { fontSize: `${Math.round(12 * scale)}px` };
                    return (
                      <span
                        key={w.word}
                        style={style}
                        className="px-2 py-1 rounded-full bg-white/10 border border-white/10"
                        title={`count: ${w.count}`}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        )

}