import { NextRequest, NextResponse } from 'next/server';
import { requireAuthApi } from '@/lib/auth/require-auth';
import { fetchMetadataSchema } from '@/lib/validation/schemas';
import { detectId, getProvider } from '@/lib/metadata';
import { findDuplicateEntry } from '@/lib/db/media';
import { MetadataNotFoundError, MetadataProviderUnavailableError, ProviderNotConfiguredError } from '@/lib/metadata/types';

export async function POST(req: NextRequest) {
  const authError = await requireAuthApi();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = fetchMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const { provider: providerName, id, type, seasonNumber } = parsed.data;

  const provider = getProvider(providerName);
  if (!provider.configured) {
    return NextResponse.json(
      { error: `${providerName} isn't configured. Add its API key to your .env file.` },
      { status: 400 },
    );
  }

  try {
    const metadata =
      type === 'SEASON'
        ? await provider.getSeason(id, seasonNumber ?? 1)
        : await provider.searchById(id, type);

    const duplicate = await findDuplicateEntry(metadata);

    return NextResponse.json({
      metadata,
      duplicate: duplicate
        ? { id: duplicate.id, title: duplicate.media.title, order: duplicate.order }
        : null,
    });
  } catch (e) {
    if (e instanceof ProviderNotConfiguredError) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e instanceof MetadataNotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
    if (e instanceof MetadataProviderUnavailableError) return NextResponse.json({ error: e.message }, { status: 502 });
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong fetching metadata.' }, { status: 500 });
  }
}

/** GET ?q=... — lightweight ID/URL detection helper used by the Add Entry modal as-you-type. */
export async function GET(req: NextRequest) {
  const authError = await requireAuthApi();
  if (authError) return authError;
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const detected = detectId(q);
  return NextResponse.json({ detected });
}
