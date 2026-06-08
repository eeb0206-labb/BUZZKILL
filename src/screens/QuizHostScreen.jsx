/**
 * QuizHostScreen — the host plays as a normal player, with controller UI layered on top.
 *
 * Base experience (everyone including host):
 *   - Sees the question
 *   - Has a buzzer + answer input (no-QM mode)
 *   - Sees their score, their powerups
 *   - Locked out after a wrong answer (iWasWrong)
 *
 * Controller extras (layered on top):
 *   - Skip Question / Next Question buttons
 *   - Pause button (future)
 *   - Scoreboard for all players
 *   - Powerup activity view
 *
 * QM mode (question master — replaces buzzer with marking panel):
 *   - See the answer + hint at all times
 *   - ✓ Correct / ✗ Wrong buttons when someone buzzes
 *   - No buzzer for themselves
 */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, TimerRing, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { generateQuizQuestions } from '../hooks/useAI'
import { getGenreById } from '../data/genres'
import SettingsOverlay from '../components/SettingsOverlay'

// Loose answer comparison — strips stop words, allows substring match
function answersMatch(submitted, correct) {
  if (!submitted || !correct) return false
  const stopWords = new Set(['the','a','an','of','in','at','for','to','and','or','is','was'])
  const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
  const strip = s => s.split(' ').filter(w => w && !stopWords.has(w)).join(' ')
  const a = norm(submitted)
  const b = norm(correct)
  if (a === b || a.includes(b) || b.includes(a)) return true
  const as = strip(a); const bs = strip(b)
  if (as && bs && (as === bs || as.includes(bs) || bs.includes(as))) return true
  // Multi-word: all significant words from correct appear in submitted
  const bWords = bs.split(' ').filter(w => w.length > 2)
  if (bWords.length >= 2 && bWords.every(w => as.includes(w))) return true
  return false
}

