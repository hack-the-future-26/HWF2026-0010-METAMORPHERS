import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

export function AdaptStory() {
  const [rain, setRain] = useState(false)
  return (
    <section className="overflow-hidden rounded-[2rem] bg-white p-6 shadow-card dark:bg-ink-800 sm:p-8">
      <h2 className="font-display text-3xl">Travel plans change. YatraSense changes with them.</h2>
      <p className="mt-2 max-w-xl text-sm text-ink-500">
        Watch a live reroute: rain hits a beach slot, and the co-pilot protects your afternoon.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-sand-100 p-4 dark:bg-white/5">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Before</p>
          <p className="mt-3 text-lg">4:00 PM · Yarada Beach</p>
        </div>
        <div className="rounded-3xl bg-teal-50 p-4 dark:bg-teal-950">
          <p className="text-xs uppercase tracking-[0.16em] text-teal-800">After</p>
          <AnimatePresence mode="wait">
            {rain ? (
              <motion.div
                key="after"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 space-y-1 text-lg"
              >
                <p>4:00 PM · Submarine Museum</p>
                <p>5:45 PM · Yarada Beach</p>
                <p className="text-sm text-teal-800">Saved 38 minutes</p>
              </motion.div>
            ) : (
              <motion.p key="wait" className="mt-3 text-sm text-ink-500">
                Waiting for a disruption…
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <button
        onClick={() => setRain(true)}
        className="mt-5 rounded-full bg-ink-900 px-5 py-2.5 text-sm text-white"
      >
        🌧️ Rain detected
      </button>
    </section>
  )
}
