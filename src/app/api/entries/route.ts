import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthApi } from '@/lib/auth/require-auth';
import { createEntrySchema } from '@/lib/validation/schemas';
import { getProvider } from '@/lib/metadata';
import { MetadataNotFoundError, MetadataProviderUnavailableError, ProviderNotConfiguredError } from '@/lib/metadata/types';
import { findDuplicateEntry, upsertMediaFromMetadata } from '@/lib/db/media';
import { computeOrderBetween } from '@/lib/utils/order';

export async function GET() {
  const entries = await prisma.timelineEntry.findMany({
    orderBy: { order: 'asc' },
    include: { media: { include: { parent: true } }, category: true },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const authError = await requireAuthApi();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const provider = getProvider(input.provider);
  if (!provider.configured) {
    return NextResponse.json(
      { error: `${input.provider} isn't configured. Add its API key to your .env file.` },
      { status: 400 },
    );
  }

  try {
    const metadata =
      input.type === 'SEASON'
        ? await provider.getSeason(input.externalId, input.seasonNumber ?? 1)
        : await provider.searchById(input.externalId, input.type);

    if (!input.allowDuplicate) {
      const duplicate = await findDuplicateEntry(metadata);
      if (duplicate) {
        return NextResponse.json(
          {
            duplicate: true,
            existingEntry: {
              id: duplicate.id,
              title: duplicate.media.title,
              order: duplicate.order,
            },
          },
          { status: 409 },
        );
      }
    }

    const media = await upsertMediaFromMetadata(metadata);

    let order: number;
    if (input.insertAfterEntryId) {
      const after = await prisma.timelineEntry.findUnique({ where: { id: input.insertAfterEntryId } });
      const next = after
        ? await prisma.timelineEntry.findFirst({ where: { order: { gt: after.order } }, orderBy: { order: 'asc' } })
        : null;
      order = computeOrderBetween(after?.order, next?.order ?? null);
    } else {
      const last = await prisma.timelineEntry.findFirst({ orderBy: { order: 'desc' } });
      order = computeOrderBetween(last?.order ?? null, null);
    }

    const entry = await prisma.timelineEntry.create({
      data: {
        mediaId: media.id,
        order,
        status: input.status ?? 'NOT_WATCHED',
        required: input.required ?? true,
        notes: input.notes,
        categoryId: input.categoryId ?? undefined,
      },
      include: { media: { include: { parent: true } }, category: true },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    if (e instanceof ProviderNotConfiguredError) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e instanceof MetadataNotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
    if (e instanceof MetadataProviderUnavailableError) return NextResponse.json({ error: e.message }, { status: 502 });
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong adding that entry.' }, { status: 500 });
  }
}
