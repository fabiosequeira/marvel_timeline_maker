import { NextResponse } from 'next/server';
import { listConfiguredProviders } from '@/lib/metadata';

export async function GET() {
  return NextResponse.json({ providers: listConfiguredProviders() });
}
