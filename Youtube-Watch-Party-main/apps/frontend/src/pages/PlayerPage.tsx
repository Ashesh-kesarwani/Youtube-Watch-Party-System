import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircleIcon, TvIcon } from '../components/Icons'
import Navbar from '../components/Navbar'
import PlaybackControls from '../components/PlaybackControls'
import RoomSidebar from '../components/RoomSidebar'
import ToastContainer, { type ToastMessage } from '../components/Toast'
import YouTubePlayer from '../components/YouTubePlayer'
import { normalizeRoomCode } from '../lib/room'
import { createSocket, type PlaybackAction, type Role, type RoomState } from '../lib/socket'

export default function PlayerPage() {
  const { roomCode: routeCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const rawUsername = searchParams.get('name')?.trim() || ''
  const roomCode = normalizeRoomCode(routeCode ?? '')

  const [room, setRoom] = useState<RoomState | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(roomCode ? null : 'Invalid room code.')
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)
  const prevRoleRef = useRef<Role | null>(null)

  const addToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { id, text, type }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    if (!roomCode) return

    const socket = createSocket()
    socketRef.current = socket
    let joined = false

    function joinRoom() {
      setConnected(true)
      socket.emit('room:join', { roomCode, username: rawUsername }, (result) => {
        if (!result.ok || !result.data) {
          const errMsg = result.ok ? 'Could not join room.' : result.error
          setError(errMsg)
          addToast(errMsg, 'error')
        } else {
          joined = true
          setRoom(result.data)
          prevRoleRef.current = result.data.role
          setError(null)
          addToast(`Connected to room ${roomCode}`, 'success')
        }
      })
    }

    socket.on('connect', joinRoom)
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => {
      setError('Cannot connect to backend server.')
      addToast('Backend connection failed', 'error')
    })

    socket.on('room:state', (updatedRoom) => {
      if (prevRoleRef.current && prevRoleRef.current !== updatedRoom.role) {
        if (updatedRoom.role === 'moderator') {
          addToast('You were promoted to Moderator', 'success')
        } else if (updatedRoom.role === 'participant') {
          addToast('Role updated to Viewer', 'info')
        }
        prevRoleRef.current = updatedRoom.role
      }
      setRoom(updatedRoom)
    })

    socket.on('room:closed', (reason) => {
      setRoom(null)
      setError(reason)
      addToast(reason, 'error')
    })

    socket.on('participant:removed', ({ reason }) => {
      joined = false
      setRoom(null)
      setError(reason)
      addToast(reason, 'error')
      socket.disconnect()
    })

    socket.connect()

    return () => {
      if (joined && socket.connected) {
        socket.emit('room:leave', undefined, () => {})
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomCode, rawUsername, addToast])

  function sendControl(action: PlaybackAction) {
    socketRef.current?.emit('playback:control', action, (result) => {
      if (!result.ok) {
        addToast(result.error, 'error')
      }
    })
  }

  function sendRequest(action: PlaybackAction) {
    socketRef.current?.emit('playback:request', action, (result) => {
      if (!result.ok) {
        addToast(result.error, 'error')
      } else {
        addToast('Request sent to room host', 'info')
      }
    })
  }

  function resolveRequest(requestId: string, approve: boolean) {
    socketRef.current?.emit('playback:resolve-request', { requestId, approve }, (result) => {
      if (!result.ok) {
        addToast(result.error, 'error')
      } else {
        addToast(approve ? 'Request approved' : 'Request declined', approve ? 'success' : 'info')
      }
    })
  }

  function handleLeave() {
    socketRef.current?.emit('room:leave', undefined, () => {})
    socketRef.current?.disconnect()
    navigate('/')
  }

  const isModerator = room?.role === 'moderator'
  const isHost = room?.role === 'host'
  const canControl = isHost || isModerator

  return (
    <div className="discord-layout">
      <Navbar
        roomCode={roomCode}
        role={room?.role ?? 'participant'}
        connected={connected}
        username={rawUsername}
        onLeave={handleLeave}
        onToast={addToast}
      />

      <div className="discord-body-split">
        {error && (
          <div
            style={{
              position: 'absolute',
              top: '56px',
              left: '16px',
              right: '16px',
              zIndex: 30,
              backgroundColor: '#1e1f22',
              border: '1px solid #f23f43',
              borderRadius: '4px',
              padding: '8px 12px',
              color: '#f23f43',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            role="alert"
          >
            <AlertCircleIcon size={16} />
            <span>{error}</span>
            <Link to="/" style={{ marginLeft: 'auto', textDecoration: 'underline', color: '#dbdee1' }}>
              Return Home
            </Link>
          </div>
        )}

        {room ? (
          <>
            <main className="discord-stage">
              <YouTubePlayer playback={room.playback} />

              <PlaybackControls
                playback={room.playback}
                canControl={canControl}
                enabled={connected}
                onControl={sendControl}
                onRequest={sendRequest}
              />
            </main>

            <RoomSidebar
              participants={room.participants}
              currentUserId={room.userId}
              isHost={false}
              canModerate={canControl}
              requests={room.requests}
              onResolveRequest={resolveRequest}
            />
          </>
        ) : (
          !error && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#949ba4',
              }}
            >
              <TvIcon size={32} />
              <p>Connecting to {roomCode}…</p>
            </div>
          )
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
