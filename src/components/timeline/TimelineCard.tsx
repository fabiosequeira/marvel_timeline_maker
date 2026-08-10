'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { TimelineEntryDTO } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

const TYPE_LABEL: Record<string, string> = {
  MOVIE: 'Movie',
  SHOW: 'Show',
  SEASON: 'Season',
  EPISODE: 'Episode',
  SPECIAL: 'Special',
};

export function TimelineCard({
  entry,
  isNext,
  align,
  onClick,
}: {
  entry: TimelineEntryDTO;
  isNext: boolean;
  align: 'left' | 'right';
  onClick: () => void;
}) {
  const title = entry.displayTitle || entry.media.title;
  const overview = entry.displayDescription ?? entry.media.overview;
  const date = entry.displayReleaseDate ?? entry.media.releaseDate;
  const year = date ? new Date(date).getFullYear() : null;

  const typeLabel =
    entry.media.type === 'SEASON' && entry.media.seasonNumber != null
      ? `Season ${entry.media.seasonNumber}`
      : TYPE_LABEL[entry.media.type];

  return (
    <button
      onClick={onClick}
      className={clsx(
        'group text-left w-full rounded-2xl border bg-base-900 overflow-hidden transition-all duration-200',
        'hover:border-base-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30',
        isNext ? 'border-accent/70 ring-1 ring-accent/40' : 'border-base-700',
      )}
    >
      <div className="flex sm:block">
        <div className="relative w-24 sm:w-full aspect-[2/3] sm:aspect-[2/3] shrink-0 bg-base-800">
          {entry.media.poster ? (
            <Image
              src={entry.media.poster}
              alt={title}
              fill
              sizes="(max-width: 640px) 96px, 320px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-base-600 text-xs px-2 text-center">
              No poster
            </div>
          )}
          {!entry.required && (
            <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-black/70 text-base-300 px-1.5 py-0.5 rounded">
              Optional
            </span>
          )}
          {isNext && (
            <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide bg-accent text-white px-1.5 py-0.5 rounded font-semibold">
              Up Next
            </span>
          )}
        </div>

        <div className="p-3 sm:p-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-base-400 mb-1">
            <span>{typeLabel}</span>
            {year && (
              <>
                <span>·</span>
                <span>{year}</span>
              </>
            )}
            {entry.category && (
              <>
                <span>·</span>
                <span style={{ color: entry.category.color || undefined }}>{entry.category.name}</span>
              </>
            )}
          </div>
          <h3 className="font-semibold text-base-100 leading-snug mb-1.5 truncate">{title}</h3>
          {overview && <p className="hidden sm:block text-sm text-base-400 line-clamp-2 mb-2">{overview}</p>}
          <StatusBadge status={entry.status} />
        </div>
      </div>
    </button>
  );
}
