import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-2xl border-0 bg-sand-100 px-4 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-400 focus:bg-white focus:ring-teal-600/40 dark:bg-ink-900 dark:text-sand-100 dark:placeholder:text-ink-400 dark:focus:bg-ink-800',
        className,
      )}
      {...props}
    />
  )
}