export default function QuizHostScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const isGameScreen = store.isGameScreen()
  const setScreen = store.setScreen
  const {
    subscribeToGame, markAnswer, nextQuestion, loadFirstQuestion,
    clearBuzzer, buzzIn,
  } = useGame()
  const { playCorrect, playWrong, playBuzz, playSkip, startMusic, stopMusic, undimMusic } = useSound()

  const [questions, setQuestions] = useState([])
  const questionsRef = useRef([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const timerRef = useRef(null)
  const [questionTimer, setQuestionTimer] = useState(0)
  const questionTimerRef = useRef(null)
  const autoAdvancingRef = useRef(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  // Host-as-player state
  const [myAnswer, setMyAnswer] = useState('')
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [ripples, setRipples] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const buzzerRef = useRef(null)

  const settings = store.getSettings()
  const isQM = !!settings.questionMaster
  const genre = game?.currentGenre
  const currentQ = game?.currentQ
  const buzzer = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const wrongAnswerers = game?.wrongAnswerers || []
  const isBuzzing = buzzer?.playerId === myId
  const someoneBuzzing = !!buzzer
  const me = game?.players?.[myId]
  const myColor = me?.colorHex || '#a855f7'
  const iWasWrong = wrongAnswerers.includes(myId)
  const isMyTurnForced = isBuzzing && buzzer?.forcedBy
  const hasDoublePoints = game?.powerupRound?.[myId]
  const myPowerups = me?.powerups || {}

  // Players list: QM is excluded from participants (they mark answers, not play)
  // In no-QM mode everyone including the host plays, so include them all
  const allParticipants = Object.values(game?.players || {}).filter(p => {
    if (p.role === 'gamescreen') return false
    if (isQM && p.id === myId) return false // QM doesn't participate or earn points
    return true
  })

  // ── Reset on new question ────────────────────────────────────────────────────
  useEffect(() => {
    setMyAnswer('')
    setAnswerSubmitted(false)
  }, [game?.currentQIndex])

  // ── Subscribe ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'final') setScreen('final')
      if (g.state === 'round-pick') setScreen('round-pick')
    })
    return unsub
  }, [gameCode])

  // ── Load questions on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!genre || questions.length > 0) return
    loadQuestions()
  }, [genre?.id])

  // ── Music ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    startMusic(0.05)
    return () => stopMusic()
  }, [])

  async function loadQuestions() {
    setLoadingQ(true)
    const genreData = getGenreById(genre?.id)
    const apiKey = settings.anthropicApiKey || ''
    const insideJokes = game?.insideJokes ? Object.values(game.insideJokes) : []
    const count = settings.questionsPerRound || 8
    let qs = null
    if (apiKey) qs = await generateQuizQuestions(apiKey, genreData, count, insideJokes)
    if (!qs || qs.length === 0) {
      qs = [...(genreData?.questions || [])].sort(() => Math.random() - 0.5).slice(0, count)
    }
    setQuestions(qs)
    questionsRef.current = qs
    if (qs.length > 0) await loadFirstQuestion(gameCode, qs)
    setLoadingQ(false)
  }

  // ── Answer timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!buzzer || !settings.timers?.quizAnswer) return
    const total = settings.timers.quizAnswer
    setTimerSeconds(total); setTimerTotal(total)
    timerRef.current = setInterval(() => {
      setTimerSeconds(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleMark(false) // auto-wrong on timeout (QM mode)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [buzzer?.timestamp])

  useEffect(() => {
    if (!buzzer && timerRef.current) { clearInterval(timerRef.current); setTimerSeconds(0) }
  }, [buzzer])

  // ── Question display timer: auto-advance if no one buzzes in time ────────────
  useEffect(() => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current)
    const questionTime = settings.timers?.quizQuestion
    if (!currentQ || !questionTime || game?.buzzer || !isController) {
      setQuestionTimer(0)
      return
    }
    setQuestionTimer(questionTime)
    questionTimerRef.current = setInterval(() => {
      setQuestionTimer(t => {
        if (t <= 1) {
          clearInterval(questionTimerRef.current)
          if (!autoAdvancingRef.current) {
            autoAdvancingRef.current = true
            nextQuestion(gameCode, game, questionsRef.current).then(() => {
              autoAdvancingRef.current = false
            })
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(questionTimerRef.current)
  }, [game?.currentQIndex, game?.buzzer, settings.timers?.quizQuestion, isController])

  // ── Auto-advance: correct answer accepted ────────────────────────────────────
  useEffect(() => {
    if (isQM) return
    if (!game?.answerRevealed || game?.buzzer) return
    if (autoAdvancingRef.current) return
    autoAdvancingRef.current = true
    const t = setTimeout(async () => {
      await nextQuestion(gameCode, game, questionsRef.current)
      autoAdvancingRef.current = false
    }, 1500)
    return () => clearTimeout(t)
  }, [isQM, game?.answerRevealed, game?.buzzer, gameCode])

  // ── Auto-advance: ALL eligible players guessed wrong ─────────────────────────
  useEffect(() => {
    if (!isController || game?.buzzer || game?.answerRevealed) return
    if (wrongAnswerers.length === 0) return
    const eligible = allParticipants.length || 1
    if (wrongAnswerers.length < eligible) return
    // Everyone's out — wait 2s then skip to next question
    if (autoAdvancingRef.current) return
    autoAdvancingRef.current = true
    const t = setTimeout(async () => {
      await nextQuestion(gameCode, game, questionsRef.current)
      autoAdvancingRef.current = false
    }, 2000)
    return () => { clearTimeout(t); autoAdvancingRef.current = false }
  }, [wrongAnswerers.length, allParticipants.length, game?.buzzer, game?.answerRevealed, isController, gameCode])

  // ── QM mode: mark correct/wrong ──────────────────────────────────────────────
  async function handleMark(correct) {
    if (timerRef.current) clearInterval(timerRef.current)
    await markAnswer(gameCode, game, correct)
    if (correct) { playCorrect(); undimMusic(); setTimeout(() => handleNext(), 1200) }
    else { playWrong(); undimMusic() }
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

  // ── No-QM: host buzzes in (same as player screen) ────────────────────────────
  const handleHostBuzz = useCallback((e) => {
    e?.preventDefault()
    if (isQM || isGameScreen) return
    const rect = buzzerRef.current?.getBoundingClientRect()
    if (rect) {
      const touch = e?.touches?.[0] || e
      const ripple = { id: Date.now(), x: ((touch.clientX - rect.left) / rect.width) * 100, y: ((touch.clientY - rect.top) / rect.height) * 100 }
      setRipples(r => [...r, ripple])
      setTimeout(() => setRipples(r => r.filter(rr => rr.id !== ripple.id)), 600)
    }
    if (iWasWrong) {
      // Same as player screen — locked out, play fart
      return
    }
    if (someoneBuzzing && !isBuzzing) return
    if (!someoneBuzzing) {
      playBuzz(me?.colorId || 'blue')
      buzzIn(gameCode, myId, me?.colorId)
    }
  }, [isQM, isGameScreen, iWasWrong, someoneBuzzing, isBuzzing, me, gameCode, myId, playBuzz, buzzIn])

  // ── No-QM: host submits answer ────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(async () => {
    if (!myAnswer.trim() || answerSubmitted) return
    setAnswerSubmitted(true)
    const correct = answersMatch(myAnswer, currentQ?.a)
    if (timerRef.current) clearInterval(timerRef.current)
    await markAnswer(gameCode, game, correct)
    if (correct) { playCorrect(); undimMusic() }
    else { playWrong(); undimMusic() }
    // nextQuestion on correct handled by auto-advance effect
  }, [myAnswer, answerSubmitted, currentQ, gameCode, game, markAnswer, playCorrect, playWrong, undimMusic])

  const qIndex = game?.currentQIndex || 0
  const totalQ = settings.questionsPerRound || 8

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
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="row gap-8">
          <div className="round-badge">{genre?.emoji} Q{qIndex + 1}/{totalQ}</div>
          {hasDoublePoints && <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>✖️×2</div>}
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: isQM ? 'var(--gold)' : myColor }}>
          {isQM ? '🎤 QM' : me?.name}
        </div>
        <div className="row gap-8">
          {!isQM && <div style={{ fontFamily: 'var(--font-mono)', color: myColor, fontWeight: 700 }}>{me?.score || 0}</div>}
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 10 }}>
        {/* ── Progress bar ────────────────────────────────────────────────── */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(qIndex / totalQ) * 100}%` }} />
        </div>

        {/* ── Question timer countdown (time to buzz) ──────────────────────── */}
        {questionTimer > 0 && settings.timers?.quizQuestion > 0 && !game?.buzzer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: questionTimer < 10 ? 'var(--red)' : 'var(--accent)', borderRadius: 2 }}
                animate={{ width: `${(questionTimer / settings.timers.quizQuestion) * 100}%` }}
                transition={{ duration: 0.8, ease: 'linear' }}
              />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: questionTimer < 10 ? 'var(--red)' : 'var(--text3)', minWidth: 28, textAlign: 'right', fontWeight: 700 }}>
              {questionTimer}s
            </div>
          </div>
        )}

        {/* ── Question card ────────────────────────────────────────────────── */}
        {currentQ && (
          <motion.div
            className="question-card"
            key={qIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ borderColor: isBuzzing ? myColor : undefined }}
          >
            <div className="row gap-8" style={{ marginBottom: 10 }}>
              <div className="caption">Q{qIndex + 1}</div>
              {wrongAnswerers.length > 0 && (
                <span className="tag" style={{ background: 'rgba(244,208,63,0.1)', color: 'var(--gold)', border: '1px solid rgba(244,208,63,0.3)', fontSize: '0.65rem' }}>
                  🔥 {100 + (game?.potAmount || 0)} pts
                </span>
              )}
            </div>
            <div className="question-text">{currentQ.q}</div>

            {/* ANSWER — only visible to QM (not to playing host in no-QM mode) */}
            {isQM && (
              <div className="answer-text">✓ {currentQ.a}</div>
            )}

            {/* HINT — QM sees it always; players see it after first wrong answer */}
            {currentQ.hint && (isQM || wrongAnswerers.length > 0) && (
              <motion.div
                className="hint-text"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                💡 {currentQ.hint}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Buzz indicator (who buzzed) ─────────────────────────────────── */}
        <AnimatePresence>
          {buzzedPlayer && (
            <motion.div
              className="buzz-indicator"
              key={buzzer?.timestamp}
              style={{ borderColor: buzzedPlayer.colorHex, background: `${buzzedPlayer.colorHex}11` }}
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
                  {game?.powerupRound?.[buzzedPlayer.id] ? '✖️ Double Points · ' : ''}
                  {wrongAnswerers.length > 0
                    ? `🔥 Pot: ${100 + (game?.potAmount || 0)} pts`
                    : 'Buzzed in'}
                </div>
              </div>
              {timerSeconds > 0 && <TimerRing seconds={timerSeconds} total={timerTotal} size={56} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── QM mode: ✓/✗ marking buttons ─────────────────────────────────── */}
        {isQM && isController && buzzedPlayer && (
          <motion.div className="row gap-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <motion.button className="btn btn-green btn-lg flex-1" whileTap={{ scale: 0.94 }} onClick={() => handleMark(true)}>
              ✓ Correct
              <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: 4 }}>
                +{(100 + (game?.potAmount || 0)) * (game?.powerupRound?.[buzzer?.playerId] ? 2 : 1)}
              </span>
            </motion.button>
            <motion.button className="btn btn-red btn-lg flex-1" whileTap={{ scale: 0.94 }} onClick={() => handleMark(false)}>
              ✗ Wrong <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: 4 }}>-25</span>
            </motion.button>
          </motion.div>
        )}

        {/* ── No-QM: HOST BUZZER (same as player screen) ──────────────────── */}
        {!isQM && !isGameScreen && (
          <div className="col gap-8">
            <div className="buzzer-wrap" style={{ flex: 'none', minHeight: 160 }}>
              <motion.button
                ref={buzzerRef}
                className={`buzzer ${(someoneBuzzing && !isBuzzing) || iWasWrong ? 'buzzer-disabled' : ''} ${isBuzzing ? 'buzzer-glow' : ''}`}
                style={{
                  background: iWasWrong
                    ? 'radial-gradient(circle at 35% 35%, #555, #333)'
                    : `radial-gradient(circle at 35% 35%, ${myColor}ee, ${myColor}99)`,
                  '--player-color': myColor,
                  height: 150,
                  boxShadow: isBuzzing
                    ? `0 0 40px ${myColor}99, 0 0 80px ${myColor}44, inset 0 2px 0 rgba(255,255,255,0.25)`
                    : iWasWrong ? 'none'
                    : `0 8px 24px ${myColor}44, inset 0 2px 0 rgba(255,255,255,0.2)`,
                }}
                whileTap={!someoneBuzzing && !iWasWrong ? { scale: 0.91, y: 4 } : {}}
                onMouseDown={handleHostBuzz}
                onTouchStart={handleHostBuzz}
              >
                {ripples.map(r => (
                  <div key={r.id} className="buzzer-ripple" style={{ left: `${r.x}%`, top: `${r.y}%` }} />
                ))}
                <AnimatePresence mode="wait">
                  {isBuzzing ? (
                    <motion.div key="buzzing" className="col center" style={{ gap: 6 }}
                      initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                      <motion.div style={{ fontSize: '2rem' }} animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}>✏️</motion.div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>TYPE IT!</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{me?.name}</div>
                      {timerSeconds > 0 && <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{timerSeconds}s</div>}
                    </motion.div>
                  ) : someoneBuzzing ? (
                    <motion.div key="other" className="col center" style={{ gap: 6 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '1.8rem' }}>🔕</div>
                      <div style={{ fontWeight: 700 }}>{buzzedPlayer?.name}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>is answering</div>
                    </motion.div>
                  ) : iWasWrong ? (
                    <motion.div key="wrong" className="col center" style={{ gap: 6 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '2rem' }}>✗</div>
                      <div style={{ fontWeight: 700 }}>OUT</div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>Already answered</div>
                    </motion.div>
                  ) : (
                    <motion.div key="ready" className="col center" style={{ gap: 6 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <motion.div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.05em' }}
                        animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>BUZZ!</motion.div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{me?.name}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Answer input when host has buzzed */}
            <AnimatePresence>
              {isBuzzing && (
                <motion.div className="col gap-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <input
                    className="input"
                    placeholder="Type your answer..."
                    value={myAnswer}
                    onChange={e => setMyAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer()}
                    autoFocus
                    style={{ fontSize: '1.1rem', textAlign: 'center' }}
                  />
                  <button className="btn btn-gold btn-lg" onClick={handleSubmitAnswer} disabled={!myAnswer.trim() || answerSubmitted}>
                    Submit Answer →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Forced to answer notification ────────────────────────────────── */}
        <AnimatePresence>
          {isMyTurnForced && (
            <motion.div style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid var(--red)', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              😈 Forced to answer by {game?.players?.[buzzer?.forcedBy]?.name}!
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Wrong answerers ──────────────────────────────────────────────── */}
        {wrongAnswerers.length > 0 && (
          <div className="card" style={{ padding: '8px 14px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Got it wrong</div>
            <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
              {wrongAnswerers.map(pid => {
                const p = game?.players?.[pid]
                if (!p) return null
                return (
                  <div key={pid} className="row gap-4" style={{ background: 'rgba(230,57,70,0.1)', padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem' }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={20} />
                    {p.name}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Controller extras: skip / clear buzzer ───────────────────────── */}
        {isController && (
          <div className="row gap-8">
            {buzzedPlayer && (
              <button className="btn btn-ghost flex-1" onClick={() => clearBuzzer(gameCode)}>Clear Buzzer</button>
            )}
            <button className="btn btn-ghost flex-1" onClick={() => setShowSkipConfirm(true)}>⏭ Skip</button>
          </div>
        )}

        {/* ── Scoreboard ───────────────────────────────────────────────────── */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Scores</div>
          <div className="col gap-6">
            {[...allParticipants].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, i) => (
              <div key={p.id} className="row gap-8">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)', width: 16 }}>#{i + 1}</div>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex || 'var(--text)', fontSize: '0.9rem', fontWeight: 700 }}>{p.score || 0}</div>
                {game?.powerupRound?.[p.id] && <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>×2</div>}
                {wrongAnswerers.includes(p.id) && <div style={{ fontSize: '0.72rem', color: 'var(--red)' }}>✗</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Skip confirm modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSkipConfirm && (
          <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card col gap-12" style={{ maxWidth: 320, width: '100%' }}
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
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

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
