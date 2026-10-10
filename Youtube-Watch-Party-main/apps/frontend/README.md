# Quiz buzzer frontend

Run the frontend and backend together from the repository root:

```sh
bun run dev
```

The frontend connects to `http://localhost:3001` by default. Set `VITE_BACKEND_URL` to point it at another backend. The backend's `CORS_ORIGIN` must allow the frontend origin.

Hosts create a room from the host page. Players join with the room code, and the host receives live player and buzz updates over Socket.IO.
