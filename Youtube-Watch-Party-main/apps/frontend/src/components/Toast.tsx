import { useEffect } from 'react'
import { AlertCircleIcon, CheckCircleIcon, XCircleIcon } from './Icons'

export type ToastMessage = {
  id: string
  type: 'success' | 'error' | 'info'
  text: string
}

type Props = {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="discord-toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className={`discord-toast toast-${toast.type}`} role="status">
      <span>
        {toast.type === 'success' && <CheckCircleIcon size={16} style={{ color: '#23a55a' }} />}
        {toast.type === 'error' && <AlertCircleIcon size={16} style={{ color: '#f23f43' }} />}
        {toast.type === 'info' && <CheckCircleIcon size={16} style={{ color: '#5865f2' }} />}
      </span>
      <span style={{ flex: 1 }}>{toast.text}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{ color: '#949ba4' }}
      >
        <XCircleIcon size={14} />
      </button>
    </div>
  )
}
