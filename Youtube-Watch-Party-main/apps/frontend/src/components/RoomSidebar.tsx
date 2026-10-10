import { useState } from 'react'
import { formatTime } from '../lib/room'
import type { Participant, PlaybackAction, PlaybackRequest } from '../lib/socket'
import { CheckIcon, CrownIcon, ShieldIcon, TrashIcon, XCircleIcon } from './Icons'

type Props = {
  participants: Participant[]
  currentUserId: string
  isHost: boolean
  canModerate: boolean
  requests: PlaybackRequest[]
  onAssignRole?: (userId: string, role: 'moderator' | 'participant') => void
  onRemoveParticipant?: (userId: string) => void
  onResolveRequest?: (requestId: string, approve: boolean) => void
}

export default function RoomSidebar({
  participants,
  currentUserId,
  isHost,
  canModerate,
  requests,
  onAssignRole,
  onRemoveParticipant,
  onResolveRequest,
}: Props) {
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members')

  // Group participants by role
  const hosts = participants.filter((p) => p.role === 'host')
  const mods = participants.filter((p) => p.role === 'moderator')
  const viewers = participants.filter((p) => p.role === 'participant')

  return (
    <aside className="discord-sidebar">
      {/* Tab Switcher */}
      <div className="sidebar-tab-switcher">
        <button
          type="button"
          className={`sidebar-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <span>Members</span>
          <span>({participants.length})</span>
        </button>

        {canModerate && (
          <button
            type="button"
            className={`sidebar-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span>Requests</span>
            {requests.length > 0 && (
              <span
                style={{
                  backgroundColor: '#f23f43',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {requests.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab 1: Members List */}
      {activeTab === 'members' && (
        <div className="sidebar-scroll-content">
          {/* Host Group */}
          {hosts.length > 0 && (
            <div>
              <div className="member-category-header">Host — {hosts.length}</div>
              <div className="member-list">
                {hosts.map((p) => renderMemberRow(p, currentUserId, isHost, onAssignRole, onRemoveParticipant))}
              </div>
            </div>
          )}

          {/* Moderators Group */}
          {mods.length > 0 && (
            <div>
              <div className="member-category-header">Moderators — {mods.length}</div>
              <div className="member-list">
                {mods.map((p) => renderMemberRow(p, currentUserId, isHost, onAssignRole, onRemoveParticipant))}
              </div>
            </div>
          )}

          {/* Viewers Group */}
          {viewers.length > 0 && (
            <div>
              <div className="member-category-header">Viewers — {viewers.length}</div>
              <div className="member-list">
                {viewers.map((p) => renderMemberRow(p, currentUserId, isHost, onAssignRole, onRemoveParticipant))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Requests Queue */}
      {activeTab === 'requests' && canModerate && onResolveRequest && (
        <div className="sidebar-scroll-content">
          <div className="member-category-header">Pending Requests — {requests.length}</div>

          {requests.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#949ba4', fontSize: '13px' }}>
              No requests waiting in queue.
            </div>
          ) : (
            <div className="requests-queue-list">
              {requests.map((req) => (
                <div key={req.id} className="discord-request-card">
                  <div className="req-header-row">
                    <span className="req-user">{req.username}</span>
                    <span style={{ fontSize: '11px', color: '#949ba4' }}>Pending</span>
                  </div>

                  <div className="req-details">
                    <RequestDesc action={req.action} />
                  </div>

                  <div className="req-buttons-row">
                    <button
                      type="button"
                      className="d-btn d-btn-green d-btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => onResolveRequest(req.id, true)}
                    >
                      <CheckIcon size={13} />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      className="d-btn d-btn-red d-btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => onResolveRequest(req.id, false)}
                    >
                      <XCircleIcon size={13} />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

function renderMemberRow(
  p: Participant,
  currentUserId: string,
  isHost: boolean,
  onAssignRole?: (userId: string, role: 'moderator' | 'participant') => void,
  onRemoveParticipant?: (userId: string) => void,
) {
  const isMe = p.id === currentUserId
  const avatarColors = ['#5865f2', '#f23f43', '#23a55a', '#f0b232', '#9b59b6', '#e91e63']
  const colorIndex = Math.abs(p.username.charCodeAt(0) || 0) % avatarColors.length
  const bgColor = avatarColors[colorIndex]

  return (
    <div key={p.id} className="member-item">
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
        <div className="member-avatar-wrap" style={{ backgroundColor: bgColor }}>
          {p.username.charAt(0).toUpperCase() || 'U'}
          <span className="avatar-online-dot" />
        </div>

        <div className="member-name-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="member-name-text">{p.username}</span>
            {p.role === 'host' && <CrownIcon size={12} style={{ color: '#f0b232' }} />}
            {p.role === 'moderator' && <ShieldIcon size={12} style={{ color: '#5865f2' }} />}
          </div>
          <span className="member-role-desc">
            {isMe ? 'You • ' : ''}
            {p.role === 'host' ? 'Host' : p.role === 'moderator' ? 'Moderator' : 'Viewer'}
          </span>
        </div>
      </div>

      {/* Host Controls */}
      {isHost && p.role !== 'host' && onAssignRole && onRemoveParticipant && (
        <div className="member-actions">
          <select
            value={p.role}
            onChange={(e) => onAssignRole(p.id, e.target.value as 'moderator' | 'participant')}
            className="role-dropdown-discord"
            title="Change role"
          >
            <option value="participant">Viewer</option>
            <option value="moderator">Mod</option>
          </select>

          <button
            type="button"
            className="d-btn d-btn-ghost d-btn-sm"
            style={{ padding: '2px 4px', color: '#f23f43' }}
            onClick={() => {
              if (confirm(`Kick ${p.username} from party?`)) {
                onRemoveParticipant(p.id)
              }
            }}
            title="Kick participant"
          >
            <TrashIcon size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

function RequestDesc({ action }: { action: PlaybackAction }) {
  switch (action.type) {
    case 'play':
      return <span>Requested to resume video</span>
    case 'pause':
      return <span>Requested to pause video</span>
    case 'seek':
      return <span>Requested seek to {formatTime(action.time)}</span>
    case 'changeVideo':
      return <span>Requested switch to {action.videoId}</span>
  }
}
