import React, { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store'
import AvatarSvg from '../AvatarSvg'

// ── Toast ──────────────────────────────────────────────────────────────────────
export function Toast() {
  const toast = useStore(s => s.toast)
  const setToast = useStore(s => s.setToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.duration || 2500)
    return () => clearTimeout(t)
  }, [toast, setToast])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {toast.icon && <span>{toast.icon} </span>}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function showToast(store, message, icon = null, duration = 2500) {
  store.setToast({ message, icon, duration })
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ show, onClose, title, children, centered = false }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`modal-backdrop ${centered ? 'centered' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {title && (
              <div className="row" style={{ marginBottom: 16 }}>
                <h3 className="flex-1">{title}</h3>
                {onClose && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
// Renders in priority order: avatarConfig (SVG, with optional photo bobblehead) → src (photo) → placeholder
export function Avatar({ src, name, colorHex, size = 40, avatarConfig }) {
  if (avatarConfig) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          border: `2px solid ${colorHex || 'var(--border)'}`,
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Pass photoSrc so the face photo overlays the avatar head (bobblehead effect) */}
        <AvatarSvg config={avatarConfig} size={size} showFull={false} photoSrc={src || null}/>
      </div>
    )
  }
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="avatar"
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className="avatar-placeholder"
      style={{
        width: size, height: size,
        background: colorHex || '#321960',
        border: `2px solid ${colorHex || '#4895ef'}`,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ── CameraCapture ──────────────────────────────────────────────────────────────
// Full-screen camera overlay — renders as a portal so it covers the whole screen.
// Pass onSkip={null} to hide the skip button.
export function CameraCapture({ onCapture, onSkip }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState(null)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let stream = null
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        stream = s
        if (videoRef.current) { videoRef.current.srcObject = s; setStreaming(true) }
      })
      .catch(() => { setError('no-camera'); setStreaming(false) })
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  const snap = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth || 320
    c.height = v.videoHeight || 240
    c.getContext('2d').drawImage(v, 0, 0)
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    setCaptured(c.toDataURL('image/jpeg', 0.8))
  }, [])

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCaptured(ev.target.result)
    reader.readAsDataURL(file)
  }

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0f',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 env(safe-area-inset-bottom, 16px)',
      }}
    >
      {/* Header */}
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
      }}>
        <button
          onClick={onSkip}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', cursor: 'pointer', padding: '8px 4px' }}
        >
          ✕ Cancel
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: 'var(--red)', letterSpacing: '0.05em' }}>
            ⚡ BUZZKILL
          </div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Camera
          </div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Viewfinder / preview area */}
      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Flash overlay */}
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 10, pointerEvents: 'none' }}
            />
          )}
        </AnimatePresence>

        {captured ? (
          /* Review captured photo */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <img
              src={captured}
              alt="preview"
              style={{ width: 220, height: 220, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent)' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Looking good?</div>
          </div>
        ) : error ? (
          /* No camera — upload prompt */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>📸</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: '1rem' }}>No camera available</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>Upload a photo from your gallery instead</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()} style={{ marginTop: 8 }}>
              📤 Choose from Gallery
            </button>
          </div>
        ) : (
          /* Live camera feed */
          <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
            />
            {/* Viewfinder circle overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '70%', paddingBottom: '70%', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.35)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                position: 'relative',
              }} />
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Bottom controls */}
      <div style={{ width: '100%', padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {captured ? (
          /* Confirm / retake */
          <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 320 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => setCaptured(null)}
            >↩ Retake</button>
            <button
              className="btn btn-green"
              style={{ flex: 1, fontWeight: 700 }}
              onClick={() => onCapture(captured)}
            >✓ Use Photo</button>
          </div>
        ) : !error ? (
          /* Shutter button + gallery */
          <>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            {/* Big shutter button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              disabled={!streaming}
              onClick={snap}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: streaming ? 'white' : 'rgba(255,255,255,0.2)',
                border: '5px solid rgba(255,255,255,0.4)',
                cursor: streaming ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: streaming ? '0 0 0 3px rgba(255,255,255,0.15), 0 4px 24px rgba(0,0,0,0.6)' : 'none',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ width: 62, height: 62, borderRadius: '50%', background: streaming ? 'white' : 'rgba(255,255,255,0.2)' }} />
            </motion.button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}
              onClick={() => fileRef.current?.click()}
            >
              📤 Upload from gallery instead
            </button>
          </>
        ) : null}
      </div>
    </motion.div>
  )

  return createPortal(content, document.body)
}

// ── TimerRing ──────────────────────────────────────────────────────────────────
export function TimerRing({ seconds, total, size = 80 }) {
  const r = (size - 10) / 2
  const circumference = 2 * Math.PI * r
  const progress = total > 0 ? Math.max(0, seconds / total) : 0
  const offset = circumference * (1 - progress)
  const color = progress > 0.5 ? '#57cc99' : progress > 0.25 ? '#f4d03f' : '#e63946'

  return (
    <div className="timer-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={6}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
        />
      </svg>
      <div className="timer-text" style={{ color }}>
        {seconds}
      </div>
    </div>
  )
}

// ── Podium ─────────────────────────────────────────────────────────────────────
export function Podium({ players }) {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 4)
  const order = [1, 0, 2, 3] // visual order: 2nd, 1st, 3rd, 4th
  const display = order.map(i => sorted[i]).filter(Boolean)

  // Avatar height for each rank — winner is tallest
  const HEIGHTS = { 1: 96, 2: 80, 3: 72, 4: 64 }

  return (
    <div className="podium">
      {display.map((player, di) => {
        const actualRank = sorted.indexOf(player) + 1
        const avH = HEIGHTS[actualRank] || 64

        return (
          <motion.div
            key={player.id}
            className="podium-slot"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: di * 0.15, type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Full-body avatar — photo replaces head if available */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(255,255,255,0.04)', borderRadius: 10,
              padding: '6px 4px 0',
              border: actualRank === 1 ? '1px solid rgba(244,208,63,0.3)' : '1px solid var(--border)',
            }}>
              {player.avatarConfig ? (
                <AvatarSvg
                  config={player.avatarConfig}
                  size={avH}
                  showFull
                  photoSrc={player.avatar || null}
                />
              ) : player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.name}
                  style={{ width: avH * 0.7, height: avH * 0.7, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: avH * 0.7, height: avH * 0.7, borderRadius: '50%',
                  background: player.colorHex || '#321960',
                  border: `2px solid ${player.colorHex || '#4895ef'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: avH * 0.28, fontWeight: 700, color: '#fff',
                }}>
                  {player.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Name */}
            <div style={{
              fontSize: actualRank === 1 ? '0.82rem' : '0.75rem',
              fontWeight: 700, textAlign: 'center',
              maxWidth: 72, wordBreak: 'break-word', lineHeight: 1.2,
              color: actualRank === 1 ? 'var(--gold)' : 'var(--text)',
              marginTop: 4,
            }}>
              {player.name}
            </div>

            {/* Points */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: actualRank === 1 ? '0.82rem' : '0.72rem',
              color: actualRank === 1 ? 'var(--gold)' : 'var(--text2)',
              fontWeight: 700,
            }}>
              {player.score}pts
            </div>

            {/* Podium block */}
            <div className={`podium-block podium-${actualRank}`}>
              {actualRank === 1 ? '👑' : actualRank === 2 ? '🥈' : actualRank === 3 ? '🥉' : '🎮'}
              <div className="podium-place">#{actualRank}</div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── DrawCanvas ─────────────────────────────────────────────────────────────────
