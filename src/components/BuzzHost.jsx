import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBuzzQuip } from '../data/hostQuips'
import { useBuzzSpeech, useBuzzSpeaking } from '../hooks/useBuzzSpeech'

// Per-event default speak probabilities — applied when speakChance is not passed
const DEFAULT_CHANCES = {
  roundStart: 0.85,
  roundEnd:   0.90,
  votingOpen: 0.60,
  artworkReveal: 0.60,
  correct:    0.15,
  wrong:      0.08,
  playerJoins: 0.10,
}

// Auto-discover a custom Buzz image dropped into src/assets/images/buzz/
const _buzzImgGlob = import.meta.glob(
  '../assets/images/buzz/*.{png,jpg,jpeg,webp,gif,svg}',
  { eager: true, as: 'url' }
)
const BUZZ_IMAGE = Object.values(_buzzImgGlob)[0] || null

/**
 * BuzzHost — the AI host character.
 *
 * Props:
 *   quip          string   — what Buzz says (controlled from outside)
 *   event         string   — 'correct' | 'wrong' | 'idle' | 'generic' (drives face expression + audio folder)
 *   genreId       string   — genre ID for genreReveal events (routes to the right audio folder)
 *   featured      bool     — large centred display vs compact corner chip
 *   visible       bool     — show / hide
 *   autoIdle      bool     — cycle idle quips on a timer (good for TV corner)
 *   idleInterval  number   — ms between idle quip changes (default 12000)
 *   speakOnChange bool     — speak when quip changes (only pass true on the device that should speak)
 */
