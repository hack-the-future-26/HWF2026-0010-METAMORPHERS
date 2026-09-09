import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-white shadow-card ring-1 ring-black/5 dark:bg-ink-800 dark:ring-white/8',
        className,
      )}
      {...props}
    />
  )
}
