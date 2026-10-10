import { Link } from 'react-router-dom'
import { TvIcon } from '../components/Icons'

export default function NotFound() {
  return (
    <div className="landing-wrap">
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          <span className="brand-logo">
            <TvIcon size={20} />
          </span>
          <span>WatchParty</span>
        </Link>
      </header>

      <main className="not-found-wrap">
        <div className="not-found-title">404</div>
        <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Room or Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px' }}>
          The watch party link you followed doesn't exist, has ended, or the room code was mistyped.
        </p>
        <Link to="/" className="btn-primary-action" style={{ marginTop: '16px' }}>
          Back to WatchParty Home
        </Link>
      </main>
    </div>
  )
}
