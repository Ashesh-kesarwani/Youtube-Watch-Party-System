# YouTube Watch Party

A small real-time watch party app built with React, TypeScript, Vite, Express, and Socket.IO. A host creates a room and shares its code or link. Participants watch an embedded YouTube video whose play, pause, seek, and video changes are synchronized through the backend.

## Run locally

Requirements: Bun 1.3.2 or later and Node.js 24 or later.

```sh
bun install
bun run dev
```

The frontend runs at `http://localhost:5173`; the backend listens on `http://localhost:3001`. You can also run each workspace separately:

```sh
bun run --cwd apps/backend dev
bun run --cwd apps/frontend dev
```

Set `VITE_BACKEND_URL` in the frontend environment to change the Socket.IO server URL. Set `PORT` and `CORS_ORIGIN` for the backend. `CORS_ORIGIN` must match the browser origin. `GET /health` is the backend health endpoint.

## How it works

The host creates a room over Socket.IO and receives a unique room code. Joiners enter that code and receive the `participant` role. The backend stores room membership, roles, playback state, and pending playback requests in memory.

The YouTube IFrame Player API embeds the current video in each browser. Play, pause, seek, and video-change actions travel to the backend over Socket.IO. The backend checks the sender's role before changing playback state, timestamps the update, then sends a personalized room snapshot to each participant. Clients use that timestamp to account for network delay and correct playback drift.

Hosts can promote participants to moderators, demote them, and remove them. Hosts and moderators can control playback directly. Participants can submit playback requests; the host or a moderator approves or declines them. Role enforcement happens in the backend, so hiding or disabling a frontend control is not treated as authorization.

## Main backend modules

- `apps/backend/model/Room.js` holds participants, role assignments, playback state, and pending requests for one room.
- `apps/backend/model/RoomStore.js` creates and looks up in-memory rooms.
- `apps/backend/controllers/playerController.js` handles joining, leaving, and disconnect cleanup.
- `apps/backend/controllers/playbackController.js` validates playback commands and request approvals.
- `apps/backend/controllers/hostController.js` handles room creation, role assignment, participant removal, and host disconnects.

## Deployment

The backend is a persistent WebSocket service and needs a host that supports Socket.IO connections. Deploy the frontend as a static Vite site and the backend as a Node/Bun web service. Configure `VITE_BACKEND_URL` to the public backend URL and `CORS_ORIGIN` to the public frontend origin. The room store is in memory, so rooms are lost on restart and are not shared across multiple backend instances.

Live URL: https://youtube-watch-party-kappa.vercel.app/

