import { useEffect, useState } from 'react'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { EmptyState, ErrorState, Loading } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'

const blank = { name: '', type: 'EXPENSE', color: '#78a991' }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/categories')
      setCategories(data)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (form.id) await api.put(`/categories/${form.id}`, form)
      else await api.post('/categories', form)
      setToast(form.id ? 'Category updated.' : 'Category created.')
      setForm(null)
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function remove(category) {
    if (!window.confirm(`Delete “${category.name}”? Categories in use cannot be removed.`)) return
    try {
      await api.delete(`/categories/${category.id}`)
      setToast('Category deleted.')
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const incomeCategories = categories.filter((item) => item.type === 'INCOME' || item.type === 'BOTH')
  const expenseCategories = categories.filter((item) => item.type === 'EXPENSE' || item.type === 'BOTH')

  return (
    <>
      <PageHeader eyebrow="ORGANIZE YOUR MONEY" title="Categories" description="Make sense of where your money comes from and where it goes."
        action={<button className="button button-primary" onClick={() => setForm({ ...blank })}><Plus size={17} /> New category</button>} />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Loading label="Loading categories…" /> : !error && (
        <div className="category-groups">
          {[{ title: 'Expenses', description: 'Places your money goes', items: expenseCategories, kind: 'EXPENSE' },
            { title: 'Income', description: 'Places your money comes from', items: incomeCategories, kind: 'INCOME' }].map((group) => (
            <section className="panel category-group" key={group.title}>
              <div className="panel-heading"><div><span className="eyebrow">{group.description}</span><h2>{group.title}</h2></div><span className="count-pill">{group.items.length} categories</span></div>
              {group.items.length ? <div className="category-cards">{group.items.map((item) => <article className="category-card" key={item.id}>
                <div className="category-card-icon" style={{ '--category-color': item.color || '#78a991' }}><Tag size={18} /></div>
                <div className="category-card-copy"><strong>{item.name}</strong><span>{item.type === 'BOTH' ? 'Income & expense' : group.title.slice(0, -1)}</span></div>
                <div className="row-actions"><button title="Edit category" aria-label={`Edit ${item.name}`} onClick={() => setForm({ ...item })}><Pencil size={15} /></button><button title="Delete category" aria-label={`Delete ${item.name}`} onClick={() => remove(item)}><Trash2 size={15} /></button></div>
              </article>)}</div> : <EmptyState title={`No ${group.title.toLowerCase()} categories`} message="Add a category to organize your transactions." />}
            </section>
          ))}
        </div>
      )}
      {form && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setForm(null)}><section className="dialog compact-dialog" role="dialog" aria-modal="true" aria-labelledby="category-title">
        <div className="dialog-heading"><div><span className="eyebrow">KEEP IT ORGANIZED</span><h2 id="category-title">{form.id ? 'Edit category' : 'New category'}</h2></div></div>
        <form className="form-grid" onSubmit={save}>
          <label className="field full-field">Category name<input required maxLength="60" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Pet care" autoFocus /></label>
          <label className="field full-field">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="EXPENSE">Expense</option><option value="INCOME">Income</option><option value="BOTH">Income & expense</option></select></label>
          <label className="field full-field">Color <span className="optional">For charts and labels</span><div className="color-input"><input type="color" value={form.color || '#78a991'} onChange={(event) => setForm({ ...form, color: event.target.value })} /><span>{form.color || '#78a991'}</span></div></label>
          {error && <div className="inline-error full-field">{error}</div>}
          <div className="dialog-actions full-field"><button type="button" className="button button-quiet" onClick={() => { setForm(null); setError('') }}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button></div>
        </form>
      </section></div>}
    </>
  )
}
