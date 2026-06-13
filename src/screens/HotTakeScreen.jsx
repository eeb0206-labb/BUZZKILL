/**
 * HotTakeScreen — Agree / Disagree voting round.
 * A spicy statement is shown. Everyone votes AGREE 🔥 or DISAGREE ❄️ simultaneously.
 * Rarer answer = more points (uniqueness scoring, max 150).
 * After voting, the split is revealed with a dramatic bar.
 *
 * Phases: vote → results → (next prompt / end round)
 * Same screen for all roles except gamescreen.
 */
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { getGenreById } from '../data/genres'
import SettingsOverlay from '../components/SettingsOverlay'

const VOTE_TIME = 10 // seconds

export default function HotTakeScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const {
    subscribeToGame, startHotTakePrompt, submitHotTakeVote,
    revealHotTakeResults, nextHotTakePrompt, endHotTakeRound,
  } = useGame()
  const { playCorrect, playWrong, playRoundOver, startMusic, stopMusic } = useSound()

  const [timeLeft, setTimeLeft] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const timerRef = useRef(null)
  const autoRef = useRef(false)

  const phase = game?.htPhase
  const prompt = game?.htPrompt
  const votes = game?.htVotes || {}
  const results = game?.htResults || null
  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const genre = game?.currentGenre
  const promptNum = (game?.htPromptCount || 0) + 1
  const roundLimit = game?.settings?.questionsPerRound || 5

  const myVote = votes[myId]
  const agreeCount = Object.values(votes).filter(v => v === 'agree').length
  const disagreeCount = Object.values(votes).filter(v => v === 'disagree').length
  const totalVoted = Object.keys(votes).length

  // Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (phase !== 'vote' || !game?.htStartAt) return
    const elapsed = Math.floor((Date.now() - game.htStartAt) / 1000)
    const remaining = Math.max(0, VOTE_TIME - elapsed)
    setTimeLeft(remaining)
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.htStartAt])

  // Auto-reveal — use elapsed time from Firebase timestamp to avoid stale-zero fires on mount
  useEffect(() => {
    if (phase !== 'vote' || !isController || autoRef.current || !game?.htStartAt) return
    const elapsed = Date.now() - game.htStartAt
    const expired = elapsed >= VOTE_TIME * 1000
    if (expired || (players.length > 0 && totalVoted >= players.length)) {
      autoRef.current = true
      setTimeout(() => handleReveal(), 800)
    }
  }, [timeLeft, totalVoted, players.length, phase, isController, game?.htStartAt])

  // Subscribe
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final') store.setScreen('final')
      if (g.state === 'lobby') store.setScreen('lobby')
    })
    return unsub
  }, [gameCode])

  // Music
  useEffect(() => {
    startMusic()
    return () => stopMusic()
  }, [])

  // Start first prompt if host + no phase
  useEffect(() => {
    if (!isController || phase || !genre) return
    const genreData = getGenreById(genre?.id)
    const prompts = genreData?.prompts || []
    if (prompts.length > 0) {
      startHotTakePrompt(gameCode, prompts[Math.floor(Math.random() * prompts.length)])
    }
  }, [isController, phase, genre?.id, gameCode])

  // Reset on new prompt
  useEffect(() => {
    autoRef.current = false
  }, [prompt])

  async function handleVote(choice) {
    if (myVote) return
    await submitHotTakeVote(gameCode, myId, choice)
  }

  async function handleReveal() {
    const res = await revealHotTakeResults(gameCode, game)
    if (res?.majority === 'agree') playCorrect()
    else playWrong()
    autoRef.current = false
  }

  // Agree percentage for bar
  const total = agreeCount + disagreeCount || 1
  const agreePct = Math.round((agreeCount / total) * 100)
  const disagreePct = 100 - agreePct

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} Hot Take</div>
        <div className="topbar-logo" style={{ color: '#e63946' }}>🔥 {promptNum}/{roundLimit}</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 16 }}>

        {/* Timer bar */}
        {phase === 'vote' && (
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ background: timeLeft < 8 ? 'var(--red)' : '#e63946' }}
              animate={{ width: `${(timeLeft / VOTE_TIME) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>
        )}

        {/* ── Prompt card ───────────────────────────────────────────────────── */}
        {prompt && (
          <motion.div
            key={prompt}
            className="card col center gap-10"
            style={{ textAlign: 'center', padding: '28px 20px', background: 'rgba(230,57,70,0.04)', borderColor: 'rgba(230,57,70,0.2)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ fontSize: '2.5rem' }}>🔥</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)', lineHeight: 1.3 }}>
              "{prompt}"
            </div>
            {phase === 'vote' && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                {totalVoted}/{players.length} voted · {timeLeft}s
              </div>
            )}
          </motion.div>
        )}

        {/* ── VOTE phase — big AGREE / DISAGREE buttons ─────────────────────── */}
        {phase === 'vote' && (
          <div className="row gap-12" style={{ minHeight: 140 }}>
            <motion.button
              className="flex-1 col center gap-8"
              style={{
                borderRadius: 16, border: `2px solid ${myVote === 'agree' ? '#e63946' : 'var(--border)'}`,
                background: myVote === 'agree' ? 'rgba(230,57,70,0.15)' : 'var(--surface)',
                cursor: myVote ? 'default' : 'pointer', padding: 20,
              }}
              whileTap={!myVote ? { scale: 0.95 } : {}}
              onClick={() => handleVote('agree')}
            >
              <div style={{ fontSize: '3rem' }}>🔥</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: myVote === 'agree' ? '#e63946' : 'var(--text)' }}>
                AGREE
              </div>
              {myVote === 'agree' && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#e63946' }}>✓ Locked in</div>
              )}
            </motion.button>

            <motion.button
              className="flex-1 col center gap-8"
              style={{
                borderRadius: 16, border: `2px solid ${myVote === 'disagree' ? '#4895ef' : 'var(--border)'}`,
                background: myVote === 'disagree' ? 'rgba(72,149,239,0.15)' : 'var(--surface)',
                cursor: myVote ? 'default' : 'pointer', padding: 20,
              }}
              whileTap={!myVote ? { scale: 0.95 } : {}}
              onClick={() => handleVote('disagree')}
            >
              <div style={{ fontSize: '3rem' }}>❄️</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: myVote === 'disagree' ? '#4895ef' : 'var(--text)' }}>
                DISAGREE
              </div>
              {myVote === 'disagree' && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#4895ef' }}>✓ Locked in</div>
              )}
            </motion.button>
          </div>
        )}

        {/* ── RESULTS phase — split bar ──────────────────────────────────────── */}
        {phase === 'results' && (
          <motion.div className="col gap-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Split bar */}
            <div style={{ height: 40, borderRadius: 12, overflow: 'hidden', display: 'flex', gap: 2 }}>
              <motion.div
                style={{ background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem' }}
                initial={{ width: 0 }}
                animate={{ width: `${agreePct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.3 }}
              >
                {agreePct > 12 && `🔥 ${agreePct}%`}
              </motion.div>
              <motion.div
                style={{ background: '#4895ef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem', flex: 1 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {disagreePct > 12 && `❄️ ${disagreePct}%`}
              </motion.div>
            </div>

            <div className="row gap-20" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <div className="col center gap-4">
                <div style={{ fontSize: '2rem' }}>🔥</div>
                <div style={{ fontWeight: 900, color: '#e63946', fontFamily: 'var(--font-mono)', fontSize: '1.4rem' }}>{agreeCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Agree</div>
              </div>
              <div className="col center gap-4">
                <div style={{ fontSize: '2rem' }}>❄️</div>
                <div style={{ fontWeight: 900, color: '#4895ef', fontFamily: 'var(--font-mono)', fontSize: '1.4rem' }}>{disagreeCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Disagree</div>
              </div>
            </div>

            {/* Per-player results — shows for all devices once htResults is in Firebase */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Scores</div>
              <div className="col gap-8">
                {players.map(p => {
                  const v = votes[p.id]
                  const pts = results?.playerPts?.[p.id]
                  return (
                    <motion.div
                      key={p.id}
                      className="row gap-8"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={30} />
                      <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      <span style={{ fontSize: '1.1rem' }}>
                        {v === 'agree' ? '🔥' : v === 'disagree' ? '❄️' : '–'}
                      </span>
                      {phase === 'results' && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 54, textAlign: 'right',
                          fontSize: '0.85rem', color: pts ? 'var(--gold)' : 'var(--text3)',
                        }}>
                          {pts ? `+${pts}` : v ? '+0' : '–'}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              {results && (() => {
                const t = (results.agrees + results.disagrees) || 1
                const agreePts = Math.round((results.disagrees / t) * 150)
                const disagreePts = Math.round((results.agrees / t) * 150)
                return (
                  <div className="row gap-16" style={{ justifyContent: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                      <div style={{ color: 'var(--text3)', marginBottom: 2 }}>🔥 Agree worth</div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: '#e63946', fontWeight: 700 }}>+{agreePts}</div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                      <div style={{ color: 'var(--text3)', marginBottom: 2 }}>❄️ Disagree worth</div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: '#4895ef', fontWeight: 700 }}>+{disagreePts}</div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {isController && (
              <div className="row gap-8">
                <button className="btn btn-ghost flex-1" onClick={() => endHotTakeRound(gameCode)}>End Round</button>
                <button className="btn btn-gold flex-1" onClick={() => nextHotTakePrompt(gameCode, game)}>Next Take →</button>
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
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Starting Hot Take…</div>
          </div>
        )}

      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
