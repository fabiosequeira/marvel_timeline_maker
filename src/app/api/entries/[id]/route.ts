import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthApi } from '@/lib/auth/require-auth';
import { updateEntrySchema } from '@/lib/validation/schemas';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuthApi();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // If the user manually pins a "next" item, clear any other manual pin so
  // only one entry is ever forced as next.
  if (data.manualNext === true) {
    await prisma.timelineEntry.updateMany({ where: { manualNext: true }, data: { manualNext: false } });
  }

  try {
    const entry = await prisma.timelineEntry.update({
      where: { id: params.id },
      data: {
        ...data,
        displayReleaseDate: data.displayReleaseDate ? new Date(data.displayReleaseDate) : data.displayReleaseDate,
      },
      include: { media: { include: { parent: true } }, category: true },
    });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuthApi();
  if (authError) return authError;

  try {
    await prisma.timelineEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
}
