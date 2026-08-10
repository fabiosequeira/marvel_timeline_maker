import { prisma } from './prisma';
import { NormalizedMetadata } from '@/lib/metadata/types';
import { Media, Prisma } from '@prisma/client';

function toDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Store (or update the cache for) a piece of normalized metadata. If it's a
 * season, its parent show is upserted first and linked via parentId.
 */
export async function upsertMediaFromMetadata(meta: NormalizedMetadata): Promise<Media> {
  let parentId: string | undefined;
  if (meta.type === 'SEASON' && meta.parentShow) {
    const parent = await upsertMediaFromMetadata(meta.parentShow);
    parentId = parent.id;
  }

  const data: Prisma.MediaCreateInput = {
    type: meta.type,
    title: meta.title,
    originalTitle: meta.originalTitle,
    overview: meta.overview,
    poster: meta.poster,
    backdrop: meta.backdrop,
    releaseDate: toDate(meta.releaseDate),
    endDate: toDate(meta.endDate),
    runtime: meta.runtime,
    genres: meta.genres ?? [],
    network: meta.network,
    productionCompanies: meta.productionCompanies ?? [],
    cast: meta.cast ?? [],
    creators: meta.creators ?? [],
    director: meta.director,
    country: meta.country,
    language: meta.language,
    rating: meta.rating,
    seasonNumber: meta.seasonNumber,
    numberOfSeasons: meta.numberOfSeasons,
    numberOfEpisodes: meta.numberOfEpisodes,
    provider: meta.provider,
    tmdbId: meta.tmdbId,
    tvdbId: meta.tvdbId,
    imdbId: meta.imdbId,
    lastFetchedAt: new Date(),
    ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
  };

  // Find an existing row for this exact provider id + type (dedupe cache).
  const existing = await findExistingMedia(meta);
  if (existing) {
    return prisma.media.update({ where: { id: existing.id }, data });
  }
  return prisma.media.create({ data });
}

async function findExistingMedia(meta: NormalizedMetadata): Promise<Media | null> {
  const or: Prisma.MediaWhereInput[] = [];
  if (meta.tmdbId) or.push({ tmdbId: meta.tmdbId, type: meta.type });
  if (meta.tvdbId) or.push({ tvdbId: meta.tvdbId, type: meta.type });
  if (meta.imdbId) or.push({ imdbId: meta.imdbId, type: meta.type });
  if (or.length === 0) return null;
  return prisma.media.findFirst({ where: { OR: or } });
}

/** Returns the existing timeline entry (if any) that already references this media, for duplicate-protection prompts. */
export async function findDuplicateEntry(meta: NormalizedMetadata) {
  const media = await findExistingMedia(meta);
  if (!media) return null;
  const entry = await prisma.timelineEntry.findFirst({
    where: { mediaId: media.id },
    include: { media: true },
  });
  return entry;
}
