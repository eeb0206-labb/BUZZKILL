/**
 * FillGapScreen — Fill the Gap creative round.
 * A sentence with one or two ___ blanks is shown. Everyone types their answer.
 * Answers are revealed as a slideshow (inserted into the sentence), then everyone votes.
 * Points: 25 participation + 75 per vote received + 100 bonus for top answer.
 *
 * Phases: input (75s) → vote (25s) → results (slideshow then summary) → next/end
 */
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { getGenreById } from '../data/genres'
import SettingsOverlay from '../components/SettingsOverlay'

const INPUT_TIME = 75
const VOTE_TIME  = 25
const SLIDE_DELAY = 4000 // ms per answer in slideshow

// Split a stored answer into its parts (separator: " | " for two-blank prompts)
function splitAnswer(answer) {
  return answer.includes(' | ') ? answer.split(' | ') : [answer]
}

// Fill blanks in a prompt with the answer parts; returns a React element
function renderFilled(text, answer) {
  if (!text) return null
  const parts = text.split('___')
  const fills = splitAnswer(answer)
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span style={{
              display: 'inline-block',
              padding: '1px 10px',
              marginInline: 4,
              background: 'rgba(76,201,240,0.18)',
              borderBottom: '3px solid #4cc9f0',
              borderRadius: 4,
              fontWeight: 700,
              color: '#4cc9f0',
            }}>
              {fills[i] || '…'}
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

// Render just the blank underlines (no answer) for the prompt card
function renderPrompt(text) {
  if (!text) return null
  const parts = text.split('___')
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span style={{
              display: 'inline-block',
              minWidth: 80,
              borderBottom: '3px solid var(--accent)',
              margin: '0 4px',
              verticalAlign: 'bottom',
              opacity: 0.7,
            }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          )}
        </span>
      ))}
    </span>
  )
}

