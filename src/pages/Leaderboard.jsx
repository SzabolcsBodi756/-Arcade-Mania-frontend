// src/pages/Leaderboard.jsx
import React, { useEffect, useState } from 'react'
import { getAllPublicUsers } from '../services/userService'

function Leaderboard({ fetchUsers } = {}) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        setLoading(true)
        const data = await (fetchUsers ? fetchUsers() : getAllPublicUsers())
        if (!isMounted) return

        // Biztonság kedvéért: ha nem tömb jönne, legyen üres
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Hiba a leaderboard lekérésekor')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  // ABC-sorrend username alapján (case-insensitive)
  const sortedUsers = [...users].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' })
  )

  // Keresés – minden karakterre frissül
  const normalizedSearch = search.trim().toLowerCase()
  const filteredUsers = normalizedSearch
    ? sortedUsers.filter((u) => (u.name || '').toLowerCase().includes(normalizedSearch))
    : sortedUsers

  // Segédfüggvény: adott játék high score-ja, ha nincs → 0
  const getScore = (user, gameName) => {
    const s = user.scores?.find((sc) => sc.gameName === gameName)
    return s ? s.highScore : 0
  }

  return (
    <main className="page-container">
      <h1 className="page-title">Leaderboard</h1>

      {/* 🔍 Keresőmező középen */}
      <div className="leaderboard-search-wrapper">
        <input
          className="leaderboard-search"
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <p className="info-text">Leaderboard betöltése...</p>
      )}

      {error && !loading && (
        <p className="error-text">{error}</p>
      )}

      {!loading && !error && (
        <div className="leaderboard-grid">
          {filteredUsers.length === 0 ? (
            <p className="no-user-text">There is no user with that name</p>
          ) : (
            filteredUsers.map((user, idx) => (
              <div key={idx} className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-card-label">Username:</div>
                  <div className="profile-card-value">{user.name}</div>
                </div>

                <div className="profile-card-body">
                  <div className="profile-card-body-title">Game&nbsp;High&nbsp;Score</div>

                  <div className="profile-card-row">
                    <span>Fighter</span>
                    <span>{getScore(user, 'Fighter')}</span>
                  </div>
                  <div className="profile-card-row">
                    <span>Memory</span>
                    <span>{getScore(user, 'Memory')}</span>
                  </div>
                  <div className="profile-card-row">
                    <span>Snake</span>
                    <span>{getScore(user, 'Snake')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  )
}

export default Leaderboard
