import { STYLES, TRANSPORT } from '@/data/catalog'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import { toast } from 'sonner'

export function ProfilePage() {
  const user = useAppStore((s) => s.user)
  const updateUser = useAppStore((s) => s.updateUser)
  const updatePreferences = useAppStore((s) => s.updatePreferences)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl">Profile</h1>
      <div className="rounded-3xl bg-white p-6 shadow-card dark:bg-ink-800">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-teal-800 text-2xl text-white">
            {user.name.slice(0, 1)}
          </div>
          <div>
            {editing ? (
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <p className="font-display text-2xl">{user.name}</p>
            )}
            <p className="text-sm text-ink-500">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (editing) {
                updateUser({ name })
                toast.success('Profile updated')
              }
              setEditing(!editing)
            }}
          >
            {editing ? 'Save name' : 'Edit Preferences'}
          </Button>
          <Button variant="secondary" onClick={toggleTheme}>
            Theme · {theme}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              updatePreferences({ notifications: !user.preferences.notifications })
              toast.success(user.preferences.notifications ? 'Notifications off' : 'Notifications on')
            }}
          >
            Notifications · {user.preferences.notifications ? 'On' : 'Off'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const next = user.preferences.language === 'English' ? 'తెలుగు' : 'English'
              updatePreferences({ language: next })
              toast.success(`Language: ${next}`)
            }}
          >
            Language · {user.preferences.language}
          </Button>
          <Button variant="ghost" onClick={() => toast.message('Demo privacy: itinerary stays on this device via localStorage.')}>
            Privacy
          </Button>
        </div>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-card dark:bg-ink-800">
        <p className="font-medium">Travel preferences</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {STYLES.map((s) => {
            const on = user.preferences.styles.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() =>
                  updatePreferences({
                    styles: on
                      ? user.preferences.styles.filter((x) => x !== s.id)
                      : [...user.preferences.styles, s.id],
                  })
                }
                className={`rounded-full px-3 py-1.5 text-sm ${on ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8'}`}
              >
                {s.icon} {s.label}
              </button>
            )
          })}
        </div>
        <p className="mt-5 text-sm text-ink-500">
          Budget preference: {user.preferences.budgetTier} · ₹{user.preferences.defaultBudget.toLocaleString('en-IN')}
        </p>
        <input
          type="range"
          min={3000}
          max={40000}
          step={500}
          value={user.preferences.defaultBudget}
          onChange={(e) => updatePreferences({ defaultBudget: Number(e.target.value) })}
          className="mt-2 w-full accent-teal-700"
        />
        <p className="mt-5 font-medium">Transportation preference</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRANSPORT.map((t) => {
            const on = user.preferences.transport.includes(t.id)
            return (
              <button
                key={t.id}
                onClick={() =>
                  updatePreferences({
                    transport: on
                      ? user.preferences.transport.filter((x) => x !== t.id)
                      : [...user.preferences.transport, t.id],
                  })
                }
                className={`rounded-full px-3 py-1.5 text-sm ${on ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8'}`}
              >
                {t.icon} {t.label}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
