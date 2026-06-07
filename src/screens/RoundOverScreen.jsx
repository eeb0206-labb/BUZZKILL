import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Podium, Confetti, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'

export default function RoundOverScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const setScreen = store.setScreen
  const { subscribeToGame, startNextRound, triggerRedemptionArc } = useGame()
  const [redemptionLoading, setRedemptionLoading] = useState(false)
  const { playRoundOver } = useSound()

  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    playRoundOver()
    const t = setTimeout(() => setShowConfetti(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-pick') setScreen('round-pick')
      if (g.state === 'final') setScreen('final')
    })
    return unsub
  }, [gameCode])

  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const settings = store.getSettings()
  const currentRound = game?.currentRound || 1
  const totalRounds = settings.totalRounds || 5
  const isLastRound = currentRound >= totalRounds

  // Round scores this round
  const roundScores = [...players].sort((a, b) => (b.roundScore || 0) - (a.roundScore || 0))

  // This round's MVP (most points scored this round)
  const mvp = roundScores[0]
  const mvpDelta = mvp?.roundScore || 0

  // Check if redemption arc is possible (any players have wrong answers)
  const hasWrongAnswers = Object.values(game?.playerWrongAnswers || {}).some(qs => qs?.length > 0)

  async function handleNext() {
    await startNextRound(gameCode, game)
  }

  async function handleRedemption() {
    setRedemptionLoading(true)
    const triggered = await triggerRedemptionArc(gameCode, game)
    if (triggered) store.setScreen('quiz-host')
    else await startNextRound(gameCode, game)
    setRedemptionLoading(false)
  }

  return (
    <div className="screen">
      <Confetti active={showConfetti} />

      <div className="topbar">
        <div className="round-badge">Round {currentRound} Over</div>
        <div className="topbar-logo">{isLastRound ? 'Final Round!' : `Round ${currentRound}/${totalRounds}`}</div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Overall podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', textAlign: 'center', marginBottom: 12 }}>
            🏆 Overall Standings
          </div>
          <Podium players={players} showConfetti={showConfetti} />
        </motion.div>

        {/* This round's scores */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12 }}>
            Round {currentRound} Scores
          </div>
          <div className="col gap-8">
            {roundScores.map((p, i) => (
              <motion.div
                key={p.id}
                className="row gap-10"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text3)', width: 20 }}>
                  #{i + 1}
                </div>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={36} />
                <div className="flex-1" style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: (p.roundScore || 0) >= 0 ? 'var(--green)' : 'var(--red)',
                  }}>
                    {(p.roundScore || 0) >= 0 ? '+' : ''}{p.roundScore || 0}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                    Total: {p.score || 0}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* MVP */}
        {mvp && mvpDelta > 0 && (
          <motion.div
            className="card col center gap-6"
            style={{ background: 'rgba(244,208,63,0.06)', borderColor: 'rgba(244,208,63,0.3)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Round MVP</div>
            <Avatar src={mvp.avatar} name={mvp.name} colorHex={mvp.colorHex} size={56} />
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem' }}>{mvp.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: '1.1rem' }}>+{mvpDelta} this round</div>
          </motion.div>
        )}

        {/* Next round / Redemption Arc buttons */}
        {isController && (
          <motion.div className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            {/* Redemption Arc — only available on last round if anyone got questions wrong */}
            {isLastRound && hasWrongAnswers && (
              <motion.button
                className="btn btn-gold btn-lg btn-block"
                whileTap={{ scale: 0.97 }}
                onClick={handleRedemption}
                disabled={redemptionLoading}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.85, type: 'spring', stiffness: 300, damping: 22 }}
              >
                {redemptionLoading ? <div className="loading-dots"><span /><span /><span /></div>
                  : '⚡ Redemption Arc — 1.25× points!'}
              </motion.button>
            )}
            <motion.button
              className={`btn btn-lg btn-block ${isLastRound ? 'btn-ghost' : 'btn-primary'}`}
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
            >
              {isLastRound ? '🏆 Skip to Final Results' : `Next Round →`}
            </motion.button>
          </motion.div>
        )}

        {!isController && (
          <motion.div
            className="card center"
            style={{ color: 'var(--accent)', fontSize: '0.9rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ marginTop: 8 }}>Waiting for host...</div>
          </motion.div>
        )}
      </div>
      <Toast />
    </div>
  )
}
