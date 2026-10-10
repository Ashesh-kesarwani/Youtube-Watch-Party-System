import type { Participant, Role } from '../lib/socket'
import { CrownIcon, ShieldIcon, TrashIcon, UserIcon, UsersIcon } from './Icons'

type Props = {
  participants: Participant[]
  currentUserId: string
  isHost: boolean
  onAssignRole?: (userId: string, role: 'moderator' | 'participant') => void
  onRemoveParticipant?: (userId: string) => void
}

export default function ParticipantsList({
  participants,
  currentUserId,
  isHost,
  onAssignRole,
  onRemoveParticipant,
}: Props) {
  return (
    <div className="participants-card">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <UsersIcon size={18} />
          <span>Participants</span>
        </div>
        <span className="badge-count">{participants.length}</span>
      </div>

      <div className="participants-list-wrap">
        {participants.length === 0 ? (
          <div className="empty-state">No participants in room.</div>
        ) : (
          <ul className="participants-list">
            {participants.map((p) => {
              const isCurrentUser = p.id === currentUserId
              const avatarColor = getAvatarColor(p.username)

              return (
                <li key={p.id} className={`participant-item ${isCurrentUser ? 'is-self' : ''}`}>
                  <div className="participant-info">
                    <div className="avatar-badge" style={{ background: avatarColor }}>
                      {p.username.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="user-details">
                      <div className="user-name-row">
                        <span className="user-name">{p.username}</span>
                        {isCurrentUser && <span className="you-badge">YOU</span>}
                      </div>

                      <div className="role-tag-row">
                        <RoleTag role={p.role} />
                      </div>
                    </div>
                  </div>

                  {/* Host management actions */}
                  {isHost && p.role !== 'host' && onAssignRole && onRemoveParticipant && (
                    <div className="host-actions">
                      <select
                        value={p.role}
                        onChange={(e) =>
                          onAssignRole(p.id, e.target.value as 'moderator' | 'participant')
                        }
                        className="role-select"
                        title="Change role"
                        aria-label={`Change role for ${p.username}`}
                      >
                        <option value="participant">Participant</option>
                        <option value="moderator">Moderator</option>
                      </select>

                      <button
                        type="button"
                        className="btn-kick"
                        onClick={() => {
                          if (confirm(`Remove ${p.username} from the watch party?`)) {
                            onRemoveParticipant(p.id)
                          }
                        }}
                        title={`Remove ${p.username}`}
                        aria-label={`Remove ${p.username}`}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function RoleTag({ role }: { role: Role }) {
  if (role === 'host') {
    return (
      <span className="role-chip chip-host">
        <CrownIcon size={12} />
        <span>Host</span>
      </span>
    )
  }
  if (role === 'moderator') {
    return (
      <span className="role-chip chip-mod">
        <ShieldIcon size={12} />
        <span>Moderator</span>
      </span>
    )
  }
  return (
    <span className="role-chip chip-viewer">
      <UserIcon size={12} />
      <span>Participant</span>
    </span>
  )
}

function getAvatarColor(username: string): string {
  const hues = [
    'linear-gradient(135deg, #ef4444, #f97316)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #6366f1, #a855f7)',
  ]
  let sum = 0
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i)
  }
  return hues[sum % hues.length]
}
