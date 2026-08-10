'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { TimelineEntryDTO, CategoryDTO } from '@/types';
import { SortableEntryRow } from './SortableEntryRow';
import { AddEntryModal } from '@/components/timeline/AddEntryModal';
import { EntryDetailModal } from '@/components/timeline/EntryDetailModal';

export function AdminDashboard() {
  const router = useRouter();
  const [entries, setEntries] = useState<TimelineEntryDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<TimelineEntryDTO | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const load = useCallback(async () => {
    const res = await fetch('/api/timeline', { cache: 'no-store' });
    const data = await res.json();
    setEntries(data.entries);
    setCategories(data.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(entries, oldIndex, newIndex);
    setEntries(reordered);

    const beforeEntryId = reordered[newIndex - 1]?.id ?? null;
    const afterEntryId = reordered[newIndex + 1]?.id ?? null;

    setSaving(true);
    try {
      await fetch('/api/entries/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: active.id, beforeEntryId, afterEntryId }),
      });
    } finally {
      setSaving(false);
      load();
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">Admin</div>
          <h1 className="text-xl font-semibold">Manage your timeline</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="text-sm text-base-400 hover:text-base-100 border border-base-700 rounded-full px-3.5 py-1.5">
            Settings
          </Link>
          <Link href="/" className="text-sm text-base-400 hover:text-base-100 border border-base-700 rounded-full px-3.5 py-1.5">
            View timeline
          </Link>
          <button onClick={handleLogout} className="text-sm text-base-400 hover:text-red-400 border border-base-700 rounded-full px-3.5 py-1.5">
            Log out
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-muted text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          + Add Entry
        </button>
        <span className={`text-xs transition-opacity ${saving ? 'opacity-100' : 'opacity-0'} text-base-500`}>
          Saved
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-base-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-base-500 py-12 text-center">
          No entries yet. Click <strong className="text-base-300">+ Add Entry</strong> to get started.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <SortableEntryRow key={entry.id} entry={entry} index={i} onClick={() => setSelected(entry)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddEntryModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={load} categories={categories} />
      <EntryDetailModal
        entry={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onChanged={load}
        onDeleted={() => {
          setSelected(null);
          load();
        }}
        isAdmin
      />
    </div>
  );
}
