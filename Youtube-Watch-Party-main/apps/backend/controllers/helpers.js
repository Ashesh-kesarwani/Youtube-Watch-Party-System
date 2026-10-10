import { roomStore } from '../model/RoomStore.js'

export function respond(ack, result) {
  if (typeof ack === 'function') ack(result)
}

export function getSocketRoom(socket) {
  const code = socket.data.roomCode
  return code ? roomStore.find(code) : undefined
}

export function publishRoom(io, room) {
  for (const participant of room.participants) {
    io.to(participant.id).emit('room:state', room.snapshot(participant.id))
  }
}

export function isController(socket, room) {
  const role = room.participant(socket.id)?.role
  return role === 'host' || role === 'moderator'
}

export function applyPlayback(room, action) {
  switch (action.type) {
    case 'play': return room.setPlayback({ playState: 'playing' })
    case 'pause': return room.setPlayback({ playState: 'paused', currentTime: room.currentTime() })
    case 'seek': return room.setPlayback({ currentTime: action.time })
    case 'changeVideo':
      return room.setPlayback({ videoId: action.videoId, currentTime: 0, playState: 'paused' })
    default: return null
  }
}
