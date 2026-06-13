/**
 * WhodunnitScreen — Fakin' It style deduction game.
 *
 * One player (the Imposter) secretly gets a DIFFERENT prompt from everyone else.
 * All players answer out loud / type their answer.
 * Then everyone votes on who they think answered something different.
 *
 * Points:
 *  - If imposter is caught (majority voted them): 150 pts each to correct voters
 *  - If imposter escapes: 200 pts to the imposter
 *
 * Phases: answer → vote → results → (next pair / end round)
 */
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import SettingsOverlay from '../components/SettingsOverlay'

const ANSWER_TIME = 45
const VOTE_TIME   = 25

export default function WhodunnitScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const {
    subscribeToGame, startWhodunnit, submitWhodAnswer,
    startWhodVoting, submitWhodVote, revealWhodResults, endWhodRound,
  } = useGame()
  const { playCorrect, playWrong, startMusic, stopMusic, playPowerupActivate } = useSound()

  const [myAnswer, setMyAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const timerRef = useRef(null)
  const autoRef = useRef(false)
  // Read result from Firebase so every device sees the same outcome
  const result = game?.whodCaught ?? null

  const phase = game?.whodPhase
  const imposterId = game?.whodImposterId
  const normalPrompt = game?.whodPrompt
  const imposterPrompt = game?.whodImposterPrompt
  const answers = game?.whodAnswers || {}
  const votes = game?.whodVotes || {}
  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const genre = game?.currentGenre
  const roundNum = game?.whodCount || 1
  const roundLimit = game?.settings?.questionsPerRound || 3

  const iAmImposter = imposterId === myId
  const myPrompt = iAmImposter ? imposterPrompt : normalPrompt
  const myVote = votes[myId]
  const answeredCount = Object.keys(answers).length
  const votedCount = Object.keys(votes).length

  // Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!game?.whodStartAt) return
    const total = phase === 'vote' ? VOTE_TIME : ANSWER_TIME
    const elapsed = Math.floor((Date.now() - game.whodStartAt) / 1000)
    const remaining = Math.max(0, total - elapsed)
    setTimeLeft(remaining)
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.whodStartAt])

  // Auto-advance — use elapsed time from Firebase timestamp to avoid stale-zero fires on mount
  useEffect(() => {
    if (!isController || autoRef.current) return
    if (phase === 'answer' && game?.whodStartAt) {
      const elapsed = Date.now() - game.whodStartAt
      const expired = elapsed >= ANSWER_TIME * 1000
      if (expired || (players.length > 0 && answeredCount >= players.length)) {
        autoRef.current = true
        setTimeout(() => startWhodVoting(gameCode).then(() => { autoRef.current = false }), 800)
      }
    }
    if (phase === 'vote' && game?.whodStartAt) {
      const elapsed = Date.now() - game.whodStartAt
      const expired = elapsed >= VOTE_TIME * 1000
      if (expired || (players.length > 0 && votedCount >= players.length)) {
        autoRef.current = true
        setTimeout(() => handleReveal(), 600)
      }
    }
  }, [timeLeft, answeredCount, votedCount, phase, isController, game?.whodStartAt])

  // Subscribe
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, g => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final') store.setScreen('final')
      if (g.state === 'lobby') store.setScreen('lobby')
    })
    return unsub
  }, [gameCode])

  // Music
  useEffect(() => { startMusic(); return () => stopMusic() }, [])

  // Start if host + no phase
  useEffect(() => {
    if (!isController || phase) return
    startWhodunnit(gameCode, game)
  }, [isController, phase, gameCode])

  // Reset on new round
  useEffect(() => {
    setMyAnswer(''); setSubmitted(false); autoRef.current = false
  }, [game?.whodImposterId])

  async function handleSubmit() {
    if (!myAnswer.trim() || submitted) return
    setSubmitted(true)
    await submitWhodAnswer(gameCode, myId, myAnswer)
    playPowerupActivate()
  }

  async function handleVote(targetId) {
    if (myVote || targetId === myId) return
    await submitWhodVote(gameCode, myId, targetId)
    playPowerupActivate()
  }

  async function handleReveal() {
    const caught = await revealWhodResults(gameCode, game)
    if (caught) playCorrect()
    else playWrong()
    autoRef.current = false
  }

  // Who voted for whom
  const voteTally = {}
  Object.values(votes).forEach(t => { voteTally[t] = (voteTally[t] || 0) + 1 })

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} Whodunnit</div>
        <div className="topbar-logo" style={{ color: '#4895ef' }}>🕵️ {roundNum}/{roundLimit}</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 16 }}>

        {/* Timer bar */}
        {(phase === 'answer' || phase === 'vote') && (
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ background: timeLeft < 10 ? 'var(--red)' : '#4895ef' }}
              animate={{ width: `${(timeLeft / (phase === 'vote' ? VOTE_TIME : ANSWER_TIME)) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>
        )}

        {/* ── ANSWER phase ──────────────────────────────────────────────────── */}
        {phase === 'answer' && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Secret prompt reveal */}
            <motion.div
              className="card col center gap-10"
              style={{
                background: 'rgba(72,149,239,0.06)',
                borderColor: 'rgba(72,149,239,0.2)',
                textAlign: 'center', padding: '24px 18px',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div style={{ fontSize: '2.5rem' }}>🕵️</div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>
                Your question
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 4vw, 1.3rem)', lineHeight: 1.3 }}>
                {myPrompt}
              </div>
            </motion.div>

            {/* Input */}
            {submitted ? (
              <div className="card center col gap-8">
                <div style={{ fontSize: '2rem' }}>✅</div>
                <div style={{ fontWeight: 700 }}>Answer locked in!</div>
                <div style={{ fontStyle: 'italic', color: 'var(--text2)' }}>"{answers[myId]}"</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                  Waiting… {answeredCount}/{players.length} answered
                </div>
              </div>
            ) : (
              <div className="col gap-8">
                <input
                  className="input"
                  placeholder="Type your answer..."
                  value={myAnswer}
                  onChange={e => setMyAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  autoFocus
                  style={{ fontSize: '1.1rem', textAlign: 'center' }}
                />
                <button className="btn btn-gold btn-lg" onClick={handleSubmit} disabled={!myAnswer.trim()}>
                  Lock In Answer 🔒
                </button>
              </div>
            )}

            {isController && (
              <button className="btn btn-ghost btn-sm" onClick={() => { autoRef.current = true; startWhodVoting(gameCode) }}>
                Skip to voting →
              </button>
            )}
          </motion.div>
        )}

        {/* ── VOTE phase ────────────────────────────────────────────────────── */}
        {phase === 'vote' && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            <div className="card center col gap-6" style={{ background: 'rgba(72,149,239,0.06)', borderColor: 'rgba(72,149,239,0.2)' }}>
              <div style={{ fontSize: '2rem' }}>🔍</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', textAlign: 'center' }}>
                Everyone answered the same question…<br />
                <span style={{ color: '#4895ef' }}>except one person.</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                Who answered something different? · {timeLeft}s
              </div>
            </div>

            {/* Answers (all visible now) */}
            <div className="col gap-8">
              {players.map(p => (
                <motion.button
                  key={p.id}
                  className="card"
                  style={{
                    textAlign: 'left', padding: '12px 16px',
                    cursor: p.id === myId || myVote ? 'default' : 'pointer',
                    borderColor: myVote === p.id ? '#4895ef' : 'var(--border)',
                    background: myVote === p.id ? 'rgba(72,149,239,0.1)' : 'var(--surface)',
                    opacity: p.id === myId ? 0.6 : 1,
                  }}
                  whileTap={p.id !== myId && !myVote ? { scale: 0.98 } : {}}
                  onClick={() => handleVote(p.id)}
                >
                  <div className="row gap-10">
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                    <div className="flex-1">
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name} {p.id === myId ? '(you)' : ''}</div>
                      <div style={{ fontStyle: 'italic', color: 'var(--text2)', fontSize: '0.9rem' }}>
                        "{answers[p.id] || '…'}"
                      </div>
                    </div>
                    {myVote === p.id && <span style={{ fontSize: '1.1rem' }}>🔍</span>}
                  </div>
                </motion.button>
              ))}
            </div>

            {isController && (
              <button className="btn btn-ghost btn-sm" onClick={() => { autoRef.current = true; handleReveal() }}>
                Reveal results →
              </button>
            )}
          </motion.div>
        )}

        {/* ── RESULTS phase ─────────────────────────────────────────────────── */}
        {phase === 'results' && result !== null && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Big reveal */}
            <motion.div
              className="card col center gap-10"
              style={{
                background: result ? 'rgba(87,204,153,0.08)' : 'rgba(230,57,70,0.08)',
                borderColor: result ? 'rgba(87,204,153,0.3)' : 'rgba(230,57,70,0.3)',
                textAlign: 'center', padding: '28px 20px',
              }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <motion.div
                style={{ fontSize: '3.5rem' }}
                animate={{ rotate: result ? [0, -15, 15, -10, 10, 0] : [0, 5, -5, 5, 0] }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {result ? '🎉' : '😈'}
              </motion.div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: result ? 'var(--green)' : 'var(--red)' }}>
                {result ? 'IMPOSTER CAUGHT!' : 'IMPOSTER ESCAPED!'}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text2)' }}>
                {game.players?.[imposterId]?.name} was the imposter
              </div>
            </motion.div>

            {/* The two prompts revealed */}
            <div className="card col gap-10">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>The two questions</div>
              <div className="col gap-6">
                <div style={{ borderLeft: '3px solid #4895ef', paddingLeft: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Everyone else</div>
                  <div style={{ fontStyle: 'italic' }}>{normalPrompt}</div>
                </div>
                <div style={{ borderLeft: '3px solid var(--red)', paddingLeft: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {game.players?.[imposterId]?.name}'s secret question
                  </div>
                  <div style={{ fontStyle: 'italic' }}>{imposterPrompt}</div>
                </div>
              </div>
            </div>

            {/* All answers */}
            <div className="card col gap-8">
              <div style={{ fontWeight: 700 }}>Everyone's answers</div>
              {players.map(p => (
                <div key={p.id} className="row gap-10">
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                  <div className="flex-1">
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {p.name} {p.id === imposterId ? '😈' : ''}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text2)' }}>"{answers[p.id] || '—'}"</div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {voteTally[p.id] ? `${voteTally[p.id]} vote${voteTally[p.id] > 1 ? 's' : ''}` : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Points summary */}
            <motion.div
              className="card center col gap-4"
              style={{ background: 'rgba(244,208,63,0.06)', borderColor: 'rgba(244,208,63,0.2)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
              {result ? (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--gold)' }}>Detectives who guessed correctly got +150 pts each</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{game.players?.[imposterId]?.name} escapes and gets +200 pts!</div>
                </>
              )}
            </motion.div>

            {isController && (
              <div className="row gap-8">
                <button className="btn btn-ghost flex-1" onClick={() => endWhodRound(gameCode)}>End Round</button>
                {roundNum < roundLimit && (
                  <button className="btn btn-gold flex-1" onClick={() => { autoRef.current = false; startWhodunnit(gameCode, game) }}>
                    Next Round 🕵️
                  </button>
                )}
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
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Starting Whodunnit…</div>
          </div>
        )}

      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
