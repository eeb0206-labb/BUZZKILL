/**
 * OrdersUpScreen — Memory + ordering game.
 *
 * Phases:
 *   memorize → show full order list for 15 seconds
 *   order    → show 3 scrambled items, players tap to rank them 1st / 2nd / 3rd
 *   reveal   → correct sequence shown, scores awarded
 *
 * Scoring (doubled if Double Points active):
 *   All 3 correct = 150 pts | 2 correct = 75 | 1 correct = 25 | 0 = 0
 *
 * Same screen for all roles except gamescreen.
 */
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import SettingsOverlay from '../components/SettingsOverlay'

const MEM_TIME   = 15
const ORDER_TIME = 25

export default function OrdersUpScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const {
    subscribeToGame, startOrdersUp, submitOUAnswer,
    advanceOUPhase, revealOUResults, nextOUOrder, endOURound,
  } = useGame()
  const { playCorrect, playWrong, playRoundOver, startMusic, stopMusic } = useSound()

  const [timeLeft, setTimeLeft]     = useState(MEM_TIME)
  const [showSettings, setShowSettings] = useState(false)
  const [myOrder, setMyOrder]       = useState([])   // items tapped in order
  const [submitted, setSubmitted]   = useState(false)
  const timerRef = useRef(null)
  const autoRef  = useRef(false)

  const phase        = game?.ouPhase
  const fullOrder    = game?.ouFullOrder  || []
  const challenge    = game?.ouChallenge  || []
  const correctOrder = game?.ouCorrectOrder || []
  const label        = game?.ouLabel      || 'Order'
  const submissions  = game?.ouSubmissions || {}
  const scoreMap     = game?.ouScoreMap   || {}
  const players      = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const genre        = game?.currentGenre
  const count        = game?.ouCount      || 1
  const roundLimit   = game?.settings?.questionsPerRound || 5
  const totalDone    = Object.keys(submissions).length

  // Timer
  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase === 'memorize' && game?.ouStartAt) {
      const tick = () => setTimeLeft(Math.max(0, Math.ceil(MEM_TIME - (Date.now() - game.ouStartAt) / 1000)))
      tick(); timerRef.current = setInterval(tick, 500)
    } else if (phase === 'order' && game?.ouOrderStart) {
      const tick = () => setTimeLeft(Math.max(0, Math.ceil(ORDER_TIME - (Date.now() - game.ouOrderStart) / 1000)))
      tick(); timerRef.current = setInterval(tick, 500)
    }
    return () => clearInterval(timerRef.current)
  }, [phase, game?.ouStartAt, game?.ouOrderStart])

  // Auto-advance: memorize → order when actual elapsed time >= MEM_TIME
  useEffect(() => {
    if (phase !== 'memorize' || !isController || autoRef.current || !game?.ouStartAt) return
    const elapsed = Date.now() - game.ouStartAt
    if (elapsed >= MEM_TIME * 1000) {
      autoRef.current = true
      setTimeout(() => advanceOUPhase(gameCode, 'memorize'), 400)
    }
  }, [timeLeft, phase, isController, game?.ouStartAt])

  // Auto-reveal: order → reveal when actual elapsed time >= ORDER_TIME or all submitted
  useEffect(() => {
    if (phase !== 'order' || !isController || autoRef.current || !game?.ouOrderStart) return
    const elapsed = Date.now() - game.ouOrderStart
    const timeExpired = elapsed >= ORDER_TIME * 1000
    if (timeExpired || (players.length > 0 && totalDone >= players.length)) {
      autoRef.current = true
      setTimeout(() => handleReveal(), 600)
    }
  }, [timeLeft, totalDone, players.length, phase, isController, game?.ouOrderStart])

  // Subscribe
  useEffect(() => {
    if (!gameCode) return
    return subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final')      store.setScreen('final')
      if (g.state === 'lobby')      store.setScreen('lobby')
    })
  }, [gameCode])

  // Music
  useEffect(() => { startMusic(); return () => stopMusic() }, [])

  // Auto-start
  useEffect(() => {
    if (!isController || phase || !genre) return
    startOrdersUp(gameCode, game)
  }, [isController, phase, genre?.id, gameCode])

  // Reset autoRef on every phase change so the next phase's auto-advance isn't blocked
  // by the previous phase setting autoRef.current = true.
  useEffect(() => {
    autoRef.current = false
  }, [phase])

  // Reset local state on new order
  useEffect(() => {
    setMyOrder([])
    setSubmitted(false)
  }, [challenge.join(',')])

  // Auto-advance: reveal → next order (8s)
  useEffect(() => {
    if (phase !== 'reveal' || !isController) return
    const t = setTimeout(() => {
      const current = game?.ouCount || 1
      const limit = game?.settings?.questionsPerRound || 5
      if (current >= limit) {
        endOURound(gameCode)
      } else {
        nextOUOrder(gameCode, game)
      }
    }, 8000)
    return () => clearTimeout(t)
  }, [phase, isController, gameCode])

  // Play sound on reveal
  useEffect(() => {
    if (phase !== 'reveal') return
    const sm = scoreMap[myId]
    if (sm) { if (sm.pts > 0) playCorrect(); else playWrong() }
  }, [phase])

  function handleTap(item) {
    if (submitted || phase !== 'order') return
    if (myOrder.includes(item)) return
    const next = [...myOrder, item]
    setMyOrder(next)
    if (next.length === 3) {
      setSubmitted(true)
      submitOUAnswer(gameCode, myId, next)
    }
  }

  function handleUndoTap() {
    if (submitted) return
    setMyOrder(prev => prev.slice(0, -1))
  }

  async function handleReveal() {
    await revealOUResults(gameCode, game)
    autoRef.current = false
  }

  const remaining = challenge.filter(item => !myOrder.includes(item))

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} Orders Up!</div>
        <div className="topbar-logo" style={{ color: '#f97316' }}>🍔 {count}/{roundLimit}</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 14 }}>

        {/* Order label + timer bar */}
        {(phase === 'memorize' || phase === 'order') && (
          <>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '0.95rem', color: '#f97316' }}>
              📋 {label}
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                style={{ background: timeLeft <= 5 ? 'var(--red)' : '#f97316' }}
                animate={{ width: `${(timeLeft / (phase === 'memorize' ? MEM_TIME : ORDER_TIME)) * 100}%` }}
                transition={{ duration: 0.9, ease: 'linear' }}
              />
            </div>
          </>
        )}

        {/* ── MEMORIZE phase ── */}
        {phase === 'memorize' && (
          <motion.div className="col gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', marginBottom: 4 }}>
                Memorise the order!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                {timeLeft}s to remember · you'll need to sequence 3 of these
              </div>
            </div>
            {fullOrder.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(249,115,22,0.07)',
                  border: '1.5px solid rgba(249,115,22,0.2)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f97316', minWidth: 26, fontSize: '1rem' }}>
                  {i + 1}.
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── ORDER phase ── */}
        {phase === 'order' && !submitted && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.05rem', color: 'var(--gold)', marginBottom: 4 }}>
                What order did these appear?
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                Tap 1st → 2nd → 3rd · {timeLeft}s · {totalDone}/{players.length} submitted
              </div>
            </div>

            {/* Player's running order */}
            <div className="col gap-6">
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 12, minHeight: 48,
                  background: myOrder[i] ? 'rgba(249,115,22,0.1)' : 'var(--surface)',
                  border: `1.5px solid ${myOrder[i] ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f97316', fontWeight: 700, minWidth: 24 }}>
                    {i + 1}.
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: myOrder[i] ? 'var(--text)' : 'var(--text3)' }}>
                    {myOrder[i] || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Tappable items */}
            <div className="col gap-8" style={{ marginTop: 4 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', textAlign: 'center' }}>
                Tap to add in order ↑
              </div>
              {remaining.map(item => (
                <motion.button
                  key={item}
                  className="btn"
                  style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600, borderColor: 'rgba(249,115,22,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTap(item)}
                >
                  {item}
                </motion.button>
              ))}
              {myOrder.length > 0 && !submitted && (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '0.82rem', cursor: 'pointer', marginTop: -4 }}
                  onClick={handleUndoTap}
                >
                  ← Undo last tap
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ORDER phase — submitted state */}
        {phase === 'order' && submitted && (
          <motion.div className="card col center gap-10" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <div style={{ fontSize: '2rem' }}>✓</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: 'var(--green)' }}>Order submitted!</div>
            <div className="col gap-6" style={{ width: '100%' }}>
              {myOrder.map((item, i) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'rgba(87,204,153,0.08)', border: '1px solid rgba(87,204,153,0.25)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 700 }}>{i + 1}.</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
              {totalDone}/{players.length} submitted · {timeLeft}s left
            </div>
          </motion.div>
        )}

        {/* ── REVEAL phase ── */}
        {phase === 'reveal' && (
          <motion.div className="col gap-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: 'var(--gold)' }}>
              ✅ Correct Order
            </div>
            <div className="col gap-6">
              {correctOrder.map((item, i) => (
                <motion.div key={item} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 12, background: 'rgba(87,204,153,0.08)', border: '1.5px solid rgba(87,204,153,0.3)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', minWidth: 24 }}>{i + 1}.</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item}</span>
                </motion.div>
              ))}
            </div>

            {/* My score */}
            {(() => {
              const sm = scoreMap[myId]
              if (!sm) return null
              return (
                <motion.div
                  className="card col center gap-6"
                  style={{
                    background: sm.pts > 0 ? 'rgba(244,208,63,0.08)' : 'rgba(100,100,100,0.06)',
                    borderColor: sm.pts > 0 ? 'rgba(244,208,63,0.3)' : 'var(--border)',
                  }}
                  initial={{ scale: 0.88 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
                >
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem' }}>
                    {sm.correct === 3 ? '🎯 Perfect!' : sm.correct === 2 ? '✌️ 2 correct' : sm.correct === 1 ? '🤏 1 correct' : '💀 None correct'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--gold)' }}>
                    {sm.pts > 0 ? `+${sm.pts} pts` : 'No points'}
                  </div>
                </motion.div>
              )
            })()}

            {/* All player scores */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Results</div>
              <div className="col gap-6">
                {players.map(p => {
                  const sm = scoreMap[p.id]
                  const sub = submissions[p.id]
                  return (
                    <div key={p.id} className="row gap-8">
                      <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                      <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      {sub ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                          {sub.join(' → ')}
                        </span>
                      ) : <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>—</span>}
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: sm?.pts > 0 ? 'var(--gold)' : 'var(--text3)', minWidth: 48, textAlign: 'right', fontSize: '0.82rem' }}>
                        {sm ? `${sm.correct}/3 +${sm.pts}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {isController && (
              <div className="row gap-8">
                <button className="btn btn-ghost flex-1" onClick={() => endOURound(gameCode)}>End Round</button>
                <button className="btn btn-gold flex-1" onClick={() => nextOUOrder(gameCode, game)}>Next Order →</button>
              </div>
            )}

            {!isController && (
              <div className="card center" style={{ color: 'var(--accent)' }}>
                <div className="loading-dots"><span /><span /><span /></div>
                <div style={{ marginTop: 6, fontSize: '0.85rem' }}>Waiting for host…</div>
              </div>
            )}
          </motion.div>
        )}

        {!phase && (
          <div className="card center col gap-8" style={{ padding: 32 }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Starting Orders Up!…</div>
          </div>
        )}

      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
