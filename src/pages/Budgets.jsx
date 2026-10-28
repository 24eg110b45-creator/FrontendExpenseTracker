import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Plus, Target, Trash2 } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { currentMonthValue } from '../utils/format'
import { EmptyState, ErrorState, Loading } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

function BudgetCard({ budget, currency, onDelete }) {
  const percent = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0
  const state = percent >= 100 ? 'over' : percent >= 80 ? 'warning' : 'healthy'
  return (
    <article className={`budget-card ${state}`}>
      <div className="budget-card-heading"><div className="budget-card-icon"><Target size={19} /></div><div><span>{budget.category ? 'CATEGORY BUDGET' : 'MONTHLY SPENDING LIMIT'}</span><h3>{budget.category || 'Overall monthly budget'}</h3></div><button className="icon-button delete-budget" aria-label={`Delete ${budget.category || 'monthly'} budget`} onClick={() => onDelete(budget)}><Trash2 size={16} /></button></div>
      <div className="budget-amounts"><div><span>Spent</span><strong>{new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(budget.spent)}</strong></div><div className="budget-limit"><span>Budget</span><strong>{new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(budget.amount)}</strong></div></div>
      <div className="progress-track"><span style={{ width: `${Math.min(percent, 100)}%` }} /></div>
      <div className="budget-progress-label"><span>{percent >= 100 ? <><AlertTriangle size={14} /> Over by {new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Math.abs(budget.remaining))}</> : percent >= 80 ? <><AlertTriangle size={14} /> Getting close</> : <><Check size={14} /> {new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(budget.remaining)} left</>}</span><strong>{percent}%</strong></div>
    </article>
  )
}

export default function Budgets() {
  const [month, setMonth] = useState(currentMonthValue())
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [year, selectedMonth] = month.split('-').map(Number)

  async function load() {
    setLoading(true)
    try {
      const [budgetResponse, categoryResponse, settingsResponse] = await Promise.all([
        api.get('/budgets', { params: { year, month: selectedMonth } }),
        api.get('/categories'),
        api.get('/settings'),
      ])
      setBudgets(budgetResponse.data)
      setCategories(categoryResponse.data.filter((item) => item.type !== 'INCOME'))
      setCurrency(settingsResponse.data.currency)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [month])

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await api.post('/budgets', { amount: Number(amount), year, month: selectedMonth, categoryId: categoryId ? Number(categoryId) : null })
      setAmount('')
      setToast(categoryId ? 'Category budget saved.' : 'Monthly budget saved.')
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function remove(budget) {
    if (!budget.id || !window.confirm(`Remove the ${budget.category || 'monthly'} budget?`)) return
    try {
      await api.delete(`/budgets/${budget.id}`)
      setToast('Budget removed.')
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const overall = budgets.find((item) => !item.categoryId)
  const categoriesWithBudgets = budgets.filter((item) => item.categoryId)
  const monthDate = new Date(year, selectedMonth - 1, 1)

  return (
    <>
      <PageHeader eyebrow="SPEND WITH INTENTION" title="Budgets" description="Set a gentle limit and keep your goals in sight."
        action={<label className="month-picker"><span>MONTH</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>} />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Loading label="Checking your budgets…" /> : <>
        <section className="budget-intro"><div className="budget-intro-mark"><Target size={24} /></div><div><span>{monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span><strong>{overall ? `${overall.remaining < 0 ? 'You’re over by' : 'You have'} ${new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Math.abs(overall.remaining))} ${overall.remaining < 0 ? 'over your monthly plan' : 'left in your monthly plan'}` : 'Start by setting a monthly spending plan'}</strong></div></section>
        <div className="budget-layout">
          <section className="budget-list"><div className="section-title"><div><span className="eyebrow">YOUR PLAN</span><h2>Budget progress</h2></div></div>
            {overall ? <BudgetCard budget={overall} currency={currency} onDelete={remove} /> : <article className="panel budget-empty"><EmptyState title="No monthly budget yet" message="Set an overall limit to keep tabs on your spending." /></article>}
            {categoriesWithBudgets.map((item) => <BudgetCard key={item.id} budget={item} currency={currency} onDelete={remove} />)}
            {!categoriesWithBudgets.length && <div className="hint-card"><span className="hint-icon">✳</span><div><strong>Make it personal</strong><span>Add category budgets for the things that matter most to you.</span></div></div>}
          </section>
          <aside className="panel budget-form-card"><span className="eyebrow">A PLAN THAT FITS</span><h2>{categoryId ? 'Set a category budget' : 'Set your budget'}</h2><p>Choose an amount and we'll help you keep track as the month unfolds.</p>
            <form onSubmit={save}>
              <label className="field">Budget type<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Overall monthly</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="field budget-amount-field">Monthly limit<div className="amount-input"><span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).formatToParts(0).find((part) => part.type === 'currency')?.value}</span><input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div></label>
              <div className="budget-tip"><span>✦</span><p>We’ll give you a friendly heads-up when you reach 80% of your budget.</p></div>
              <button className="button button-primary button-wide" disabled={saving}><Plus size={17} />{saving ? 'Saving…' : 'Save budget'}</button>
            </form>
          </aside>
        </div>
      </>}
    </>
  )
}
