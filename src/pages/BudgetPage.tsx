import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { spentTotal, useAppStore } from '@/store/useAppStore'
import type { ExpenseCategory } from '@/types'
import { formatInr } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

const CATS: { id: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { id: 'stay', label: 'Stay', icon: '🏨', color: '#0f6e6a' },
  { id: 'food', label: 'Food', icon: '🍛', color: '#c45c26' },
  { id: 'transport', label: 'Transport', icon: '🚕', color: '#1d4ed8' },
  { id: 'tickets', label: 'Tickets', icon: '🎟️', color: '#7c3aed' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#ca8a04' },
  { id: 'other', label: 'Other', icon: '✨', color: '#64748b' },
]

export function BudgetPage() {
  const trip = useAppStore((s) => s.trip)
  const user = useAppStore((s) => s.user)
  const expenses = useAppStore((s) => s.expenses)
  const add = useAppStore((s) => s.addExpense)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [amount, setAmount] = useState('220')
  const [description, setDescription] = useState('Evening snack')

  const budget = trip?.budget ?? user.preferences.defaultBudget
  const spent = spentTotal(expenses)
  const remaining = budget - spent
  const estimatedRemaining = remaining
  const byCat = CATS.map((c) => ({
    ...c,
    value: expenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.value > 0)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-4xl">Budget</h1>
        <Button onClick={() => setOpen(true)}>+ Add Expense</Button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile k="Total Budget" v={formatInr(budget)} />
        <Tile k="Spent" v={formatInr(spent)} />
        <Tile k="Remaining" v={formatInr(remaining)} />
        <Tile k="Estimated remaining" v={formatInr(estimatedRemaining)} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-card dark:bg-ink-800">
          <p className="font-medium">Spend mix</p>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {byCat.map((c) => (
                    <Cell key={c.id} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatInr(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-2">
          {CATS.map((c) => {
            const v = expenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0)
            return (
              <div key={c.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card dark:bg-ink-800">
                <span>
                  {c.icon} {c.label}
                </span>
                <span className="font-medium">{formatInr(v)}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {expenses.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm dark:bg-ink-800">
            <span>
              {e.description}
              <span className="block text-[11px] capitalize text-ink-400">{e.category}</span>
            </span>
            <span>{formatInr(e.amount)}</span>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add expense">
        <label className="text-xs text-ink-400">Category</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-3 py-1 text-sm ${category === c.id ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8'}`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-xs text-ink-400">Amount (₹)</label>
        <Input className="mt-1" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label className="mt-4 block text-xs text-ink-400">Description</label>
        <Input className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button
          className="mt-5 w-full"
          onClick={() => {
            add(category, Number(amount) || 0, description)
            setOpen(false)
          }}
        >
          Save expense
        </Button>
      </Modal>
    </div>
  )
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card dark:bg-ink-800">
      <p className="text-[11px] text-ink-400">{k}</p>
      <p className="mt-1 font-display text-2xl">{v}</p>
    </div>
  )
}
