import { customAlphabet } from 'nanoid'
import { Room } from './Room.js'

const createRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ123456789', 6)

export class RoomStore {
  #rooms = new Map()

  create(hostId, username) {
    let code = createRoomCode()
    while (this.#rooms.has(code)) code = createRoomCode()
    const room = new Room(code, hostId, username)
    this.#rooms.set(code, room)
    return room
  }

  find(code) { return this.#rooms.get(code) }
  join(code, userId, username) {
    const room = this.find(code)
    if (!room) return null
    room.addParticipant(userId, username)
    return room
  }
  close(code) { return this.#rooms.delete(code) }
}

export const roomStore = new RoomStore()
