import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus, Wallet } from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import api, { getErrorMessage } from '../services/api'
import { formatMoney } from '../utils/format'
import { EmptyState, ErrorState, Loading } from '../components/Feedback'
import PageHeader from '../components/PageHeader'

function SummaryCard({ label, value, icon: Icon, tone, helper, badge }) {
  return (
    <article className={`summary-card ${tone}`}>
      <div className="summary-card-top">
        <span className="summary-label">{label}</span>
        <span className="summary-icon"><Icon size={19} /></span>
      </div>
      <div className="summary-value">{value}</div>
      <div className="summary-foot"><span>{helper}</span>{badge && <span className="summary-badge">{badge}</span>}</div>
    </article>
  )
}

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={item.dataKey} style={{ color: item.color }}>{item.name}: {formatMoney(item.value, currency)}</span>)}</div>
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('USD')

  async function load() {
    setLoading(true)
    try {
      const [summary, settings] = await Promise.all([api.get('/dashboard/summary'), api.get('/settings')])
      setData(summary.data)
      setCurrency(settings.data.currency)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Loading />
  if (error) return <ErrorState message={error} onRetry={load} />
  if (!data) return null

  const summary = data.summary
  const budgetTone = summary.budgetStatus === 'EXCEEDED' ? 'danger'
    : summary.budgetStatus === 'WARNING' ? 'warning' : 'good'
  const budgetMessage = summary.budgetStatus === 'NOT_SET' ? 'Set a monthly budget to track progress'
    : summary.budgetStatus === 'EXCEEDED' ? 'Monthly budget exceeded'
      : summary.budgetStatus === 'WARNING' ? 'You’ve used at least 80% of your budget'
        : 'You’re within your monthly plan'

  return (
    <>
      <PageHeader eyebrow="OVERVIEW" title="Your dashboard" description="A little clarity goes a long way. Here's your month at a glance."
        action={<Link className="button button-primary" to="/transactions?add=1"><Plus size={17} /> New transaction</Link>} />
      {summary.budgetStatus !== 'NOT_SET' && <div className={`budget-alert ${budgetTone}`}><span className="alert-mark">!</span><div><strong>{budgetMessage}</strong><span>{formatMoney(Math.abs(summary.budgetRemaining), currency)} {summary.budgetRemaining < 0 ? 'over budget' : 'left to spend'}</span></div><Link to="/budgets">View budget <ArrowRight size={15} /></Link></div>}
      <section className="summary-grid">
        <SummaryCard label="Income this month" value={formatMoney(summary.income, currency)} icon={ArrowDownLeft} tone="income" helper="Money coming in" />
        <SummaryCard label="Expenses this month" value={formatMoney(summary.expenses, currency)} icon={ArrowUpRight} tone="expense" helper="Money going out" />
        <SummaryCard label="Monthly balance" value={formatMoney(summary.balance, currency)} icon={Wallet} tone="balance" helper="Income minus expenses" badge="This month" />
        <SummaryCard label="Monthly budget" value={formatMoney(summary.monthlyBudget, currency)} icon={Wallet} tone="budget" helper={summary.monthlyBudget ? `${summary.budgetPercent}% used` : 'No budget set yet'} />
      </section>

      <section className="chart-grid">
        <article className="panel trend-panel">
          <div className="panel-heading"><div><span className="eyebrow">YOUR CASH FLOW</span><h2>Income & expenses</h2></div><span className="chart-period">Last 6 months</span></div>
          {data.trend.length ? <div className="chart-wrap trend-chart"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ top: 10, right: 6, left: -14, bottom: 0 }}>
              <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#31a67a" stopOpacity={0.19} /><stop offset="100%" stopColor="#31a67a" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e27a70" stopOpacity={0.13} /><stop offset="100%" stopColor="#e27a70" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#edf0ed" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8b9690', fontSize: 12 }} dy={9} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b9690', fontSize: 11 }} tickFormatter={(value) => `${currency === 'INR' ? '₹' : '$'}${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#2e9b71" strokeWidth={2.5} fill="url(#incomeFill)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#df766b" strokeWidth={2.5} fill="url(#expenseFill)" />
            </AreaChart>
          </ResponsiveContainer></div> : <EmptyState title="No monthly data yet" message="Add a few transactions to see your cash flow." />}
          <div className="chart-legend"><span><i className="legend-dot green" />Income</span><span><i className="legend-dot coral" />Expenses</span></div>
        </article>
        <article className="panel category-panel">
          <div className="panel-heading"><div><span className="eyebrow">WHERE IT GOES</span><h2>Spending by category</h2></div><Link className="icon-link" to="/reports" aria-label="See reports"><ArrowRight size={17} /></Link></div>
          {data.categories.length ? <>
            <div className="chart-wrap donut-chart"><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={data.categories} dataKey="amount" nameKey="category" innerRadius="66%" outerRadius="88%" paddingAngle={3} stroke="none">
                {data.categories.map((entry) => <Cell key={entry.category} fill={entry.color || '#82b9a2'} />)}
              </Pie><Tooltip formatter={(value) => formatMoney(value, currency)} /></PieChart>
            </ResponsiveContainer><div className="donut-label"><span>THIS MONTH</span><strong>{formatMoney(summary.expenses, currency)}</strong><small>total spent</small></div></div>
            <div className="category-legend">{data.categories.slice(0, 5).map((item) => <div key={item.category}><span><i style={{ backgroundColor: item.color || '#82b9a2' }} />{item.category}</span><strong>{formatMoney(item.amount, currency)}</strong></div>)}</div>
          </> : <EmptyState title="Nothing to chart yet" message="Your expense categories will appear here." />}
        </article>
      </section>

      <section className="panel transactions-panel">
        <div className="panel-heading"><div><span className="eyebrow">THE LATEST</span><h2>Recent transactions</h2></div><Link className="subtle-link" to="/transactions">View all <ArrowRight size={15} /></Link></div>
        {data.recent.length ? <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th className="align-right">AMOUNT</th></tr></thead><tbody>
          {data.recent.map((item) => <tr key={item.id}><td><div className="transaction-title"><span className={`transaction-symbol ${item.type.toLowerCase()}`}>{item.type === 'INCOME' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><div><strong>{item.title}</strong><small>{item.notes || item.type.toLowerCase()}</small></div></div></td><td><span className="category-chip"><i style={{ backgroundColor: item.categoryColor || '#93a99b' }} />{item.category}</span></td><td className="muted-cell">{new Date(`${item.transactionDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td className={`align-right amount-cell ${item.type.toLowerCase()}`}>{item.type === 'INCOME' ? '+' : '−'}{formatMoney(item.amount, currency)}</td></tr>)}
        </tbody></table></div> : <EmptyState title="Your story starts here" message="Add your first transaction and your dashboard will come to life." />}
      </section>
    </>
  )
}
