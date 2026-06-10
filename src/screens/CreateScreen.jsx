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
      await createGame(hostName.trim(), {
        aiHost: true,
        hasScreen: false,
        questionMaster: false,
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
        <motion.div
          className="col gap-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.6rem', lineHeight: 1, marginBottom: 10 }}>🎮</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', marginBottom: 4 }}>
              What's your name?
            </div>
            <div style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>You'll be the host — configure settings in the lobby</div>
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

        <motion.button
          className="btn btn-primary btn-lg btn-block"
          whileTap={{ scale: 0.97 }}
          onClick={handleCreate}
          disabled={loading || !hostName.trim()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
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
