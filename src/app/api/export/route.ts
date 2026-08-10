import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthApi } from '@/lib/auth/require-auth';

export async function GET() {
  const authError = await requireAuthApi();
  if (authError) return authError;

  const [entries, categories] = await Promise.all([
    prisma.timelineEntry.findMany({ orderBy: { order: 'asc' }, include: { media: true, category: true } }),
    prisma.category.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    categories: categories.map((c) => ({
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
    })),
    entries: entries.map((e) => ({
      order: e.order,
      status: e.status,
      required: e.required,
      notes: e.notes,
      displayTitle: e.displayTitle,
      displayDescription: e.displayDescription,
      categoryName: e.category?.name ?? null,
      media: {
        type: e.media.type,
        title: e.media.title,
        originalTitle: e.media.originalTitle,
        overview: e.media.overview,
        poster: e.media.poster,
        backdrop: e.media.backdrop,
        releaseDate: e.media.releaseDate?.toISOString() ?? null,
        endDate: e.media.endDate?.toISOString() ?? null,
        runtime: e.media.runtime,
        genres: e.media.genres,
        seasonNumber: e.media.seasonNumber,
        numberOfSeasons: e.media.numberOfSeasons,
        numberOfEpisodes: e.media.numberOfEpisodes,
        provider: e.media.provider,
        tmdbId: e.media.tmdbId,
        tvdbId: e.media.tvdbId,
        imdbId: e.media.imdbId,
      },
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="timeline-export.json"',
    },
  });
}
