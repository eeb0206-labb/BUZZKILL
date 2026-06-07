/**
 * JokeOffScreen — Quiplash-style round.
 * Everyone writes a funny response to a prompt.
 * Responses are shown anonymously, then everyone votes for the funniest.
 * Points: 100 per vote + 100 bonus to the player with the most votes.
 *
 * Phases: submit → vote → results → (next prompt / end round)
 * Same screen for host + player. GameScreen role gets GameScreen component.
 */
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Confetti, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { getGenreById } from '../data/genres'
import SettingsOverlay from '../components/SettingsOverlay'

const SUBMIT_TIME = 90  // seconds to write response
const VOTE_TIME   = 30  // seconds to vote

export default function JokeOffScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const { subscribeToGame, startJokePrompt, submitJoke, startJokeVoting, voteJoke, revealJokeResults, nextJokePrompt, endJokeRound } = useGame()
  const { playCorrect, playRoundOver, playPowerupActivate, startMusic, stopMusic } = useSound()

  const [myAnswer, setMyAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const timerRef = useRef(null)
  const autoStartRef = useRef(false)

  const phase = game?.jokePhase
  const prompt = game?.jokePrompt
  const submissions = game?.jokeSubmissions || {}
  const votes = game?.jokeVotes || {}
  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const genre = game?.currentGenre

  // My submission
  const mySubmission = submissions[myId]

  // Phase timing
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!game?.jokePromptStartAt) return
    const total = phase === 'vote' ? VOTE_TIME : SUBMIT_TIME
    const elapsed = Math.floor((Date.now() - game.jokePromptStartAt) / 1000)
    const remaining = Math.max(0, total - elapsed)
    setTimeLeft(remaining)
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.jokePromptStartAt])

  // Auto-advance: when timer hits 0
  useEffect(() => {
    if (timeLeft > 0 || !isController || autoStartRef.current) return
    if (phase === 'submit') {
      autoStartRef.current = true
      startJokeVoting(gameCode).then(() => { autoStartRef.current = false })
    } else if (phase === 'vote') {
      autoStartRef.current = true
      handleRevealResults()
    }
  }, [timeLeft, phase, isController, gameCode])

  // Auto-advance: everyone submitted
  useEffect(() => {
    if (phase !== 'submit' || !isController) return
    const submitCount = Object.keys(submissions).length
    if (submitCount >= players.length && submitCount > 0 && !autoStartRef.current) {
      autoStartRef.current = true
      setTimeout(() => {
        startJokeVoting(gameCode).then(() => { autoStartRef.current = false })
      }, 1500)
    }
  }, [submissions, players.length, phase, isController, gameCode])

  // Auto-advance: everyone voted
  useEffect(() => {
    if (phase !== 'vote' || !isController) return
    const voteCount = Object.keys(votes).length
    // Exclude own submissions from voting
    const eligible = players.length
    if (voteCount >= eligible && voteCount > 0 && !autoStartRef.current) {
      autoStartRef.current = true
      setTimeout(() => {
        handleRevealResults()
      }, 500)
    }
  }, [votes, players.length, phase, isController, gameCode])

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

  // Start first prompt if host + no phase set
  useEffect(() => {
    if (!isController || phase || !genre) return
    const genreData = getGenreById(genre?.id)
    const prompts = genreData?.prompts || []
    if (prompts.length > 0) {
      startJokePrompt(gameCode, prompts[Math.floor(Math.random() * prompts.length)])
    }
  }, [isController, phase, genre?.id, gameCode])

  // Reset on new prompt
  useEffect(() => {
    setMyAnswer('')
    setSubmitted(false)
    autoStartRef.current = false
  }, [prompt])

  async function handleSubmit() {
    if (!myAnswer.trim() || submitted) return
    setSubmitted(true)
    await submitJoke(gameCode, myId, myAnswer)
    playPowerupActivate()
  }

  async function handleRevealResults() {
    setRevealing(true)
    await revealJokeResults(gameCode, game)
    playCorrect()
    setRevealing(false)
    autoStartRef.current = false
  }

  async function handleVote(targetId) {
    if (votes[myId]) return // already voted
    await voteJoke(gameCode, myId, targetId)
    playPowerupActivate()
  }

  // Results tally
  const tally = {}
  Object.values(votes).forEach(t => { tally[t] = (tally[t] || 0) + 1 })
  const maxVotes = Math.max(...Object.values(tally), 0)
  const sortedByVotes = [...players].sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0))

  // Submission order for voting (shuffle, stable across renders)
  const submissionList = Object.entries(submissions)
    .filter(([pid]) => pid !== myId) // can't vote for yourself
    .sort(([a], [b]) => a.localeCompare(b)) // stable sort

  const hasVoted = !!votes[myId]

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} Joke Off</div>
        <div className="topbar-logo" style={{ color: '#f77f00' }}>😂 Joke Off</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 16 }}>

        {/* ── Timer bar ─────────────────────────────────────────────────────── */}
        {(phase === 'submit' || phase === 'vote') && (
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ background: timeLeft < 10 ? 'var(--red)' : 'var(--accent)' }}
              animate={{ width: `${(timeLeft / (phase === 'vote' ? VOTE_TIME : SUBMIT_TIME)) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>
        )}

        {/* ── Prompt card ───────────────────────────────────────────────────── */}
        {prompt && (
          <motion.div
            key={prompt}
            className="card col center gap-8"
            style={{ background: 'rgba(247,127,0,0.06)', borderColor: 'rgba(247,127,0,0.3)', textAlign: 'center', padding: '20px 18px' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ fontSize: '1.8rem' }}>😂</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 4vw, 1.3rem)', lineHeight: 1.3 }}>
              {prompt}
            </div>
            {(phase === 'submit' || phase === 'vote') && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                {phase === 'submit' ? `✏️ Write your funniest answer · ${timeLeft}s` : `🗳️ Vote for the funniest · ${timeLeft}s`}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SUBMIT phase ──────────────────────────────────────────────────── */}
        {phase === 'submit' && (
          <motion.div className="col gap-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {submitted ? (
              <div className="card center col gap-8" style={{ padding: 24 }}>
                <div style={{ fontSize: '2rem' }}>✅</div>
                <div style={{ fontWeight: 700 }}>Answer submitted!</div>
                <div style={{ fontStyle: 'italic', color: 'var(--text2)' }}>"{ mySubmission }"</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                  Waiting for others… {Object.keys(submissions).length}/{players.length}
                </div>
              </div>
            ) : (
              <>
                <textarea
                  className="input"
                  placeholder="Write your answer here..."
                  value={myAnswer}
                  onChange={e => setMyAnswer(e.target.value)}
                  rows={3}
                  style={{ resize: 'none', fontSize: '1rem', lineHeight: 1.5 }}
                  maxLength={120}
                />
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{myAnswer.length}/120</span>
                  <button className="btn btn-gold" onClick={handleSubmit} disabled={!myAnswer.trim()}>
                    Submit 😂
                  </button>
                </div>
              </>
            )}

            {/* Host see who's submitted */}
            {isController && (
              <div className="card" style={{ padding: '8px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Submitted {Object.keys(submissions).length}/{players.length}
                </div>
                <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
                  {players.map(p => (
                    <div key={p.id} style={{ opacity: submissions[p.id] ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                      <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                    </div>
                  ))}
                </div>
                <motion.button
                  className="btn btn-gold btn-sm" style={{ marginTop: 10 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => startJokeVoting(gameCode)}
                >
                  Start Voting →
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── VOTE phase ────────────────────────────────────────────────────── */}
        {phase === 'vote' && (
          <motion.div className="col gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {submissionList.length === 0 ? (
              <div className="card center" style={{ color: 'var(--text3)' }}>Waiting for answers…</div>
            ) : (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', textAlign: 'center' }}>
                  {hasVoted ? '✅ Vote locked in!' : 'Tap the funniest answer — you can\'t vote for your own'}
                </div>
                <div className="col gap-8">
                  {submissionList.map(([pid, text], i) => {
                    const isMyVote = votes[myId] === pid
                    const isMyOwn = pid === myId
                    return (
                      <motion.button
                        key={pid}
                        className="card"
                        style={{
                          textAlign: 'left', cursor: isMyOwn || hasVoted ? 'default' : 'pointer',
                          borderColor: isMyVote ? 'var(--gold)' : 'var(--border)',
                          background: isMyVote ? 'rgba(244,208,63,0.08)' : 'var(--surface)',
                          padding: '14px 16px',
                        }}
                        whileTap={!isMyOwn && !hasVoted ? { scale: 0.98 } : {}}
                        onClick={() => !isMyOwn && !hasVoted && handleVote(pid)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                      >
                        <div style={{ fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.4 }}>"{text}"</div>
                        {isMyOwn && <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>← Your answer</div>}
                        {isMyVote && <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: 4 }}>✓ Your vote</div>}
                      </motion.button>
                    )
                  })}
                </div>

                {isController && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { autoStartRef.current = true; handleRevealResults() }}>
                    {revealing ? '…' : 'Reveal Results →'}
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── RESULTS phase ─────────────────────────────────────────────────── */}
        {phase === 'results' && (
          <motion.div className="col gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', textAlign: 'center' }}>
              🏆 Results
            </div>
            <div className="col gap-8">
              {sortedByVotes.filter(p => submissions[p.id]).map((p, i) => {
                const voteCount = tally[p.id] || 0
                const isWinner = voteCount === maxVotes && maxVotes > 0
                return (
                  <motion.div
                    key={p.id}
                    className="card"
                    style={{
                      borderColor: isWinner ? 'var(--gold)' : 'var(--border)',
                      background: isWinner ? 'rgba(244,208,63,0.08)' : 'var(--surface)',
                      padding: '14px 16px',
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="row gap-10" style={{ marginBottom: 6 }}>
                      <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                      <div className="flex-1" style={{ fontWeight: 700 }}>{p.name}</div>
                      {isWinner && <span>👑</span>}
                      <span style={{ fontFamily: 'var(--font-mono)', color: voteCount > 0 ? 'var(--gold)' : 'var(--text3)', fontWeight: 700 }}>
                        {voteCount} vote{voteCount !== 1 ? 's' : ''} · +{voteCount * 100 + (isWinner ? 100 : 0)}
                      </span>
                    </div>
                    <div style={{ fontStyle: 'italic', color: 'var(--text2)', fontSize: '0.95rem' }}>
                      "{submissions[p.id]}"
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {isController && (
              <div className="row gap-8">
                <button className="btn btn-ghost flex-1" onClick={() => endJokeRound(gameCode)}>
                  End Round
                </button>
                <button className="btn btn-gold flex-1" onClick={() => nextJokePrompt(gameCode, game)}>
                  Next Prompt →
                </button>
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

        {/* ── Waiting / no phase ────────────────────────────────────────────── */}
        {!phase && (
          <div className="card center col gap-8" style={{ padding: 32 }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Starting Joke Off…</div>
          </div>
        )}

      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
