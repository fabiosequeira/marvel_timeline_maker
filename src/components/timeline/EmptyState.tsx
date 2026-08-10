export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="text-5xl mb-4">🎬</div>
      <h2 className="text-lg font-semibold text-base-100 mb-1.5">Your timeline is empty</h2>
      <p className="text-base-400 text-sm mb-6 max-w-sm">
        Add your first movie or show to get started. Paste an IMDb, TMDB, or TVDB ID and we'll fetch the rest.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-muted text-white px-5 py-2.5 text-sm font-medium transition-colors"
      >
        + Add Entry
      </button>
    </div>
  );
}
