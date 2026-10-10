import { z } from 'zod'
import { roomStore } from '../model/RoomStore.js'
import { publishRoom, respond } from './helpers.js'

const joinSchema = z.object({
  roomCode: z.string().trim().min(1).max(12),
  username: z.string().trim().max(32).optional().default(''),
})

export function registerPlayerController(io, socket) {
  socket.on('room:join', (payload, ack) => {
    if (socket.data.roomCode) {
      respond(ack, { ok: false, error: 'This connection already belongs to a room.' })
      return
    }
    const parsed = joinSchema.safeParse(payload)
    if (!parsed.success) {
      respond(ack, { ok: false, error: 'Enter a room code and a name of at most 32 characters.' })
      return
    }
    const code = parsed.data.roomCode.toUpperCase()
    const room = roomStore.join(code, socket.id, parsed.data.username)
    if (!room) {
      respond(ack, { ok: false, error: 'That room does not exist or has closed.' })
      return
    }
    socket.data.roomCode = code
    socket.data.role = 'participant'
    void socket.join(code)
    respond(ack, { ok: true, data: room.snapshot(socket.id) })
    publishRoom(io, room)
  })

  socket.on('room:leave', (_payload, ack) => {
    const code = socket.data.roomCode
    const room = code ? roomStore.find(code) : undefined
    if (!room || room.participant(socket.id)?.role === 'host') {
      respond(ack, { ok: false, error: 'The host must close the room by leaving.' })
      return
    }
    room.removeParticipant(socket.id)
    socket.data.roomCode = null
    socket.data.role = null
    void socket.leave(code)
    respond(ack, { ok: true })
    publishRoom(io, room)
  })
}

export function removeDisconnectedPlayer(io, socket) {
  const code = socket.data.roomCode
  const room = code ? roomStore.find(code) : undefined
  if (!room || room.participant(socket.id)?.role === 'host') return
  room.removeParticipant(socket.id)
  publishRoom(io, room)
}
