'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TimelineEntryDTO, WatchStatus } from '@/types';

const STATUS_ACTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'NOT_WATCHED', label: 'Mark Unwatched' },
  { value: 'WATCHING', label: 'Mark Watching' },
  { value: 'WATCHED', label: 'Mark Watched' },
  { value: 'SKIPPED', label: 'Skip' },
  { value: 'REWATCHING', label: 'Rewatching' },
];

export function EntryDetailModal({
  entry,
  open,
  onClose,
  onChanged,
  onDeleted,
  isAdmin,
}: {
  entry: TimelineEntryDTO | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
  isAdmin: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!entry) return null;

  const title = entry.displayTitle || entry.media.title;
  const description = entry.displayDescription ?? entry.media.overview;
  const date = entry.displayReleaseDate ?? entry.media.releaseDate;

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries/${entry!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Update failed');
      }
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove "${title}" from your timeline?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${entry!.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onDeleted();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/metadata/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: entry!.id,
          updatePoster: true,
          updateDescription: true,
          updateDates: true,
          overwriteCustomTitle: false,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Refresh failed');
      }
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="grid sm:grid-cols-[180px_1fr] gap-5">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-base-800 shrink-0">
          {entry.media.poster ? (
            <Image src={entry.media.poster} alt={title} fill className="object-cover" sizes="180px" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-base-600 text-xs">No poster</div>
          )}
        </div>

        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-base-400">
            <span>{entry.media.type === 'SEASON' ? `Season ${entry.media.seasonNumber ?? ''}` : entry.media.type}</span>
            {date && <span>· {new Date(date).getFullYear()}</span>}
            {entry.media.runtime && <span>· {entry.media.runtime} min</span>}
            {entry.media.rating && <span>· ★ {entry.media.rating.toFixed(1)}</span>}
            {!entry.required && <span className="text-base-500">· Optional</span>}
          </div>

          <StatusBadge status={entry.status} />

          {description && <p className="text-sm text-base-300 leading-relaxed">{description}</p>}

          {entry.media.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.media.genres.map((g) => (
                <span key={g} className="text-xs bg-base-800 text-base-400 px-2 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-base-500">
            {entry.media.director && <div>Director: <span className="text-base-300">{entry.media.director}</span></div>}
            {entry.media.network && <div>Network: <span className="text-base-300">{entry.media.network}</span></div>}
            {entry.media.country && <div>Country: <span className="text-base-300">{entry.media.country}</span></div>}
            {entry.media.language && <div>Language: <span className="text-base-300">{entry.media.language}</span></div>}
            {entry.media.imdbId && <div>IMDb: <span className="text-base-300">{entry.media.imdbId}</span></div>}
            {entry.media.tmdbId && <div>TMDB: <span className="text-base-300">{entry.media.tmdbId}</span></div>}
          </div>

          {isAdmin && (
            <div>
              <label className="text-xs text-base-400 block mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => patch({ notes })}
                rows={2}
                className="w-full rounded-lg bg-base-800 border border-base-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Add a note..."
              />
            </div>
          )}
          {!isAdmin && entry.notes && (
            <div className="text-sm bg-base-800/60 rounded-lg px-3 py-2 text-base-300">{entry.notes}</div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-2">
            {STATUS_ACTIONS.filter((a) => a.value !== entry.status).map((a) => (
              <button
                key={a.value}
                disabled={busy}
                onClick={() => patch({ status: a.value })}
                className="text-xs px-3 py-1.5 rounded-full bg-base-800 hover:bg-base-700 text-base-200 transition-colors disabled:opacity-50"
              >
                {a.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-base-800">
              <button
                disabled={busy}
                onClick={handleRefresh}
                className="text-xs px-3 py-1.5 rounded-full border border-base-700 hover:bg-base-800 transition-colors disabled:opacity-50"
              >
                Refresh Metadata
              </button>
              <button
                disabled={busy}
                onClick={() => patch({ manualNext: !entry.manualNext })}
                className="text-xs px-3 py-1.5 rounded-full border border-base-700 hover:bg-base-800 transition-colors disabled:opacity-50"
              >
                {entry.manualNext ? 'Unpin from Next' : 'Pin as Next'}
              </button>
              <button
                disabled={busy}
                onClick={() => patch({ required: !entry.required })}
                className="text-xs px-3 py-1.5 rounded-full border border-base-700 hover:bg-base-800 transition-colors disabled:opacity-50"
              >
                {entry.required ? 'Mark Optional' : 'Mark Required'}
              </button>
              <button
                disabled={busy}
                onClick={handleDelete}
                className="text-xs px-3 py-1.5 rounded-full border border-red-900 text-red-400 hover:bg-red-950 transition-colors disabled:opacity-50 ml-auto"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
