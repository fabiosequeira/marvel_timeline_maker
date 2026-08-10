'use client';

import clsx from 'clsx';
import { CategoryDTO } from '@/types';

export type TypeFilter = 'ALL' | 'MOVIE' | 'SHOW' | 'SEASON' | 'SPECIAL';
export type StatusFilter = 'ALL' | 'NOT_WATCHED' | 'WATCHING' | 'WATCHED' | 'SKIPPED';

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SHOW', label: 'Shows' },
  { value: 'SEASON', label: 'Seasons' },
  { value: 'SPECIAL', label: 'Specials' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NOT_WATCHED', label: 'Unwatched' },
  { value: 'WATCHING', label: 'Watching' },
  { value: 'WATCHED', label: 'Watched' },
  { value: 'SKIPPED', label: 'Skipped' },
];

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
        active ? 'bg-accent text-white' : 'bg-base-800 text-base-300 hover:bg-base-700',
      )}
    >
      {children}
    </button>
  );
}

export function TimelineFilters({
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
}: {
  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-500 text-sm">🔎</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search timeline..."
          className="w-full rounded-full bg-base-800 border border-base-700 pl-9 pr-4 py-2.5 text-sm text-base-100 placeholder:text-base-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPE_OPTIONS.map((o) => (
          <Pill key={o.value} active={typeFilter === o.value} onClick={() => setTypeFilter(o.value)}>
            {o.label}
          </Pill>
        ))}
        <span className="w-px bg-base-700 mx-1 shrink-0" />
        {STATUS_OPTIONS.map((o) => (
          <Pill key={o.value} active={statusFilter === o.value} onClick={() => setStatusFilter(o.value)}>
            {o.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}
