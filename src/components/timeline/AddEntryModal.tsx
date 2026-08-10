'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { CategoryDTO, ProviderName } from '@/types';
import { NormalizedMetadata } from '@/lib/metadata/types';

type Step = 'input' | 'preview' | 'duplicate';

const PROVIDERS: { value: ProviderName; label: string }[] = [
  { value: 'TMDB', label: 'TMDB' },
  { value: 'TVDB', label: 'TVDB' },
  { value: 'OMDB', label: 'OMDb' },
];

export function AddEntryModal({
  open,
  onClose,
  onAdded,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  categories: CategoryDTO[];
}) {
  const [step, setStep] = useState<Step>('input');
  const [provider, setProvider] = useState<ProviderName>('TMDB');
  const [rawId, setRawId] = useState('');
  const [isSeason, setIsSeason] = useState(false);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<NormalizedMetadata | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: string; title: string; order: number } | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [providers, setProviders] = useState<{ name: ProviderName; configured: boolean }[]>([]);

  useEffect(() => {
    if (!open) return;
    reset();
    fetch('/api/settings/providers')
      .then((r) => r.json())
      .then((d) => setProviders(d.providers ?? []))
      .catch(() => {});
  }, [open]);

  function reset() {
    setStep('input');
    setRawId('');
    setIsSeason(false);
    setSeasonNumber(1);
    setError(null);
    setMetadata(null);
    setDuplicate(null);
    setCategoryId('');
  }

  function extractId(input: string): string {
    const trimmed = input.trim();
    const imdbMatch = trimmed.match(/imdb\.com\/title\/(tt\d+)/i);
    if (imdbMatch) return imdbMatch[1];
    const tmdbMatch = trimmed.match(/themoviedb\.org\/(movie|tv)\/(\d+)/i);
    if (tmdbMatch) return tmdbMatch[2];
    const tvdbMatch = trimmed.match(/thetvdb\.com\/(series|movies)\/(\d+)/i);
    if (tvdbMatch) return tvdbMatch[2];
    return trimmed;
  }

  const detectedType = /^tt\d+$/i.test(extractId(rawId)) ? 'IMDb ID' : /^\d+$/.test(extractId(rawId)) ? `${provider} ID` : null;

  async function handleFetch(allowDuplicate = false) {
    setLoading(true);
    setError(null);
    try {
      const id = extractId(rawId);
      const res = await fetch('/api/metadata/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          id,
          type: isSeason ? 'SEASON' : undefined,
          seasonNumber: isSeason ? seasonNumber : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch metadata');

      setMetadata(data.metadata);
      if (data.duplicate && !allowDuplicate) {
        setDuplicate(data.duplicate);
        setStep('duplicate');
      } else {
        setStep('preview');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(allowDuplicate = false) {
    if (!metadata) return;
    setLoading(true);
    setError(null);
    try {
      const id = extractId(rawId);
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          externalId: id,
          type: metadata.type,
          seasonNumber: isSeason ? seasonNumber : undefined,
          categoryId: categoryId || undefined,
          allowDuplicate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.duplicate) {
          setDuplicate(data.existingEntry);
          setStep('duplicate');
          return;
        }
        throw new Error(data.error || 'Failed to add entry');
      }
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const configuredProviders = providers.filter((p) => p.configured);

  return (
    <Modal open={open} onClose={onClose} title="Add Entry">
      {step === 'input' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-base-400 block mb-1.5">Provider</label>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => {
                const cfg = providers.find((x) => x.name === p.value);
                const disabled = providers.length > 0 && cfg && !cfg.configured;
                return (
                  <button
                    key={p.value}
                    disabled={disabled}
                    onClick={() => setProvider(p.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      provider === p.value
                        ? 'border-accent bg-accent-soft text-white'
                        : 'border-base-700 text-base-300 hover:bg-base-800'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {p.label}
                    {disabled && <span className="block text-[10px] text-base-500">not configured</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-base-400 block mb-1.5">ID or URL</label>
            <input
              autoFocus
              value={rawId}
              onChange={(e) => setRawId(e.target.value)}
              placeholder="tt0120611, 12445, or a provider URL"
              className="w-full rounded-lg bg-base-800 border border-base-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            {detectedType && <p className="text-xs text-base-500 mt-1.5">Detected: {detectedType}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-base-300">
            <input type="checkbox" checked={isSeason} onChange={(e) => setIsSeason(e.target.checked)} className="rounded" />
            This is a TV season (ID = the show's ID)
          </label>

          {isSeason && (
            <div>
              <label className="text-xs text-base-400 block mb-1.5">Season number</label>
              <input
                type="number"
                min={0}
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(parseInt(e.target.value, 10) || 1)}
                className="w-24 rounded-lg bg-base-800 border border-base-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            disabled={!rawId.trim() || loading}
            onClick={() => handleFetch()}
            className="w-full rounded-lg bg-accent hover:bg-accent-muted text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Fetching…' : 'Fetch Metadata'}
          </button>
        </div>
      )}

      {step === 'duplicate' && duplicate && (
        <div className="space-y-4">
          <p className="text-sm text-base-300">
            This title already exists in your timeline.
          </p>
          <div className="rounded-lg bg-base-800 px-3 py-2.5">
            <div className="font-medium text-sm">{duplicate.title}</div>
            <div className="text-xs text-base-500">Position #{Math.round(duplicate.order)}</div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setStep('input')}
              className="flex-1 rounded-lg border border-base-700 py-2.5 text-sm hover:bg-base-800 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={() => handleConfirm(true)}
              className="flex-1 rounded-lg bg-accent hover:bg-accent-muted text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Add Anyway
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && metadata && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {metadata.poster && (
              <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden bg-base-800 shrink-0">
                <Image src={metadata.poster} alt={metadata.title} fill className="object-cover" sizes="80px" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs text-base-500 mb-0.5">
                {metadata.type}
                {metadata.releaseDate ? ` · ${new Date(metadata.releaseDate).getFullYear()}` : ''}
              </div>
              <div className="font-semibold">{metadata.title}</div>
              {metadata.overview && <p className="text-xs text-base-400 line-clamp-3 mt-1">{metadata.overview}</p>}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="text-xs text-base-400 block mb-1.5">Category (optional)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg bg-base-800 border border-base-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('input')}
              className="flex-1 rounded-lg border border-base-700 py-2.5 text-sm hover:bg-base-800 transition-colors"
            >
              Back
            </button>
            <button
              disabled={loading}
              onClick={() => handleConfirm()}
              className="flex-1 rounded-lg bg-accent hover:bg-accent-muted text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add to Timeline'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
