import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { MuteButton } from '../components/ui'

export default function HomeScreen() {
  const setScreen = useStore(s => s.setScreen)

  return (
    <div className="screen" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="home-bg" />

      {/* Floating orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${['rgba(192,132,252,0.15)', 'rgba(248,37,133,0.1)', 'rgba(244,208,63,0.1)'][i % 3]} 0%, transparent 70%)`,
              width: 200 + i * 80,
              height: 200 + i * 80,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
          />
        ))}
      </div>

      {/* Mute button top-right */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <MuteButton />
      </div>

      {/* Main content */}
      <div className="screen-inner center" style={{ position: 'relative', zIndex: 1, justifyContent: 'center', padding: '0 24px' }}>
        <motion.div
          className="col center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ gap: 8, marginBottom: 8 }}
        >
          {/* Logo/lightning bolt */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(244,208,63,0.8))' }}
          >
            ⚡
          </motion.div>

          <div className="buzz-title">BUZZKILL</div>
          <div className="buzz-subtitle">The Party Game That Hurts</div>
        </motion.div>

        <motion.div
          className="col gap-12"
          style={{ width: '100%', maxWidth: 320, marginTop: 16 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.button
            className="btn btn-primary btn-xl btn-block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setScreen('create')}
          >
            🎮 Create Game
          </motion.button>

          <motion.button
            className="btn btn-gold btn-xl btn-block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setScreen('join')}
          >
            🚀 Join Game
          </motion.button>
        </motion.div>

        <motion.div
          className="col center gap-8"
          style={{ marginTop: 24 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="row gap-16" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {['❓ Quiz', '🎨 Draw It', '😂 Joke Off', '🔥 Hot Takes', '⚡ Blitz', '🕵️ Whodunnit'].map(f => (
              <div key={f} className="caption" style={{ color: 'var(--text3)' }}>{f}</div>
            ))}
          </div>
          <div className="caption" style={{ color: 'var(--text3)' }}>
            Up to 10 players · Firebase powered · No download needed
          </div>
        </motion.div>
      </div>
    </div>
  )
}
