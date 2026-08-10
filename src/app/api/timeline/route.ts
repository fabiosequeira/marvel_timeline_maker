import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const [entries, categories] = await Promise.all([
    prisma.timelineEntry.findMany({
      orderBy: { order: 'asc' },
      include: { media: { include: { parent: true } }, category: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const total = entries.filter((e) => e.required).length;
  const watched = entries.filter((e) => e.required && e.status === 'WATCHED').length;
  const movies = entries.filter((e) => e.media.type === 'MOVIE');
  const shows = entries.filter((e) => e.media.type === 'SHOW' || e.media.type === 'SEASON');

  const manualNext = entries.find((e) => e.manualNext);
  const autoNext = entries.find((e) => e.status === 'NOT_WATCHED' || e.status === 'WATCHING');

  return NextResponse.json({
    entries,
    categories,
    progress: {
      total,
      watched,
      movies: { total: movies.length, watched: movies.filter((e) => e.status === 'WATCHED').length },
      shows: { total: shows.length, watched: shows.filter((e) => e.status === 'WATCHED').length },
    },
    nextEntryId: (manualNext ?? autoNext)?.id ?? null,
  });
}
