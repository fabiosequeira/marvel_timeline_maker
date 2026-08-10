import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.timelineEntry.count();
  if (existing > 0) {
    console.log('Timeline already has entries — skipping seed.');
    return;
  }

  const category = await prisma.category.upsert({
    where: { name: 'Demo' },
    update: {},
    create: { name: 'Demo', color: '#457b9d', description: 'Fictional demo entries for local development' },
  });

  const demoMedia = [
    {
      type: 'MOVIE' as const,
      title: 'The Nightshade Signal',
      overview: 'A fictional sci-fi thriller used for local development and screenshots.',
      releaseDate: new Date('2015-06-12'),
      genres: ['Sci-Fi', 'Thriller'],
      provider: 'MANUAL' as const,
    },
    {
      type: 'SHOW' as const,
      title: 'Harbor Lights',
      overview: 'A fictional drama series used for local development and screenshots.',
      releaseDate: new Date('2018-09-03'),
      genres: ['Drama'],
      numberOfSeasons: 3,
      provider: 'MANUAL' as const,
    },
    {
      type: 'MOVIE' as const,
      title: 'Glass Horizon',
      overview: 'A fictional sequel used for local development and screenshots.',
      releaseDate: new Date('2021-03-19'),
      genres: ['Sci-Fi', 'Adventure'],
      provider: 'MANUAL' as const,
    },
  ];

  let order = 1000;
  for (const m of demoMedia) {
    const media = await prisma.media.create({ data: m });
    await prisma.timelineEntry.create({
      data: { mediaId: media.id, order, categoryId: category.id, status: 'NOT_WATCHED' },
    });
    order += 1000;
  }

  console.log(`Seeded ${demoMedia.length} demo entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
