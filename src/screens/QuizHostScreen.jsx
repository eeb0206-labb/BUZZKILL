import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, TimerRing, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { generateQuizQuestions } from '../hooks/useAI'
import { getGenreById } from '../data/genres'

export default function QuizHostScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const isGameScreen = store.isGameScreen()
  const setScreen = store.setScreen
  const {
    subscribeToGame, markAnswer, nextQuestion, loadFirstQuestion,
    clearBuzzer, usePowerup, forceAnswer, buzzIn,
  } = useGame()

  const { playCorrect, playWrong, playBuzz, playSkip, startMusic, stopMusic, dimMusic, undimMusic } = useSound()

  const [questions, setQuestions] = useState([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const timerRef = useRef(null)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [imposterTarget, setImposterTarget] = useState(null)

  const settings = store.getSettings()
  const genre = game?.currentGenre
  const currentQ = game?.currentQ
  const buzzer = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const wrongAnswerers = game?.wrongAnswerers || []
  const players = Object.values(game?.players || {}).filter(p => p.role === 'player')

  // Subscribe
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'final') setScreen('final')
      if (g.state === 'round-pick') setScreen('round-pick')
    })
    return unsub
  }, [gameCode])

  // Load questions on mount
  useEffect(() => {
    if (!genre || questions.length > 0) return
    loadQuestions()
  }, [genre?.id])

  // Start music
  useEffect(() => {
    startMusic(0.4)
    return () => stopMusic()
  }, [])

  async function loadQuestions() {
    setLoadingQ(true)
    const genreData = getGenreById(genre?.id)
    const apiKey = settings.anthropicApiKey || ''
    const insideJokes = game?.insideJokes ? Object.values(game.insideJokes) : []
    const count = settings.questionsPerRound || 8

    let qs = null
    if (apiKey) {
      qs = await generateQuizQuestions(apiKey, genreData, count, insideJokes)
    }

    if (!qs || qs.length === 0) {
      // Use built-in questions
      qs = [...(genreData?.questions || [])].sort(() => Math.random() - 0.5).slice(0, count)
    }

    setQuestions(qs)
    if (qs.length > 0) {
      await loadFirstQuestion(gameCode, qs)
    }
    setLoadingQ(false)
  }

  // Answer timer (for answer window)
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!buzzer || !settings.timers?.quizAnswer) return

    const total = settings.timers.quizAnswer
    setTimerSeconds(total)
    setTimerTotal(total)

    timerRef.current = setInterval(() => {
      setTimerSeconds(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          // Auto wrong
          handleMark(false)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [buzzer?.timestamp])

  // Clear timer when buzzer clears
  useEffect(() => {
    if (!buzzer && timerRef.current) {
      clearInterval(timerRef.current)
      setTimerSeconds(0)
    }
  }, [buzzer])

  async function handleMark(correct) {
    if (timerRef.current) clearInterval(timerRef.current)
    const delta = await markAnswer(gameCode, game, correct)
    if (correct) { playCorrect(); undimMusic() }
    else { playWrong(); undimMusic() }

    // Show score delta briefly then move on
    if (correct) {
      setTimeout(() => handleNext(), 1200)
    } else {
      undimMusic()
    }
  }

  async function handleNext() {
    await nextQuestion(gameCode, game, questions)
    undimMusic()
  }

  async function handleSkip() {
    if (timerRef.current) clearInterval(timerRef.current)
    await clearBuzzer(gameCode)
    playSkip()
    await nextQuestion(gameCode, game, questions)
    setShowSkipConfirm(false)
    undimMusic()
  }

  const qIndex = game?.currentQIndex || 0
  const totalQ = settings.questionsPerRound || 8

  // Get score delta for display
  function getDeltaInfo() {
    if (!buzzer?.playerId) return null
    const isBonus = wrongAnswerers.length > 0
    const hasDouble = game?.powerupRound?.[buzzer.playerId]
    return { isBonus, hasDouble }
  }

  if (loadingQ) {
    return (
      <div className="screen center">
        <div className="loading-dots"><span /><span /><span /></div>
        <p className="muted" style={{ marginTop: 12 }}>Loading questions...</p>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div className="row gap-8">
          <div className="round-badge">{genre?.emoji} {genre?.name}</div>
          <div className="caption" style={{ color: 'var(--text3)' }}>Q{qIndex + 1}/{totalQ}</div>
        </div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Progress bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((qIndex) / totalQ) * 100}%` }} />
        </div>

        {/* Current question */}
        {currentQ && (
          <motion.div
            className="question-card"
            key={qIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="row gap-8" style={{ marginBottom: 10 }}>
              <div className="caption">Q{qIndex + 1}</div>
              {wrongAnswerers.length > 0 && (
                <span className="tag" style={{ background: 'rgba(244,208,63,0.1)', color: 'var(--gold)', border: '1px solid rgba(244,208,63,0.3)', fontSize: '0.65rem' }}>
                  +50 bonus available
                </span>
              )}
            </div>
            <div className="question-text">{currentQ.q}</div>

            {/* ANSWER — always visible to host */}
            <div className="answer-text">
              ✓ {currentQ.a}
            </div>

            {/* Hint — always visible to host */}
            {currentQ.hint && (
              <div className="hint-text">💡 {currentQ.hint}</div>
            )}
          </motion.div>
        )}

        {/* Buzz indicator */}
        <AnimatePresence>
          {buzzedPlayer && (
            <motion.div
              className="buzz-indicator"
              key={buzzer?.timestamp}
              style={{ borderColor: buzzedPlayer.colorHex || 'var(--accent)', background: `${buzzedPlayer.colorHex}11` }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Avatar src={buzzedPlayer.avatar} name={buzzedPlayer.name} colorHex={buzzedPlayer.colorHex} size={48} />
              <div className="flex-1">
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: buzzedPlayer.colorHex }}>
                  {buzzedPlayer.name}
                  {buzzer.forcedBy && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text2)', marginLeft: 8 }}>
                      (forced by {game?.players?.[buzzer.forcedBy]?.name})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                  {game?.powerupRound?.[buzzedPlayer.id] ? '✖️ Double Points Active' : ''}
                  {wrongAnswerers.length > 0 ? ' · Bonus question!' : ''}
                </div>
              </div>
              {timerSeconds > 0 && (
                <TimerRing seconds={timerSeconds} total={timerTotal} size={56} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mark correct/wrong — only when someone buzzed */}
        {isController && buzzedPlayer && (
          <motion.div
            className="row gap-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.button
              className="btn btn-green btn-lg flex-1"
              whileTap={{ scale: 0.94 }}
              onClick={() => handleMark(true)}
            >
              ✓ Correct
              <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: 4 }}>
                +{(100 + (wrongAnswerers.length > 0 ? 50 : 0)) * (game?.powerupRound?.[buzzer?.playerId] ? 2 : 1)}
              </span>
            </motion.button>
            <motion.button
              className="btn btn-red btn-lg flex-1"
              whileTap={{ scale: 0.94 }}
              onClick={() => handleMark(false)}
            >
              ✗ Wrong
              <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: 4 }}>-25</span>
            </motion.button>
          </motion.div>
        )}

        {/* Skip / Clear buzzer controls */}
        {isController && (
          <div className="row gap-8">
            {buzzedPlayer && (
              <button className="btn btn-ghost flex-1" onClick={() => clearBuzzer(gameCode)}>
                Clear Buzzer
              </button>
            )}
            <button className="btn btn-ghost flex-1" onClick={() => setShowSkipConfirm(true)}>
              ⏭ Skip Question
            </button>
          </div>
        )}

        {/* Wrong answerers list */}
        {wrongAnswerers.length > 0 && (
          <div className="card">
            <div className="caption" style={{ marginBottom: 8 }}>Got it wrong:</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {wrongAnswerers.map(pid => {
                const p = game?.players?.[pid]
                if (!p) return null
                return (
                  <div key={pid} className="row gap-4" style={{ background: 'rgba(230,57,70,0.1)', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem' }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={20} />
                    {p.name}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Scores</div>
          <div className="col gap-6">
            {[...players].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, i) => (
              <div key={p.id} className="row gap-8">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)', width: 16 }}>#{i + 1}</div>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex || 'var(--text)', fontSize: '0.9rem', fontWeight: 700 }}>
                  {p.score || 0}
                </div>
                {game?.powerupRound?.[p.id] && <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>×2</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Imposter powerup */}
        {isController && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>😈 Imposter (force answer)</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {players.filter(p => (p.powerups?.imposter || 0) > 0 && p.id !== myId).map(p => (
                <button
                  key={p.id}
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: p.colorHex, color: p.colorHex }}
                  onClick={() => setImposterTarget(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skip confirm */}
      <AnimatePresence>
        {showSkipConfirm && (
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="card col gap-12"
              style={{ maxWidth: 320, width: '100%' }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem' }}>Skip this question?</div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>No points awarded or deducted.</div>
              <div className="row gap-8">
                <button className="btn btn-ghost flex-1" onClick={() => setShowSkipConfirm(false)}>Cancel</button>
                <button className="btn btn-gold flex-1" onClick={handleSkip}>Skip ⏭</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast />
    </div>
  )
}
