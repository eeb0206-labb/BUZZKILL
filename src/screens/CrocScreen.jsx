import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import SettingsOverlay from '../components/SettingsOverlay'

export default function CrocScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const setScreen = store.setScreen
  const settings = store.getSettings()
  const isQM = !!settings.questionMaster
  const {
    subscribeToGame,
    submitCrocBluff, revealCrocOptions,
    submitCrocVote, revealCrocResults,
    nextCrocQuestion,
  } = useGame()
  const { playCorrect, playWrong } = useSound()
  const [showSettings, setShowSettings] = useState(false)
  const [myBluff, setMyBluff] = useState('')
  const [bluffSubmitted, setBluffSubmitted] = useState(false)
  const [myVote, setMyVote] = useState(null)
  const [voteSubmitted, setVoteSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const autoRef = useRef(false)

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

  const allPlayers = Object.values(game?.players || {}).filter(p => p.role === 'player')
  const me = game?.players?.[myId]
  const myColor = me?.colorHex || 'var(--accent)'

  // Subscribe to game state changes
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
    setMyVote(null)
    setVoteSubmitted(false)
    autoRef.current = false
  }, [qIndex])

  // Auto-advance for no-QM mode (controller only)
  useEffect(() => {
    if (!isController || isQM || autoRef.current) return
    if (phase === 'submit') {
      const submitted = Object.keys(bluffs).length
      if (submitted >= allPlayers.length && allPlayers.length > 0) {
        autoRef.current = true
        setTimeout(() => {
          revealCrocOptions(gameCode, game).then(() => { autoRef.current = false })
        }, 1200)
      }
    }
    if (phase === 'vote') {
      const voted = Object.keys(votes).length
      if (voted >= allPlayers.length && allPlayers.length > 0) {
        autoRef.current = true
        setTimeout(() => {
          revealCrocResults(gameCode, game).then(() => { autoRef.current = false })
        }, 1200)
      }
    }
  }, [phase, bluffs, votes, allPlayers.length, isController, isQM])

  async function handleSubmitBluff() {
    if (!myBluff.trim() || bluffSubmitted) return
    setBluffSubmitted(true)
    await submitCrocBluff(gameCode, myId, myBluff)
  }

  async function handleVote(optionIdx) {
    if (voteSubmitted) return
    const myOptionIdx = options.findIndex(o => !o.isReal && o.authorId === myId)
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

  async function handleNext() {
    setLoading(true)
    await nextCrocQuestion(gameCode, game)
    setLoading(false)
  }

  const submittedCount = Object.keys(bluffs).length
  const votedCount = Object.keys(votes).length
  const myDelta = scoreDeltas[myId]
  const iGotItRight = correctVoters.includes(myId)
  const myOptionIdx = options.findIndex(o => !o.isReal && o.authorId === myId)
  const fooledCount = phase === 'reveal'
    ? Object.values(votes).filter(v => Number(v) === myOptionIdx).length
    : 0

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
              <div style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)', lineHeight: 1.5, fontWeight: 600 }}>
                {currentQ.q}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SUBMIT PHASE ── */}
        {phase === 'submit' && (
          <motion.div className="col gap-12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {!bluffSubmitted ? (
              <>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text2)' }}>
                  Write a convincing fake answer. Fool the crowd. 🎭
                </div>
                <input
                  className="input"
                  placeholder="Your fake answer..."
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
                  Submit Bluff →
                </button>
              </>
            ) : (
              <motion.div
                className="card col center gap-8"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'rgba(30,107,60,0.08)', borderColor: 'rgba(30,107,60,0.3)' }}
              >
                <div style={{ fontSize: '1.5rem' }}>✅</div>
                <div style={{ fontWeight: 700, color: '#27913e' }}>Bluff submitted!</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', textAlign: 'center' }}>
                  "{myBluff}"
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                  {submittedCount}/{allPlayers.length} written…
                </div>
              </motion.div>
            )}

            {/* Controller: QM reveal button */}
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
                const isMyBluff = !opt.isReal && opt.authorId === myId
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

            {/* Controller: QM reveal results button */}
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
            {/* My score delta */}
            {myDelta !== undefined && (
              <motion.div
                className="card col center gap-4"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                style={{
                  background: myDelta > 0 ? 'rgba(87,204,153,0.1)' : myDelta < 0 ? 'rgba(230,57,70,0.08)' : 'var(--surface)',
                  borderColor: myDelta > 0 ? 'rgba(87,204,153,0.4)' : myDelta < 0 ? 'rgba(230,57,70,0.3)' : 'var(--border)',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: myDelta > 0 ? 'var(--green)' : myDelta < 0 ? 'var(--red)' : 'var(--text3)',
                }}>
                  {myDelta > 0 ? '+' : ''}{myDelta}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                  {iGotItRight ? uniqueKnowledge === myId ? '✅ Only you knew — +25 unique bonus!' : '✅ You guessed right!' : myDelta >= 0 ? '' : noneRight ? '🐊 Nobody guessed right — −25 extra for all' : '🐊 Croc got you'}
                  {fooledCount > 0 && ` · Fooled ${fooledCount} player${fooledCount > 1 ? 's' : ''}`}
                </div>
              </motion.div>
            )}

            {/* Options revealed */}
            <div className="col gap-8">
              {options.map((opt, idx) => {
                const author = opt.authorId ? game?.players?.[opt.authorId] : null
                const votesForThis = Object.values(votes).filter(v => Number(v) === idx).length

                return (
                  <motion.div
                    key={idx}
                    className="card"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.06 }}
                    style={{
                      background: opt.isReal ? 'rgba(30,107,60,0.12)' : 'var(--surface)',
                      borderColor: opt.isReal ? 'rgba(30,107,60,0.45)' : 'var(--border)',
                    }}
                  >
                    <div className="row gap-10" style={{ alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: opt.isReal ? 700 : 500, fontSize: '0.92rem', color: opt.isReal ? '#52b788' : undefined }}>
                          {opt.isReal && '🐊 '}{opt.text}
                        </div>
                        <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--text3)' }}>
                          {opt.isReal ? 'The real answer' : author ? `Written by ${author.name}` : ''}
                          {votesForThis > 0 && ` · ${votesForThis} vote${votesForThis > 1 ? 's' : ''}`}
                        </div>
                      </div>
                      {author && !opt.isReal && (
                        <Avatar src={author.avatar} name={author.name} colorHex={author.colorHex} size={28} />
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {noneRight && (
              <motion.div
                className="card col center gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                style={{ background: 'rgba(181,42,42,0.08)', borderColor: 'rgba(181,42,42,0.3)' }}
              >
                <div style={{ fontSize: '1.2rem' }}>🐊💀</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 700 }}>Nobody got it right — −25 for everyone!</div>
              </motion.div>
            )}

            {/* Next question / end round */}
            {isController && (
              <motion.button
                className="btn btn-primary btn-lg btn-block"
                onClick={handleNext}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ background: '#1e6b3c', borderColor: '#1e6b3c' }}
              >
                {loading
                  ? <div className="loading-dots"><span /><span /><span /></div>
                  : qIndex + 1 >= totalQs ? 'Finish Round →' : 'Next Question →'}
              </motion.button>
            )}
            {!isController && (
              <motion.div className="card center" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
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
