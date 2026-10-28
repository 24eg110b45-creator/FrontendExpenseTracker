import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, SlidersHorizontal } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { formatMoney, monthBounds, currentMonthValue } from '../utils/format'
import { EmptyState, ErrorState, Loading } from '../components/Feedback'
import PageHeader from '../components/PageHeader'

export default function Reports() {
  const [period, setPeriod] = useState(currentMonthValue())
  const [groupBy, setGroupBy] = useState('daily')
  const [report, setReport] = useState(null)
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const range = monthBounds(period)

  async function load() {
    setLoading(true)
    try {
      const [reportResponse, settingsResponse] = await Promise.all([
        api.get('/reports', { params: { startDate: range.startDate, endDate: range.endDate, groupBy } }),
        api.get('/settings'),
      ])
      setReport(reportResponse.data)
      setCurrency(settingsResponse.data.currency)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [period, groupBy])

  function downloadCsv() {
    if (!report) return
    const csvRows = [
      ['Period', 'Income', 'Expenses'],
      ...report.periods.map((item) => [item.period, item.income, item.expenses]),
    ]
    const csv = csvRows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `expense-report-${period}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader eyebrow="KNOW YOUR NUMBERS" title="Reports & insights" description="Patterns tell a story. Find yours in the details."
        action={<button className="button button-outline" onClick={downloadCsv} disabled={!report}><Download size={16} /> Export CSV</button>} />
      <section className="panel report-filters">
        <div className="report-filter-intro"><span className="filter-mark"><SlidersHorizontal size={17} /></span><div><strong>Find your focus</strong><span>Choose a month and view</span></div></div>
        <label className="field">Month<input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} /></label>
        <label className="field">Group results<select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
      </section>
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Loading label="Gathering your insights…" /> : report && <>
        <section className="report-stat-grid">
          <article className="report-stat"><span>INCOME</span><strong className="income-text">{formatMoney(report.income, currency)}</strong><small>For the selected period</small></article>
          <article className="report-stat"><span>EXPENSES</span><strong className="expense-text">{formatMoney(report.expenses, currency)}</strong><small>For the selected period</small></article>
          <article className="report-stat"><span>NET BALANCE</span><strong>{formatMoney(report.balance, currency)}</strong><small>Income less expenses</small></article>
        </section>
        <section className="report-chart-grid">
          <article className="panel report-chart-panel"><div className="panel-heading"><div><span className="eyebrow">MONEY OVER TIME</span><h2>Income vs. expenses</h2></div><span className="chart-period">{new Date(`${period}-02`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span></div>
            {report.periods.length ? <div className="chart-wrap report-bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.periods} margin={{ top: 8, right: 6, left: -14, bottom: 0 }}><CartesianGrid stroke="#edf0ed" vertical={false} /><XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#8b9690', fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b9690', fontSize: 11 }} tickFormatter={(value) => `${currency === 'INR' ? '₹' : '$'}${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} /><Tooltip formatter={(value) => formatMoney(value, currency)} /><Bar dataKey="income" name="Income" fill="#43a77e" radius={[4, 4, 0, 0]} maxBarSize={24} /><Bar dataKey="expenses" name="Expenses" fill="#e07c70" radius={[4, 4, 0, 0]} maxBarSize={24} /></BarChart></ResponsiveContainer></div> : <EmptyState title="No activity in this period" message="Try another month or add a transaction." />}
            <div className="chart-legend"><span><i className="legend-dot green" />Income</span><span><i className="legend-dot coral" />Expenses</span></div>
          </article>
          <article className="panel report-category-panel"><div className="panel-heading"><div><span className="eyebrow">EXPENSE BREAKDOWN</span><h2>By category</h2></div></div>
            {report.categories.length ? <>
              <div className="chart-wrap report-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.categories} dataKey="amount" nameKey="category" innerRadius="60%" outerRadius="84%" paddingAngle={3} stroke="none">{report.categories.map((item) => <Cell key={item.category} fill={item.color || '#81b49c'} />)}</Pie><Tooltip formatter={(value) => formatMoney(value, currency)} /></PieChart></ResponsiveContainer></div>
              <div className="category-legend">{report.categories.map((item) => <div key={item.category}><span><i style={{ backgroundColor: item.color || '#81b49c' }} />{item.category}</span><strong>{formatMoney(item.amount, currency)}</strong></div>)}</div>
            </> : <EmptyState title="No expenses to break down" message="Expense categories will show up here." />}
          </article>
        </section>
      </>}
    </>
  )
}
