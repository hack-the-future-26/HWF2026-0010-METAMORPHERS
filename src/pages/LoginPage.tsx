import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { loginAccount, signupAccount } from '@/services/backend'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const SIDE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/The_Charminar_from_Nimrah_Cafe.jpg/1280px-The_Charminar_from_Nimrah_Cafe.jpg'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const hydrateSession = useAppStore((s) => s.hydrateSession)
  const applyAuth = useAppStore((s) => s.applyAuth)
  const next = params.get('next') || '/arrive'
  const initialSignup = params.get('mode') === 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>(initialSignup ? 'signup' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const title = useMemo(() => (mode === 'signup' ? 'Save your trips' : 'Welcome back'), [mode])

  const submit = async () => {
    const mail = email.trim()
    if (!mail.includes('@') || password.length < 6) {
      toast.error('Use a real email and a password of at least 6 characters')
      return
    }
    setBusy(true)
    try {
      const data =
        mode === 'signup'
          ? await signupAccount({ name: name.trim() || mail.split('@')[0], email: mail, password })
          : await loginAccount(mail, password)
      applyAuth(data.user)
      await hydrateSession()
      toast.success(mode === 'signup' ? 'Account created' : `Signed in as ${data.user.email}`)
      navigate(next.startsWith('/') ? next : '/arrive')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100svh-5.5rem)] max-w-6xl items-center gap-8 px-5 pb-16 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-[2rem] lg:block lg:min-h-[34rem]">
        <img src={SIDE} alt="Hussain Sagar, Hyderabad" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
        <p className="absolute bottom-8 left-8 right-8 font-display text-3xl text-white">
          Planning does not need an account. Sign in to keep saved trips, day ratings, and packing lists with you.
        </p>
      </div>
      <section className="rounded-[2rem] bg-white p-6 shadow-card dark:bg-ink-800 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sunset-600">Account</p>
        <h1 className="mt-2 font-display text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">
          Optional. You can plan, explore, and go live without signing in.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setMode('login')}
            className={`rounded-full px-3 py-1.5 text-xs ${mode === 'login' ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8'}`}
          >
            Log in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`rounded-full px-3 py-1.5 text-xs ${mode === 'signup' ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8'}`}
          >
            Sign up
          </button>
        </div>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {mode === 'signup' && <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />}
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <button className="text-ink-500 underline" onClick={() => navigate(next.startsWith('/') ? next : '/plan')}>
            Continue without an account
          </button>
          <button className="text-ink-500 underline" onClick={() => navigate('/')}>
            Back to landing
          </button>
        </div>
      </section>
    </main>
  )
}
