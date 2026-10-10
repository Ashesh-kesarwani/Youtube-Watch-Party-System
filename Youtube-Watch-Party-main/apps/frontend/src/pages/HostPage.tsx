import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircleIcon, TvIcon } from '../components/Icons'
import Navbar from '../components/Navbar'
import PlaybackControls from '../components/PlaybackControls'
import RoomSidebar from '../components/RoomSidebar'
import ToastContainer, { type ToastMessage } from '../components/Toast'
import YouTubePlayer from '../components/YouTubePlayer'
import { createSocket, type PlaybackAction, type RoomState } from '../lib/socket'

export default function HostPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const hostUsername = searchParams.get('name')?.trim() || 'Host'

  const [room, setRoom] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null)

  const addToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { id, text, type }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const socket = createSocket()
    socketRef.current = socket
    let roomCreated = false

    function handleConnect() {
      setConnected(true)
      if (roomCreated) {
        setError('Connection interrupted. Please reload.')
        addToast('Connection interrupted', 'error')
        return
      }

      socket.emit('room:create', { username: hostUsername }, (result) => {
        if (!result.ok || !result.data) {
          const errMsg = result.ok ? 'Could not create room.' : result.error
          setError(errMsg)
          addToast(errMsg, 'error')
        } else {
          roomCreated = true
          setRoom(result.data)
          setError(null)
          addToast(`Watch room ${result.data.roomCode} created`, 'success')
        }
      })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => {
      setError('Cannot connect to backend server.')
      addToast('Backend connection failed', 'error')
    })
    socket.on('room:state', (updatedRoom) => {
      setRoom(updatedRoom)
    })
    socket.on('room:closed', (reason) => {
      setError(reason)
      addToast(reason, 'error')
    })

    socket.connect()

    return () => {
      socketRef.current = null
      socket.disconnect()
    }
  }, [hostUsername, addToast])

  function sendPlayback(action: PlaybackAction) {
    socketRef.current?.emit('playback:control', action, (result) => {
      if (!result.ok) {
        addToast(result.error, 'error')
      }
    })
  }

  function assignRole(userId: string, role: 'moderator' | 'participant') {
    socketRef.current?.emit('participant:assign-role', { userId, role }, (result) => {
      if (!result.ok) {
        addToast(result.error, 'error')
      } else {
        addToast(`Role changed to ${role}`, 'success')
      }
    })
  }

  function removeParticipant(userId: string) {
    socketRef.current?.emit('participant:remove', { userId }, (result) => {
      if (!result.ok) {
        addToast(result.error, 'error')
      } else {
        addToast('Participant removed', 'info')
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
    if (confirm('Leave and close the watch party?')) {
      socketRef.current?.disconnect()
      navigate('/')
    }
  }

  return (
    <div className="discord-layout">
      <Navbar
        roomCode={room?.roomCode ?? ''}
        role="host"
        connected={connected}
        username={hostUsername}
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
          </div>
        )}

        {room ? (
          <>
            <main className="discord-stage">
              <YouTubePlayer playback={room.playback} />

              <PlaybackControls
                playback={room.playback}
                canControl={true}
                enabled={connected}
                onControl={sendPlayback}
                onRequest={sendPlayback}
              />
            </main>

            <RoomSidebar
              participants={room.participants}
              currentUserId={room.userId}
              isHost={true}
              canModerate={true}
              requests={room.requests}
              onAssignRole={assignRole}
              onRemoveParticipant={removeParticipant}
              onResolveRequest={resolveRequest}
            />
          </>
        ) : (
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
            <p>Starting watch party…</p>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