export default function BuzzHost({
  quip: propQuip,
  event = 'idle',
  genreId = null,
  featured = false,
  size = null,         // override face size (null = 44 compact / 88 featured)
  visible = true,
  autoIdle = false,
  idleInterval = 12000,
  speakOnChange = false,
  speakChance = null,  // override probability; null = use DEFAULT_CHANCES[event] or 1.0
  speaking = false,    // pass useBuzzSpeaking() result for live float animation
}) {
  const [displayQuip, setDisplayQuip] = useState(propQuip || getBuzzQuip('idle'))
  const idleRef = useRef(null)
  const { speakWithChance } = useBuzzSpeech()

  const chance = speakChance ?? DEFAULT_CHANCES[event] ?? 1.0

  // Sync controlled quip and speak it
  useEffect(() => {
    if (!propQuip) return
    setDisplayQuip(propQuip)
    if (speakOnChange) speakWithChance(propQuip, event, genreId, chance)
  }, [propQuip, speakOnChange])

  // Auto-cycle idle quips
  useEffect(() => {
    if (!autoIdle) return
    idleRef.current = setInterval(() => {
      const q = getBuzzQuip('idle')
      setDisplayQuip(q)
      if (speakOnChange) speakWithChance(q, 'idle', null, 1.0)
    }, idleInterval)
    return () => clearInterval(idleRef.current)
  }, [autoIdle, idleInterval, speakOnChange])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: featured ? 16 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: featured ? 16 : 8 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: featured ? 'column' : 'row',
            alignItems: featured ? 'center' : 'flex-start',
            gap: featured ? 14 : 10,
            width: featured ? '100%' : undefined,
          }}
        >
          <BuzzFace size={size ?? (featured ? 88 : 44)} event={event} speaking={speaking} />

          <AnimatePresence mode="wait">
            <motion.div
              key={displayQuip}
              initial={{ opacity: 0, x: featured ? 0 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'relative',
                background: 'rgba(10, 4, 28, 0.92)',
                border: `1px solid rgba(247, 224, 39, ${featured ? '0.5' : '0.35'})`,
                borderRadius: featured ? 10 : 7,
                padding: featured ? '14px 18px' : '8px 12px',
                maxWidth: featured ? 420 : 260,
                flex: featured ? undefined : 1,
              }}
            >
              {/* Label */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: featured ? '0.6rem' : '0.55rem',
                color: 'rgba(247, 224, 39, 0.55)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: featured ? 6 : 4,
              }}>
                ⚡ BUZZ
              </div>
              {/* Quip text */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: featured ? '1rem' : '0.78rem',
                color: '#f7e027',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
              }}>
                {displayQuip}
              </div>
              {/* Connector triangle pointing left toward face (row mode) */}
              {!featured && (
                <div style={{
                  position: 'absolute',
                  left: -7,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '7px solid rgba(247, 224, 39, 0.35)',
                }} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Buzz face — custom image or SVG fallback ─────────────────────────────────

function BuzzFace({ size = 48, event = 'idle', speaking = false }) {
  // If a custom image exists in src/assets/images/buzz/, use it
  if (BUZZ_IMAGE) {
    const ringColor = event === 'correct' ? '#00ff88'
      : event === 'wrong' ? '#ff4455'
      : '#f7e027'
    // Float up-down: faster + bigger amplitude while speaking
    const floatY = speaking ? [0, -12, 0] : [0, -6, 0]
    const floatDuration = speaking ? 0.7 : 2.8
    return (
      <motion.div
        animate={{
          y: floatY,
          ...(event === 'correct' ? { scale: [1, 1.1, 1] } : {}),
          ...(event === 'wrong' ? { rotate: [0, -6, 6, -4, 0] } : {}),
        }}
        transition={{
          y: { duration: floatDuration, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.4 },
          rotate: { duration: 0.45, ease: 'easeInOut' },
        }}
        style={{ flexShrink: 0, position: 'relative' }}
      >
        <img
          src={BUZZ_IMAGE}
          alt="Buzz"
          style={{
            width: size,
            height: size,
            objectFit: 'cover',
            borderRadius: '50%',
            border: `2px solid ${ringColor}`,
            boxShadow: `0 0 ${size * 0.2}px ${ringColor}55`,
            display: 'block',
          }}
        />
        {/* BUZZ nameplate under image */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: Math.max(7, size * 0.12),
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          color: ringColor,
          marginTop: 3,
        }}>
          BUZZ
        </div>
      </motion.div>
    )
  }

  // ── SVG robot face fallback ─────────────────────────────────────────────────
  const eyeColor = event === 'correct' ? '#00ff88'
    : event === 'wrong' ? '#ff4455'
    : '#f7e027'

  const mouthD = event === 'correct'
    ? 'M 18 56 Q 30 66 42 56'
    : event === 'wrong'
    ? 'M 18 60 Q 30 52 42 60'
    : 'M 18 57 Q 30 60 42 57'

  const headShake = event === 'wrong'
    ? { rotate: [0, -6, 6, -4, 4, 0] }
    : event === 'correct'
    ? { scale: [1, 1.08, 1] }
    : {}

  return (
    <motion.div
      animate={headShake}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      style={{ flexShrink: 0 }}
    >
      <svg
        width={size}
        height={Math.round(size * 1.18)}
        viewBox="0 0 60 71"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="bz-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bz-eye-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Antenna */}
        <line x1="30" y1="9" x2="30" y2="1" stroke="#f7e027" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="30" cy="0" r="3" fill="#00d4ff" filter="url(#bz-glow)" />

        {/* Head */}
        <rect x="3" y="9" width="54" height="48" rx="9" fill="#0a041c" stroke="#f7e027" strokeWidth="1.6" />

        {/* Corner circuit decorations */}
        <polyline points="3,22 10,22 10,18" fill="none" stroke="rgba(247,224,39,0.18)" strokeWidth="1" />
        <polyline points="57,22 50,22 50,18" fill="none" stroke="rgba(247,224,39,0.18)" strokeWidth="1" />
        <polyline points="3,44 10,44 10,48" fill="none" stroke="rgba(247,224,39,0.18)" strokeWidth="1" />
        <polyline points="57,44 50,44 50,48" fill="none" stroke="rgba(247,224,39,0.18)" strokeWidth="1" />

        {/* Eyes — outer ring */}
        <circle cx="20" cy="30" r="8.5" fill={eyeColor} opacity="0.85" filter="url(#bz-eye-glow)" />
        <circle cx="40" cy="30" r="8.5" fill={eyeColor} opacity="0.85" filter="url(#bz-eye-glow)" />

        {/* Eyes — inner dark */}
        <circle cx="20" cy="30" r="4.5" fill="#0a041c" />
        <circle cx="40" cy="30" r="4.5" fill="#0a041c" />

        {/* Eyes — pupil highlight */}
        <circle cx="22" cy="28" r="1.5" fill={eyeColor} opacity="0.7" />
        <circle cx="42" cy="28" r="1.5" fill={eyeColor} opacity="0.7" />

        {/* Mouth */}
        <path d={mouthD} stroke={eyeColor} strokeWidth="2.2" fill="none" strokeLinecap="round" filter="url(#bz-glow)" />

        {/* BUZZ nameplate */}
        <rect x="9" y="62" width="42" height="9" rx="3" fill="rgba(247,224,39,0.1)" stroke="rgba(247,224,39,0.25)" strokeWidth="0.8" />
        <text
          x="30" y="69.5"
          textAnchor="middle"
          fill="#f7e027"
          fontFamily="monospace"
          fontSize="7"
          fontWeight="bold"
          letterSpacing="3"
        >
          BUZZ
        </text>
      </svg>
    </motion.div>
  )
}

// ── Compact banner variant for phone screens ──────────────────────────────────

/**
 * BuzzBanner — slim notification-style strip for player phone screens.
 * Shown between rounds, not during active gameplay.
 */
export function BuzzBanner({ quip, event = 'roundEnd', visible = true, speakOnChange = false, speakChance = null, size = 52 }) {
  const { speakWithChance } = useBuzzSpeech()
  const speaking = useBuzzSpeaking()
  const chance = speakChance ?? DEFAULT_CHANCES[event] ?? 1.0
  useEffect(() => {
    if (quip && speakOnChange) speakWithChance(quip, event, null, chance)
  }, [quip, speakOnChange])
  return (
    <AnimatePresence>
      {visible && quip && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(10, 4, 28, 0.9)',
            border: '1px solid rgba(247, 224, 39, 0.35)',
            borderRadius: 10,
            padding: '12px 16px',
            width: '100%',
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <BuzzFace size={size} event={event} speaking={speaking} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              color: 'rgba(247,224,39,0.55)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}>
              ⚡ BUZZ
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.88rem',
              color: '#f7e027',
              lineHeight: 1.45,
            }}>
              {quip}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
