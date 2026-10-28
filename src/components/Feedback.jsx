import { AlertCircle, LoaderCircle } from 'lucide-react'

export function Loading({ label = 'Loading your data…' }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={20} />{label}</div>
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="feedback error-state">
      <AlertCircle size={20} />
      <span>{message}</span>
      {onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function EmptyState({ title, message }) {
  return <div className="empty-state"><div className="empty-mark">—</div><strong>{title}</strong><span>{message}</span></div>
}
