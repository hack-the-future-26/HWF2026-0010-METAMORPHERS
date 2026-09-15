import { STYLES, TRANSPORT } from '@/data/catalog'
import { GUEST_USER } from '@/data/user'
import { useAppStore } from '@/store/useAppStore'
import { logoutAccount, patchMe } from '@/services/backend'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function ProfilePage() {
  const user = useAppStore((s) => s.user)
  const signedIn = useAppStore((s) => s.signedIn)
  const personalMatch = useAppStore((s) => s.personalMatch)
  const updateUser = useAppStore((s) => s.updateUser)
  const updatePreferences = useAppStore((s) => s.updatePreferences)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)

  if (!signedIn) return <Navigate to="/login?next=/profile" replace />

  const signOut = async () => {
    await logoutAccount()
    useAppStore.setState({ user: GUEST_USER, signedIn: false, personalMatch: null })
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl">Profile</h1>

      <div className="rounded-[1.8rem] bg-white p-6 shadow-card dark:bg-ink-800">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-teal-800 text-2xl text-white">
              {(user.name || 'Y').slice(0, 1)}
            </div>
            <div>
              {editing ? (
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              ) : (
                <p className="font-display text-2xl">{user.name}</p>
              )}
              <p className="text-sm text-ink-500">{user.email}</p>
              {personalMatch != null && (
                <p className="mt-1 text-xs text-teal-800 dark:text-teal-300">Personalized {personalMatch}% match from your feedback</p>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (editing) {
                  updateUser({ name })
                  void patchMe({ name }).catch(() => {})
                  toast.success('Profile updated')
                }
                setEditing(!editing)
              }}
            >
              {editing ? 'Save name' : 'Edit name'}
            </Button>
            <Button variant="secondary" onClick={toggleTheme}>
              Theme · {theme}
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Log out
            </Button>
          </div>
      </div>

      <section className="rounded-[1.8rem] bg-white p-6 shadow-card dark:bg-ink-800">
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
        <p className="mt-5 font-medium">How you like to move</p>
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
