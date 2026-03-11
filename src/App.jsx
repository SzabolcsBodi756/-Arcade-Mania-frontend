// src/App.jsx
import { useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import Main from './pages/Main'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Game1 from './Games/Game1.jsx'
import Game2 from './Games/Game2.jsx'
import Game3 from './Games/Game3.jsx'
import Header from './components/Header'
import bgMusic from './assets/AI created 8 Bits theme  Retro Gaming Music.mp3'
import { AuthProvider, RequireAuth } from './auth/AuthProvider'

function AppContent() {
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const location = useLocation()

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (!hasStarted) {
      audio.muted = false
      audio.play().catch((err) => {
        console.log('Lejátszás sikertelen:', err)
      })
      setMuted(false)
      setHasStarted(true)
      return
    }

    const newMuted = !muted
    audio.muted = newMuted
    setMuted(newMuted)
  }

  const headerProps = {
    muted,
    toggleMute,
    title: 'Arcade Mania'
  }

  if (location.pathname === '/login') {
    headerProps.rightLabel = 'Register'
    headerProps.rightTo = '/register'
  } else if (location.pathname === '/register') {
    headerProps.rightLabel = 'Login'
    headerProps.rightTo = '/login'
  }

  return (
    <div>
      <audio
        ref={audioRef}
        src={bgMusic}
        loop
        muted
      />

      <Header {...headerProps} />

      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Main />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <RequireAuth>
              <Leaderboard />
            </RequireAuth>
          }
        />

        <Route path="/game1" element={<Game1 />} />
        <Route path="/game2" element={<Game2 />} />
        <Route path="/game3" element={<Game3 />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}