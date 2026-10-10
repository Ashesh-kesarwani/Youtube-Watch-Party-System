import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HostPage from './pages/HostPage'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import PlayerPage from './pages/PlayerPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/play/:roomCode" element={<PlayerPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
