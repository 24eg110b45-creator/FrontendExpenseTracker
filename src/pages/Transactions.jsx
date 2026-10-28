import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowDownUp, ArrowUpRight, ArrowDownLeft, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { currentDateValue, formatMoney } from '../utils/format'
import { EmptyState, ErrorState, Loading } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

const today = currentDateValue()

function TransactionDialog({ initial, categories, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { title: '', amount: '', type: 'EXPENSE', categoryId: '', transactionDate: today, notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const visibleCategories = categories.filter((category) => category.type === form.type || category.type === 'BOTH')

  useEffect(() => {
    if (!visibleCategories.some((category) => String(category.id) === String(form.categoryId))) {
      setForm((current) => ({ ...current, categoryId: visibleCategories[0] ? String(visibleCategories[0].id) : '' }))
    }
  }, [form.type, categories])

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const body = { ...form, amount: Number(form.amount), categoryId: Number(form.categoryId) }
    try {
      if (initial?.id) await api.put(`/transactions/${initial.id}`, body)
      else await api.post('/transactions', body)
      onSaved(initial?.id ? 'Transaction updated.' : 'Transaction added.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title">
        <div className="dialog-heading"><div><span className="eyebrow">{initial?.id ? 'MAKE A CHANGE' : 'ADD TO YOUR STORY'}</span><h2 id="transaction-dialog-title">{initial?.id ? 'Edit transaction' : 'New transaction'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        {error && <div className="inline-error">{error}</div>}
        <form className="form-grid" onSubmit={submit}>
          <label className="field full-field">Title<input name="title" value={form.title} onChange={change} maxLength="120" placeholder="e.g. Weekly groceries" required autoFocus /></label>
          <label className="field">Amount<input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={change} placeholder="0.00" required /></label>
          <label className="field">Date<input name="transactionDate" type="date" max={today} value={form.transactionDate} onChange={change} required /></label>
          <label className="field">Type<select name="type" value={form.type} onChange={change}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select></label>
          <label className="field">Category<select name="categoryId" value={form.categoryId} onChange={change} required>{visibleCategories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="field full-field">Notes <span className="optional">Optional</span><textarea name="notes" value={form.notes || ''} onChange={change} maxLength="1000" rows="3" placeholder="Add a note to remember the details…" /></label>
          <div className="dialog-actions full-field"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving || !visibleCategories.length}>{saving ? 'Saving…' : initial?.id ? 'Save changes' : 'Add transaction'}</button></div>
        </form>
      </section>
    </div>
  )
}

export default function Transactions() {
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [pageData, setPageData] = useState(null)
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', type: '', categoryId: '', startDate: '', endDate: '', sortBy: 'transactionDate', direction: 'desc' })
  const [page, setPage] = useState(0)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')
  const showDialog = params.get('add') === '1'

  async function load() {
    setLoading(true)
    try {
      const query = { page, size: 10, sortBy: filters.sortBy, direction: filters.direction }
      Object.entries(filters).forEach(([key, value]) => { if (value) query[key] = value })
      const [transactions, categoryResponse, settings] = await Promise.all([
        api.get('/transactions', { params: query }), api.get('/categories'), api.get('/settings'),
      ])
      setPageData(transactions.data)
      setCategories(categoryResponse.data)
      setCurrency(settings.data.currency)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters, page])
  useEffect(() => { if (showDialog) setDialog({}) }, [showDialog])

  function updateFilter(event) {
    setPage(0)
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function closeDialog() {
    setDialog(null)
    if (showDialog) setParams({})
  }

  async function saveDialog(message) {
    closeDialog()
    setToast(message)
    await load()
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    try {
      await api.delete(`/transactions/${item.id}`)
      setToast('Transaction deleted.')
      if (page > 0 && pageData?.content.length === 1) setPage((value) => value - 1)
      else await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const rows = pageData?.content || []
  const hasFilters = useMemo(() => Object.entries(filters).some(([key, value]) => value && !['sortBy', 'direction'].includes(key)), [filters])

  return (
    <>
      <PageHeader eyebrow="YOUR ACTIVITY" title="Transactions" description="Every little detail, all in one place."
        action={<button className="button button-primary" onClick={() => setDialog({})}><Plus size={17} /> Add transaction</button>} />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <section className="panel transaction-tools">
        <div className="filter-search"><Search size={17} /><input name="search" value={filters.search} onChange={updateFilter} placeholder="Search transactions…" /></div>
        <div className="filter-controls">
          <select aria-label="Filter by type" name="type" value={filters.type} onChange={updateFilter}><option value="">All types</option><option value="EXPENSE">Expenses</option><option value="INCOME">Income</option></select>
          <select aria-label="Filter by category" name="categoryId" value={filters.categoryId} onChange={updateFilter}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <label className="date-filter">From<input aria-label="Start date" name="startDate" type="date" value={filters.startDate} onChange={updateFilter} /></label>
          <label className="date-filter">To<input aria-label="End date" name="endDate" type="date" value={filters.endDate} onChange={updateFilter} /></label>
        </div>
      </section>
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Loading label="Loading transactions…" /> : (
        <section className="panel transactions-panel full-table-panel">
          <div className="panel-heading"><div><span className="eyebrow">{pageData?.totalElements || 0} RECORDS</span><h2>All transactions</h2></div>
            <label className="sort-picker"><span>Sort by</span><select aria-label="Sort transactions" value={`${filters.sortBy}:${filters.direction}`} onChange={(event) => { const [sortBy, direction] = event.target.value.split(':'); setFilters((current) => ({ ...current, sortBy, direction })) }}><option value="transactionDate:desc">Newest first</option><option value="transactionDate:asc">Oldest first</option><option value="amount:desc">Amount: high to low</option><option value="amount:asc">Amount: low to high</option></select><ArrowDown size={14} /></label>
          </div>
          {rows.length ? <>
            <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th className="align-right">AMOUNT</th><th className="action-heading">ACTIONS</th></tr></thead><tbody>
              {rows.map((item) => <tr key={item.id}><td><div className="transaction-title"><span className={`transaction-symbol ${item.type.toLowerCase()}`}>{item.type === 'INCOME' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><div><strong>{item.title}</strong><small>{item.notes || item.type.toLowerCase()}</small></div></div></td><td><span className="category-chip"><i style={{ backgroundColor: item.categoryColor || '#93a99b' }} />{item.category}</span></td><td className="muted-cell">{new Date(`${item.transactionDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td className={`align-right amount-cell ${item.type.toLowerCase()}`}>{item.type === 'INCOME' ? '+' : '−'}{formatMoney(item.amount, currency)}</td><td><div className="row-actions"><button title="Edit transaction" aria-label={`Edit ${item.title}`} onClick={() => setDialog(item)}><Pencil size={15} /></button><button title="Delete transaction" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 size={15} /></button></div></td></tr>)}
            </tbody></table></div>
            <div className="pagination"><span>Showing {page * 10 + 1}–{Math.min((page + 1) * 10, pageData.totalElements)} of {pageData.totalElements}</span><div><button className="button button-quiet button-small" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="page-number">{page + 1} / {Math.max(pageData.totalPages, 1)}</span><button className="button button-quiet button-small" disabled={page + 1 >= pageData.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
          </> : <EmptyState title={hasFilters ? 'No matching transactions' : 'A fresh start'} message={hasFilters ? 'Try adjusting your filters or search.' : 'Add your first income or expense to get started.'} />}
        </section>
      )}
      {dialog && <TransactionDialog initial={dialog.id ? dialog : null} categories={categories} onClose={closeDialog} onSaved={saveDialog} />}
    </>
  )
}
