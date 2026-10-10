import { roomStore } from '../model/RoomStore.js'
import { getSocketRoom, publishRoom, respond } from './helpers.js'

export function registerHostController(io, socket) {
  socket.on('room:create', (payload = {}, ack) => {
    if (socket.data.roomCode) {
      respond(ack, { ok: false, error: 'This connection already belongs to a room.' })
      return
    }
    const username = typeof payload.username === 'string' ? payload.username.slice(0, 32) : ''
    const room = roomStore.create(socket.id, username)
    socket.data.roomCode = room.code
    socket.data.role = 'host'
    void socket.join(room.code)
    respond(ack, { ok: true, data: room.snapshot(socket.id) })
    publishRoom(io, room)
  })

  socket.on('participant:assign-role', (payload = {}, ack) => {
    const room = getSocketRoom(socket)
    const actor = room?.participant(socket.id)
    if (actor?.role !== 'host') {
      respond(ack, { ok: false, error: 'Only the host can assign roles.' })
      return
    }
    const role = payload.role
    if (!['participant', 'moderator'].includes(role) || !room.setRole(payload.userId, role)) {
      respond(ack, { ok: false, error: 'Choose a valid participant and role.' })
      return
    }
    respond(ack, { ok: true })
    publishRoom(io, room)
  })

  socket.on('participant:remove', (payload = {}, ack) => {
    const room = getSocketRoom(socket)
    if (room?.participant(socket.id)?.role !== 'host') {
      respond(ack, { ok: false, error: 'Only the host can remove participants.' })
      return
    }
    const target = room.participant(payload.userId)
    if (!target || target.role === 'host') {
      respond(ack, { ok: false, error: 'That participant cannot be removed.' })
      return
    }
    room.removeParticipant(target.id)
    const targetSocket = io.sockets.sockets.get(target.id)
    if (targetSocket) {
      targetSocket.data.role = 'removed'
      void targetSocket.leave(room.code)
      targetSocket.emit('participant:removed', { reason: 'The host removed you from the room.' })
    }
    respond(ack, { ok: true })
    publishRoom(io, room)
  })
}

export function closeHostRoom(io, socket) {
  const room = getSocketRoom(socket)
  if (!room || room.participant(socket.id)?.role !== 'host') return
  roomStore.close(room.code)
  io.to(room.code).emit('room:closed', 'The host left. This watch party has ended.')
}
