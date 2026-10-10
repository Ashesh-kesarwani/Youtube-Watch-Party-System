import { formatTime } from '../lib/room'
import type { PlaybackAction, PlaybackRequest } from '../lib/socket'
import { CheckIcon, ClockIcon, SparklesIcon, XCircleIcon } from './Icons'

type Props = {
  requests: PlaybackRequest[]
  onResolve: (requestId: string, approve: boolean) => void
}

export default function RequestsQueue({ requests, onResolve }: Props) {
  return (
    <div className="requests-card">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <ClockIcon size={18} />
          <span>Playback Requests</span>
        </div>
        {requests.length > 0 && <span className="badge-count count-alert">{requests.length}</span>}
      </div>

      <div className="requests-list-wrap">
        {requests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-sub">No pending requests from viewers.</span>
          </div>
        ) : (
          <ul className="requests-list">
            {requests.map((req) => (
              <li key={req.id} className="request-item">
                <div className="request-body">
                  <div className="request-user">{req.username}</div>
                  <div className="request-action-desc">
                    <ActionDescriptor action={req.action} />
                  </div>
                </div>

                <div className="request-button-group">
                  <button
                    type="button"
                    className="btn-req-approve"
                    onClick={() => onResolve(req.id, true)}
                    title="Approve request"
                  >
                    <CheckIcon size={14} />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    className="btn-req-decline"
                    onClick={() => onResolve(req.id, false)}
                    title="Decline request"
                  >
                    <XCircleIcon size={14} />
                    <span>Decline</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ActionDescriptor({ action }: { action: PlaybackAction }) {
  switch (action.type) {
    case 'play':
      return <span className="desc-text text-play">Requested: Resume Playback</span>
    case 'pause':
      return <span className="desc-text text-pause">Requested: Pause Video</span>
    case 'seek':
      return (
        <span className="desc-text text-seek">
          Requested: Jump to {formatTime(action.time)} ({action.time}s)
        </span>
      )
    case 'changeVideo':
      return (
        <span className="desc-text text-change">
          <SparklesIcon size={13} />
          <span>Requested: Switch video ({action.videoId})</span>
        </span>
      )
  }
}