export function DrawCanvas({ onDataChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(4)

  const COLORS = ['#000000', '#e63946', '#4895ef', '#57cc99', '#f4d03f', '#a855f7', '#f77f00', '#f72585', '#ffffff']

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function startDraw(e) {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    lastPos.current = pos
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  function draw(e) {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function endDraw(e) {
    e.preventDefault()
    drawing.current = false
    onDataChange?.(canvasRef.current.toDataURL('image/jpeg', 0.6))
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    onDataChange?.(null)
  }

  return (
    <div className="col" style={{ gap: 8, alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        width={320} height={240}
        style={{ width: '100%', maxWidth: 320, height: 'auto', touchAction: 'none' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      <div className="draw-toolbar">
        {COLORS.map(c => (
          <div
            key={c}
            className={`color-swatch ${color === c ? 'selected' : ''}`}
            style={{ background: c, border: c === '#ffffff' ? '2px solid var(--border2)' : 'none' }}
            onClick={() => setColor(c)}
          />
        ))}
        <select
          value={brushSize}
          onChange={e => setBrushSize(Number(e.target.value))}
          className="input"
          style={{ width: 70, padding: '4px 8px', fontSize: '0.8rem' }}
        >
          <option value={2}>Thin</option>
          <option value={4}>Medium</option>
          <option value={8}>Thick</option>
          <option value={16}>Chunky</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={clearCanvas}>Clear</button>
      </div>
    </div>
  )
}

// ── QRCode ─────────────────────────────────────────────────────────────────────
export function QRCode({ value, size = 180 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    // Simple QR via Google Charts API
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        canvasRef.current.width = size
        canvasRef.current.height = size
        ctx.drawImage(img, 0, 0, size, size)
      }
    }
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=1a0a2e&margin=10`
  }, [value, size])

  return (
    <div className="qr-wrap">
      <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />
    </div>
  )
}

// ── Confetti ───────────────────────────────────────────────────────────────────
export function Confetti({ active }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) return
    const colors = ['#e63946', '#f4d03f', '#57cc99', '#4895ef', '#a855f7', '#f72585', '#f77f00']
    const newPieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
    setPieces(newPieces)
    const t = setTimeout(() => setPieces([]), 5000)
    return () => clearTimeout(t)
  }, [active])

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}vw`,
            top: 0,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.5,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  )
}

// ── PlayerList ─────────────────────────────────────────────────────────────────
export function PlayerList({ players, myId, showScore = false, onAction = null, actionLabel = null }) {
  const sorted = Object.values(players || {})
    .sort((a, b) => (b.score || 0) - (a.score || 0))

  return (
    <div className="col gap-8">
      {sorted.map((p, i) => (
        <motion.div
          key={p.id}
          className="player-row"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          style={{ borderColor: p.id === myId ? p.colorHex || 'var(--accent)' : 'var(--border)' }}
        >
          <Avatar src={p.avatar} avatarConfig={p.avatarConfig} name={p.name} colorHex={p.colorHex} size={40} />
          <div className="flex-1">
            <div className="row gap-8">
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.id === myId && <span className="tag tag-new" style={{ fontSize: '0.65rem' }}>You</span>}
              {p.role === 'host' && <span className="tag tag-host">Host</span>}
              {p.role === 'cohost' && <span className="tag tag-cohost">Co-host</span>}
            </div>
            {showScore && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                {p.score || 0} pts
              </div>
            )}
          </div>
          {onAction && actionLabel && (
            <button className="btn btn-ghost btn-sm" onClick={() => onAction(p)}>
              {actionLabel}
            </button>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// ── MuteButton ─────────────────────────────────────────────────────────────────
export function MuteButton() {
  const muted = useStore(s => s.muted)
  const setMuted = useStore(s => s.setMuted)
  return (
    <button
      className="btn btn-ghost btn-icon"
      onClick={() => setMuted(!muted)}
      style={{ fontSize: '1.1rem', width: 38, height: 38 }}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
