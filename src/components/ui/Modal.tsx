import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function Modal({
  open,
  onClose,
  children,
  title,
  wide,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  wide?: boolean
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className={`relative z-10 max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-ink-800 sm:rounded-3xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-sand-200/80 bg-white/90 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-ink-800/90">
              <h3 className="font-display text-lg">{title}</h3>
              <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close dialog">
                <X className="size-5" />
              </Button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
