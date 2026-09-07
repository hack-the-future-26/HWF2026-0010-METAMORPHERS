import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

export function Badge({
  className,
  tone = 'teal',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: 'teal' | 'sand' | 'sunset' | 'red' | 'green' | 'yellow' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide',
        tone === 'teal' && 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        tone === 'sand' && 'bg-sand-200 text-ink-700 dark:bg-white/10 dark:text-sand-200',
        tone === 'sunset' && 'bg-sunset-100 text-sunset-600 dark:bg-sunset-500/15 dark:text-sunset-400',
        tone === 'red' && 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        tone === 'green' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        tone === 'yellow' && 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        className,
      )}
      {...props}
    />
  )
}
