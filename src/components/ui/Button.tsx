import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'sunset' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children?: ReactNode
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-teal-800 text-white shadow-float hover:bg-teal-700 dark:bg-teal-500 dark:text-ink-900',
        variant === 'secondary' && 'bg-white text-ink-900 shadow-card ring-1 ring-sand-300 hover:bg-sand-50 dark:bg-ink-800 dark:text-sand-100 dark:ring-white/10',
        variant === 'ghost' && 'text-ink-700 hover:bg-sand-200/70 dark:text-sand-200 dark:hover:bg-white/5',
        variant === 'sunset' && 'bg-sunset-500 text-white hover:bg-sunset-600',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'outline' && 'border border-teal-800/20 text-teal-800 hover:bg-teal-50 dark:border-teal-400/30 dark:text-teal-300 dark:hover:bg-teal-950',
        size === 'sm' && 'h-9 px-3.5 text-sm',
        size === 'md' && 'h-11 px-5 text-sm',
        size === 'lg' && 'h-13 px-7 text-base h-12',
        size === 'icon' && 'size-10',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
