import clsx from 'clsx';
import { WatchStatus } from '@/types';

const STATUS_CONFIG: Record<WatchStatus, { label: string; className: string }> = {
  NOT_WATCHED: { label: 'Not Watched', className: 'bg-base-700 text-base-300' },
  WATCHING: { label: 'Watching', className: 'bg-blue-500/15 text-blue-400' },
  WATCHED: { label: '✓ Watched', className: 'bg-emerald-500/15 text-emerald-400' },
  SKIPPED: { label: 'Skipped', className: 'bg-base-700 text-base-500 line-through' },
  REWATCHING: { label: 'Rewatching', className: 'bg-purple-500/15 text-purple-400' },
};

export function StatusBadge({ status, className }: { status: WatchStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', cfg.className, className)}>
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
