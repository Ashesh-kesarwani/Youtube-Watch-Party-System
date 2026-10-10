import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, CopyIcon, CrownIcon, LinkIcon, LogOutIcon, ShieldIcon, UserIcon } from './Icons'
import type { Role } from '../lib/socket'

type Props = {
  roomCode: string
  role?: Role
  connected: boolean
  username?: string
  onLeave?: () => void
  onToast: (text: string, type?: 'success' | 'info' | 'error') => void
}

export default function Navbar({ roomCode, role, connected, username, onLeave, onToast }: Props) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const inviteUrl = `${window.location.origin}/play/${roomCode}`

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopiedCode(true)
      onToast(`Room code copied: ${roomCode}`, 'success')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      onToast(`Room code: ${roomCode}`, 'info')
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedLink(true)
      onToast('Invite link copied to clipboard', 'success')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      onToast('Failed to copy invite link', 'error')
    }
  }

  return (
    <header className="discord-header">
      <div className="header-channel-info">
        {roomCode && (
          <>
            <button
              type="button"
              className="room-code-tag"
              onClick={copyCode}
              title="Copy room code"
            >
              <span>{roomCode}</span>
              {copiedCode ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
            </button>

            <button
              type="button"
              className="d-btn d-btn-subtle d-btn-sm"
              onClick={copyInvite}
              title="Copy invite URL"
            >
              {copiedLink ? <CheckIcon size={12} /> : <LinkIcon size={12} />}
              <span>Invite</span>
            </button>
          </>
        )}
      </div>

      <div className="header-actions">
        <div className="connection-status-pill">
          <span className="connection-dot" style={{ backgroundColor: connected ? '#23a55a' : '#f23f43' }} />
          <span>{connected ? 'RTC Connected' : 'Connecting…'}</span>
        </div>

        {role && (
          <div className={`role-badge-pill ${role}`}>
            {role === 'host' && <CrownIcon size={12} />}
            {role === 'moderator' && <ShieldIcon size={12} />}
            {role === 'participant' && <UserIcon size={12} />}
            <span style={{ textTransform: 'capitalize' }}>
              {role}
              {username ? ` (${username})` : ''}
            </span>
          </div>
        )}

        {onLeave ? (
          <button type="button" className="d-btn d-btn-ghost d-btn-sm" onClick={onLeave} title="Disconnect">
            <LogOutIcon size={14} />
            <span>Leave</span>
          </button>
        ) : (
          <Link to="/" className="d-btn d-btn-ghost d-btn-sm" title="Disconnect">
            <LogOutIcon size={14} />
            <span>Leave</span>
          </Link>
        )}
      </div>
    </header>
  )
}
