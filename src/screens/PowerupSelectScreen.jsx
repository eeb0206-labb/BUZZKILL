import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { db, ref, update } from '../firebase'

const POWERUP_INFO = {
  doublePoints: { icon: '✖️', label: 'Double Points', desc: '2× all points this round', color: '#f4d03f' },
  sneakPeek:    { icon: '🔍', label: 'Sneak Peek',    desc: 'See answer initials ×%n',  color: '#4895ef' },
  steal:        { icon: '🤑', label: 'Steal',          desc: 'Take someone\'s sneak peek', color: '#57cc99' },
  imposter:     { icon: '😈', label: 'Imposter',       desc: 'Force someone to answer ×%n', color: '#e63946' },
  plagiarism:   { icon: '📋', label: 'Plagiarism',     desc: 'Copy a player\'s correct answers', color: '#a855f7' },
  block:        { icon: '🚫', label: 'Block',           desc: 'Silence someone\'s next buzz', color: '#f77f00' },
}

export default function PowerupSelectScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const setScreen = store.setScreen
  const { subscribeToGame, activatePowerupRound, usePowerup, loadFirstQuestion, startLawyers } = useGame()
  const { playPowerupActivate, playPowerupDeactivate } = useSound()

  const [activated, setActivated] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const me = game?.players?.[myId]
  const myPowerups = me?.powerups || {}
  const hasDoublePoints = (myPowerups.doublePoints || 0) > 0
  const isActive = game?.powerupRound?.[myId] || false

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'quiz') {
        // Route draw game types to draw screen instead of quiz
        if (g.currentGenre?.gameType === 'draw') {
          setScreen('draw')
        } else {
          setScreen('quiz-host')
        }
      }
      // Creative rounds that use a custom state name still route via quiz-host → App.jsx routes further
      if (g.state === 'lawyers') {
        setScreen('quiz-host')
      }
    })
    return unsub
  }, [gameCode])

  async function toggleDoublePoints() {
    if (!myId || isActive) return  // one-way — can't undo once spent
    const consumed = await usePowerup(gameCode, myId, 'doublePoints')
    if (!consumed) return
    await activatePowerupRound(gameCode, myId, true)
    setActivated(true)
    playPowerupActivate()
  }

  async function handleStart() {
    if (!isController) return
    setConfirmed(true)
    const gameType = genre?.gameType
    if (gameType === 'lawyers') {
      // Outlandish Lawyers — pick 2 players + statement, set state to 'lawyers'
      await startLawyers(gameCode, game)
    } else {
      await update(ref(db, `games/${gameCode}`), { state: 'quiz', currentQIndex: 0, currentQ: null })
    }
  }

  const genre = game?.currentGenre
  const allPlayers = Object.values(game?.players || {}).filter(p => p.role === 'player')
  const activatedPlayers = Object.entries(game?.powerupRound || {})
    .filter(([, v]) => v)
    .map(([id]) => game?.players?.[id])
    .filter(Boolean)

  // host AND players both see powerups — only game screen is excluded
  const isPlayer = !store.isGameScreen()

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">Round {game?.currentRound || 1}</div>
        <div className="topbar-logo">Before the Round</div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Genre info */}
        {genre && (
          <motion.div
            className="card col center gap-8"
            style={{ background: `${genre.color}11`, borderColor: `${genre.color}44` }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div style={{ fontSize: '3rem' }}>{genre.emoji}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>{genre.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>This round's theme</div>
          </motion.div>
        )}

        {/* Powerup dealt this round */}
        {isPlayer && (() => {
          const dealtKey = game?.roundDealtPowerups?.[myId]
          const info = dealtKey ? POWERUP_INFO[dealtKey] : null
          if (!info) return null
          return (
            <motion.div
              className="card col center gap-8"
              style={{ background: `${info.color}14`, borderColor: `${info.color}55` }}
              initial={{ opacity: 0, scale: 0.75, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.15 }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                🎁 Your powerup this round
              </div>
              <motion.div
                style={{ fontSize: '3rem' }}
                initial={{ scale: 0.4, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.25 }}
              >
                {info.icon}
              </motion.div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: info.color }}>
                {info.label}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text2)', textAlign: 'center' }}>
                {info.desc.replace('%n', '1')}
              </div>
            </motion.div>
          )
        })()}

        {/* Double Points activation */}
        {isPlayer && (hasDoublePoints || isActive) && (
          <motion.div
            className={`powerup-banner ${isActive ? 'active' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>⚡ Double Points Powerup</div>
            {isActive ? (
              <motion.div
                className="btn btn-gold btn-block"
                style={{ cursor: 'default', opacity: 0.95 }}
                initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              >
                ✖️ Double Points ACTIVE ✓
              </motion.div>
            ) : (
              <motion.button
                className="btn btn-ghost btn-block"
                onClick={toggleDoublePoints}
                whileTap={{ scale: 0.96 }}
              >
                ✖️ Activate Double Points
              </motion.button>
            )}
            <motion.p
              style={{ fontSize: '0.8rem', color: isActive ? 'var(--gold)' : 'var(--text3)', marginTop: 8, textAlign: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              {isActive ? 'All your points this round will be doubled! 🎉' : 'Activate once — cannot be undone.'}
            </motion.p>
          </motion.div>
        )}

        {/* Who activated */}
        {activatedPlayers.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--gold)' }}>
              ✖️ Double Points Active
            </div>
            <div className="col gap-6">
              {activatedPlayers.map(p => (
                <div key={p.id} className="row gap-8">
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ marginLeft: 'auto', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>×2</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other powerups info for players */}
        {isPlayer && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Your Powerups</div>
            <div className="col gap-6">
              {Object.entries(POWERUP_INFO).map(([key, info]) => {
                const count = myPowerups[key] || 0
                if (key === 'doublePoints') return null
                if (count === 0) return null
                return (
                  <div key={key} className="row gap-8">
                    <div style={{ fontSize: '1.3rem' }}>{info.icon}</div>
                    <div className="flex-1">
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{info.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>
                        {info.desc.replace('%n', count)}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: info.color, fontSize: '0.9rem', fontWeight: 700 }}>
                      ×{count}
                    </div>
                  </div>
                )
              })}
              {Object.entries(myPowerups).every(([k, v]) => k === 'doublePoints' || v === 0) && (
                <div className="dimmed" style={{ fontSize: '0.85rem' }}>All powerups spent.</div>
              )}
            </div>
          </div>
        )}

        {/* Waiting message for players */}
        {isPlayer && !confirmed && (
          <motion.div
            className="card center"
            style={{ color: 'var(--accent)', padding: 20 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Waiting for host to start the round...</div>
          </motion.div>
        )}

        {/* Start button for controller */}
        {isController && (
          <motion.button
            className="btn btn-green btn-lg btn-block"
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={confirmed}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {confirmed ? (
              <div className="loading-dots"><span /><span /><span /></div>
            ) : '▶ Start Round →'}
          </motion.button>
        )}
      </div>
      <Toast />
    </div>
  )
}
