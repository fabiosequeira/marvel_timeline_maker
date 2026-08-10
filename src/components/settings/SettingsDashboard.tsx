'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CategoryDTO, ProviderName } from '@/types';
import { CategoriesManager } from './CategoriesManager';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-base-200 mb-3">{title}</h2>
      <div className="bg-base-900 border border-base-800 rounded-xl p-4">{children}</div>
    </section>
  );
}

export function SettingsDashboard() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [providers, setProviders] = useState<{ name: ProviderName; configured: boolean }[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
    fetch('/api/settings/providers')
      .then((r) => r.json())
      .then((d) => setProviders(d.providers ?? []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleImportFile(file: File) {
    setImportStatus('Importing…');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportStatus(`Imported ${data.created} entries.`);
      load();
    } catch (e: any) {
      setImportStatus(`Import failed: ${e.message}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">Settings</div>
          <h1 className="text-xl font-semibold">Configuration</h1>
        </div>
        <Link href="/admin" className="text-sm text-base-400 hover:text-base-100 border border-base-700 rounded-full px-3.5 py-1.5">
          ← Back to admin
        </Link>
      </header>

      <Section title="Metadata providers">
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.name} className="flex items-center justify-between text-sm">
              <span>{p.name}</span>
              <span className={p.configured ? 'text-emerald-400' : 'text-base-500'}>
                {p.configured ? 'Configured' : 'Not configured'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-base-500 mt-3">
          Add API keys to your <code className="text-base-400">.env</code> file and restart the app to enable a provider.
        </p>
      </Section>

      <Section title="Categories">
        <CategoriesManager categories={categories} onChanged={load} />
      </Section>

      <Section title="Backup / restore">
        <div className="flex flex-wrap gap-3 items-center">
          <a
            href="/api/export"
            download
            className="rounded-lg border border-base-700 px-4 py-2 text-sm hover:bg-base-800 transition-colors"
          >
            Export Timeline (JSON)
          </a>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-base-700 px-4 py-2 text-sm hover:bg-base-800 transition-colors"
          >
            Import Timeline (JSON)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
          />
        </div>
        {importStatus && <p className="text-xs text-base-400 mt-2">{importStatus}</p>}
        <p className="text-xs text-base-500 mt-3">
          For full database backups (not just the timeline JSON), use{' '}
          <code className="text-base-400">scripts/backup.sh</code> — see the README.
        </p>
      </Section>
    </div>
  );
}
