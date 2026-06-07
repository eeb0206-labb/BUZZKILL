import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Podium, Confetti, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'

export default function FinalScreen() {
  const store = useStore()
  const { game, myId } = { game: store.game, myId: store.myId }
  const setScreen = store.setScreen
  const { playVictory, stopMusic } = useSound()

  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    stopMusic()
    playVictory()
    const t = setTimeout(() => setShowConfetti(false), 6000)
    return () => clearTimeout(t)
  }, [])

  const players = Object.values(game?.players || {}).filter(p => p.role === 'player')
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winner = sorted[0]
  const me = players.find(p => p.id === myId)
  const myRank = sorted.findIndex(p => p.id === myId) + 1

  function handleRestart() {
    store.setGame(null)
    store.setGameCode(null)
    store.setMyId(null)
    setScreen('home')
  }

  const RANK_MESSAGES = [
    "🏆 WINNER! You absolutely destroyed it!",
    "🥈 So close! Brilliant effort.",
    "🥉 Respectable. Very respectable.",
    "4th. You tried. That's what matters.",
  ]

  return (
    <div className="screen">
      <Confetti active={showConfetti} />

      <div className="topbar">
        <div />
        <div className="topbar-logo">Game Over!</div>
        <MuteButton />
      </div>

      <div className="screen-inner center">
        {/* Winner announcement */}
        {winner && (
          <motion.div
            className="col center gap-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.3 }}
          >
            <motion.div
              style={{ fontSize: '5rem', filter: 'drop-shadow(0 0 30px rgba(244,208,63,0.8))' }}
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              🏆
            </motion.div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', color: 'var(--gold)', textAlign: 'center' }}>
              {winner.name} wins!
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', color: 'var(--gold)' }}>
              {winner.score} points
            </div>
          </motion.div>
        )}

        {/* Podium */}
        <motion.div
          style={{ width: '100%' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Podium players={players} />
        </motion.div>

        {/* My rank message */}
        {me && (
          <motion.div
            className="card col center gap-6"
            style={{
              background: myRank === 1 ? 'rgba(244,208,63,0.08)' : 'var(--surface)',
              borderColor: myRank === 1 ? 'rgba(244,208,63,0.3)' : 'var(--border)',
              width: '100%',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              {RANK_MESSAGES[Math.min(myRank - 1, RANK_MESSAGES.length - 1)]}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              You finished #{myRank} with {me.score} points
            </div>
          </motion.div>
        )}

        {/* Full leaderboard */}
        <motion.div
          className="card col gap-8"
          style={{ width: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div style={{ fontWeight: 700 }}>Final Leaderboard</div>
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              className="row gap-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + i * 0.08 }}
            >
              <div style={{
                fontFamily: 'var(--font-head)',
                fontSize: '1.2rem',
                width: 32,
                textAlign: 'center',
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </div>
              <div className="flex-1" style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex || 'var(--text)', fontWeight: 700 }}>
                {p.score || 0} pts
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Play again */}
        <motion.div
          className="row gap-12"
          style={{ width: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.button
            className="btn btn-primary btn-lg flex-1"
            whileTap={{ scale: 0.97 }}
            onClick={handleRestart}
          >
            🎮 Play Again
          </motion.button>
        </motion.div>
      </div>
      <Toast />
    </div>
  )
}
