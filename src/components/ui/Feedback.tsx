import { cn } from '@/lib/utils'

export function CrowdDot({ level }: { level: 'low' | 'moderate' | 'high' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={cn(
          'size-2 rounded-full',
          level === 'low' && 'bg-crowd-low',
          level === 'moderate' && 'bg-crowd-mod',
          level === 'high' && 'bg-crowd-high',
        )}
      />
      {level === 'low' ? 'Low' : level === 'high' ? 'High' : 'Moderate'} crowd
    </span>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="rounded-3xl border border-dashed border-sand-300 px-6 py-14 text-center dark:border-white/10">
      <p className="font-display text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">{body}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 rounded-full bg-teal-800 px-5 py-2.5 text-sm text-white dark:bg-teal-500 dark:text-ink-900"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-sand-200 dark:bg-white/10', className)} />
}
