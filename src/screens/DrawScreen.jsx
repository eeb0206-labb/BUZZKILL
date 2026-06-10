import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { getGenreById } from '../data/genres'
import { db, ref, update } from '../firebase'
import { useBuzzSpeech, useShouldBuzzSpeak } from '../hooks/useBuzzSpeech'
import { getBuzzQuip } from '../data/hostQuips'

// ── colour palette ────────────────────────────────────────────────────────────
const COLOURS = ['#e63946','#f77f00','#f4d03f','#57cc99','#4895ef','#a855f7','#ffffff','#1a1a2e']
const BRUSH_SIZES = [3, 7, 14, 24]

export default function DrawScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const isGameScreen = store.isGameScreen()
  const setScreen = store.setScreen
  const { subscribeToGame, saveDrawing, submitDrawGuess, advanceDrawRound } = useGame()
  const { playCorrect, playWrong } = useSound()

  // ── drawing state ─────────────────────────────────────────────────────────
  const canvasRef = useRef(null)
  const [color, setColor] = useState('#e63946')
  const [brushSize, setBrushSize] = useState(7)
  const [drawing, setDrawing] = useState(false)
  const [strokes, setStrokes] = useState([]) // [{color, size, pts:[{x,y}]}]
  const currentStrokeRef = useRef(null)
  const lastSaveRef = useRef(0)
  const saveTimerRef = useRef(null)

  // ── guessing state ────────────────────────────────────────────────────────
  const [guess, setGuess] = useState('')
  const [guessSubmitted, setGuessSubmitted] = useState(false)
  const [revealPrompt, setRevealPrompt] = useState(false)

  const genre = game?.currentGenre
  const drawerId = game?.drawerId
  const drawPrompt = game?.drawPrompt
  const drawWinner = game?.drawWinner
  const drawingData = game?.drawingData // base64 canvas snapshot
  const promptIndex = game?.drawPromptIndex || 0
  const questionsPerRound = game?.settings?.questionsPerRound || 8

  const amIDrawer = myId === drawerId || (!drawerId && isController)
  const me = game?.players?.[myId]

  // Artwork reveal — 60% chance when drawing data first appears
  const { speakWithChance } = useBuzzSpeech()
  const shouldSpeak = useShouldBuzzSpeak(game)
  const aiHost = game?.settings?.aiHost ?? true
  const prevDrawingRef = useRef(null)
  useEffect(() => {
    if (drawingData && !prevDrawingRef.current && shouldSpeak && aiHost) {
      speakWithChance(getBuzzQuip('artworkReveal'), 'artworkReveal', null, 0.60)
    }
    prevDrawingRef.current = drawingData ?? null
  }, [drawingData, shouldSpeak, aiHost])
  const winner = drawWinner ? game?.players?.[drawWinner] : null

  // ── pick prompt and drawer on mount (controller only) ─────────────────────
  useEffect(() => {
    if (!isController || drawerId) return
    const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
    if (!players.length) return
    const drawer = players[promptIndex % players.length]
    const genreData = getGenreById(genre?.id)
    // draw genre stores plain string prompts; quiz genres use {q, a, hint} objects
    const rawPrompts = genreData?.prompts || genreData?.questions || []
    const rawPrompt = rawPrompts[promptIndex % Math.max(rawPrompts.length, 1)]
    const prompt = (typeof rawPrompt === 'string' ? rawPrompt : rawPrompt?.q) || 'A cat playing piano'
    update(ref(db, `games/${gameCode}`), {
      drawerId: drawer.id,
      drawPrompt: prompt,
      drawingData: null,
      drawWinner: null,
      drawWinGuess: null,
    })
  }, [isController, drawerId, promptIndex, gameCode])

  // ── Firebase subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'round-pick') setScreen('round-pick')
      if (g.state === 'final') setScreen('final')
    })
    return unsub
  }, [gameCode])

  // ── Reset guess when new prompt ───────────────────────────────────────────
  useEffect(() => {
    setGuess('')
    setGuessSubmitted(false)
    setRevealPrompt(false)
    setStrokes([])
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [promptIndex, drawerId])

  // ── Render remote strokes onto canvas (for non-drawers) ──────────────────
  useEffect(() => {
    if (amIDrawer || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!drawingData) return
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    img.src = drawingData
  }, [drawingData, amIDrawer, promptIndex])

  // ── Canvas drawing helpers ────────────────────────────────────────────────
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return {
      x: (touch.clientX - rect.left) / rect.width,
      y: (touch.clientY - rect.top) / rect.height,
    }
  }

  function drawLocalStroke(stroke) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { pts, color: c, size } = stroke
    if (pts.length < 2) return
    ctx.strokeStyle = c
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height)
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * canvas.width, pts[i].y * canvas.height)
    }
    ctx.stroke()
  }

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
      saveDrawing(gameCode, dataUrl, myId, drawPrompt)
    }, 300) // debounce: only save 300ms after last stroke
  }

  const handlePointerDown = useCallback((e) => {
    if (!amIDrawer || drawWinner) return
    e.preventDefault()
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    currentStrokeRef.current = { color, size: brushSize, pts: [pos] }
    setDrawing(true)
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.arc(pos.x * canvas.width, pos.y * canvas.height, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }, [amIDrawer, color, brushSize, drawWinner])

  const handlePointerMove = useCallback((e) => {
    if (!drawing || !amIDrawer || !currentStrokeRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    currentStrokeRef.current.pts.push(pos)
    // Render incrementally
    const stroke = currentStrokeRef.current
    const pts = stroke.pts
    if (pts.length >= 2) {
      const ctx = canvas.getContext('2d')
      const p1 = pts[pts.length - 2]
      const p2 = pts[pts.length - 1]
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height)
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height)
      ctx.stroke()
    }
  }, [drawing, amIDrawer])

  const handlePointerUp = useCallback((e) => {
    if (!drawing || !amIDrawer || !currentStrokeRef.current) return
    e.preventDefault()
    const stroke = currentStrokeRef.current
    setStrokes(s => [...s, stroke])
    currentStrokeRef.current = null
    setDrawing(false)
    scheduleSave()
  }, [drawing, amIDrawer])

  function handleClear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStrokes([])
    saveDrawing(gameCode, null, myId, drawPrompt)
  }

  // ── Guess submission ──────────────────────────────────────────────────────
  async function handleSubmitGuess() {
    if (!guess.trim() || guessSubmitted || amIDrawer) return
    setGuessSubmitted(true)
    const correct = await submitDrawGuess(gameCode, game, myId, guess.trim())
    if (correct) {
      playCorrect()
    } else {
      playWrong()
      setGuessSubmitted(false) // allow re-guess if wrong (draw game allows multiple guesses)
      setGuess('')
    }
  }

  // ── Next prompt ───────────────────────────────────────────────────────────
  async function handleNext() {
    await advanceDrawRound(gameCode, game)
  }

  const drawerPlayer = game?.players?.[drawerId]
  const currentRound = game?.currentRound || 1
  const settings = game?.settings || {}

  return (
    <div className="screen" style={{ touchAction: 'none' }}>
      <div className="topbar">
        <div className="row gap-8">
          <div className="round-badge">{genre?.emoji} Draw It</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{promptIndex + 1}/{questionsPerRound}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.9rem', color: 'var(--text2)' }}>
          {drawerPlayer ? `${drawerPlayer.name} draws` : 'Drawing...'}
        </div>
        <MuteButton />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 16px', gap: 8 }}>
        {/* Prompt — only shown to drawer */}
        {amIDrawer && drawPrompt && !drawWinner && (
          <motion.div
            className="card"
            style={{ background: 'rgba(192,132,252,0.1)', borderColor: 'var(--accent)', textAlign: 'center', padding: '10px 16px' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Your prompt</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', color: 'var(--accent)' }}>{drawPrompt}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>Draw it above — don't write words!</div>
          </motion.div>
        )}

        {/* Waiting message for non-drawers without a prompt shown */}
        {!amIDrawer && !drawWinner && (
          <motion.div
            className="card center"
            style={{ padding: '8px 16px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
              🎨 <strong style={{ color: 'var(--accent)' }}>{drawerPlayer?.name || '...'}</strong> is drawing — type your guess below!
            </div>
          </motion.div>
        )}

        {/* Canvas */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--border)', background: '#1a1a2e' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            style={{ width: '100%', height: '100%', display: 'block', cursor: amIDrawer && !drawWinner ? 'crosshair' : 'default', touchAction: 'none' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />

          {/* Winner banner */}
          <AnimatePresence>
            {drawWinner && (
              <motion.div
                style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div style={{ fontSize: '2.5rem' }}>🎉</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: 'white' }}>
                  {winner?.name || 'Someone'} got it!
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  The answer was: <strong style={{ color: 'var(--gold)' }}>{drawPrompt}</strong>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting for drawing */}
          {!amIDrawer && !drawingData && !drawWinner && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem' }}>Waiting for {drawerPlayer?.name} to start drawing...</div>
            </div>
          )}
        </div>

        {/* Drawer tools */}
        {amIDrawer && !drawWinner && (
          <motion.div
            className="card"
            style={{ padding: '8px 12px', gap: 10 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="row gap-8" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Colour swatches */}
              <div className="row gap-5">
                {COLOURS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                      outline: color === c ? `3px solid white` : '2px solid transparent',
                      transform: color === c ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.12s',
                    }}
                  />
                ))}
              </div>
              {/* Brush sizes */}
              <div className="row gap-5" style={{ marginLeft: 'auto' }}>
                {BRUSH_SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: brushSize === s ? 'rgba(192,132,252,0.2)' : 'var(--surface)',
                      border: `1.5px solid ${brushSize === s ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: s * 0.7, height: s * 0.7, borderRadius: '50%', background: color }} />
                  </button>
                ))}
              </div>
              {/* Clear */}
              <button className="btn btn-ghost btn-sm" onClick={handleClear} style={{ color: 'var(--red)', borderColor: 'var(--red)', marginLeft: 4 }}>
                🗑️ Clear
              </button>
            </div>
          </motion.div>
        )}

        {/* Guess input — for non-drawers */}
        {!amIDrawer && !drawWinner && !isGameScreen && (
          <motion.div
            className="col gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="row gap-8">
              <input
                className="input flex-1"
                placeholder="What are they drawing?"
                value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitGuess()}
                style={{ fontSize: '1rem' }}
                autoComplete="off"
              />
              <motion.button
                className="btn btn-gold"
                onClick={handleSubmitGuess}
                disabled={!guess.trim()}
                whileTap={{ scale: 0.95 }}
              >
                Guess!
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Winner — next prompt button for controller */}
        {drawWinner && isController && (
          <motion.button
            className="btn btn-green btn-lg btn-block"
            onClick={handleNext}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {promptIndex + 1 >= questionsPerRound ? '🏆 End Round →' : 'Next Drawing →'}
          </motion.button>
        )}

        {/* Time limit expired — allow host to skip if nobody guessed */}
        {!drawWinner && isController && drawingData && (
          <motion.button
            className="btn btn-ghost"
            onClick={handleNext}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ fontSize: '0.8rem', color: 'var(--text3)' }}
          >
            Skip → (no one got it)
          </motion.button>
        )}

        {/* Waiting for winner (non-controller) */}
        {drawWinner && !isController && (
          <motion.div
            className="card center"
            style={{ color: 'var(--text3)', fontSize: '0.85rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ marginTop: 8 }}>Waiting for host...</div>
          </motion.div>
        )}
      </div>
      <Toast />
    </div>
  )
}
