import { useContext, useEffect, useState } from 'react'
import { Check, CircleUserRound, Globe2, Save } from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { ErrorState, Loading } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import Toast from '../components/Toast'
import SettingsContext from '../context/SettingsContext'

const currencies = [
  ['USD', 'US Dollar ($)'], ['EUR', 'Euro (€)'], ['GBP', 'British Pound (£)'],
  ['INR', 'Indian Rupee (₹)'], ['CAD', 'Canadian Dollar (CA$)'], ['AUD', 'Australian Dollar (A$)'],
]

export default function Settings() {
  const { updateSettings } = useContext(SettingsContext)
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({ displayName: '', currency: 'USD' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/settings')
      setSettings(data)
      setForm({ displayName: data.displayName, currency: data.currency })
      updateSettings(data)
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
    try {
      const { data } = await api.put('/settings', form)
      setSettings(data)
      updateSettings(data)
      setToast('Your preferences are saved.')
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="MAKE IT YOURS" title="Settings" description="A few small touches to make this space feel like yours." />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Loading label="Loading your settings…" /> : settings && <div className="settings-layout">
        <section className="panel settings-card"><div className="settings-section-head"><span className="settings-icon"><CircleUserRound size={20} /></span><div><h2>Your profile</h2><p>Just the basics. You can update your name at any time.</p></div></div>
          <form onSubmit={save} className="settings-form">
            <label className="field">Display name<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} maxLength="100" required /></label>
            <label className="field">Email address<input value={settings.email} readOnly /><span className="field-note">This local single-user profile uses a fixed email identifier.</span></label>
            <div className="form-divider" />
            <div className="settings-section-head preferences-head"><span className="settings-icon"><Globe2 size={20} /></span><div><h2>Preferences</h2><p>Choose how amounts are shown throughout the app.</p></div></div>
            <label className="field">Display currency<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>{currencies.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
            <div className="settings-actions"><span><Check size={15} /> Preferences are saved to your database</span><button className="button button-primary" disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </section>
        <aside className="settings-side-note"><div className="settings-note-mark">✦</div><h3>Built around your habits.</h3><p>Your currency preference is applied consistently to dashboard totals, transaction amounts, budgets, and reports.</p><span>More ways to personalize are coming soon.</span></aside>
      </div>}
    </>
  )
}
