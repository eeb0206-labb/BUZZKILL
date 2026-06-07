import React, { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store'

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
export function Avatar({ src, name, colorHex, size = 40 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="avatar"
        style={{ width: size, height: size }}
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
      }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ── CameraCapture ──────────────────────────────────────────────────────────────
export function CameraCapture({ onCapture, onSkip }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState(null)
  const [error, setError] = useState(null)

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
    setCaptured(c.toDataURL('image/jpeg', 0.7))
  }, [])

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCaptured(ev.target.result)
    reader.readAsDataURL(file)
  }

  // Preview + confirm (shared between camera snap and file upload)
  if (captured) {
    return (
      <div className="col center" style={{ gap: 12 }}>
        <img src={captured} alt="preview"
          style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover' }} />
        <div className="row gap-8">
          <button className="btn btn-green" onClick={() => onCapture(captured)}>✓ Use this</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCaptured(null)}>Retake</button>
        </div>
      </div>
    )
  }

  // No camera — upload only
  if (error) {
    return (
      <div className="col center" style={{ gap: 12 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>📤 Upload from Gallery</button>
        {onSkip && <button className="btn btn-ghost btn-sm" onClick={onSkip}>Continue without photo</button>}
      </div>
    )
  }

  // Camera available — show live feed + option to upload instead
  return (
    <div className="col" style={{ gap: 12, alignItems: 'center' }}>
      {!captured ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ width: '100%', maxWidth: 280, borderRadius: 12, transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <div className="col center" style={{ gap: 6 }}>
            <div className="row gap-8">
              <button className="btn btn-primary" onClick={snap} disabled={!streaming}>📸 Take Selfie</button>
              {onSkip && <button className="btn btn-ghost btn-sm" onClick={onSkip}>Skip</button>}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}
              onClick={() => fileRef.current?.click()}>📤 Upload from gallery instead</button>
          </div>
        </>
      ) : (
        <>
          <img src={captured} alt="preview"
            style={{ width: 160, height: 160, borderRadius: '50%', objectFit: 'cover' }} />
          <div className="row gap-8">
            <button className="btn btn-green" onClick={() => onCapture(captured)}>✓ Use this</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCaptured(null)}>Retake</button>
          </div>
        </>
      )}
    </div>
  )
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
export function Podium({ players, showConfetti = false }) {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 4)
  const order = [1, 0, 2, 3] // visual order: 2nd, 1st, 3rd, 4th
  const display = order.map(i => sorted[i]).filter(Boolean)

  return (
    <div className="podium">
      {display.map((player, di) => {
        const actualRank = sorted.indexOf(player) + 1
        return (
          <motion.div
            key={player.id}
            className="podium-slot"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: di * 0.15, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Avatar src={player.avatar} name={player.name} colorHex={player.colorHex} size={44} />
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>{player.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text2)' }}>
              {player.score}pts
            </div>
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
          <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={40} />
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
