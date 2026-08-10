'use client';

import { useState } from 'react';
import { CategoryDTO } from '@/types';

const SWATCHES = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d', '#a78bfa', '#f472b6', '#94a3b8'];

export function CategoriesManager({
  categories,
  onChanged,
}: {
  categories: CategoryDTO[];
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create category');
      }
      setName('');
      onChanged();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Entries using it will become uncategorized.')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    onChanged();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 bg-base-900 border border-base-800 rounded-lg px-3 py-2">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ background: c.color || '#666' }} />
            <span className="flex-1 text-sm">{c.name}</span>
            <button onClick={() => handleDelete(c.id)} className="text-xs text-base-500 hover:text-red-400">
              Delete
            </button>
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm text-base-500">No categories yet.</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {SWATCHES.map((s) => (
            <button
              key={s}
              onClick={() => setColor(s)}
              className="h-6 w-6 rounded-full shrink-0"
              style={{ background: s, outline: color === s ? '2px solid white' : 'none', outlineOffset: 2 }}
              aria-label={`Choose color ${s}`}
            />
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New category name"
          className="flex-1 rounded-lg bg-base-800 border border-base-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          disabled={busy || !name.trim()}
          onClick={handleCreate}
          className="rounded-lg bg-accent hover:bg-accent-muted text-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
