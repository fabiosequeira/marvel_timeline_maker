export function ProgressBar({ watched, total, label }: { watched: number; total: number; label?: string }) {
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
  return (
    <div>
      {label && (
        <div className="flex items-baseline justify-between mb-1.5 text-sm">
          <span className="text-base-300">{label}</span>
          <span className="text-base-400 tabular-nums">
            {watched} / {total} · {pct}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-base-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
