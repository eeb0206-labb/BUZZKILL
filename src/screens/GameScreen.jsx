// TV/Projector display screen — no controls, just shows the game state
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, TimerRing } from '../components/ui'

export default function GameScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const { subscribeToGame } = useGame()

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, () => {})
    return unsub
  }, [gameCode])

  const players = Object.values(game?.players || {}).filter(p => p.role === 'player')
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const buzzer = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const currentQ = game?.currentQ
  const state = game?.state
  const genre = game?.currentGenre

  return (
    <div className="tv-screen" style={{ padding: 32, gap: 24, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', background: 'linear-gradient(135deg, var(--accent), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚡ BUZZKILL
        </div>
        {genre && (
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', color: genre.color }}>
            {genre.emoji} {genre.name}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text3)' }}>
          Round {game?.currentRound || 1} · Q{(game?.currentQIndex || 0) + 1}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Question */}
        {currentQ && (
          <motion.div
            key={game?.currentQIndex}
            className="card"
            style={{ padding: '32px', textAlign: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="tv-question">{currentQ.q}</div>
            {game?.wrongAnswerers?.length > 0 && currentQ.hint && (
              <motion.div
                className="hint-text"
                style={{ marginTop: 20, fontSize: '1.2rem', textAlign: 'center' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                💡 {currentQ.hint}
              </motion.div>
            )}
            {game?.answerRevealed && (
              <motion.div
                className="answer-text"
                style={{ marginTop: 20, fontSize: '1.5rem', textAlign: 'center' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                ✓ {currentQ.a}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Buzz indicator */}
        <AnimatePresence>
          {buzzedPlayer && (
            <motion.div
              className="buzz-indicator"
              style={{
                borderColor: buzzedPlayer.colorHex,
                background: `${buzzedPlayer.colorHex}11`,
                padding: '20px 24px',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Avatar src={buzzedPlayer.avatar} name={buzzedPlayer.name} colorHex={buzzedPlayer.colorHex} size={64} />
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', color: buzzedPlayer.colorHex }}>
                {buzzedPlayer.name}
              </div>
              <div style={{ fontSize: '1.2rem', color: 'var(--text2)', flex: 1 }}>
                is answering...
                {buzzer.forcedBy && ` (forced by ${game?.players?.[buzzer.forcedBy]?.name})`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wrong answerers */}
        {(game?.wrongAnswerers || []).length > 0 && (
          <div className="card">
            <div className="caption" style={{ marginBottom: 8 }}>Got it wrong:</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {(game.wrongAnswerers || []).map(pid => {
                const p = game?.players?.[pid]
                if (!p) return null
                return (
                  <div key={pid} className="row gap-6" style={{ padding: '6px 12px', background: 'rgba(230,57,70,0.1)', borderRadius: 20 }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={24} />
                    <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="row gap-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {sorted.map((p, i) => (
          <motion.div
            key={p.id}
            style={{
              background: buzzedPlayer?.id === p.id ? `${p.colorHex}22` : 'var(--surface)',
              border: `2px solid ${buzzedPlayer?.id === p.id ? p.colorHex : p.colorHex + '44'}`,
              borderRadius: 16,
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              minWidth: 120,
            }}
            animate={buzzedPlayer?.id === p.id ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {p.avatar ? (
              <img src={p.avatar} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${p.colorHex}` }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: p.colorHex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
                {p.name[0]}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex, fontSize: '1.3rem', fontWeight: 700 }}>
              {p.score || 0}
            </div>
            {game?.powerupRound?.[p.id] && (
              <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>✖️×2</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
