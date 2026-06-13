/**
 * TrueFalseScreen — Strange but (maybe) true facts.
 * Everyone answers simultaneously — no buzzer.
 * Correct = +100 pts (×2 with double points). Wrong = −25 (×2 with double points).
 *
 * Phases: 'question' → 'reveal' → (next / end round)
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

const VOTE_TIME = 15

export default function TrueFalseScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const {
    subscribeToGame, startTrueOrFalse,
    submitTFAnswer, revealTFResults, nextTFQuestion, endTFRound,
  } = useGame()
  const { playCorrect, playWrong, playRoundOver, startMusic, stopMusic } = useSound()

  const [timeLeft, setTimeLeft]     = useState(VOTE_TIME)
  const [showSettings, setShowSettings] = useState(false)
  const timerRef = useRef(null)
  const autoRef  = useRef(false)

  const phase       = game?.tfPhase
  const question    = game?.tfQuestion
  const submissions = game?.tfSubmissions || {}
  const players     = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const genre       = game?.currentGenre
  const count       = (game?.tfCount || 1)
  const roundLimit  = game?.settings?.questionsPerRound || 8
  const myAnswer    = submissions[myId]
  const totalVoted  = Object.keys(submissions).length

  // Timer
  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase !== 'question' || !game?.tfStartAt) return
    const tick = () => setTimeLeft(Math.max(0, Math.ceil(VOTE_TIME - (Date.now() - game.tfStartAt) / 1000)))
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.tfStartAt])

  // Auto-reveal when timer hits 0 or all answered
  useEffect(() => {
    if (phase !== 'question' || !isController || autoRef.current || game?.gamePaused) return
    if (timeLeft === 0 || totalVoted >= players.length) {
      autoRef.current = true
      setTimeout(() => handleReveal(), 600)
    }
  }, [timeLeft, totalVoted, players.length, phase, isController])

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

  // Auto-start first question
  useEffect(() => {
    if (!isController || phase || !genre) return
    startTrueOrFalse(gameCode, game)
  }, [isController, phase, genre?.id, gameCode])

  // Reset autoRef on new question
  useEffect(() => { autoRef.current = false }, [question?.statement])

  async function handleAnswer(answer) {
    if (myAnswer !== undefined) return
    await submitTFAnswer(gameCode, myId, answer)
  }

  async function handleReveal() {
    await revealTFResults(gameCode, game)
    const correct = game?.tfQuestion?.answer
    // sounds handled per-player in reveal
    autoRef.current = false
  }

  // On reveal, play sound for this player
  useEffect(() => {
    if (phase !== 'reveal' || myAnswer === undefined) return
    if (myAnswer === question?.answer) playCorrect()
    else playWrong()
  }, [phase])

  const trueCount  = Object.values(submissions).filter(v => v === true).length
  const falseCount = Object.values(submissions).filter(v => v === false).length

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} True or False</div>
        <div className="topbar-logo" style={{ color: '#10b981' }}>🤔 {count}/{roundLimit}</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 16 }}>

        {/* Timer bar */}
        {phase === 'question' && (
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ background: timeLeft <= 5 ? 'var(--red)' : '#10b981' }}
              animate={{ width: `${(timeLeft / VOTE_TIME) * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>
        )}

        {/* Statement card */}
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={question.statement}
              className="card col center gap-10"
              style={{ textAlign: 'center', padding: '28px 20px', background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.25)' }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <div style={{ fontSize: '2.2rem' }}>🤔</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 4.5vw, 1.45rem)', lineHeight: 1.35 }}>
                "{question.statement}"
              </div>
              {phase === 'question' && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                  {totalVoted}/{players.length} answered · {timeLeft}s left
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* VOTE phase — TRUE / FALSE buttons */}
        {phase === 'question' && (
          <div className="row gap-12" style={{ minHeight: 130 }}>
            {[
              { answer: true,  label: '✅ TRUE',  color: '#10b981' },
              { answer: false, label: '❌ FALSE', color: '#e63946' },
            ].map(({ answer, label, color }) => (
              <motion.button
                key={String(answer)}
                className="flex-1 col center gap-8"
                style={{
                  borderRadius: 16, padding: 20,
                  border: `2px solid ${myAnswer === answer ? color : 'var(--border)'}`,
                  background: myAnswer === answer ? `${color}18` : 'var(--surface)',
                  cursor: myAnswer !== undefined ? 'default' : 'pointer',
                }}
                whileTap={myAnswer === undefined ? { scale: 0.95 } : {}}
                onClick={() => handleAnswer(answer)}
              >
                <div style={{ fontSize: '2.6rem' }}>{answer ? '✅' : '❌'}</div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: myAnswer === answer ? color : 'var(--text)' }}>
                  {answer ? 'TRUE' : 'FALSE'}
                </div>
                {myAnswer === answer && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color }}>✓ Locked in</div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* REVEAL phase */}
        {phase === 'reveal' && question && (
          <motion.div className="col gap-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Answer banner */}
            <motion.div
              className="card col center gap-8"
              style={{
                background: question.answer ? 'rgba(16,185,129,0.1)' : 'rgba(230,57,70,0.1)',
                borderColor: question.answer ? 'rgba(16,185,129,0.4)' : 'rgba(230,57,70,0.4)',
                textAlign: 'center', padding: '22px 16px',
              }}
              initial={{ scale: 0.85 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: question.answer ? '#10b981' : '#e63946' }}>
                {question.answer ? '✅ TRUE' : '❌ FALSE'}
              </div>
              {question.fact && (
                <div style={{ fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.55, marginTop: 4 }}>
                  {question.fact}
                </div>
              )}
            </motion.div>

            {/* My result */}
            {myAnswer !== undefined && (
              <motion.div
                className="card col center gap-6"
                style={{
                  background: myAnswer === question.answer ? 'rgba(87,204,153,0.08)' : 'rgba(230,57,70,0.08)',
                  borderColor: myAnswer === question.answer ? 'rgba(87,204,153,0.3)' : 'rgba(230,57,70,0.3)',
                }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              >
                {myAnswer === question.answer ? (
                  <>
                    <div style={{ fontSize: '1.5rem' }}>🎉</div>
                    <div style={{ fontWeight: 700, color: 'var(--green)' }}>Correct! +100 pts</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.5rem' }}>😬</div>
                    <div style={{ fontWeight: 700, color: 'var(--red)' }}>Wrong! −25 pts</div>
                  </>
                )}
              </motion.div>
            )}

            {/* Who got what */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 10 }}>The room's answers</div>
              <div className="col gap-6">
                {players.map(p => {
                  const sub = submissions[p.id]
                  const correct = sub === question.answer
                  const noAns = sub === undefined
                  return (
                    <div key={p.id} className="row gap-8">
                      <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                      <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      <span style={{ fontSize: '0.85rem' }}>
                        {noAns ? '–' : sub ? '✅ True' : '❌ False'}
                      </span>
                      {!noAns && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: correct ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                          {correct ? '+100' : '−25'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {isController && (
              <div className="row gap-8">
                <button className="btn btn-ghost flex-1" onClick={() => endTFRound(gameCode)}>End Round</button>
                <button className="btn btn-gold flex-1" onClick={() => nextTFQuestion(gameCode, game)}>Next Statement →</button>
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
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Starting True or False…</div>
          </div>
        )}

      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
