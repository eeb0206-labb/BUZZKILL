import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, TimerRing, Modal, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { db, ref, update } from '../firebase'
import SettingsOverlay from '../components/SettingsOverlay'

function answersMatch(submitted, correct) {
  if (!submitted || !correct) return false
  const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
  const a = norm(submitted)
  const b = norm(correct)
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  return false
}

const POWERUP_INFO = {
  sneakPeek:  { icon: '🔍', label: 'Sneak Peek',  color: '#4895ef' },
  steal:      { icon: '🤑', label: 'Steal',        color: '#57cc99' },
  imposter:   { icon: '😈', label: 'Imposter',     color: '#e63946' },
  plagiarism: { icon: '📋', label: 'Plagiarism',   color: '#a855f7' },
  block:      { icon: '🚫', label: 'Block',         color: '#f77f00' },
}

function getSneakPeek(answer) {
  if (!answer) return '???'
  const words = answer.split(' ').filter(w => w.length > 0)
  if (words.length === 1) {
    // First and last letter
    const w = words[0]
    if (w.length <= 2) return w[0] + '_'
    return w[0] + '_'.repeat(w.length - 2) + w[w.length - 1]
  }
  // Initials of each word
  return words.map(w => w[0].toUpperCase()).join(' ')
}

export default function QuizPlayerScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const setScreen = store.setScreen
  const { subscribeToGame, buzzIn, usePowerup, useSecondLife, blockPlayer, setPlagiarismTarget, markAnswer, stealPowerup } = useGame()
  const { playBuzz, playFartSound, playSecondLife, playPowerupActivate, playTick, playCorrect, playWrong, startMusic } = useSound()

  const [blocked, setBlocked] = useState(null) // reason string
  const [showBlockedReason, setShowBlockedReason] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [sneakResult, setSneakResult] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const timerRef = useRef(null)
  const [powerupModal, setPowerupModal] = useState(null) // 'steal' | 'imposter' | 'plagiarism' | 'block'
  const [targetModal, setTargetModal] = useState(null) // { powerup, onSelect }
  const [ripples, setRipples] = useState([])
  const [myAnswer, setMyAnswer] = useState('')
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const buzzerRef = useRef(null)
  const settings = store.getSettings()
  const isQM = !!settings.questionMaster

  const me = game?.players?.[myId]
  const myPowerups = me?.powerups || {}
  const buzzer = game?.buzzer
  const isBuzzing = buzzer?.playerId === myId
  const someoneBuzzing = !!buzzer
  const wrongAnswerers = game?.wrongAnswerers || []
  const iWasWrong = wrongAnswerers.includes(myId)
  const gameBlocked = game?.blocked?.[myId]
  const isMyTurnForced = buzzer?.playerId === myId && buzzer?.forcedBy

  // Subscribe to game changes
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'final') setScreen('final')
      if (g.state === 'round-pick') setScreen('round-pick')
      if (g.state === 'powerup-select') setScreen('powerup-select')
    })
    return unsub
  }, [gameCode])

  // Reset answer input when question changes
  useEffect(() => {
    setMyAnswer('')
    setAnswerSubmitted(false)
  }, [game?.currentQIndex])

  // No-QM self-marking: player types answer, auto-compare
  const handleSubmitAnswer = useCallback(async () => {
    if (!myAnswer.trim() || answerSubmitted || isQM) return
    setAnswerSubmitted(true)
    const correct = answersMatch(myAnswer, game?.currentQ?.a)
    if (correct) {
      playCorrect?.()
    } else {
      playWrong?.()
    }
    await markAnswer(gameCode, game, correct)
  }, [myAnswer, answerSubmitted, isQM, game, gameCode, markAnswer])

  // Answer timer when I'm buzzing
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!isBuzzing || !settings.timers?.quizAnswer) return

    const total = settings.timers.quizAnswer
    setTimerSeconds(total)
    setTimerTotal(total)

    timerRef.current = setInterval(() => {
      setTimerSeconds(t => {
        if (t <= 2) playTick(true)
        else if (t % 5 === 0) playTick(false)
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isBuzzing, buzzer?.timestamp])

  // Handle buzz attempt
  const handleBuzzAttempt = useCallback((e) => {
    e.preventDefault()
    const rect = buzzerRef.current?.getBoundingClientRect()
    if (rect) {
      const touch = e.touches?.[0] || e
      const ripple = {
        id: Date.now(),
        x: ((touch.clientX - rect.left) / rect.width) * 100,
        y: ((touch.clientY - rect.top) / rect.height) * 100,
      }
      setRipples(r => [...r, ripple])
      setTimeout(() => setRipples(r => r.filter(rr => rr.id !== ripple.id)), 600)
    }

    // Check if blocked
    if (gameBlocked) {
      const blocker = game?.players?.[gameBlocked]
      playFartSound()
      setBlocked(`You're blocked by ${blocker?.name || 'someone'} 🚫`)
      setShowBlockedReason(true)
      setTimeout(() => setShowBlockedReason(false), 3000)
      // Clear the block
      const up = {}
      up[`games/${gameCode}/blocked/${myId}`] = null
      update(ref(db), up)
      return
    }

    if (iWasWrong) {
      playFartSound()
      setBlocked('You already answered this one! 💀')
      setShowBlockedReason(true)
      setTimeout(() => setShowBlockedReason(false), 2000)
      return
    }

    if (someoneBuzzing && !isBuzzing) {
      const other = game?.players?.[buzzer.playerId]
      playFartSound()
      setBlocked(`${other?.name || 'Someone'} is answering... `)
      setShowBlockedReason(true)
      setTimeout(() => setShowBlockedReason(false), 2500)
      return
    }

    if (!someoneBuzzing) {
      // Buzz in!
      playBuzz(me?.colorId || 'blue')
      buzzIn(gameCode, myId, me?.colorId)
    }
  }, [gameBlocked, iWasWrong, someoneBuzzing, isBuzzing, me, game, gameCode, myId])

  // Use Second Life
  async function handleSecondLife() {
    playSecondLife()
    await useSecondLife(gameCode, myId)
    setShowBlockedReason(false)
    setBlocked(null)
    playBuzz(me?.colorId || 'blue')
    await buzzIn(gameCode, myId, me?.colorId)
  }

  // Sneak peek
  async function handleSneakPeek() {
    const success = await usePowerup(gameCode, myId, 'sneakPeek')
    if (!success) { store.setToast({ message: 'No Sneak Peeks left!', icon: '🔍' }); return }
    const answer = game?.currentQ?.a || '???'
    setSneakResult(getSneakPeek(answer))
    setTimeout(() => setSneakResult(null), 10000)
  }

  // Target picker for powerups
  function openTargetPicker(powerupKey, onSelect) {
    setTargetModal({ powerupKey, onSelect })
  }

  async function handleBlock() {
    openTargetPicker('block', async (targetId) => {
      const target = game?.players?.[targetId]
      const success = await blockPlayer(gameCode, myId, targetId)
      if (success) {
        store.setToast({ message: `${target?.name} will be blocked next buzz! 🚫`, icon: '✓' })
      }
    })
  }

  async function handlePlagiarism() {
    openTargetPicker('plagiarism', async (targetId) => {
      const target = game?.players?.[targetId]
      const success = await setPlagiarismTarget(gameCode, myId, targetId)
      if (success) {
        store.setToast({ message: `You'll copy ${target?.name}'s correct answers this round! 📋`, icon: '✓' })
      }
    })
  }

  async function handleImposter(targetId) {
    const target = game?.players?.[targetId]
    const ok = await usePowerup(gameCode, myId, 'imposter')
    if (ok) {
      await update(ref(db, `games/${gameCode}`), {
        buzzer: { playerId: targetId, timestamp: Date.now(), forcedBy: myId, colorId: target?.colorId || 'red' },
        questionRevealed: true,
      })
      store.setToast({ message: `${target?.name} must answer! 😈`, icon: '😈' })
    } else {
      store.setToast({ message: 'No Imposter uses left!', icon: '😈' })
    }
  }

  const [stealTargetModal, setStealTargetModal] = useState(null) // targetId waiting for powerup pick
  const [stealPowerupModal, setStealPowerupModal] = useState(null) // targetId → pick which powerup

  async function handleSteal() {
    openTargetPicker('steal', (targetId) => {
      setStealPowerupModal(targetId)
    })
  }

  async function executeSteal(targetId, powerupKey) {
    const target = game?.players?.[targetId]
    const ok = await stealPowerup(gameCode, myId, targetId, powerupKey)
    if (ok) {
      store.setToast({ message: `Stole ${POWERUP_INFO[powerupKey]?.icon} from ${target?.name}! 🤑`, icon: '✓' })
    } else {
      store.setToast({ message: 'Steal failed!', icon: '⚠️' })
    }
    setStealPowerupModal(null)
  }

  const myColor = me?.colorHex || '#a855f7'
  const hasDoublePoints = game?.powerupRound?.[myId]
  const otherPlayers = Object.values(game?.players || {}).filter(p => p.id !== myId && p.role !== 'gamescreen')

  return (
    <div className="screen">
      {/* Header */}
      <div className="topbar">
        <div className="row gap-8">
          <div className="round-badge">
            {game?.currentGenre?.emoji} Q{(game?.currentQIndex || 0) + 1}/{settings.questionsPerRound || 8}
          </div>
          {hasDoublePoints && <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>✖️×2</div>}
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: myColor }}>{me?.name}</div>
        <div className="row gap-8">
          <div style={{ fontFamily: 'var(--font-mono)', color: myColor, fontWeight: 700 }}>{me?.score || 0}</div>
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      {/* Blocked overlay */}
      <AnimatePresence>
        {showBlockedReason && blocked && blocked !== 'second-life' && (
          <motion.div
            className="blocked-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBlockedReason(false)}
          >
            <motion.div className="blocked-emoji" animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>💨</motion.div>
            <div className="blocked-reason">{blocked}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Tap to dismiss</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forced to answer notification */}
      <AnimatePresence>
        {isMyTurnForced && (
          <motion.div
            className="blocked-overlay"
            style={{ background: 'rgba(230,57,70,0.92)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{ fontSize: '3.5rem' }}
              animate={{ rotate: [0,-10,10,-10,10,0], scale: [1,1.1,1] }}
              transition={{ duration: 0.6 }}
            >😈</motion.div>
            <div className="blocked-reason" style={{ color: 'white' }}>You've been forced to answer!</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
              by {game?.players?.[buzzer?.forcedBy]?.name || 'someone'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="screen-inner" style={{ gap: 12 }}>
        {/* Question (if revealed) */}
        <AnimatePresence>
          {game?.currentQ && (
            <motion.div
              key={game?.currentQIndex}
              className="question-card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ borderColor: isBuzzing ? myColor : undefined }}
            >
              <div className="question-text" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.3rem)' }}>
                {game.currentQ.q}
              </div>
              {/* Hint appears after someone gets it wrong */}
              {wrongAnswerers.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700 }}>
                  🔥 Pot: {100 + (game?.potAmount || 0)} pts
                </div>
              )}
              {wrongAnswerers.length > 0 && game.currentQ.hint && (
                <motion.div
                  className="hint-text"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  💡 {game.currentQ.hint}
                </motion.div>
              )}
              {/* Answer shown to no one on player screen */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sneak peek result */}
        <AnimatePresence>
          {sneakResult && (
            <motion.div
              className="sneak-peek-result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              🔍 {sneakResult}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buzzer */}
        <div className="buzzer-wrap" style={{ flex: 1, minHeight: 200 }}>
          <motion.button
            ref={buzzerRef}
            className={`buzzer ${(someoneBuzzing && !isBuzzing) || iWasWrong ? 'buzzer-disabled' : ''} ${isBuzzing ? 'buzzer-glow' : ''}`}
            style={{
              background: iWasWrong
                ? 'radial-gradient(circle at 35% 35%, #555, #333)'
                : `radial-gradient(circle at 35% 35%, ${myColor}ee, ${myColor}99)`,
              '--player-color': myColor,
              boxShadow: isBuzzing
                ? `0 0 40px ${myColor}99, 0 0 80px ${myColor}44, inset 0 2px 0 rgba(255,255,255,0.25)`
                : iWasWrong
                ? 'none'
                : `0 8px 24px ${myColor}44, inset 0 2px 0 rgba(255,255,255,0.2)`,
            }}
            whileTap={!someoneBuzzing && !iWasWrong ? { scale: 0.91, y: 4 } : {}}
            onMouseDown={handleBuzzAttempt}
            onTouchStart={handleBuzzAttempt}
          >
            {ripples.map(r => (
              <div
                key={r.id}
                className="buzzer-ripple"
                style={{ left: `${r.x}%`, top: `${r.y}%` }}
              />
            ))}

            <AnimatePresence mode="wait">
              {isBuzzing ? (
                <motion.div key="buzzing" className="col center" style={{ gap: 6 }}
                  initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                  <motion.div
                    style={{ fontSize: '2.5rem' }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 0.7 }}
                  >{isQM ? '🎤' : '✏️'}</motion.div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em' }}>{isQM ? 'ANSWER!' : 'TYPE IT!'}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{me?.name}</div>
                  {timerSeconds > 0 && (
                    <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{timerSeconds}s</div>
                  )}
                </motion.div>
              ) : someoneBuzzing ? (
                <motion.div key="other" className="col center" style={{ gap: 6 }}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                  <div style={{ fontSize: '2rem' }}>🔕</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{game?.players?.[buzzer?.playerId]?.name || '...'}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>is answering</div>
                </motion.div>
              ) : iWasWrong ? (
                <motion.div key="wrong" className="col center" style={{ gap: 6 }}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <div style={{ fontSize: '2.5rem' }}>✗</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>OUT</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>Already answered</div>
                </motion.div>
              ) : (
                <motion.div key="ready" className="col center" style={{ gap: 6 }}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <motion.div
                    style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '0.05em', color: 'white' }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                  >BUZZ!</motion.div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 600 }}>{me?.name}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* No-QM: answer input when this player buzzed */}
        <AnimatePresence>
          {isBuzzing && !isQM && (
            <motion.div
              className="col gap-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <input
                className="input"
                placeholder="Type your answer..."
                value={myAnswer}
                onChange={e => setMyAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer()}
                autoFocus
                style={{ fontSize: '1.1rem', textAlign: 'center' }}
              />
              <button
                className="btn btn-gold btn-lg"
                onClick={handleSubmitAnswer}
                disabled={!myAnswer.trim() || answerSubmitted}
              >
                Submit Answer →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Powerups panel */}
        {Object.values(myPowerups).some(v => v > 0) && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.85rem' }}>Your Powerups</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Sneak Peek */}
              {(myPowerups.sneakPeek || 0) > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ borderColor: '#4895ef', color: '#4895ef' }}
                  onClick={handleSneakPeek}>
                  🔍 Peek ×{myPowerups.sneakPeek}
                </button>
              )}

              {/* Block */}
              {(myPowerups.block || 0) > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ borderColor: '#f77f00', color: '#f77f00' }}
                  onClick={handleBlock}>
                  🚫 Block ×{myPowerups.block}
                </button>
              )}

              {/* Plagiarism */}
              {(myPowerups.plagiarism || 0) > 0 && !game?.plagiarismTargets?.[myId] && (
                <button className="btn btn-ghost btn-sm" style={{ borderColor: '#a855f7', color: '#a855f7' }}
                  onClick={handlePlagiarism}>
                  📋 Copy ×{myPowerups.plagiarism}
                </button>
              )}
              {game?.plagiarismTargets?.[myId] && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                  📋 Copying {game?.players?.[game.plagiarismTargets[myId]]?.name}
                </div>
              )}

              {/* Imposter */}
              {(myPowerups.imposter || 0) > 0 && !someoneBuzzing && (
                <button className="btn btn-ghost btn-sm" style={{ borderColor: '#e63946', color: '#e63946' }}
                  onClick={() => openTargetPicker('imposter', handleImposter)}>
                  😈 Force ×{myPowerups.imposter}
                </button>
              )}

              {/* Steal */}
              {(myPowerups.steal || 0) > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ borderColor: '#57cc99', color: '#57cc99' }}
                  onClick={handleSteal}>
                  🤑 Steal ×{myPowerups.steal}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mini scoreboard */}
        <div className="row gap-6" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {[...Object.values(game?.players || {})].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, i) => (
            <div key={p.id} className="row gap-4" style={{
              padding: '4px 10px', borderRadius: 20, background: p.id === myId ? `${p.colorHex}22` : 'var(--surface)',
              border: `1px solid ${p.id === myId ? p.colorHex : 'var(--border)'}`,
              fontSize: '0.8rem',
            }}>
              <span style={{ fontWeight: p.id === myId ? 700 : 400 }}>{p.name.split(' ')[0]}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: p.colorHex }}>{p.score || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target picker modal */}
      <Modal
        show={!!targetModal}
        onClose={() => setTargetModal(null)}
        title="Choose a player"
      >
        <div className="col gap-8">
          {otherPlayers.map(p => (
            <motion.div
              key={p.id}
              className="player-row"
              style={{ cursor: 'pointer' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                targetModal?.onSelect?.(p.id)
                setTargetModal(null)
              }}
            >
              <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={40} />
              <div className="flex-1" style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex }}>{p.score || 0}</div>
            </motion.div>
          ))}
        </div>
      </Modal>

      {/* Steal powerup picker — choose WHICH powerup to steal from target */}
      <Modal
        show={!!stealPowerupModal}
        onClose={() => setStealPowerupModal(null)}
        title="🤑 Steal which powerup?"
      >
        <div className="col gap-8">
          {stealPowerupModal && Object.entries(game?.players?.[stealPowerupModal]?.powerups || {})
            .filter(([key, count]) => key !== 'doublePoints' && count > 0)
            .map(([key, count]) => {
              const info = POWERUP_INFO[key]
              if (!info) return null
              return (
                <motion.div
                  key={key}
                  className="player-row"
                  style={{ cursor: 'pointer', borderColor: info.color }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => executeSteal(stealPowerupModal, key)}
                >
                  <div style={{ fontSize: '1.5rem' }}>{info.icon}</div>
                  <div className="flex-1">
                    <div style={{ fontWeight: 700, color: info.color }}>{info.label}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: info.color }}>×{count}</div>
                </motion.div>
              )
            })}
          {stealPowerupModal && Object.entries(game?.players?.[stealPowerupModal]?.powerups || {})
            .filter(([key, count]) => key !== 'doublePoints' && count > 0).length === 0 && (
            <div style={{ color: 'var(--text3)', fontSize: '0.9rem', textAlign: 'center', padding: 16 }}>
              This player has no powerups to steal!
            </div>
          )}
        </div>
      </Modal>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
