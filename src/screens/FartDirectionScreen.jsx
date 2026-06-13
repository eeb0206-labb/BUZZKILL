/**
 * FartDirectionScreen — 💨 F-Art Direction
 *
 * You're an art director trying to find the perfect colour. You find it — then fart and lose it.
 * A colour flashes on screen for 4 seconds. It disappears (with a fart 💨). Match it on the
 * colour wheel as closely as possible.
 *
 * Scoring: closest match = 100pts | 2nd = 75pts | 3rd = 50pts | 4th+ = 0pts
 * Phases: 'show' (4s) → 'pick' (20s) → 'reveal' → next colour / end round
 *
 * Same screen for host, co-host, and players. gamescreen uses FartDirectionView in GameScreen.jsx.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import SettingsOverlay from '../components/SettingsOverlay'

// ── Colour math helpers ────────────────────────────────────────────────────────

function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function hslToHex(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function hexToHsl(hex) {
  if (!hex || hex.length < 7) return { h: 0, s: 0, l: 50 }
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0, s = 0
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

// Euclidean RGB distance, normalised 0–100
function colorAccuracy(hex1, hex2) {
  if (!hex1 || !hex2) return 0
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16)
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16)
  const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
  const maxDist = Math.sqrt(3 * 255 ** 2) // ≈ 441.7
  return Math.round((1 - dist / maxDist) * 100)
}

// Decide whether to use black or white text on a given background
function textColorFor(hex) {
  if (!hex || hex.length < 7) return '#fff'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#000' : '#fff'
}

// ── Colour Wheel Canvas ────────────────────────────────────────────────────────

function drawWheelOnCanvas(canvas, size, selectedHex, fixedL) {
  const ctx = canvas.getContext('2d')
  const cx = size / 2, cy = size / 2
  const r = size / 2 - 3

  // Draw pixel-by-pixel HSL wheel: angle = hue, radius = saturation
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > r) continue
      const hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360
      const sat = (dist / r) * 100
      const [R, G, B] = hslToRgb(hue, sat, fixedL)
      const idx = (y * size + x) * 4
      data[idx] = R; data[idx + 1] = G; data[idx + 2] = B; data[idx + 3] = 255
    }
  }
  ctx.putImageData(imageData, 0, 0)

  // Draw the selection crosshair
  if (selectedHex && selectedHex.length >= 7) {
    const { h, s } = hexToHsl(selectedHex)
    const radians = (h * Math.PI) / 180
    const dist = (s / 100) * r
    const px = cx + Math.cos(radians) * dist
    const py = cy + Math.sin(radians) * dist

    // Shadow ring
    ctx.beginPath()
    ctx.arc(px, py, 11, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fill()
    // White outer ring
    ctx.beginPath()
    ctx.arc(px, py, 10, 0, Math.PI * 2)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()
    // Black inner ring
    ctx.beginPath()
    ctx.arc(px, py, 7, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    // Coloured dot
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = selectedHex
    ctx.fill()
  }
}

function ColourWheel({ size = 260, value, onChange, disabled = false }) {
  const canvasRef = useRef(null)
  const isDragging = useRef(false)
  // We fix lightness at 50% for the wheel — target colours are generated in 45–60% range,
  // but the wheel at L=50% gives the cleanest, most saturated view of all hues.
  const FIXED_L = 50

  useEffect(() => {
    if (canvasRef.current) drawWheelOnCanvas(canvasRef.current, size, value, FIXED_L)
  }, [size, value])

  function getColorFromEvent(e) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = size / rect.width
    const scaleY = size / rect.height
    const touch = e.touches?.[0] ?? e
    const x = (touch.clientX - rect.left) * scaleX
    const y = (touch.clientY - rect.top) * scaleY
    const cx = size / 2, cy = size / 2
    const dx = x - cx, dy = y - cy
    const r = size / 2 - 3
    const clampedDist = Math.min(Math.sqrt(dx * dx + dy * dy), r)
    const hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360
    const sat = (clampedDist / r) * 100
    return hslToHex(hue, sat, FIXED_L)
  }

  function onStart(e) {
    if (disabled) return
    e.preventDefault()
    isDragging.current = true
    const c = getColorFromEvent(e)
    if (c) onChange(c)
  }
  function onMove(e) {
    if (!isDragging.current || disabled) return
    e.preventDefault()
    const c = getColorFromEvent(e)
    if (c) onChange(c)
  }
  function onEnd() { isDragging.current = false }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        borderRadius: '50%',
        cursor: disabled ? 'default' : 'crosshair',
        touchAction: 'none',
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'block',
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.3s',
      }}
      onMouseDown={onStart}
      onMouseMove={onMove}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
    />
  )
}

// ── Rank medal helpers ─────────────────────────────────────────────────────────
const RANK_MEDALS = ['🥇', '🥈', '🥉']
const RANK_COLORS = ['#f4d03f', '#c0c0c0', '#cd7f32']
const PICK_TIME = 20  // seconds for pick phase
const SHOW_TIME = 4000  // ms for show phase
const REVEAL_DURATION = 7000  // ms before auto-advancing from reveal

function playFartSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const duration = 0.9
    const rate = ctx.sampleRate
    const buf = ctx.createBuffer(1, rate * duration, rate)
    const data = buf.getChannelData(0)
    let phase = 0
    const baseFreq = 80 + Math.random() * 40
    for (let i = 0; i < data.length; i++) {
      const t = i / rate
      const decay = Math.pow(1 - t / duration, 1.2)
      const wobble = Math.sin(2 * Math.PI * baseFreq * t * (1 + 0.8 * t))
      const noise = (Math.random() * 2 - 1)
      data[i] = (wobble * 0.6 + noise * 0.4) * decay
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.9, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(600, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration)
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    src.start(); src.stop(ctx.currentTime + duration)
  } catch (_) {}
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function FartDirectionScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const {
    subscribeToGame,
    startFartDirection, advanceFDToPick,
    submitFartColor, revealFartResults,
    nextFartColor, endFDRound,
  } = useGame()

  const phase         = game?.fdPhase
  const targetColor   = game?.fdTargetColor
  const submissions   = game?.fdSubmissions || {}
  const scoreMap      = game?.fdScoreMap   || {}
  const count         = game?.fdCount      || 1
  const roundLimit    = game?.settings?.questionsPerRound || 5
  const players       = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const mySubmission  = submissions[myId]
  const totalSubmitted = Object.keys(submissions).length

  const [selectedColor, setSelectedColor] = useState('#ff0000')
  const [timeLeft, setTimeLeft]           = useState(PICK_TIME)
  const [showSettings, setShowSettings]   = useState(false)
  const [fartPlaying, setFartPlaying]     = useState(false)
  const timerRef    = useRef(null)
  const autoRef     = useRef(false)
  const showTimerRef = useRef(null)

  // ── Subscribe ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameCode) return
    return subscribeToGame(gameCode, g => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final')      store.setScreen('final')
      if (g.state === 'lobby')      store.setScreen('lobby')
    })
  }, [gameCode])

  // ── Auto-start first colour ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isController || phase || !game?.currentGenre) return
    startFartDirection(gameCode, game)
  }, [isController, phase, game?.currentGenre?.id, gameCode])

  // ── Auto-advance show → pick after SHOW_TIME ─────────────────────────────────
  useEffect(() => {
    if (!isController || phase !== 'show') return
    showTimerRef.current = setTimeout(() => {
      if (useStore.getState().game?.gamePaused) return
      setFartPlaying(true)
      playFartSound()
      setTimeout(() => setFartPlaying(false), 1200)
      advanceFDToPick(gameCode)
    }, SHOW_TIME)
    return () => clearTimeout(showTimerRef.current)
  }, [phase, gameCode, isController])

  // ── Pick phase timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase !== 'pick' || !game?.fdPickStartAt) return
    const tick = () => setTimeLeft(Math.max(0, Math.ceil(PICK_TIME - (Date.now() - game.fdPickStartAt) / 1000)))
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.fdPickStartAt])

  // ── Auto-reveal when all submitted or timer hits 0 ──────────────────────────
  useEffect(() => {
    if (phase !== 'pick' || !isController || autoRef.current || game?.gamePaused) return
    if (timeLeft === 0 || totalSubmitted >= players.length) {
      autoRef.current = true
      // Read latest game from store at call time — avoids stale closure on the 600ms delay
      setTimeout(() => revealFartResults(gameCode, useStore.getState().game), 600)
    }
  }, [timeLeft, totalSubmitted, players.length, phase, isController])

  // ── Reset autoRef on new colour ──────────────────────────────────────────────
  useEffect(() => { autoRef.current = false }, [targetColor])

  // ── Auto-advance reveal → next colour or end round ───────────────────────────
  useEffect(() => {
    if (phase !== 'reveal' || !isController) return
    const t = setTimeout(async () => {
      const currentCount = game?.fdCount || 1
      const limit = game?.settings?.questionsPerRound || 5
      if (currentCount >= limit) {
        await endFDRound(gameCode)
      } else {
        await nextFartColor(gameCode, game)
      }
    }, REVEAL_DURATION)
    return () => clearTimeout(t)
  }, [phase, isController, gameCode])

  // ── Reset selected colour on each new pick phase ─────────────────────────────
  useEffect(() => {
    if (phase === 'pick') setSelectedColor('#ff6600')
  }, [phase])

  async function handleSubmit() {
    if (mySubmission) return
    await submitFartColor(gameCode, myId, selectedColor)
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  function renderShowPhase() {
    const tc = textColorFor(targetColor)
    return (
      <motion.div
        key="show"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.06 }}
        transition={{ duration: 0.3 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: targetColor || 'var(--surface)',
          position: 'relative', overflow: 'hidden',
          margin: -16, // bleed to edges of screen-inner padding
          borderRadius: 0,
        }}
      >
        {/* Pulsing inner glow */}
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.2)', borderRadius: 0 }}
        />

        <div style={{ position: 'relative', textAlign: 'center', padding: '0 24px' }}>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ fontSize: '3rem', marginBottom: 12 }}
          >
            🎨
          </motion.div>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 'clamp(1.4rem, 7vw, 2.2rem)',
            color: tc,
            textShadow: tc === '#000' ? '0 1px 6px rgba(255,255,255,0.5)' : '0 1px 6px rgba(0,0,0,0.4)',
            lineHeight: 1.2,
            marginBottom: 10,
          }}>
            REMEMBER<br />THIS COLOUR!
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: tc,
            opacity: 0.65,
          }}>
            {count}/{roundLimit} · Disappearing in a moment…
          </div>
        </div>

        {/* Countdown bar at bottom */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: SHOW_TIME / 1000, ease: 'linear' }}
          style={{
            position: 'absolute', bottom: 0, left: 0,
            height: 5,
            background: tc === '#000' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)',
          }}
        />
      </motion.div>
    )
  }

  function renderPickPhase() {
    const submitted = !!mySubmission
    return (
      <motion.div key="pick" className="col" style={{ gap: 14, flex: 1 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

        {/* Timer bar */}
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            style={{ background: timeLeft <= 5 ? 'var(--red)' : '#a855f7' }}
            animate={{ width: `${(timeLeft / PICK_TIME) * 100}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: '#a855f7' }}>
            💨 Find the colour!
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text3)' }}>
            {timeLeft}s · {totalSubmitted}/{players.length} locked in
          </div>
        </div>

        {/* Colour wheel — centred */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <ColourWheel
            size={Math.min(260, window.innerWidth - 48)}
            value={selectedColor}
            onChange={setSelectedColor}
            disabled={submitted}
          />

          {/* Selected colour preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: selectedColor,
              border: '2.5px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
                Your pick
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: selectedColor }}>
                {selectedColor.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Submit / locked-in button */}
        {!submitted ? (
          <motion.button
            className="btn btn-lg btn-block"
            style={{ background: '#a855f7', border: 'none', color: '#fff', fontWeight: 700 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
          >
            🎨 Lock it in!
          </motion.button>
        ) : (
          <motion.div
            className="card col center gap-6"
            style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)' }}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: mySubmission, border: '2px solid rgba(255,255,255,0.15)' }} />
              <div style={{ fontWeight: 700, color: '#a855f7' }}>✓ Locked in!</div>
            </div>
            <div className="loading-dots"><span /><span /><span /></div>
          </motion.div>
        )}
      </motion.div>
    )
  }

  function renderRevealPhase() {
    // Sort players by rank for display
    const ranked = players
      .map(p => ({ ...p, ...(scoreMap[p.id] || { rank: 99, pts: 0, distance: 999, color: null }) }))
      .sort((a, b) => a.rank - b.rank)

    return (
      <motion.div key="reveal" className="col" style={{ gap: 14 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* Target colour */}
        <motion.div
          className="col center"
          style={{ gap: 8 }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            The colour was
          </div>
          <motion.div
            style={{
              width: '100%', height: 64, borderRadius: 14,
              background: targetColor,
              border: '2.5px solid rgba(255,255,255,0.15)',
            }}
            initial={{ scale: 0.85 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
          />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
            {targetColor?.toUpperCase()}
          </div>
        </motion.div>

        {/* Player results */}
        <div className="card col" style={{ gap: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Results</div>
          {ranked.map((p, i) => {
            const acc = p.color ? colorAccuracy(targetColor, p.color) : 0
            const medal = RANK_MEDALS[p.rank - 1]
            const rankColor = RANK_COLORS[p.rank - 1] || 'var(--text3)'
            const noSubmit = !p.color
            return (
              <motion.div
                key={p.id}
                className="row gap-10"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', width: 28, textAlign: 'center', flexShrink: 0 }}>
                  {medal || '—'}
                </div>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                {!noSubmit && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: p.color, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: rankColor, fontWeight: 700 }}>
                        {acc}% match
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: p.pts > 0 ? '#a855f7' : 'var(--text3)', fontWeight: 700 }}>
                        {p.pts > 0 ? `+${p.pts}` : '—'}
                      </div>
                    </div>
                  </div>
                )}
                {noSubmit && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>No pick</div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* My personal result card */}
        {mySubmission && scoreMap[myId] && (
          <motion.div
            className="card col center gap-6"
            style={{
              background: scoreMap[myId].pts > 0 ? 'rgba(168,85,247,0.08)' : 'rgba(100,100,100,0.05)',
              borderColor: scoreMap[myId].pts > 0 ? 'rgba(168,85,247,0.3)' : 'var(--border)',
            }}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 2 }}>Target</div>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: targetColor, border: '2px solid rgba(255,255,255,0.15)' }} />
              </div>
              <div style={{ fontSize: '1.4rem', color: 'var(--text3)' }}>↔</div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 2 }}>Your pick</div>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: mySubmission, border: '2px solid rgba(255,255,255,0.15)' }} />
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', color: '#a855f7' }}>
                  {colorAccuracy(targetColor, mySubmission)}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>accuracy</div>
                {scoreMap[myId].pts > 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#a855f7', marginTop: 4 }}>
                    {RANK_MEDALS[scoreMap[myId].rank - 1]} +{scoreMap[myId].pts} pts
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Controller buttons */}
        {isController && (
          <motion.div className="row gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <button className="btn btn-ghost flex-1" onClick={() => endFDRound(gameCode)}>
              End Round
            </button>
            <button
              className="btn flex-1"
              style={{ background: '#a855f7', border: 'none', color: '#fff', fontWeight: 700 }}
              onClick={() => nextFartColor(gameCode, game)}
            >
              Next Colour 💨
            </button>
          </motion.div>
        )}

        {!isController && (
          <div className="card center" style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ marginTop: 6 }}>Waiting for host…</div>
          </div>
        )}
      </motion.div>
    )
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="screen">
      {/* Fart flash overlay — fires on show→pick transition */}
      <AnimatePresence>
        {fartPlaying && (
          <motion.div
            key="fart-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(180,160,60,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -15 }}
              animate={{ scale: [0.4, 1.4, 1.1], rotate: [-15, 12, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ fontSize: 'clamp(4rem, 15vw, 7rem)' }}
            >
              💨
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="topbar">
        <div className="round-badge">💨 F-Art Direction</div>
        <div className="topbar-logo" style={{ color: '#a855f7' }}>
          {count}/{roundLimit}
        </div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 14, position: 'relative', overflow: phase === 'show' ? 'hidden' : undefined }}>
        <AnimatePresence mode="wait">
          {!phase && (
            <motion.div key="loading" className="col center" style={{ flex: 1, gap: 12, padding: 32 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="loading-dots"><span /><span /><span /></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Mixing colours…</div>
            </motion.div>
          )}
          {phase === 'show'   && renderShowPhase()}
          {phase === 'pick'   && renderPickPhase()}
          {phase === 'reveal' && renderRevealPhase()}
        </AnimatePresence>
      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
