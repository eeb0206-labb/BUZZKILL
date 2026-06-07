/**
 * RedemptionArcScreen — re-asks questions that players got wrong during the game.
 *
 * - Questions come from game.redemptionQuestions (set by triggerRedemptionArc)
 * - Points: 125 per correct answer (1.25× multiplier)
 * - Visual callout showing which player(s) originally got this question wrong
 * - Same buzzer flow as QuizHostScreen
 */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { db, ref, update } from '../firebase'
import SettingsOverlay from '../components/SettingsOverlay'

function answersMatch(submitted, correct) {
  if (!submitted || !correct) return false
  const stopWords = new Set(['the','a','an','of','in','at','for','to','and','or','is','was'])
  const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
  const strip = s => s.split(' ').filter(w => w && !stopWords.has(w)).join(' ')
  const a = norm(submitted); const b = norm(correct)
  if (a === b || a.includes(b) || b.includes(a)) return true
  const as = strip(a); const bs = strip(b)
  if (as && bs && (as === bs || as.includes(bs) || bs.includes(as))) return true
  const bWords = bs.split(' ').filter(w => w.length > 2)
  return bWords.length >= 2 && bWords.every(w => as.includes(w))
}

export default function RedemptionArcScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const isQM = !!store.getSettings().questionMaster
  const { subscribeToGame, buzzIn, clearBuzzer, markAnswer } = useGame()
  const { playCorrect, playWrong, playBuzz, playSkip, startMusic, stopMusic, undimMusic } = useSound()

  const [myAnswer, setMyAnswer] = useState('')
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ripples, setRipples] = useState([])
  const [redemptionIdx, setRedemptionIdx] = useState(0)
  const buzzerRef = useRef(null)
  const autoAdvRef = useRef(false)

  const questions = game?.redemptionQuestions || []
  const currentQ = questions[redemptionIdx] || null
  const totalQ = questions.length
  const buzzer = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const wrongAnswerers = game?.wrongAnswerers || []
  const isBuzzing = buzzer?.playerId === myId
  const someoneBuzzing = !!buzzer
  const me = game?.players?.[myId]
  const myColor = me?.colorHex || '#f4d03f'
  const iWasWrong = wrongAnswerers.includes(myId)
  const allParticipants = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')

  // Who originally got this question wrong
  const originallyWrong = Object.entries(game?.playerWrongAnswers || {})
    .filter(([, qs]) => qs?.some(q => q.q === currentQ?.q))
    .map(([pid]) => game?.players?.[pid])
    .filter(Boolean)

  // ── Reset on question change ──────────────────────────────────────────────
  useEffect(() => {
    setMyAnswer('')
    setAnswerSubmitted(false)
    autoAdvRef.current = false
  }, [redemptionIdx])

  // ── Keep local idx in sync with Firebase qIndex ───────────────────────────
  useEffect(() => {
    // Use currentQIndex to track which redemption question we're on
    setRedemptionIdx(game?.currentQIndex || 0)
  }, [game?.currentQIndex])

  // ── Subscribe ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, g => {
      if (g.state === 'final') store.setScreen('final')
      if (g.state === 'lobby') store.setScreen('lobby')
    })
    return unsub
  }, [gameCode])

  // ── Music ─────────────────────────────────────────────────────────────────
  useEffect(() => { startMusic(0.04); return () => stopMusic() }, [])

  // ── Auto-advance: correct ─────────────────────────────────────────────────
  useEffect(() => {
    if (isQM) return
    if (!game?.answerRevealed || game?.buzzer) return
    if (autoAdvRef.current) return
    autoAdvRef.current = true
    setTimeout(() => { advanceRedemption(); autoAdvRef.current = false }, 1500)
  }, [isQM, game?.answerRevealed, game?.buzzer])

  // ── Auto-advance: all wrong ────────────────────────────────────────────────
  useEffect(() => {
    if (!isController || game?.buzzer || game?.answerRevealed) return
    if (wrongAnswerers.length < allParticipants.length || allParticipants.length === 0) return
    if (autoAdvRef.current) return
    autoAdvRef.current = true
    setTimeout(() => { advanceRedemption(); autoAdvRef.current = false }, 2000)
    return () => { autoAdvRef.current = false }
  }, [wrongAnswerers.length, allParticipants.length, game?.buzzer, game?.answerRevealed, isController])

  async function advanceRedemption() {
    const nextIdx = (game?.currentQIndex || 0) + 1
    if (nextIdx >= totalQ) {
      await update(ref(db, `games/${gameCode}`), { state: 'final' })
    } else {
      await update(ref(db, `games/${gameCode}`), {
        currentQIndex: nextIdx,
        currentQ: questions[nextIdx],
        wrongAnswerers: [],
        buzzer: null,
        answerRevealed: false,
        questionRevealed: true,
      })
    }
  }

  // ── QM marking ────────────────────────────────────────────────────────────
  async function handleMark(correct) {
    // Redemption uses 125 points per correct (overriding the 100 default)
    // We'll write it directly rather than using markAnswer which does 100
    const buzzerId = game?.buzzer?.playerId
    if (!buzzerId) return
    const player = game?.players?.[buzzerId]
    if (!player) return

    const updates = {}
    const delta = correct ? 125 : -25
    updates[`games/${gameCode}/players/${buzzerId}/score`] = (player.score || 0) + delta
    updates[`games/${gameCode}/players/${buzzerId}/roundScore`] = (player.roundScore || 0) + delta
    if (!correct) {
      updates[`games/${gameCode}/wrongAnswerers`] = [...wrongAnswerers, buzzerId]
    } else {
      updates[`games/${gameCode}/wrongAnswerers`] = []
      updates[`games/${gameCode}/answerRevealed`] = true
    }
    updates[`games/${gameCode}/buzzer`] = null
    await update(ref(db), updates)

    if (correct) { playCorrect(); undimMusic(); setTimeout(() => advanceRedemption(), 1200) }
    else { playWrong(); undimMusic() }
  }

  // ── Buzzer ────────────────────────────────────────────────────────────────
  const handleBuzz = useCallback((e) => {
    e?.preventDefault()
    if (isQM) return
    const rect = buzzerRef.current?.getBoundingClientRect()
    if (rect) {
      const touch = e?.touches?.[0] || e
      const ripple = { id: Date.now(), x: ((touch.clientX - rect.left) / rect.width) * 100, y: ((touch.clientY - rect.top) / rect.height) * 100 }
      setRipples(r => [...r, ripple])
      setTimeout(() => setRipples(r => r.filter(rr => rr.id !== ripple.id)), 600)
    }
    if (iWasWrong || (someoneBuzzing && !isBuzzing)) return
    if (!someoneBuzzing) { playBuzz(me?.colorId || 'yellow'); buzzIn(gameCode, myId, me?.colorId) }
  }, [isQM, iWasWrong, someoneBuzzing, isBuzzing, me, gameCode, myId])

  async function handleSubmitAnswer() {
    if (!myAnswer.trim() || answerSubmitted) return
    setAnswerSubmitted(true)
    const correct = answersMatch(myAnswer, currentQ?.a)
    const buzzerId = myId
    const player = me
    if (!player) return
    const delta = correct ? 125 : -25
    const updates = {
      [`games/${gameCode}/players/${buzzerId}/score`]: (player.score || 0) + delta,
      [`games/${gameCode}/players/${buzzerId}/roundScore`]: (player.roundScore || 0) + delta,
      [`games/${gameCode}/buzzer`]: null,
    }
    if (!correct) {
      updates[`games/${gameCode}/wrongAnswerers`] = [...wrongAnswerers, buzzerId]
    } else {
      updates[`games/${gameCode}/wrongAnswerers`] = []
      updates[`games/${gameCode}/answerRevealed`] = true
    }
    await update(ref(db), updates)
    if (correct) { playCorrect(); undimMusic() }
    else { playWrong(); undimMusic() }
  }

  if (!currentQ && questions.length > 0 && redemptionIdx >= totalQ) {
    return (
      <div className="screen center">
        <div style={{ fontSize: '3rem' }}>⚡</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem' }}>Redemption complete!</div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge" style={{ background: 'rgba(244,208,63,0.15)', color: 'var(--gold)', borderColor: 'rgba(244,208,63,0.3)' }}>
          ⚡ {redemptionIdx + 1}/{totalQ}
        </div>
        <div className="topbar-logo" style={{ color: 'var(--gold)' }}>⚡ Redemption Arc</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 12 }}>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(redemptionIdx / totalQ) * 100}%`, background: 'var(--gold)' }} />
        </div>

        {/* Redemption Arc intro card */}
        <motion.div
          className="card center col gap-6"
          style={{ background: 'rgba(244,208,63,0.06)', borderColor: 'rgba(244,208,63,0.3)', padding: '12px 16px' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700 }}>
            ⚡ 1.25× points — show what you've learned!
          </div>
        </motion.div>

        {/* Question card */}
        {currentQ && (
          <motion.div
            key={redemptionIdx}
            className="question-card"
            style={{ borderColor: isBuzzing ? myColor : 'rgba(244,208,63,0.3)', background: 'rgba(244,208,63,0.03)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="row gap-8" style={{ marginBottom: 8 }}>
              <div className="caption">Q{redemptionIdx + 1}</div>
              <div className="caption" style={{ color: 'var(--gold)' }}>⚡ REDEMPTION</div>
            </div>
            <div className="question-text">{currentQ.q}</div>

            {isQM && (
              <div className="answer-text">✓ {currentQ.a}</div>
            )}
            {currentQ.hint && (isQM || wrongAnswerers.length > 0) && (
              <motion.div className="hint-text" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                💡 {currentQ.hint}
              </motion.div>
            )}

            {/* Who originally got it wrong */}
            {originallyWrong.length > 0 && (
              <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Originally got it wrong:</span>
                {originallyWrong.map(p => (
                  <div key={p.id} className="row gap-4" style={{ background: 'rgba(244,208,63,0.08)', padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', color: 'var(--gold)' }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={16} />
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Buzz indicator */}
        <AnimatePresence>
          {buzzedPlayer && (
            <motion.div className="buzz-indicator" style={{ borderColor: buzzedPlayer.colorHex }}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <Avatar src={buzzedPlayer.avatar} name={buzzedPlayer.name} colorHex={buzzedPlayer.colorHex} size={44} />
              <div className="flex-1">
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: buzzedPlayer.colorHex }}>{buzzedPlayer.name}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QM marking */}
        {isQM && isController && buzzedPlayer && (
          <div className="row gap-12">
            <button className="btn btn-green btn-lg flex-1" onClick={() => handleMark(true)}>✓ Correct (+125)</button>
            <button className="btn btn-red btn-lg flex-1" onClick={() => handleMark(false)}>✗ Wrong (-25)</button>
          </div>
        )}

        {/* Buzzer (no-QM) */}
        {!isQM && (
          <div className="col gap-8">
            <div className="buzzer-wrap" style={{ minHeight: 130 }}>
              <motion.button
                ref={buzzerRef}
                className={`buzzer ${(someoneBuzzing && !isBuzzing) || iWasWrong ? 'buzzer-disabled' : ''} ${isBuzzing ? 'buzzer-glow' : ''}`}
                style={{
                  background: iWasWrong ? 'radial-gradient(circle at 35% 35%, #555, #333)'
                    : `radial-gradient(circle at 35% 35%, ${myColor}ee, ${myColor}99)`,
                  '--player-color': myColor, height: 130,
                  boxShadow: isBuzzing ? `0 0 40px ${myColor}99, 0 0 80px ${myColor}44` : iWasWrong ? 'none' : `0 8px 24px ${myColor}44`,
                }}
                whileTap={!someoneBuzzing && !iWasWrong ? { scale: 0.91, y: 4 } : {}}
                onMouseDown={handleBuzz} onTouchStart={handleBuzz}
              >
                {ripples.map(r => <div key={r.id} className="buzzer-ripple" style={{ left: `${r.x}%`, top: `${r.y}%` }} />)}
                <AnimatePresence mode="wait">
                  {isBuzzing ? (
                    <motion.div key="b" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '1.6rem' }}>⚡</div>
                      <div style={{ fontWeight: 900, fontSize: '1rem' }}>TYPE IT!</div>
                    </motion.div>
                  ) : iWasWrong ? (
                    <motion.div key="w" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '1.8rem' }}>✗</div>
                      <div style={{ fontWeight: 700 }}>OUT</div>
                    </motion.div>
                  ) : someoneBuzzing ? (
                    <motion.div key="s" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '1.5rem' }}>🔕</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{buzzedPlayer?.name}</div>
                    </motion.div>
                  ) : (
                    <motion.div key="r" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <motion.div style={{ fontSize: '1.5rem', fontWeight: 900 }}
                        animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>BUZZ!</motion.div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>⚡ 1.25× points</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            <AnimatePresence>
              {isBuzzing && !answerSubmitted && (
                <motion.div className="col gap-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <input className="input" placeholder="Your answer..." value={myAnswer}
                    onChange={e => setMyAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer()}
                    autoFocus style={{ fontSize: '1.1rem', textAlign: 'center' }} />
                  <button className="btn btn-gold btn-lg" onClick={handleSubmitAnswer} disabled={!myAnswer.trim()}>
                    Submit ⚡
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Controller skip */}
        {isController && (
          <div className="row gap-8">
            {buzzer && <button className="btn btn-ghost flex-1" onClick={() => clearBuzzer(gameCode)}>Clear</button>}
            <button className="btn btn-ghost flex-1" onClick={advanceRedemption}>⏭ Skip</button>
          </div>
        )}

        {/* Scores */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Scores</div>
          <div className="col gap-6">
            {[...allParticipants].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, i) => (
              <div key={p.id} className="row gap-8">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)', width: 16 }}>#{i + 1}</div>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={26} />
                <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex, fontWeight: 700, fontSize: '0.88rem' }}>{p.score || 0}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
