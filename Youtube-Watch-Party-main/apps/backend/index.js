import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { Server } from 'socket.io'
import { registerHostController, closeHostRoom } from './controllers/hostController.js'
import { registerPlayerController, removeDisconnectedPlayer } from './controllers/playerController.js'
import { registerPlaybackController } from './controllers/playbackController.js'

const port = Number(process.env.PORT ?? 3001)
const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
const app = express()

app.use(helmet())
app.use(cors({ origin: allowedOrigin }))
app.get('/health', (_request, response) => response.json({ ok: true }))

const httpServer = app.listen(port, () => {
  console.log(`Watch party backend listening on port ${port}`)
})

const io = new Server(httpServer, { cors: { origin: allowedOrigin } })
io.on('connection', (socket) => {
  registerHostController(io, socket)
  registerPlayerController(io, socket)
  registerPlaybackController(io, socket)

  socket.on('disconnect', () => {
    if (socket.data.role === 'host') closeHostRoom(io, socket)
    else removeDisconnectedPlayer(io, socket)
  })
})
