import { io, type Socket } from 'socket.io-client'

export type Role = 'host' | 'moderator' | 'participant'
export type PlaybackAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'seek'; time: number }
  | { type: 'changeVideo'; videoId: string }
export type Participant = { id: string; username: string; role: Role; joinedAt: string }
export type PlaybackState = {
  videoId: string
  playState: 'playing' | 'paused'
  currentTime: number
  updatedAt: number
}
export type PlaybackRequest = {
  id: string
  userId: string
  username: string
  action: PlaybackAction
}
export type RoomState = {
  roomCode: string
  userId: string
  role: Role
  participants: Participant[]
  playback: PlaybackState
  requests: PlaybackRequest[]
}
export type Ack<T = undefined> = T extends undefined
  ? { ok: true; data?: undefined } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string }

type ClientToServerEvents = {
  'room:create': (payload: { username?: string }, ack: (result: Ack<RoomState>) => void) => void
  'room:join': (payload: { roomCode: string; username?: string }, ack: (result: Ack<RoomState>) => void) => void
  'room:leave': (payload: undefined, ack: (result: Ack) => void) => void
  'playback:control': (action: PlaybackAction, ack: (result: Ack) => void) => void
  'playback:request': (action: PlaybackAction, ack: (result: Ack) => void) => void
  'playback:resolve-request': (payload: { requestId: string; approve: boolean }, ack: (result: Ack) => void) => void
  'participant:assign-role': (payload: { userId: string; role: 'moderator' | 'participant' }, ack: (result: Ack) => void) => void
  'participant:remove': (payload: { userId: string }, ack: (result: Ack) => void) => void
}

type ServerToClientEvents = {
  'room:state': (state: RoomState) => void
  'room:closed': (reason: string) => void
  'participant:removed': (payload: { reason: string }) => void
}

export function createSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'
  return io(backendUrl, { autoConnect: false })
}
