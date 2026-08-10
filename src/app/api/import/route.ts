import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthApi } from '@/lib/auth/require-auth';
import { importSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  const authError = await requireAuthApi();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid import file', details: parsed.error.flatten() }, { status: 400 });
  }
  const { categories, entries } = parsed.data;

  const categoryIdByName = new Map<string, string>();
  for (const c of categories) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description, icon: c.icon, color: c.color },
      create: { name: c.name, description: c.description, icon: c.icon, color: c.color },
    });
    categoryIdByName.set(c.name, category.id);
  }

  let created = 0;
  for (const e of entries) {
    const media = await prisma.media.create({
      data: {
        type: e.media.type,
        title: e.media.title,
        originalTitle: e.media.originalTitle ?? undefined,
        overview: e.media.overview ?? undefined,
        poster: e.media.poster ?? undefined,
        backdrop: e.media.backdrop ?? undefined,
        releaseDate: e.media.releaseDate ? new Date(e.media.releaseDate) : undefined,
        endDate: e.media.endDate ? new Date(e.media.endDate) : undefined,
        runtime: e.media.runtime ?? undefined,
        genres: e.media.genres,
        seasonNumber: e.media.seasonNumber ?? undefined,
        numberOfSeasons: e.media.numberOfSeasons ?? undefined,
        numberOfEpisodes: e.media.numberOfEpisodes ?? undefined,
        provider: (['TMDB', 'TVDB', 'OMDB', 'MANUAL'].includes(e.media.provider) ? e.media.provider : 'MANUAL') as any,
        tmdbId: e.media.tmdbId ?? undefined,
        tvdbId: e.media.tvdbId ?? undefined,
        imdbId: e.media.imdbId ?? undefined,
      },
    });

    await prisma.timelineEntry.create({
      data: {
        mediaId: media.id,
        order: e.order,
        status: e.status,
        required: e.required,
        notes: e.notes ?? undefined,
        displayTitle: e.displayTitle ?? undefined,
        displayDescription: e.displayDescription ?? undefined,
        categoryId: e.categoryName ? categoryIdByName.get(e.categoryName) : undefined,
      },
    });
    created += 1;
  }

  return NextResponse.json({ success: true, created });
}
