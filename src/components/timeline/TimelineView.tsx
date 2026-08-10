'use client';

import { useMemo, useState } from 'react';
import { TimelineEntryDTO } from '@/types';
import { TimelineCard } from './TimelineCard';

export function TimelineView({
  entries,
  nextEntryId,
  onOpenEntry,
}: {
  entries: TimelineEntryDTO[];
  nextEntryId: string | null;
  onOpenEntry: (entry: TimelineEntryDTO) => void;
}) {
  const [reduceMotion] = useState(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  const groups = useMemo(() => groupByYear(entries), [entries]);

  if (entries.length === 0) return null;

  let globalIndex = 0;

  return (
    <div className="relative">
      <div
        className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-base-800 via-base-700 to-base-800"
        aria-hidden
      />
      <div className="sm:hidden absolute left-5 top-0 bottom-0 w-px bg-base-700" aria-hidden />

      <div className="space-y-10 sm:space-y-14">
        {groups.map((group) => (
          <div key={group.year}>
            {group.year && (
              <div className="relative flex items-center justify-center mb-6 sm:mb-8">
                <span className="relative z-10 bg-base-950 px-4 text-sm font-semibold text-base-400 tracking-wide">
                  {group.year}
                </span>
              </div>
            )}
            <div className="space-y-8 sm:space-y-0">
              {group.entries.map((entry) => {
                const idx = globalIndex++;
                const align: 'left' | 'right' = idx % 2 === 0 ? 'left' : 'right';
                return (
                  <div key={entry.id} className="relative sm:py-6">
                    <div
                      className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-accent ring-4 ring-base-950 z-10"
                      aria-hidden
                    />
                    <div className="sm:hidden absolute left-5 top-6 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-base-950 z-10" aria-hidden />

                    <div
                      className={`sm:grid sm:grid-cols-2 sm:gap-x-10 pl-12 sm:pl-0 ${!reduceMotion ? 'animate-fadeSlideUp' : ''}`}
                    >
                      <div className={align === 'left' ? 'sm:col-start-1' : 'sm:col-start-2'}>
                        <div className="max-w-md sm:mx-0" style={align === 'right' ? undefined : { marginLeft: 'auto' }}>
                          <TimelineCard
                            entry={entry}
                            isNext={entry.id === nextEntryId}
                            align={align}
                            onClick={() => onOpenEntry(entry)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByYear(entries: TimelineEntryDTO[]): { year: number | null; entries: TimelineEntryDTO[] }[] {
  const groups: { year: number | null; entries: TimelineEntryDTO[] }[] = [];
  let currentYear: number | null | undefined = undefined;

  for (const entry of entries) {
    const date = entry.displayReleaseDate ?? entry.media.releaseDate;
    const year = date ? new Date(date).getFullYear() : null;
    if (year !== currentYear) {
      groups.push({ year, entries: [] });
      currentYear = year;
    }
    groups[groups.length - 1].entries.push(entry);
  }
  return groups;
}
