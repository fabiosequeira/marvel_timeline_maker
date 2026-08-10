import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthApi } from '@/lib/auth/require-auth';
import { reorderSchema } from '@/lib/validation/schemas';
import { computeOrderBetween, needsNormalization } from '@/lib/utils/order';

export async function POST(req: NextRequest) {
  const authError = await requireAuthApi();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const { entryId, beforeEntryId, afterEntryId } = parsed.data;

  const [before, after] = await Promise.all([
    beforeEntryId ? prisma.timelineEntry.findUnique({ where: { id: beforeEntryId } }) : null,
    afterEntryId ? prisma.timelineEntry.findUnique({ where: { id: afterEntryId } }) : null,
  ]);

  let newOrder = computeOrderBetween(before?.order ?? null, after?.order ?? null);

  if (needsNormalization(before?.order ?? null, after?.order ?? null)) {
    // Ran out of floating-point room between two neighbours (many inserts
    // in the same spot). Spread every entry back out to whole-number gaps.
    newOrder = await normalizeAndPlace(entryId, before?.order ?? null, after?.order ?? null);
  } else {
    await prisma.timelineEntry.update({ where: { id: entryId }, data: { order: newOrder } });
  }

  return NextResponse.json({ success: true, order: newOrder });
}

async function normalizeAndPlace(entryId: string, beforeOrder: number | null, afterOrder: number | null) {
  const all = await prisma.timelineEntry.findMany({ orderBy: { order: 'asc' }, select: { id: true, order: true } });
  const withoutMoved = all.filter((e) => e.id !== entryId);

  let insertIndex = withoutMoved.length;
  if (beforeOrder != null) {
    insertIndex = withoutMoved.findIndex((e) => e.order === beforeOrder) + 1;
  } else if (afterOrder != null) {
    insertIndex = withoutMoved.findIndex((e) => e.order === afterOrder);
  } else {
    insertIndex = 0;
  }

  const finalIds = [...withoutMoved.map((e) => e.id)];
  finalIds.splice(insertIndex, 0, entryId);

  await prisma.$transaction(
    finalIds.map((id, i) => prisma.timelineEntry.update({ where: { id }, data: { order: (i + 1) * 1000 } })),
  );

  return (insertIndex + 1) * 1000;
}
