'use client';

import Image from 'next/image';
import { TimelineEntryDTO } from '@/types';

export function ContinueWatching({ entry, onOpen }: { entry: TimelineEntryDTO | null; onOpen: () => void }) {
  if (!entry) {
    return (
      <div className="rounded-2xl border border-base-800 bg-base-900 px-5 py-4 flex items-center gap-3">
        <span className="text-xl">🎉</span>
        <p className="text-sm text-base-300">Timeline complete — you're all caught up.</p>
      </div>
    );
  }

  const title = entry.displayTitle || entry.media.title;
  const date = entry.displayReleaseDate ?? entry.media.releaseDate;
  const year = date ? new Date(date).getFullYear() : null;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl border border-accent/40 bg-gradient-to-r from-accent-soft/60 to-base-900 hover:border-accent/70 transition-colors px-4 sm:px-5 py-4 flex items-center gap-4"
    >
      {entry.media.poster && (
        <div className="relative h-16 w-11 shrink-0 rounded overflow-hidden bg-base-800">
          <Image src={entry.media.poster} alt={title} fill className="object-cover" sizes="44px" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-accent font-semibold mb-0.5">Continue Watching</div>
        <div className="font-semibold truncate">{title}</div>
        <div className="text-xs text-base-400">
          {entry.media.type === 'SEASON' ? 'Season' : entry.media.type.charAt(0) + entry.media.type.slice(1).toLowerCase()}
          {year ? ` · ${year}` : ''}
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium rounded-full bg-accent text-white px-4 py-2">Open</span>
    </button>
  );
}
