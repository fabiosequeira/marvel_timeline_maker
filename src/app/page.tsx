'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { TimelineEntryDTO, CategoryDTO } from '@/types';
import { TimelineView } from '@/components/timeline/TimelineView';
import { EmptyState } from '@/components/timeline/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ContinueWatching } from '@/components/timeline/ContinueWatching';
import { TimelineFilters, TypeFilter, StatusFilter } from '@/components/timeline/TimelineFilters';
import { EntryDetailModal } from '@/components/timeline/EntryDetailModal';
import { AddEntryModal } from '@/components/timeline/AddEntryModal';

interface TimelineResponse {
  entries: TimelineEntryDTO[];
  categories: CategoryDTO[];
  progress: {
    total: number;
    watched: number;
    movies: { total: number; watched: number };
    shows: { total: number; watched: number };
  };
  nextEntryId: string | null;
}

export default function HomePage() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntryDTO | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/timeline', { cache: 'no-store' });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Check whether we're an authenticated admin, to decide whether to show
    // edit affordances (Add Entry, notes, delete, etc.) on the public timeline.
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => setIsAdmin(Boolean(d.authenticated)))
      .catch(() => {});
  }, []);

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    return data.entries.filter((e) => {
      if (typeFilter !== 'ALL' && e.media.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (e.displayTitle || e.media.title).toLowerCase();
        const original = (e.media.originalTitle || '').toLowerCase();
        const year = e.media.releaseDate ? new Date(e.media.releaseDate).getFullYear().toString() : '';
        const ids = [e.media.tmdbId, e.media.tvdbId, e.media.imdbId].filter(Boolean).join(' ').toLowerCase();
        if (!title.includes(q) && !original.includes(q) && !year.includes(q) && !ids.includes(q)) return false;
      }
      return true;
    });
  }, [data, typeFilter, statusFilter, search]);

  const nextEntry = data?.entries.find((e) => e.id === data.nextEntryId) ?? null;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Media Timeline';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">{appName}</div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Your Watch Order</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin"
              className="text-sm text-base-400 hover:text-base-100 border border-base-700 rounded-full px-3.5 py-1.5 transition-colors"
            >
              {isAdmin ? 'Admin' : 'Login'}
            </Link>
          </div>
        </div>

        {data && data.progress.total > 0 && (
          <div className="space-y-3 mb-6">
            <ProgressBar watched={data.progress.watched} total={data.progress.total} label="Overall progress" />
            <div className="flex gap-6 text-xs text-base-500">
              {data.progress.movies.total > 0 && (
                <span>
                  Movies: {data.progress.movies.watched} / {data.progress.movies.total}
                </span>
              )}
              {data.progress.shows.total > 0 && (
                <span>
                  Shows: {data.progress.shows.watched} / {data.progress.shows.total}
                </span>
              )}
            </div>
          </div>
        )}

        {data && data.entries.length > 0 && (
          <div className="mb-6">
            <ContinueWatching entry={nextEntry} onOpen={() => nextEntry && setSelectedEntry(nextEntry)} />
          </div>
        )}

        {data && data.entries.length > 0 && (
          <TimelineFilters
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            search={search}
            setSearch={setSearch}
          />
        )}
      </header>

      {isAdmin && (
        <button
          onClick={() => setAddOpen(true)}
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-muted text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          + Add Entry
        </button>
      )}

      {loading ? (
        <TimelineSkeleton />
      ) : !data || data.entries.length === 0 ? (
        <EmptyState onAdd={() => (isAdmin ? setAddOpen(true) : (window.location.href = '/admin'))} />
      ) : filteredEntries.length === 0 ? (
        <p className="text-center text-base-500 py-16 text-sm">No entries match your filters.</p>
      ) : (
        <TimelineView entries={filteredEntries} nextEntryId={data.nextEntryId} onOpenEntry={setSelectedEntry} />
      )}

      <EntryDetailModal
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onChanged={() => {
          load();
        }}
        onDeleted={() => {
          setSelectedEntry(null);
          load();
        }}
        isAdmin={isAdmin}
      />

      <AddEntryModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={load} categories={data?.categories ?? []} />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="w-24 aspect-[2/3] rounded-xl bg-base-800" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-3 w-16 bg-base-800 rounded" />
            <div className="h-4 w-40 bg-base-800 rounded" />
            <div className="h-3 w-full bg-base-800 rounded" />
            <div className="h-3 w-2/3 bg-base-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