export default function FillGapScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const { subscribeToGame, startFillGap, submitFillAnswer, startFillVoting, voteFillAnswer, revealFillResults, endFillRound } = useGame()
  const { playCorrect, playWrong, startMusic, stopMusic } = useSound()

  const [word1, setWord1] = useState('')
  const [word2, setWord2] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [tally, setTally] = useState(null)
  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const slideTimerRef = useRef(null)
  const timerRef = useRef(null)
  const autoRef = useRef(false)
  const word2Ref = useRef(null)

  const phase = game?.fgPhase
  const prompt = game?.fgPrompt
  const submissions = game?.fgSubmissions || {}
  const votes = game?.fgVotes || {}
  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const genre = game?.currentGenre
  const promptNum = game?.fgPromptCount || 1
  const roundLimit = game?.settings?.questionsPerRound || 5

  const blankCount = (prompt?.match(/___/g) || []).length
  const myVote = votes[myId]
  const submittedCount = Object.keys(submissions).length
  const votedCount = Object.keys(votes).length

  // Shuffle submissions for anonymous voting (stable order per session)
  const shuffledEntries = Object.entries(submissions).sort(([a], [b]) => a.localeCompare(b))

  // Find top answer for results
  const maxVotes = tally ? Math.max(...Object.values(tally), 0) : 0
  const topAnswerIds = tally
    ? Object.entries(tally).filter(([, c]) => c === maxVotes && c > 0).map(([id]) => id)
    : []

  // Subscribe
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final') store.setScreen('final')
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
    startFillGap(gameCode, game)
  }, [isController, phase, genre?.id, gameCode])

  // Reset on new prompt
  useEffect(() => {
    setWord1('')
    setWord2('')
    setSubmitted(false)
    setTally(null)
    setSlideIndex(0)
    setShowSummary(false)
    autoRef.current = false
    if (slideTimerRef.current) clearInterval(slideTimerRef.current)
  }, [prompt])

  // Timer — input phase uses fgStartAt, vote phase uses fgVoteStartAt
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (phase === 'input' && game?.fgStartAt) {
      const elapsed = Math.floor((Date.now() - game.fgStartAt) / 1000)
      setTimeLeft(Math.max(0, INPUT_TIME - elapsed))
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    } else if (phase === 'vote' && game?.fgVoteStartAt) {
      const elapsed = Math.floor((Date.now() - game.fgVoteStartAt) / 1000)
      setTimeLeft(Math.max(0, VOTE_TIME - elapsed))
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase, game?.fgStartAt, game?.fgVoteStartAt])

  // Auto-advance: input phase done → voting
  useEffect(() => {
    if (phase !== 'input' || !isController || autoRef.current || !game?.fgStartAt || game?.gamePaused) return
    const elapsed = Date.now() - game.fgStartAt
    const timeExpired = elapsed >= INPUT_TIME * 1000
    if (timeExpired || (players.length > 0 && submittedCount >= players.length)) {
      autoRef.current = true
      setTimeout(() => {
        startFillVoting(gameCode)
        autoRef.current = false
      }, 800)
    }
  }, [timeLeft, submittedCount, players.length, phase, isController, game?.fgStartAt])

  // Auto-advance: vote phase done → results
  useEffect(() => {
    if (phase !== 'vote' || !isController || autoRef.current || !game?.fgVoteStartAt || game?.gamePaused) return
    const elapsed = Date.now() - game.fgVoteStartAt
    const timeExpired = elapsed >= VOTE_TIME * 1000
    if (timeExpired || (players.length > 0 && votedCount >= players.length)) {
      autoRef.current = true
      setTimeout(async () => {
        const t = await revealFillResults(gameCode, game)
        setTally(t)
        autoRef.current = false
        playCorrect()
      }, 800)
    }
  }, [timeLeft, votedCount, players.length, phase, isController, game?.fgVoteStartAt])

  // Slideshow: auto-advance through answers when results phase starts
  useEffect(() => {
    if (phase !== 'results' || showSummary) return
    if (shuffledEntries.length === 0) { setShowSummary(true); return }
    if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    slideTimerRef.current = setInterval(() => {
      setSlideIndex(i => {
        const next = i + 1
        if (next >= shuffledEntries.length) {
          clearInterval(slideTimerRef.current)
          setShowSummary(true)
          return i
        }
        return next
      })
    }, SLIDE_DELAY)
    return () => clearInterval(slideTimerRef.current)
  }, [phase, showSummary, shuffledEntries.length])

  async function handleSubmit() {
    const a = word1.trim()
    const b = word2.trim()
    if (!a || (blankCount >= 2 && !b) || submitted) return
    setSubmitted(true)
    const combined = blankCount >= 2 ? `${a} | ${b}` : a
    await submitFillAnswer(gameCode, myId, combined)
  }

  async function handleVote(targetId) {
    if (myVote) return
    await voteFillAnswer(gameCode, myId, targetId)
  }

  async function handleNext() {
    await startFillGap(gameCode, game)
  }

  function advanceSlide() {
    clearInterval(slideTimerRef.current)
    setSlideIndex(i => {
      const next = i + 1
      if (next >= shuffledEntries.length) {
        setShowSummary(true)
        return i
      }
      return next
    })
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} Fill the Gap</div>
        <div className="topbar-logo" style={{ color: '#4cc9f0' }}>✏️ {promptNum}/{roundLimit}</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 16 }}>

        {/* Timer bar */}
        {(phase === 'input' || phase === 'vote') && (
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ background: timeLeft < 8 ? 'var(--red)' : '#4cc9f0' }}
              animate={{ width: `${(timeLeft / (phase === 'input' ? INPUT_TIME : VOTE_TIME)) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>
        )}

        {/* Prompt card — shown in input + vote phases */}
        {prompt && phase !== 'results' && (
          <motion.div
            key={prompt}
            className="card col center gap-10"
            style={{ textAlign: 'center', padding: '24px 20px', background: 'rgba(76,201,240,0.06)', borderColor: 'rgba(76,201,240,0.25)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ fontSize: '2rem' }}>✏️</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 4vw, 1.4rem)', lineHeight: 1.45 }}>
              {renderPrompt(prompt)}
            </div>
            {phase === 'input' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                {submittedCount}/{players.length} answered · {timeLeft}s
              </div>
            )}
          </motion.div>
        )}

        {/* ── INPUT phase ─────────────────────────────────────────────── */}
        {phase === 'input' && (
          <motion.div className="col gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!submitted ? (
              <>
                {blankCount >= 2 ? (
                  <div className="col gap-8">
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Word 1</div>
                      <input
                        className="input"
                        placeholder="First blank..."
                        value={word1}
                        onChange={e => setWord1(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && word2Ref.current?.focus()}
                        autoFocus
                        style={{ fontSize: '1.05rem', textAlign: 'center' }}
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Word 2</div>
                      <input
                        ref={word2Ref}
                        className="input"
                        placeholder="Second blank..."
                        value={word2}
                        onChange={e => setWord2(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        style={{ fontSize: '1.05rem', textAlign: 'center' }}
                        maxLength={60}
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    className="input"
                    placeholder="Your funniest answer..."
                    value={word1}
                    onChange={e => setWord1(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                    style={{ fontSize: '1.05rem', textAlign: 'center' }}
                    maxLength={120}
                  />
                )}
                <motion.button
                  className="btn btn-primary btn-lg btn-block"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={!word1.trim() || (blankCount >= 2 && !word2.trim())}
                >
                  Submit ✓
                </motion.button>
              </>
            ) : (
              <div className="card center col gap-6" style={{ background: 'rgba(87,204,153,0.08)', borderColor: 'rgba(87,204,153,0.3)' }}>
                <div style={{ fontSize: '1.5rem' }}>✓</div>
                <div style={{ fontWeight: 700, color: 'var(--green)' }}>Answer submitted!</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>Waiting for others... ({submittedCount}/{players.length})</div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── VOTE phase ──────────────────────────────────────────────── */}
        {phase === 'vote' && (
          <motion.div className="col gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>
              {myVote ? '✓ Voted!' : 'Pick your favourite answer'}
              <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '0.82rem', marginLeft: 8 }}>({votedCount}/{players.length})</span>
            </div>
            {shuffledEntries.map(([pid, answer]) => {
              const isMyAnswer = pid === myId
              const isVotedFor = myVote === pid
              return (
                <motion.button
                  key={pid}
                  onClick={() => !myVote && !isMyAnswer && handleVote(pid)}
                  whileTap={!myVote && !isMyAnswer ? { scale: 0.97 } : {}}
                  style={{
                    display: 'block', width: '100%', textAlign: 'center',
                    padding: '14px 18px', borderRadius: 12,
                    border: `2px solid ${isVotedFor ? 'var(--gold)' : isMyAnswer ? 'var(--border)' : 'var(--border2)'}`,
                    background: isVotedFor ? 'rgba(244,208,63,0.1)' : isMyAnswer ? 'rgba(255,255,255,0.03)' : 'var(--surface)',
                    cursor: myVote || isMyAnswer ? 'default' : 'pointer',
                    fontFamily: 'var(--font-body)', color: isMyAnswer ? 'var(--text3)' : 'var(--text)',
                    fontSize: '1rem', fontWeight: isVotedFor ? 700 : 400,
                    opacity: myVote && !isVotedFor ? 0.5 : 1,
                    transition: 'all 0.15s',
                    lineHeight: 1.4,
                  }}
                >
                  {renderFilled(prompt, answer)}
                  {isMyAnswer && <span style={{ fontSize: '0.72rem', color: 'var(--text3)', marginLeft: 8 }}>(yours)</span>}
                  {isVotedFor && <span style={{ marginLeft: 8 }}>⭐</span>}
                </motion.button>
              )
            })}
            {shuffledEntries.length === 0 && (
              <div className="card center" style={{ color: 'var(--text3)', padding: 24 }}>No answers submitted yet...</div>
            )}
          </motion.div>
        )}

        {/* ── RESULTS phase — slideshow then summary ─────────────────── */}
        {phase === 'results' && (
          <AnimatePresence mode="wait">
            {!showSummary ? (
              /* Slideshow: one answer at a time inserted into the sentence */
              <motion.div
                key={`slide-${slideIndex}`}
                className="col gap-14"
                style={{ alignItems: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                  Answer {slideIndex + 1} of {shuffledEntries.length}
                </div>

                <motion.div
                  className="card col center gap-14"
                  style={{
                    textAlign: 'center', padding: '28px 20px',
                    background: 'rgba(76,201,240,0.06)', borderColor: 'rgba(76,201,240,0.25)',
                    fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)', fontFamily: 'var(--font-head)', lineHeight: 1.45,
                  }}
                >
                  {shuffledEntries[slideIndex] && renderFilled(prompt, shuffledEntries[slideIndex][1])}
                </motion.div>

                {/* Attribution hidden until summary */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {shuffledEntries.map((_, i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === slideIndex ? '#4cc9f0' : 'var(--border)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>

                {isController && (
                  <button
                    className="btn btn-ghost"
                    onClick={advanceSlide}
                  >
                    {slideIndex + 1 >= shuffledEntries.length ? 'See Results →' : 'Next →'}
                  </button>
                )}
                {!isController && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
                    {slideIndex + 1} / {shuffledEntries.length}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Summary: all answers with votes and attribution */
              <motion.div
                key="summary"
                className="col gap-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {shuffledEntries.map(([pid, answer], i) => {
                  const player = game?.players?.[pid]
                  const voteCount = tally?.[pid] || 0
                  const isTop = topAnswerIds.includes(pid)
                  return (
                    <motion.div
                      key={pid}
                      className="card"
                      style={{
                        borderColor: isTop ? 'var(--gold)' : 'var(--border)',
                        background: isTop ? 'rgba(244,208,63,0.07)' : 'var(--surface)',
                      }}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1rem', fontWeight: isTop ? 700 : 400, marginBottom: 6, lineHeight: 1.4 }}>
                            {renderFilled(prompt, answer)}
                            {isTop && voteCount > 0 && <span style={{ marginLeft: 8, fontSize: '1.1rem' }}>🏆</span>}
                          </div>
                          {player && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Avatar src={player.avatar} name={player.name} colorHex={player.colorHex} size={22} />
                              <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{player.name}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {voteCount > 0 && (
                            <div style={{ fontFamily: 'var(--font-mono)', color: isTop ? 'var(--gold)' : 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>
                              {voteCount} vote{voteCount !== 1 ? 's' : ''}
                            </div>
                          )}
                          {tally !== null && voteCount === 0 && (
                            <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>0 votes</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {isController && (
                  <div className="row gap-8">
                    <button className="btn btn-ghost flex-1" onClick={() => endFillRound(gameCode)}>End Round</button>
                    <button className="btn btn-gold flex-1" onClick={handleNext}>Next Prompt →</button>
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
          </AnimatePresence>
        )}

        {!phase && (
          <div className="card center col gap-8" style={{ padding: 32 }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Starting Fill the Gap…</div>
          </div>
        )}
      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
