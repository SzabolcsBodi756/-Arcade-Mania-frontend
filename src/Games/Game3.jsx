import React, { useCallback, useEffect, useRef, useState } from 'react'
import './Game3.css'
import snakeBack from '../assets/SnakeBack.png'
import { submitScore, getMyScores, extractHighScoreForGame } from '../services/GameService'
import { useNavigate } from 'react-router-dom'

export default function Game3() {
  const GAME_NAME = 'Snake'
  const CELL = 22
  const BASE_DELAY = 120
  const MAX_SIZE = 1000

  const navigate = useNavigate()

  const centerRef = useRef(null)
  const canvasRef = useRef(null)
  const loopRef = useRef(null)

  const snakeRef = useRef([])
  const dirRef = useRef({ x: 1, y: 0 })
  const foodRef = useRef({ x: 0, y: 0 })
  const colsRef = useRef(0)
  const rowsRef = useRef(0)

  const particlesRef = useRef([])
  const touchStartRef = useRef(null)
  const slowUntilRef = useRef(0)
  const bgImageRef = useRef(null)

  const [running, setRunning] = useState(false)
  const runningRef = useRef(false)

  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)

  const [highScore, setHighScore] = useState(0)
  const highScoreRef = useRef(0)

  const [ended, setEnded] = useState(false)
  const endedRef = useRef(false)

  const getNow = useCallback(() => new Date().getTime(), [])

  const refreshHighScoreFromDb = useCallback(async () => {
    try {
      const scores = await getMyScores()
      const { highScore: dbHigh } = extractHighScoreForGame(scores, GAME_NAME)

      const hs = Number(dbHigh) || 0
      setHighScore(hs)
      highScoreRef.current = hs
    } catch (e) {
      console.warn('Failed to refresh high score', e)
    }
  }, [GAME_NAME])

  const resetCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    const center = centerRef.current
    if (!canvas || !center) return

    const availableWidth = Math.max(100, center.clientWidth)
    const availableHeight = Math.max(100, center.clientHeight)

    let size = Math.min(availableWidth, availableHeight, MAX_SIZE)
    size = Math.floor(size / CELL) * CELL
    size = Math.max(10 * CELL, size)

    const dpr = window.devicePixelRatio || 1

    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    canvas.width = Math.floor(size * dpr)
    canvas.height = Math.floor(size * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    colsRef.current = Math.floor(size / CELL)
    rowsRef.current = Math.floor(size / CELL)
  }, [])

  const spawnFood = useCallback(() => {
    const typeRoll = Math.random()
    let type = 'normal'

    if (typeRoll > 0.92) type = 'bonus'
    else if (typeRoll > 0.84) type = 'slow'

    return {
      x: Math.floor(Math.random() * Math.max(1, colsRef.current)),
      y: Math.floor(Math.random() * Math.max(1, rowsRef.current)),
      type
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = parseInt(canvas.style.width, 10) || canvas.width / dpr
    const height = parseInt(canvas.style.height, 10) || canvas.height / dpr

    const bgImg = bgImageRef.current
    if (bgImg && bgImg.complete) {
      ctx.drawImage(bgImg, 0, 0, width, height)
    } else {
      ctx.fillStyle = '#0aa84b'
      ctx.fillRect(0, 0, width, height)
    }

    const f = foodRef.current
    if (f) {
      if (f.type === 'bonus') ctx.fillStyle = '#ffd86b'
      else if (f.type === 'slow') ctx.fillStyle = '#6bb4ff'
      else ctx.fillStyle = '#ff4d4d'

      ctx.fillRect(f.x * CELL + 2, f.y * CELL + 2, CELL - 4, CELL - 4)
    }

    for (let i = 0; i < snakeRef.current.length; i++) {
      const s = snakeRef.current[i]
      if (i === 0) ctx.fillStyle = '#7af77c'
      else if (i === snakeRef.current.length - 1) ctx.fillStyle = '#0b3d12'
      else ctx.fillStyle = '#1f6b2e'

      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2)
    }

    const parts = particlesRef.current
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.life -= 1
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, 3, 3)

      if (p.life <= 0) {
        parts.splice(i, 1)
      }
    }
  }, [CELL])

  const initGame = useCallback(({ preserveEnded = false } = {}) => {
    resetCanvasSize()
    colsRef.current = Math.max(10, colsRef.current)
    rowsRef.current = Math.max(8, rowsRef.current)

    snakeRef.current = [
      { x: Math.floor(colsRef.current / 2), y: Math.floor(rowsRef.current / 2) }
    ]
    dirRef.current = { x: 1, y: 0 }
    foodRef.current = spawnFood()

    scoreRef.current = 0
    setScore(0)

    runningRef.current = false
    setRunning(false)

    if (!preserveEnded) {
      setEnded(false)
      endedRef.current = false
    }

    draw()
  }, [draw, resetCanvasSize, spawnFood])

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      clearTimeout(loopRef.current)
      loopRef.current = null
    }
    runningRef.current = false
    setRunning(false)
  }, [])

  const getDelayForScore = useCallback((s) => {
    return Math.max(50, BASE_DELAY - s * 4)
  }, [BASE_DELAY])

  const gameOver = useCallback(async () => {
    stopLoop()

    setEnded(true)
    endedRef.current = true

    const finalScore = Number(scoreRef.current) || 0

    try {
      await submitScore(GAME_NAME, finalScore)
    } catch (e) {
      console.warn('submitScore failed', e)
    }

    await refreshHighScoreFromDb()
  }, [GAME_NAME, refreshHighScoreFromDb, stopLoop])

  const step = useCallback(() => {
    const cols = colsRef.current
    const rows = rowsRef.current
    const snake = snakeRef.current
    const dir = dirRef.current

    const head = {
      x: snake[0].x + dir.x,
      y: snake[0].y + dir.y
    }

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      void gameOver()
      return
    }

    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      void gameOver()
      return
    }

    snake.unshift(head)

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      const f = foodRef.current

      if (f.type === 'normal') scoreRef.current += 1
      else if (f.type === 'bonus') scoreRef.current += 3
      else if (f.type === 'slow') {
        slowUntilRef.current = getNow() + 3000
        scoreRef.current += 1
      }

      setScore(scoreRef.current)

      if (scoreRef.current > highScoreRef.current) {
        highScoreRef.current = scoreRef.current
        setHighScore(scoreRef.current)
        void submitScore(GAME_NAME, scoreRef.current)
      }

      const list = particlesRef.current
      for (let i = 0; i < 10; i++) {
        list.push({
          x: f.x * CELL + CELL / 2,
          y: f.y * CELL + CELL / 2,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 40 + Math.floor(Math.random() * 30),
          color: f.type === 'bonus' ? '#ffd86b' : '#ff6b6b'
        })
      }

      foodRef.current = spawnFood()
    } else {
      snake.pop()
    }

    draw()
  }, [CELL, GAME_NAME, draw, gameOver, getNow, spawnFood])

  const scheduleNextTick = useCallback(function tick() {
  const now = getNow()
  const slowPenalty = slowUntilRef.current > now ? 60 : 0
  const delay = getDelayForScore(scoreRef.current) + slowPenalty

  loopRef.current = setTimeout(() => {
    step()
    if (loopRef.current) {
      tick()
    }
  }, delay)
}, [getDelayForScore, getNow, step])

  const startLoop = useCallback(() => {
    if (loopRef.current) return
    runningRef.current = true
    setRunning(true)
    scheduleNextTick()
  }, [scheduleNextTick])

  const restartManual = useCallback(() => {
    stopLoop()
    setEnded(false)
    endedRef.current = false
    initGame({ preserveEnded: false })
    void refreshHighScoreFromDb()
  }, [initGame, refreshHighScoreFromDb, stopLoop])

  const handleResize = useCallback(() => {
    stopLoop()
    initGame({ preserveEnded: false })
    void refreshHighScoreFromDb()
  }, [initGame, refreshHighScoreFromDb, stopLoop])

  const changeDirection = useCallback((newDir) => {
    if (endedRef.current) return

    const cur = dirRef.current
    if (cur.x + newDir.x === 0 && cur.y + newDir.y === 0) return

    dirRef.current = newDir

    if (!runningRef.current && !endedRef.current) {
      startLoop()
    }
  }, [startLoop])

  const handleKey = useCallback((e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault()

      if (endedRef.current) {
        restartManual()
        startLoop()
      } else if (!runningRef.current) {
        startLoop()
      }
      return
    }

    if (endedRef.current) return

    const key = e.key
    const code = e.code

    const mapUp = key === 'ArrowUp' || code === 'ArrowUp' || key === 'w' || key === 'W' || code === 'KeyW'
    const mapDown = key === 'ArrowDown' || code === 'ArrowDown' || key === 's' || key === 'S' || code === 'KeyS'
    const mapLeft = key === 'ArrowLeft' || code === 'ArrowLeft' || key === 'a' || key === 'A' || code === 'KeyA'
    const mapRight = key === 'ArrowRight' || code === 'ArrowRight' || key === 'd' || key === 'D' || code === 'KeyD'

    if (mapUp) {
      e.preventDefault()
      if (!runningRef.current && !endedRef.current) startLoop()
      if (dirRef.current.y !== 1 && !endedRef.current) dirRef.current = { x: 0, y: -1 }
      return
    }

    if (mapDown) {
      e.preventDefault()
      if (!runningRef.current && !endedRef.current) startLoop()
      if (dirRef.current.y !== -1 && !endedRef.current) dirRef.current = { x: 0, y: 1 }
      return
    }

    if (mapLeft) {
      e.preventDefault()
      if (!runningRef.current && !endedRef.current) startLoop()
      if (dirRef.current.x !== 1 && !endedRef.current) dirRef.current = { x: -1, y: 0 }
      return
    }

    if (mapRight) {
      e.preventDefault()
      if (!runningRef.current && !endedRef.current) startLoop()
      if (dirRef.current.x !== -1 && !endedRef.current) dirRef.current = { x: 1, y: 0 }
    }
  }, [restartManual, startLoop])

  useEffect(() => {
    const img = new Image()

    img.onload = () => {
      bgImageRef.current = img
      draw()
    }

    img.onerror = () => {
      bgImageRef.current = null
    }

    img.src = snakeBack

    if (img.complete) {
      bgImageRef.current = img
      draw()
    }
  }, [draw])

  useEffect(() => {
    initGame({ preserveEnded: false })
    void refreshHighScoreFromDb()

    try {
      document.body.classList.add('page-game3')
    } catch {
      // ignore
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKey, true)

    if (canvasRef.current) {
      try {
        canvasRef.current.setAttribute('tabindex', '0')
        canvasRef.current.focus()
      } catch (error) {
        console.log(error)
      }
    }

    return () => {
      stopLoop()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKey, true)

      try {
        document.body.classList.remove('page-game3')
      } catch {
        // ignore
      }
    }
  }, [handleKey, handleResize, initGame, refreshHighScoreFromDb, stopLoop])

  return (
    <div className="game3-page">
      <div className="arcade-frame">
        <div className="score">
          <div>Score: {score}</div>
          <div>High: {highScore}</div>
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

        <div
          className="screen-center"
          ref={centerRef}
          onTouchStart={(e) => {
            const t = e.touches && e.touches[0]
            if (t) touchStartRef.current = { x: t.clientX, y: t.clientY }
          }}
          onTouchEnd={(e) => {
            const start = touchStartRef.current
            if (!start) return

            const t = e.changedTouches && e.changedTouches[0]
            if (!t) return

            const dx = t.clientX - start.x
            const dy = t.clientY - start.y
            const absX = Math.abs(dx)
            const absY = Math.abs(dy)

            if (Math.max(absX, absY) < 20) return

            if (absX > absY) {
              if (dx > 0) changeDirection({ x: 1, y: 0 })
              else changeDirection({ x: -1, y: 0 })
            } else {
              if (dy > 0) changeDirection({ x: 0, y: 1 })
              else changeDirection({ x: 0, y: -1 })
            }

            touchStartRef.current = null
          }}
        >
          <canvas
            ref={canvasRef}
            tabIndex={0}
            onClick={() => {
              if (!running && !ended) startLoop()

              try {
                if (canvasRef.current) canvasRef.current.focus()
              } catch (error) {
                console.log(error)
              }
            }}
          />

          {!running && (
            <div
              className="start-overlay"
              onClick={() => {
                if (ended) {
                  restartManual()
                  startLoop()
                } else {
                  startLoop()
                }

                try {
                  if (canvasRef.current) canvasRef.current.focus()
                } catch (error) {
                  console.log(error)
                }
              }}
            >
              <div className="start-text">
                {ended
                  ? `Game Over — Score ${score} (click / Space to restart)`
                  : 'Press Space to Start'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="touch-controls">
        <div className="dpad btn-group-vertical" role="group" aria-label="D-pad">
          <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: 0, y: -1 })}>
            ▲
          </button>
          <div className="dpad-row">
            <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: -1, y: 0 })}>
              ◄
            </button>
            <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: 1, y: 0 })}>
              ►
            </button>
          </div>
          <button type="button" className="dpad-btn btn btn-dark" onClick={() => changeDirection({ x: 0, y: 1 })}>
            ▼
          </button>
        </div>
      </div>
    </div>
  )
}