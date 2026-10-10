# Watch party backend

Run from the repository root with `bun run --cwd apps/backend dev`. The service listens on port `3001` by default. Configure `PORT` and `CORS_ORIGIN` with environment variables. The health endpoint is `GET /health`.

Socket.IO controllers are split by responsibility: room membership (`playerController.js`), host and participant administration (`hostController.js`), and playback and approval flows (`playbackController.js`). The `Room` model owns the room state; `RoomStore` holds rooms in process memory.

Clients use acknowledgement callbacks. Command success is `{ ok: true }` or `{ ok: true, data }`; errors are `{ ok: false, error }`. The backend checks room membership and role for each restricted event. Hosts and moderators may control playback; participants submit requests for approval. Only hosts may assign roles or remove people.

The current store is intentionally small and in-memory. Restarting the process closes all rooms, and this setup is intended for one backend instance.
