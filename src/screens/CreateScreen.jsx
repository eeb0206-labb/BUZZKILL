import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Toast, MuteButton } from '../components/ui'

export default function CreateScreen() {
  const setScreen = useStore(s => s.setScreen)
  const setToast = useStore(s => s.setToast)
  const { createGame } = useGame()
  const [hostName, setHostName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!hostName.trim()) {
      setToast({ message: 'Enter your name first!', icon: '👤' })
      return
    }
    setLoading(true)
    try {
      await createGame(hostName.trim())
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

      <div className="screen-inner" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <motion.div
          className="col gap-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: 12 }}>🎮</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', marginBottom: 6 }}>
              What's your name?
            </div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>You'll be the host</div>
          </div>

          <input
            className="input"
            style={{ fontSize: '1.3rem', padding: '16px 20px', textAlign: 'center' }}
            placeholder="Your name"
            value={hostName}
            onChange={e => setHostName(e.target.value)}
            maxLength={20}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />

          <motion.button
            className="btn btn-primary btn-lg btn-block"
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            disabled={loading || !hostName.trim()}
            style={{ fontSize: '1.1rem', padding: '16px' }}
          >
            {loading
              ? <div className="loading-dots"><span /><span /><span /></div>
              : 'Create Lobby →'
            }
          </motion.button>
        </motion.div>
      </div>
      <Toast />
    </div>
  )
}
