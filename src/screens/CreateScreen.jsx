import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Toast, MuteButton } from '../components/ui'

const MODES = [
  {
    id: 'phone-buzz',
    aiHost: true,
    hasScreen: false,
    icon: '📱',
    title: 'Phones Only',
    sub: '⚡ Buzz hosts',
    desc: 'Buzz runs everything automatically. No big screen needed. Great for any group size.',
    recommended: false,
  },
  {
    id: 'screen-buzz',
    aiHost: true,
    hasScreen: true,
    icon: '📺',
    title: 'Big Screen',
    sub: '⚡ Buzz hosts',
    desc: 'Full Jackbox-style experience. Buzz hosts on the TV while everyone plays on their phones.',
    recommended: true,
  },
  {
    id: 'phone-qm',
    aiHost: false,
    hasScreen: false,
    icon: '📱',
    title: 'Phones Only',
    sub: '🎤 Question Master',
    desc: 'One player is the Question Master and judges answers. Classic quiz night format.',
    recommended: false,
  },
  {
    id: 'screen-qm',
    aiHost: false,
    hasScreen: true,
    icon: '📺',
    title: 'Big Screen',
    sub: '🎤 Question Master',
    desc: 'TV shows the game, a human QM judges. Best for a proper pub quiz vibe.',
    recommended: false,
  },
]

export default function CreateScreen() {
  const setScreen = useStore(s => s.setScreen)
  const setToast = useStore(s => s.setToast)
  const { createGame } = useGame()
  const [hostName, setHostName] = useState('')
  const [selectedMode, setSelectedMode] = useState('screen-buzz')
  const [loading, setLoading] = useState(false)

  const mode = MODES.find(m => m.id === selectedMode) || MODES[1]

  async function handleCreate() {
    if (!hostName.trim()) {
      setToast({ message: 'Enter your name first!', icon: '👤' })
      return
    }
    setLoading(true)
    try {
      await createGame(hostName.trim(), {
        aiHost: mode.aiHost,
        hasScreen: mode.hasScreen,
        questionMaster: !mode.aiHost,
      })
      setScreen('lobby')
    } catch {
      setToast({ message: 'Failed to create game. Check your connection.', icon: '❌' })
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('home')}>← Back</button>
        <div className="topbar-logo">New Game</div>
        <MuteButton />
      </div>

      <div className="screen-inner" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 32 }}>
        {/* Name */}
        <motion.div
          className="col gap-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.6rem', lineHeight: 1, marginBottom: 10 }}>🎮</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', marginBottom: 4 }}>
              What's your name?
            </div>
            <div style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>You'll be the host</div>
          </div>

          <input
            className="input"
            style={{ fontSize: '1.2rem', padding: '14px 18px', textAlign: 'center' }}
            placeholder="Your name"
            value={hostName}
            onChange={e => setHostName(e.target.value)}
            maxLength={20}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </motion.div>

        {/* Game mode selection */}
        <motion.div
          className="col gap-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: '0.9rem',
            color: 'var(--text2)',
            textAlign: 'center',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Choose your setup
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {MODES.map((m, i) => {
              const active = selectedMode === m.id
              return (
                <motion.button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    padding: '14px 14px 12px',
                    background: active
                      ? 'rgba(192, 132, 252, 0.14)'
                      : 'var(--surface)',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  {m.recommended && (
                    <div style={{
                      position: 'absolute',
                      top: -1,
                      right: -1,
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: '0.55rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '2px 7px',
                      borderRadius: '0 10px 0 6px',
                    }}>
                      BEST
                    </div>
                  )}

                  <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{m.icon}</div>

                  <div style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: '0.85rem',
                    color: active ? 'var(--accent)' : 'var(--text)',
                    lineHeight: 1.2,
                  }}>
                    {m.title}
                  </div>

                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: active ? '#f7e027' : 'var(--text3)',
                    fontWeight: 600,
                  }}>
                    {m.sub}
                  </div>

                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text3)',
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}>
                    {m.desc}
                  </div>

                  {/* Tick */}
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Create button */}
        <motion.button
          className="btn btn-primary btn-lg btn-block"
          whileTap={{ scale: 0.97 }}
          onClick={handleCreate}
          disabled={loading || !hostName.trim()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ fontSize: '1.05rem', padding: '15px' }}
        >
          {loading
            ? <div className="loading-dots"><span /><span /><span /></div>
            : 'Create Lobby →'
          }
        </motion.button>
      </div>
      <Toast />
    </div>
  )
}
