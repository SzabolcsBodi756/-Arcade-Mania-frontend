import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './Game2.css'

import arcadeBg from '../assets/arcade.png'
import cardFrontImg from '../assets/kartya.jpg'

import { useNavigate } from 'react-router-dom'
import { submitScore, getMyScores, extractHighScoreForGame } from '../services/GameService'

export default function Game2() {
  const GAME_NAME = 'Memory'
  const GRID = 6
  const PAIRS = 18

  const navigate = useNavigate()

  const makeDeck = useCallback(() => {
    const values = []

    for (let i = 1; i <= PAIRS; i++) {
      values.push(i, i)
    }

    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[values[i], values[j]] = [values[j], values[i]]
    }

    return values.map((v, idx) => ({
      id: `${idx}-${v}-${Math.random()}`,
      value: v
    }))
  }, [PAIRS])

  const [running, setRunning] = useState(false)
  const [ended, setEnded] = useState(false)

  const [flips, setFlips] = useState(0)
  const flipsRef = useRef(0)

  const [highScore, setHighScore] = useState(null)
  const highScoreRef = useRef(null)
  const highScoreDbRef = useRef(0)

  const [deck, setDeck] = useState(() => makeDeck())
  const [faceUp, setFaceUp] = useState([])
  const [matched, setMatched] = useState(() => new Set())
  const lockRef = useRef(false)

  const refreshHighScoreFromDb = useCallback(async () => {
    try {
      const scores = await getMyScores()
      const { highScore: dbHigh } = extractHighScoreForGame(scores, GAME_NAME)

      const raw = Number(dbHigh) || 0
      highScoreDbRef.current = raw

      if (raw === 0) {
        setHighScore(null)
        highScoreRef.current = null
        return
      }

      setHighScore(raw)
      highScoreRef.current = raw
    } catch (e) {
      console.warn('Failed to refresh high score', e)
    }
  }, [GAME_NAME])

  const resetGame = useCallback(({ preserveHigh = true } = {}) => {
    setDeck(makeDeck())
    setFaceUp([])
    setMatched(new Set())
    lockRef.current = false

    flipsRef.current = 0
    setFlips(0)

    setRunning(false)
    setEnded(false)

    if (!preserveHigh) {
      setHighScore(null)
      highScoreRef.current = null
      highScoreDbRef.current = 0
    }
  }, [makeDeck])

  const finishGame = useCallback(async () => {
    setRunning(false)
    setEnded(true)

    const current = flipsRef.current
    const dbHighRaw = highScoreDbRef.current

    const shouldUpdate = dbHighRaw === 0 || current < dbHighRaw

    if (shouldUpdate) {
      try {
        await submitScore(GAME_NAME, current, { mode: 'lower', zeroMeansUnset: true })

        setHighScore(current)
        highScoreRef.current = current
        highScoreDbRef.current = current
      } catch (e) {
        console.warn('submitScore failed', e)
        await refreshHighScoreFromDb()
      }
    } else {
      await refreshHighScoreFromDb()
    }
  }, [GAME_NAME, refreshHighScoreFromDb])

  function onCardClick(index) {
    if (lockRef.current) return
    if (ended) return
    if (!running) setRunning(true)

    if (matched.has(index)) return
    if (faceUp.includes(index)) return
    if (faceUp.length >= 2) return

    flipsRef.current += 1
    setFlips(flipsRef.current)

    const nextFaceUp = [...faceUp, index]
    setFaceUp(nextFaceUp)

    if (nextFaceUp.length === 2) {
      lockRef.current = true

      const [a, b] = nextFaceUp
      const va = deck[a]?.value
      const vb = deck[b]?.value

      window.setTimeout(async () => {
        if (va != null && va === vb) {
          setMatched((prev) => {
            const n = new Set(prev)
            n.add(a)
            n.add(b)
            return n
          })

          setFaceUp([])

          const willBeMatchedCount = matched.size + 2

          if (willBeMatchedCount >= deck.length) {
            lockRef.current = false
            await finishGame()
            return
          }
        } else {
          setFaceUp([])
        }

        lockRef.current = false
      }, 650)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()

        if (ended) {
          resetGame({ preserveHigh: true })
          setRunning(true)
        } else if (!running) {
          setRunning(true)
        }
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [ended, running, resetGame])

  useEffect(() => {
  let cancelled = false

  async function loadHighScore() {
    try {
      const scores = await getMyScores()
      const { highScore: dbHigh } = extractHighScoreForGame(scores, GAME_NAME)

      const raw = Number(dbHigh) || 0

      if (cancelled) return

      highScoreDbRef.current = raw

      if (raw === 0) {
        setHighScore(null)
        highScoreRef.current = null
        return
      }

      setHighScore(raw)
      highScoreRef.current = raw
    } catch (e) {
      if (!cancelled) {
        console.warn('Failed to refresh high score', e)
      }
    }
  }

  loadHighScore()

  return () => {
    cancelled = true
  }
}, [GAME_NAME])

  const pageStyle = useMemo(() => ({ '--game2-bg': `url(${arcadeBg})` }), [])

  return (
    <div className="game2-page" style={pageStyle}>
      <div className="arcade-frame">
        <div className="score">
          <div>Score: {flips}</div>
          <div>High: {highScore == null ? '-' : highScore}</div>
        </div>

        <div
          className="back"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate('/')
          }}
        >
          Back
        </div>

        <div className="screen-center">
          <div
            className="memory-board"
            style={{
              gridTemplateColumns: `repeat(${GRID}, var(--card-w))`,
              gridAutoRows: 'var(--card-h)'
            }}
          >
            {deck.map((card, idx) => {
              const isUp = faceUp.includes(idx) || matched.has(idx)
              const isMatched = matched.has(idx)

              return (
                <button
                  key={card.id}
                  className={`card ${isUp ? 'up' : ''} ${isMatched ? 'matched' : ''}`}
                  onClick={() => onCardClick(idx)}
                  type="button"
                >
                  <div className="card-inner">
                    <div className="card-face back-face" />

                    <div className="card-face front-face">
                      <div
                        className="front-texture"
                        style={{ backgroundImage: `url(${cardFrontImg})` }}
                      />
                      <div className="front-value">{card.value}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {!running && (
            <div
              className="start-overlay"
              onClick={() => {
                if (ended) {
                  resetGame({ preserveHigh: true })
                  setRunning(true)
                } else {
                  setRunning(true)
                }
              }}
            >
              <div className="start-text">
                {ended
                  ? `You won — Flips ${flips} (click / Space to restart)`
                  : 'Press Space to Start'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}