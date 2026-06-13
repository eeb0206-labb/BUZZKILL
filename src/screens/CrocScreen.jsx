import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import SettingsOverlay from '../components/SettingsOverlay'

const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')

export default function CrocScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const setScreen = store.setScreen
  const settings = store.getSettings()
  const isQM = !!settings.questionMaster
  const {
    subscribeToGame,
    submitCrocBluff, submitCrocCorrectAnswer,
    revealCrocOptions, submitCrocVote,
    revealCrocResults, advanceCrocReveal, nextCrocQuestion,
  } = useGame()
  const { playCorrect, playWrong } = useSound()
  const [showSettings, setShowSettings] = useState(false)
  const [myBluff, setMyBluff] = useState('')
  const [bluffSubmitted, setBluffSubmitted] = useState(false)
  const [typedRealAnswer, setTypedRealAnswer] = useState(false)
  const [myVote, setMyVote] = useState(null)
  const [voteSubmitted, setVoteSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const autoRef = useRef(false)
  const timerRef = useRef(null)

  const phase = game?.crocPhase || 'submit'
  const currentQ = game?.crocCurrentQ
  const options = game?.crocOptions || []
  const bluffs = game?.crocBluffs || {}
  const votes = game?.crocVotes || {}
  const scoreDeltas = game?.crocScoreDeltas || {}
  const correctVoters = game?.crocCorrectVoters || []
  const noneRight = game?.crocNoneRight || false
  const uniqueKnowledge = game?.crocUniqueKnowledge || null
  const qIndex = game?.crocQIndex || 0
  const totalQs = (game?.crocQuestions || []).length
  const revealIdx = game?.crocRevealIdx ?? -1
  const correctSubmitters = game?.crocCorrectSubmitters || {}

  const allPlayers = Object.values(game?.players || {}).filter(p => p.role === 'player')
  const me = game?.players?.[myId]
  const myColor = me?.colorHex || 'var(--accent)'

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'final') setScreen('final')
    })
    return unsub
  }, [gameCode])

  // Reset input state when question changes
  useEffect(() => {
    setMyBluff('')
    setBluffSubmitted(false)
    setTypedRealAnswer(false)
    setMyVote(null)
    setVoteSubmitted(false)
    autoRef.current = false
  }, [qIndex])

  // Timer countdown for submit phase
  useEffect(() => {
    if (phase !== 'submit' || !game?.crocTimerEnds) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((game.crocTimerEnds - Date.now()) / 1000)))
    }, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.crocTimerEnds])

  // Auto-advance (no-QM mode, controller only)
  useEffect(() => {
    if (!isController || isQM || autoRef.current) return
    const submittedCount = Object.keys(bluffs).length
    const votedCount = Object.keys(votes).length
    if (phase === 'submit' && submittedCount >= allPlayers.length && allPlayers.length > 0) {
      autoRef.current = true
      setTimeout(() => {
        revealCrocOptions(gameCode, game).then(() => { autoRef.current = false })
      }, 1200)
    }
    if (phase === 'vote' && votedCount >= allPlayers.length && allPlayers.length > 0) {
      autoRef.current = true
      setTimeout(() => {
        revealCrocResults(gameCode, game).then(() => { autoRef.current = false })
      }, 1200)
    }
  }, [phase, bluffs, votes, allPlayers.length, isController, isQM])

  async function handleSubmitBluff() {
    if (!myBluff.trim() || bluffSubmitted) return
    const isCorrect = norm(myBluff) === norm(currentQ?.a || '')
    if (isCorrect) {
      // Award a knowledge bonus but force them to write a lie
      setTypedRealAnswer(true)
      setMyBluff('')
      await submitCrocCorrectAnswer(gameCode, myId)
      playCorrect?.()
    } else {
      setBluffSubmitted(true)
      await submitCrocBluff(gameCode, myId, myBluff)
    }
  }

  async function handleVote(optionIdx) {
    if (voteSubmitted) return
    const myOptionIdx = options.findIndex(o => !o.isReal && !o.isHouse && o.authorId === myId)
    if (optionIdx === myOptionIdx) return
    setMyVote(optionIdx)
    setVoteSubmitted(true)
    await submitCrocVote(gameCode, myId, optionIdx)
  }

  async function handleRevealOptions() {
    setLoading(true)
    await revealCrocOptions(gameCode, game)
    setLoading(false)
  }

  async function handleRevealResults() {
    setLoading(true)
    await revealCrocResults(gameCode, game)
    setLoading(false)
  }

  async function handleRevealNext() {
    setLoading(true)
    await advanceCrocReveal(gameCode, game)
    setLoading(false)
  }

  async function handleNext() {
    setLoading(true)
    await nextCrocQuestion(gameCode, game)
    setLoading(false)
  }

  const submittedCount = Object.keys(bluffs).length
  const votedCount = Object.keys(votes).length
  const myDelta = scoreDeltas[myId]
  const iGotItRight = correctVoters.includes(myId)
  const iKnewIt = !!correctSubmitters[myId]
  const myOptionIdx = options.findIndex(o => !o.isReal && !o.isHouse && o.authorId === myId)
  const fooledCount = phase === 'reveal'
    ? Object.values(votes).filter(v => Number(v) === myOptionIdx).length
    : 0
  const allRevealed = revealIdx >= options.length && options.length > 0
  const timerUrgent = timeLeft > 0 && timeLeft <= 15

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">
          🐊 Q{qIndex + 1}/{totalQs || '?'}
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.95rem', color: myColor }}>
          {me?.name}
        </div>
        <div className="row gap-8">
          <div style={{ fontFamily: 'var(--font-mono)', color: myColor, fontWeight: 700 }}>
            {me?.score || 0}
          </div>
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 14 }}>

        {/* Question */}
        <AnimatePresence mode="wait">
          {currentQ && (
            <motion.div
              key={qIndex}
              className="card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'rgba(30,107,60,0.08)',
                borderColor: 'rgba(30,107,60,0.35)',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: '#27913e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>
                🐊 Interior Crocodile Architecture
              </div>
              <div style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.1rem)', lineHeight: 1.55, fontWeight: 600 }}>
                {currentQ.q}
              </div>
              {currentQ.hint && phase === 'submit' && (
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                  💡 {currentQ.hint}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SUBMIT PHASE ── */}
        {phase === 'submit' && (
          <motion.div className="col gap-12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

            {/* Timer */}
            {timeLeft > 0 && (
              <motion.div
                style={{
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: timerUrgent ? 'var(--red)' : '#52b788',
                }}
                animate={timerUrgent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                {timeLeft}s
              </motion.div>
            )}

            {typedRealAnswer && !bluffSubmitted && (
              <motion.div
                className="card col center gap-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.4)' }}
              >
                <div style={{ fontSize: '1.4rem' }}>🧠</div>
                <div style={{ fontWeight: 700, color: '#f59e0b', textAlign: 'center' }}>
                  You knew it! +100 bonus
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', textAlign: 'center' }}>
                  Now write a convincing LIE to fool everyone else.
                </div>
              </motion.div>
            )}

            {!bluffSubmitted ? (
              <>
                {!typedRealAnswer && (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text2)' }}>
                    Write a convincing fake answer. Fool the crowd. 🎭
                  </div>
                )}
                <input
                  className="input"
                  placeholder={typedRealAnswer ? "Your fake answer..." : "Your fake answer..."}
                  value={myBluff}
                  onChange={e => setMyBluff(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitBluff()}
                  autoFocus
                  style={{ fontSize: '1rem', textAlign: 'center' }}
                />
                <button
                  className="btn btn-primary btn-lg btn-block"
                  onClick={handleSubmitBluff}
                  disabled={!myBluff.trim()}
                  style={{ background: '#1e6b3c', borderColor: '#1e6b3c' }}
                >
                  {typedRealAnswer ? 'Submit Lie →' : 'Submit Bluff →'}
                </button>
              </>
            ) : (
              <motion.div
                className="card col center gap-8"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'rgba(30,107,60,0.08)', borderColor: 'rgba(30,107,60,0.3)' }}
              >
                <div style={{ fontSize: '1.5rem' }}>{iKnewIt ? '🧠✅' : '✅'}</div>
                <div style={{ fontWeight: 700, color: '#27913e' }}>
                  {iKnewIt ? 'Lie submitted! (+100 knowledge bonus)' : 'Bluff submitted!'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', textAlign: 'center' }}>
                  "{myBluff}"
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                  {submittedCount}/{allPlayers.length} written…
                </div>
              </motion.div>
            )}

            {isController && isQM && bluffSubmitted && (
              <motion.div className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center' }}>
                  {submittedCount}/{allPlayers.length} bluffs in
                </div>
                <button
                  className="btn btn-green btn-lg btn-block"
                  onClick={handleRevealOptions}
                  disabled={loading || submittedCount === 0}
                >
                  {loading ? <div className="loading-dots"><span /><span /><span /></div> : 'Reveal Options →'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── VOTE PHASE ── */}
        {phase === 'vote' && (
          <motion.div className="col gap-10" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text2)' }}>
              {voteSubmitted ? 'Vote locked in! Waiting for others…' : 'Which one is the REAL answer?'}
            </div>
            <div className="col gap-8">
              {options.map((opt, idx) => {
                const isMyBluff = !opt.isReal && !opt.isHouse && opt.authorId === myId
                const isSelected = myVote === idx
                const isDisabled = voteSubmitted || isMyBluff

                return (
                  <motion.button
                    key={idx}
                    className="btn btn-ghost btn-block"
                    onClick={() => handleVote(idx)}
                    disabled={isDisabled}
                    whileTap={!isDisabled ? { scale: 0.97 } : {}}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderColor: isSelected
                        ? '#1e6b3c'
                        : isMyBluff
                        ? 'rgba(255,255,255,0.1)'
                        : 'var(--border)',
                      background: isSelected
                        ? 'rgba(30,107,60,0.15)'
                        : isMyBluff
                        ? 'rgba(255,255,255,0.02)'
                        : 'var(--surface)',
                      opacity: isMyBluff ? 0.45 : 1,
                      fontSize: '0.92rem',
                      fontWeight: isSelected ? 700 : 400,
                      color: isSelected ? '#52b788' : undefined,
                    }}
                  >
                    <span style={{ marginRight: 10, opacity: 0.5, fontSize: '0.8rem' }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt.text}
                    {isMyBluff && (
                      <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--text3)' }}>
                        (your bluff)
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {isController && isQM && (
              <motion.div className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center' }}>
                  {votedCount}/{allPlayers.length} voted
                </div>
                <button
                  className="btn btn-green btn-lg btn-block"
                  onClick={handleRevealResults}
                  disabled={loading}
                >
                  {loading ? <div className="loading-dots"><span /><span /><span /></div> : 'Reveal Results →'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── REVEAL PHASE ── */}
        {phase === 'reveal' && (
          <motion.div className="col gap-10" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

            {/* Revealed options so far */}
            <div className="col gap-8">
              {options.map((opt, idx) => {
                const isRevealed = revealIdx >= 0 && idx <= revealIdx - 1
                if (!isRevealed) return null
                const author = opt.authorId && !opt.isHouse ? game?.players?.[opt.authorId] : null
                const votesForThis = Object.values(votes).filter(v => Number(v) === idx).length
                const iVotedFor = votes[myId] !== undefined && Number(votes[myId]) === idx

                return (
                  <motion.div
                    key={idx}
                    className="card"
                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    style={{
                      background: opt.isReal
                        ? 'rgba(30,107,60,0.12)'
                        : iVotedFor
                        ? 'rgba(181,42,42,0.08)'
                        : 'var(--surface)',
                      borderColor: opt.isReal
                        ? 'rgba(30,107,60,0.45)'
                        : iVotedFor
                        ? 'rgba(181,42,42,0.3)'
                        : 'var(--border)',
                    }}
                  >
                    <div className="row gap-10" style={{ alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: opt.isReal ? 700 : 500, fontSize: '0.92rem', color: opt.isReal ? '#52b788' : undefined }}>
                          {opt.isReal && '🐊 '}{opt.text}
                        </div>
                        <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--text3)' }}>
                          {opt.isReal
                            ? `✅ The real answer${votesForThis > 0 ? ` · ${votesForThis} got it right (+300 each)` : ''}`
                            : opt.isHouse
                            ? `🏠 House lie${votesForThis > 0 ? ` · ${votesForThis} fell for it (no points)` : ''}`
                            : author
                            ? `${author.name}'s lie${votesForThis > 0 ? ` · ${votesForThis} vote${votesForThis > 1 ? 's' : ''} = +${votesForThis * 200} for ${author.name.split(' ')[0]}` : ''}`
                            : ''}
                          {iVotedFor && !opt.isReal && ' · You voted this 😬'}
                        </div>
                      </div>
                      {author && !opt.isReal && !opt.isHouse && (
                        <Avatar src={author.avatar} name={author.name} colorHex={author.colorHex} size={28} />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Score summary — shown only once all revealed */}
            <AnimatePresence>
              {allRevealed && myDelta !== undefined && (
                <motion.div
                  className="card col center gap-4"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  style={{
                    background: myDelta > 0 ? 'rgba(87,204,153,0.1)' : 'var(--surface)',
                    borderColor: myDelta > 0 ? 'rgba(87,204,153,0.4)' : 'var(--border)',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: myDelta > 0 ? 'var(--green)' : 'var(--text3)',
                  }}>
                    {myDelta > 0 ? '+' : ''}{myDelta}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textAlign: 'center' }}>
                    {iKnewIt && '🧠 +100 knowledge '}
                    {iGotItRight && (uniqueKnowledge === myId ? '✅ Only you knew — +75 unique bonus!' : '✅ Found the truth (+300)')}
                    {fooledCount > 0 && ` · Fooled ${fooledCount} player${fooledCount > 1 ? 's' : ''} (+${fooledCount * 200})`}
                    {myDelta === 0 && '🐊 Croc got you'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controller buttons */}
            {isController && !allRevealed && (
              <motion.button
                className="btn btn-primary btn-lg btn-block"
                onClick={handleRevealNext}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ background: '#1e6b3c', borderColor: '#1e6b3c' }}
              >
                {loading
                  ? <div className="loading-dots"><span /><span /><span /></div>
                  : revealIdx < 0 ? 'Start Reveal →' : `Reveal Next → (${revealIdx + 1}/${options.length})`}
              </motion.button>
            )}
            {isController && allRevealed && (
              <motion.button
                className="btn btn-primary btn-lg btn-block"
                onClick={handleNext}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: '#1e6b3c', borderColor: '#1e6b3c' }}
              >
                {loading
                  ? <div className="loading-dots"><span /><span /><span /></div>
                  : qIndex + 1 >= totalQs ? 'Finish Round →' : 'Next Question →'}
              </motion.button>
            )}
            {!isController && (
              <motion.div className="card center" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <div className="loading-dots"><span /><span /><span /></div>
                <div style={{ marginTop: 6 }}>Waiting for host…</div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Mini scoreboard */}
        <div className="row gap-6" style={{ flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto', paddingTop: 8 }}>
          {[...Object.values(game?.players || {})].sort((a, b) => (b.score || 0) - (a.score || 0)).map(p => (
            <div key={p.id} className="row gap-4" style={{
              padding: '4px 10px', borderRadius: 20,
              background: p.id === myId ? `${p.colorHex}22` : 'var(--surface)',
              border: `1px solid ${p.id === myId ? p.colorHex : 'var(--border)'}`,
              fontSize: '0.78rem',
            }}>
              <span style={{ fontWeight: p.id === myId ? 700 : 400 }}>{p.name.split(' ')[0]}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: p.colorHex }}>{p.score || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
