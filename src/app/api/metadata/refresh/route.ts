import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthApi } from '@/lib/auth/require-auth';
import { refreshMetadataSchema } from '@/lib/validation/schemas';
import { getProvider } from '@/lib/metadata';
import { MetadataNotFoundError, MetadataProviderUnavailableError, ProviderNotConfiguredError } from '@/lib/metadata/types';

export async function POST(req: NextRequest) {
  const authError = await requireAuthApi();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = refreshMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const { entryId, updatePoster, updateDescription, updateDates, overwriteCustomTitle } = parsed.data;

  const entry = await prisma.timelineEntry.findUnique({ where: { id: entryId }, include: { media: true } });
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

  const media = entry.media;
  const providerName = media.provider === 'MANUAL' ? 'TMDB' : media.provider;
  const provider = getProvider(providerName as 'TMDB' | 'TVDB' | 'OMDB');
  const externalId = media.tmdbId ?? media.tvdbId ?? media.imdbId;
  if (!provider.configured || !externalId) {
    return NextResponse.json({ error: 'This entry has no refreshable provider ID.' }, { status: 400 });
  }

  try {
    const fresh =
      media.type === 'SEASON' && media.parentId
        ? await provider.getSeason(
            (await prisma.media.findUnique({ where: { id: media.parentId } }))?.tmdbId ?? externalId,
            media.seasonNumber ?? 1,
          )
        : await provider.searchById(externalId, media.type as any);

    const data: Record<string, unknown> = { lastFetchedAt: new Date() };
    if (updatePoster) {
      data.poster = fresh.poster;
      data.backdrop = fresh.backdrop;
    }
    if (updateDescription) {
      data.overview = fresh.overview;
    }
    if (updateDates) {
      data.releaseDate = fresh.releaseDate ? new Date(fresh.releaseDate) : null;
      data.endDate = fresh.endDate ? new Date(fresh.endDate) : null;
    }
    data.genres = fresh.genres ?? [];
    data.rating = fresh.rating;
    data.runtime = fresh.runtime;

    await prisma.media.update({ where: { id: media.id }, data });

    if (overwriteCustomTitle && entry.displayTitle) {
      await prisma.timelineEntry.update({ where: { id: entry.id }, data: { displayTitle: null } });
    }

    const updatedEntry = await prisma.timelineEntry.findUnique({
      where: { id: entry.id },
      include: { media: { include: { parent: true } }, category: true },
    });

    return NextResponse.json({ entry: updatedEntry });
  } catch (e) {
    if (e instanceof ProviderNotConfiguredError) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e instanceof MetadataNotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
    if (e instanceof MetadataProviderUnavailableError)
      return NextResponse.json({ error: e.message }, { status: 502 });
    console.error(e);
    return NextResponse.json({ error: 'Refresh failed.' }, { status: 500 });
  }
}
