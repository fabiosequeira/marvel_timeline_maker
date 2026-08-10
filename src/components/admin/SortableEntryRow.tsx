'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { TimelineEntryDTO } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function SortableEntryRow({
  entry,
  index,
  onClick,
}: {
  entry: TimelineEntryDTO;
  index: number;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const title = entry.displayTitle || entry.media.title;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-base-900 border border-base-800 rounded-xl px-3 py-2.5 hover:border-base-700 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-base-500 hover:text-base-300 px-1 touch-none"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <span className="text-xs text-base-500 w-6 text-right tabular-nums shrink-0">{index + 1}</span>
      <div className="relative h-12 w-9 rounded overflow-hidden bg-base-800 shrink-0">
        {entry.media.poster && <Image src={entry.media.poster} alt={title} fill className="object-cover" sizes="36px" />}
      </div>
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <div className="font-medium text-sm truncate">{title}</div>
        <div className="text-xs text-base-500">
          {entry.media.type === 'SEASON' ? `Season ${entry.media.seasonNumber ?? ''}` : entry.media.type}
          {entry.media.releaseDate ? ` · ${new Date(entry.media.releaseDate).getFullYear()}` : ''}
          {!entry.required ? ' · Optional' : ''}
        </div>
      </button>
      <StatusBadge status={entry.status} className="shrink-0" />
    </div>
  );
}
