import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircleIcon, PlayIcon, TvIcon, UsersIcon } from '../components/Icons'
import { normalizeRoomCode } from '../lib/room'

export default function Landing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  const [hostName, setHostName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    const name = hostName.trim()
    const query = name ? `?name=${encodeURIComponent(name)}` : ''
    navigate(`/host${query}`)
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    const code = normalizeRoomCode(joinCode)
    if (!code) {
      setError('Please enter a room code.')
      return
    }
    setError(null)
    const params = new URLSearchParams()
    if (joinName.trim()) params.set('name', joinName.trim())
    const suffix = params.toString() ? `?${params.toString()}` : ''
    navigate(`/play/${code}${suffix}`)
  }

  return (
    <div className="discord-landing-wrap">
      <div className="discord-modal-card">
        {/* Header Block */}
        <div className="modal-header-block">
          <div className="modal-discord-logo">
            <TvIcon size={26} />
          </div>
          <h1 className="modal-title">Watch Together</h1>
          <p className="modal-sub">Watch synchronized YouTube streams with your party</p>
        </div>

        {/* Tab Switcher */}
        <div className="discord-tab-pills">
          <button
            type="button"
            className={`discord-tab-pill ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create')
              setError(null)
            }}
          >
            Create Room
          </button>
          <button
            type="button"
            className={`discord-tab-pill ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('join')
              setError(null)
            }}
          >
            Join with Code
          </button>
        </div>

        {/* Form Body */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="modal-form-fields">
            <div>
              <label htmlFor="host-name" className="d-label">
                Display Name
              </label>
              <input
                id="host-name"
                type="text"
                placeholder="e.g. Alex"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                maxLength={32}
                className="d-input"
              />
            </div>

            <button type="submit" className="d-btn d-btn-blurple" style={{ width: '100%', height: '44px' }}>
              <PlayIcon size={18} />
              <span>Start Watch Party</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="modal-form-fields">
            <div>
              <label htmlFor="join-code" className="d-label required">
                Room Code
              </label>
              <input
                id="join-code"
                type="text"
                placeholder="e.g. 7K2M9Q"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase())
                  setError(null)
                }}
                maxLength={12}
                className="d-input"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
                required
              />
            </div>

            <div>
              <label htmlFor="join-name" className="d-label">
                Display Name (Optional)
              </label>
              <input
                id="join-name"
                type="text"
                placeholder="e.g. Jordan"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                maxLength={32}
                className="d-input"
              />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f23f43', fontSize: '13px' }}>
                <AlertCircleIcon size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="d-btn d-btn-blurple" style={{ width: '100%', height: '44px' }}>
              <UsersIcon size={18} />
              <span>Join Room</span>
            </button>
          </form>
        )}

        {/* Footer Meta */}
        <div className="modal-footer-meta">
          <span>Real-time WebSocket Sync</span>
          <span>•</span>
          <span>Host Moderation</span>
        </div>
      </div>
    </div>
  )
}
