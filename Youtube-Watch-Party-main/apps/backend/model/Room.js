import { Participant } from './Participant.js'

const DEFAULT_VIDEO_ID = 'M7lc1UVf-VE'

export class Room {
  #participants = new Map()
  #requests = new Map()

  constructor(code, hostId, username) {
    this.code = code
    this.hostId = hostId
    this.state = {
      videoId: DEFAULT_VIDEO_ID,
      playState: 'paused',
      currentTime: 0,
      updatedAt: Date.now(),
    }
    this.#participants.set(hostId, new Participant(hostId, username, 'host'))
  }

  get participants() { return [...this.#participants.values()] }
  get requests() { return [...this.#requests.values()] }
  participant(id) { return this.#participants.get(id) }
  addParticipant(id, username) {
    const name = username.trim() || `Guest ${this.#participants.size}`
    const participant = new Participant(id, name, 'participant')
    this.#participants.set(id, participant)
    return participant
  }

  removeParticipant(id) {
    for (const [requestId, request] of this.#requests) {
      if (request.userId === id) this.#requests.delete(requestId)
    }
    return this.#participants.delete(id)
  }

  setRole(id, role) {
    const participant = this.#participants.get(id)
    if (!participant || participant.role === 'host') return null
    participant.role = role
    return participant
  }

  setPlayback(patch) {
    this.state = { ...this.state, ...patch, updatedAt: Date.now() }
    return this.state
  }

  currentTime() {
    if (this.state.playState !== 'playing') return this.state.currentTime
    return this.state.currentTime + Math.max(0, (Date.now() - this.state.updatedAt) / 1000)
  }

  addRequest(request) {
    this.#requests.set(request.id, request)
    return request
  }

  takeRequest(id) {
    const request = this.#requests.get(id)
    if (request) this.#requests.delete(id)
    return request
  }

  snapshot(userId) {
    const participant = this.#participants.get(userId)
    return {
      roomCode: this.code,
      userId,
      role: participant?.role ?? 'participant',
      participants: this.participants,
      playback: { ...this.state },
      requests: participant?.role === 'host' || participant?.role === 'moderator' ? this.requests : [],
    }
  }
}
