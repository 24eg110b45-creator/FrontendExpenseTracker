import { lazy, Suspense, useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowUpRight, ChartNoAxesCombined, CircleDollarSign, LayoutDashboard,
  Menu, ReceiptText, Settings2, Tags, WalletCards, X,
} from 'lucide-react'
import { Loading } from './components/Feedback'
import SettingsContext from './context/SettingsContext'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Categories = lazy(() => import('./pages/Categories'))
const Budgets = lazy(() => import('./pages/Budgets'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/budgets', label: 'Budgets', icon: WalletCards },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

export default function App() {
  const [settings, setSettings] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon"><CircleDollarSign size={23} /></div>
          <div><strong>pennywise</strong><span>PERSONAL FINANCE</span></div>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Dashboard' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-icon"><ArrowUpRight size={17} /></div>
            <strong>Small steps, big savings.</strong>
            <p>Every mindful choice moves you closer to your goals.</p>
          </div>
          <div className="sidebar-version"><span className="online-dot" /> Your finances, in focus</div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="topbar-context"><span className="topbar-kicker">YOUR MONEY, CLEARER</span><strong>Good things start with a plan.</strong></div>
          <div className="topbar-actions">
            <NavLink to="/transactions?add=1" className="button button-primary topbar-add"><span>+</span> Add transaction</NavLink>
            <NavLink to="/settings" className="profile-link" aria-label="Open profile settings">
              <span className="avatar">{settings?.displayName?.slice(0, 1)?.toUpperCase() || 'Y'}</span>
              <span className="profile-copy"><strong>{settings?.displayName || 'Your profile'}</strong><small>Personal account</small></span>
            </NavLink>
          </div>
        </header>
        <div className="content-area">
          <SettingsContext.Provider value={{ settings, updateSettings: setSettings }}>
            <Suspense fallback={<Loading label="Opening your page…" />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </Suspense>
          </SettingsContext.Provider>
        </div>
      </main>
    </div>
  )
}
