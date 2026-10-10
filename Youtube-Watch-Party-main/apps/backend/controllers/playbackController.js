import { customAlphabet } from 'nanoid'
import { getSocketRoom, isController, applyPlayback, publishRoom, respond } from './helpers.js'

const requestId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)
const videoIdSchema = /^[a-zA-Z0-9_-]{11}$/

function parseAction(payload) {
  if (payload?.type === 'play' || payload?.type === 'pause') return { type: payload.type }
  if (payload?.type === 'seek' && Number.isFinite(payload.time) && payload.time >= 0) {
    return { type: 'seek', time: payload.time }
  }
  if (payload?.type === 'changeVideo' && videoIdSchema.test(payload.videoId ?? '')) {
    return { type: 'changeVideo', videoId: payload.videoId }
  }
  return null
}

export function registerPlaybackController(io, socket) {
  socket.on('playback:control', (payload, ack) => {
    const room = getSocketRoom(socket)
    if (!room || !room.participant(socket.id)) {
      respond(ack, { ok: false, error: 'Join a room before controlling playback.' })
      return
    }
    if (!isController(socket, room)) {
      respond(ack, { ok: false, error: 'Ask the host to approve your playback request.' })
      return
    }
    const action = parseAction(payload)
    if (!action) {
      respond(ack, { ok: false, error: 'That playback action is invalid.' })
      return
    }
    applyPlayback(room, action)
    respond(ack, { ok: true })
    publishRoom(io, room)
  })

  socket.on('playback:request', (payload, ack) => {
    const room = getSocketRoom(socket)
    const participant = room?.participant(socket.id)
    if (!room || !participant) {
      respond(ack, { ok: false, error: 'Join a room before requesting playback changes.' })
      return
    }
    const action = parseAction(payload)
    if (!action) {
      respond(ack, { ok: false, error: 'That playback action is invalid.' })
      return
    }
    if (isController(socket, room)) {
      applyPlayback(room, action)
    } else {
      room.addRequest({ id: requestId(), userId: socket.id, username: participant.username, action })
    }
    respond(ack, { ok: true })
    publishRoom(io, room)
  })

  socket.on('playback:resolve-request', (payload, ack) => {
    const room = getSocketRoom(socket)
    if (!room || !isController(socket, room)) {
      respond(ack, { ok: false, error: 'Only the host or a moderator can review requests.' })
      return
    }
    const request = room.takeRequest(payload?.requestId)
    if (!request) {
      respond(ack, { ok: false, error: 'That request is no longer available.' })
      return
    }
    if (payload.approve) applyPlayback(room, request.action)
    respond(ack, { ok: true })
    publishRoom(io, room)
  })
}
