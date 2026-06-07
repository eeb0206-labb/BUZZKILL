/**
 * MusicBangersScreen — hear the clip, buzz to name the song + artist.
 *
 * Host controls:
 *  - Play / pause clip
 *  - Replay from start
 *  - Reveal answer (if no-QM)
 *  - Skip to next song
 *
 * Players: same buzzer as QuizPlayerScreen.
 * Host in no-QM: same buzzer + answer input as QuizHostScreen.
 * QM: marks correct / wrong.
 *
 * ⚠️  Clip URLs are in genres.js → musicbangers.questions[].clipUrl
 *     Add real 15s clip URLs there. The audio element handles any direct URL.
 *     If clipUrl is empty, a placeholder UI is shown with the song title hidden.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, TimerRing, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import { getGenreById } from '../data/genres'
import SettingsOverlay from '../components/SettingsOverlay'

function answersMatch(submitted, correct) {
  if (!submitted || !correct) return false
  const stopWords = new Set(['the','a','an','of','in','ft','feat','by'])
  const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
  const strip = s => s.split(' ').filter(w => w && !stopWords.has(w)).join(' ')
  const a = norm(submitted); const b = norm(correct)
  if (a === b || a.includes(b) || b.includes(a)) return true
  // Accept just artist or just title (either half)
  const [title, artist] = correct.split(' - ').map(p => norm(p.trim()))
  if (title && (norm(submitted).includes(norm(title)) || norm(title).includes(norm(submitted)))) return true
  if (artist && (norm(submitted).includes(norm(artist)) || norm(artist).includes(norm(submitted)))) return true
  const as = strip(a); const bs = strip(b)
  return as && bs && (as === bs || as.includes(bs) || bs.includes(as))
}

export default function MusicBangersScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const isGameScreen = store.isGameScreen()
  const {
    subscribeToGame, markAnswer, nextQuestion, loadFirstQuestion,
    clearBuzzer, buzzIn,
  } = useGame()
  const { playCorrect, playWrong, playBuzz, playSkip, startMusic, stopMusic, undimMusic } = useSound()
  const settings = store.getSettings()
  const isQM = !!settings.questionMaster

  const [questions, setQuestions] = useState([])
  const questionsRef = useRef([])
  const [loaded, setLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [myAnswer, setMyAnswer] = useState('')
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ripples, setRipples] = useState([])
  const buzzerRef = useRef(null)
  const audioRef = useRef(null)
  const autoAdvRef = useRef(false)

  const genre = game?.currentGenre
  const currentQ = game?.currentQ
  const buzzer = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const wrongAnswerers = game?.wrongAnswerers || []
  const isBuzzing = buzzer?.playerId === myId
  const someoneBuzzing = !!buzzer
  const me = game?.players?.[myId]
  const myColor = me?.colorHex || '#f72585'
  const iWasWrong = wrongAnswerers.includes(myId)
  const qIndex = game?.currentQIndex || 0
  const totalQ = settings.questionsPerRound || 8

  const allParticipants = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')

  // ── Load questions ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!genre || questions.length > 0) return
    const genreData = getGenreById(genre?.id)
    const qs = [...(genreData?.questions || [])].sort(() => Math.random() - 0.5).slice(0, totalQ)
    setQuestions(qs)
    questionsRef.current = qs
    if (qs.length > 0) loadFirstQuestion(gameCode, qs).then(() => setLoaded(true))
    else setLoaded(true)
  }, [genre?.id])

  // ── Reset on new question ─────────────────────────────────────────────────
  useEffect(() => {
    setMyAnswer('')
    setAnswerSubmitted(false)
    setIsPlaying(false)
    setAudioError(false)
    autoAdvRef.current = false
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
  }, [qIndex])

  // ── Subscribe ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, g => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final') store.setScreen('final')
      if (g.state === 'lobby') store.setScreen('lobby')
    })
    return unsub
  }, [gameCode])

  // ── Music (dim when playing clip) ─────────────────────────────────────────
  useEffect(() => { startMusic(); return () => stopMusic() }, [])

  // ── Auto-advance: correct ─────────────────────────────────────────────────
  useEffect(() => {
    if (isQM) return
    if (!game?.answerRevealed || game?.buzzer) return
    if (autoAdvRef.current) return
    autoAdvRef.current = true
    const t = setTimeout(async () => {
      await nextQuestion(gameCode, game, questionsRef.current)
      autoAdvRef.current = false
    }, 2000)
    return () => clearTimeout(t)
  }, [isQM, game?.answerRevealed, game?.buzzer, gameCode])

  // ── Auto-advance: all wrong ────────────────────────────────────────────────
  useEffect(() => {
    if (!isController || game?.buzzer || game?.answerRevealed) return
    if (wrongAnswerers.length < allParticipants.length || allParticipants.length === 0) return
    if (autoAdvRef.current) return
    autoAdvRef.current = true
    const t = setTimeout(async () => {
      await nextQuestion(gameCode, game, questionsRef.current)
      autoAdvRef.current = false
    }, 2500)
    return () => { clearTimeout(t); autoAdvRef.current = false }
  }, [wrongAnswerers.length, allParticipants.length, game?.buzzer, game?.answerRevealed, isController])

  // ── Audio control ──────────────────────────────────────────────────────────
  function handlePlayPause() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      undimMusic()
    } else {
      audioRef.current.play().catch(() => setAudioError(true))
      setIsPlaying(true)
    }
  }

  function handleReplay() {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => setAudioError(true))
    setIsPlaying(true)
  }

  // ── QM marking ────────────────────────────────────────────────────────────
  async function handleMark(correct) {
    await markAnswer(gameCode, game, correct)
    if (correct) { playCorrect(); undimMusic(); setTimeout(() => handleNext(), 1200) }
    else { playWrong(); undimMusic() }
  }

  async function handleNext() {
    await nextQuestion(gameCode, game, questionsRef.current)
    undimMusic()
  }

  async function handleSkip() {
    playSkip()
    await nextQuestion(gameCode, game, questionsRef.current)
    undimMusic()
  }

  // ── Buzzer (no-QM) ────────────────────────────────────────────────────────
  const handleBuzz = useCallback((e) => {
    e?.preventDefault()
    if (isGameScreen || isQM) return
    const rect = buzzerRef.current?.getBoundingClientRect()
    if (rect) {
      const touch = e?.touches?.[0] || e
      const ripple = { id: Date.now(), x: ((touch.clientX - rect.left) / rect.width) * 100, y: ((touch.clientY - rect.top) / rect.height) * 100 }
      setRipples(r => [...r, ripple])
      setTimeout(() => setRipples(r => r.filter(rr => rr.id !== ripple.id)), 600)
    }
    if (iWasWrong || (someoneBuzzing && !isBuzzing)) return
    if (!someoneBuzzing) { playBuzz(me?.colorId || 'pink'); buzzIn(gameCode, myId, me?.colorId) }
  }, [isGameScreen, isQM, iWasWrong, someoneBuzzing, isBuzzing, me, gameCode, myId])

  async function handleSubmitAnswer() {
    if (!myAnswer.trim() || answerSubmitted) return
    setAnswerSubmitted(true)
    const correct = answersMatch(myAnswer, currentQ?.a)
    await markAnswer(gameCode, game, correct)
    if (correct) { playCorrect(); undimMusic() }
    else { playWrong(); undimMusic() }
  }

  if (!loaded) {
    return (
      <div className="screen center">
        <div className="loading-dots"><span /><span /><span /></div>
        <p className="muted" style={{ marginTop: 12 }}>Loading Music Bangers…</p>
      </div>
    )
  }

  const clipUrl = currentQ?.clipUrl

  return (
    <div className="screen">
      {/* Hidden audio element */}
      {clipUrl && (
        <audio
          ref={audioRef}
          src={clipUrl}
          onEnded={() => { setIsPlaying(false); undimMusic() }}
          onError={() => setAudioError(true)}
          preload="auto"
        />
      )}

      <div className="topbar">
        <div className="round-badge">🎵 Q{qIndex + 1}/{totalQ}</div>
        <div className="topbar-logo" style={{ color: '#f72585' }}>🎵 Music Bangers</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 12 }}>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(qIndex / totalQ) * 100}%`, background: '#f72585' }} />
        </div>

        {/* ── Music player card ─────────────────────────────────────────────── */}
        {currentQ && (
          <motion.div
            key={qIndex}
            className="card col center gap-14"
            style={{ background: 'rgba(247,37,133,0.06)', borderColor: 'rgba(247,37,133,0.25)', padding: '24px 20px' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ fontSize: '3rem' }}>🎵</div>

            {/* Visualiser bars */}
            <div className="row gap-3" style={{ height: 40, alignItems: 'flex-end', justifyContent: 'center' }}>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ width: 6, borderRadius: 3, background: '#f72585' }}
                  animate={isPlaying ? {
                    height: ['40%', `${30 + Math.random() * 70}%`, '40%'],
                    opacity: [0.6, 1, 0.6],
                  } : { height: '20%', opacity: 0.3 }}
                  transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.4, delay: i * 0.04 }}
                />
              ))}
            </div>

            {/* QM only: show song title */}
            {isQM && (
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: '#f72585', textAlign: 'center' }}>
                ✓ {currentQ.a}
                {currentQ.hint && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'inherit', marginTop: 4 }}>({currentQ.hint})</div>}
              </div>
            )}

            {/* After correct: reveal */}
            {game?.answerRevealed && !isQM && (
              <motion.div
                style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: '#f72585', textAlign: 'center' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                🎵 {currentQ.a}
                {currentQ.hint && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 4 }}>({currentQ.hint})</div>}
              </motion.div>
            )}

            {/* Audio controls (visible to host/controller) */}
            {(isController || isQM) && (
              <div className="row gap-10" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                {clipUrl ? (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ minWidth: 110, background: isPlaying ? 'var(--red)' : '#f72585', borderColor: 'transparent' }}
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? '⏸ Pause' : '▶ Play Clip'}
                    </button>
                    <button className="btn btn-ghost" onClick={handleReplay}>↺ Replay</button>
                  </>
                ) : (
                  <div className="card" style={{ padding: '8px 14px', background: 'rgba(244,208,63,0.06)', borderColor: 'rgba(244,208,63,0.3)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold)' }}>
                      ⚠️ No clip URL — add <code>clipUrl</code> in genres.js
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>
                      Play the song yourself on Spotify / YouTube for now!
                    </div>
                  </div>
                )}
                {audioError && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--red)' }}>⚠️ Clip failed to load</div>
                )}
              </div>
            )}

            {/* Hint after wrong answers */}
            {currentQ.hint && wrongAnswerers.length > 0 && !isQM && (
              <motion.div
                style={{ fontSize: '0.82rem', color: 'var(--text2)', background: 'rgba(247,37,133,0.06)', padding: '6px 14px', borderRadius: 10, textAlign: 'center' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                💡 Hint: {currentQ.hint}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Buzzer (no-QM host or separate player) */}
        {!isQM && !isGameScreen && (
          <div className="col gap-8">
            <div className="buzzer-wrap" style={{ minHeight: 130 }}>
              <motion.button
                ref={buzzerRef}
                className={`buzzer ${(someoneBuzzing && !isBuzzing) || iWasWrong ? 'buzzer-disabled' : ''} ${isBuzzing ? 'buzzer-glow' : ''}`}
                style={{
                  background: iWasWrong ? 'radial-gradient(circle at 35% 35%, #555, #333)'
                    : `radial-gradient(circle at 35% 35%, ${myColor}ee, ${myColor}99)`,
                  '--player-color': myColor, height: 130,
                  boxShadow: isBuzzing ? `0 0 40px ${myColor}99, 0 0 80px ${myColor}44, inset 0 2px 0 rgba(255,255,255,0.25)` : iWasWrong ? 'none' : `0 8px 24px ${myColor}44`,
                }}
                whileTap={!someoneBuzzing && !iWasWrong ? { scale: 0.91, y: 4 } : {}}
                onMouseDown={handleBuzz}
                onTouchStart={handleBuzz}
              >
                {ripples.map(r => (
                  <div key={r.id} className="buzzer-ripple" style={{ left: `${r.x}%`, top: `${r.y}%` }} />
                ))}
                <AnimatePresence mode="wait">
                  {isBuzzing ? (
                    <motion.div key="b" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '1.6rem' }}>🎵</div>
                      <div style={{ fontWeight: 900, fontSize: '1rem' }}>NAME IT!</div>
                    </motion.div>
                  ) : iWasWrong ? (
                    <motion.div key="w" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '1.8rem' }}>✗</div>
                      <div style={{ fontWeight: 700 }}>OUT</div>
                    </motion.div>
                  ) : someoneBuzzing ? (
                    <motion.div key="s" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <div style={{ fontSize: '1.6rem' }}>🔕</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{buzzedPlayer?.name}</div>
                    </motion.div>
                  ) : (
                    <motion.div key="r" className="col center" style={{ gap: 4 }}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      <motion.div style={{ fontSize: '1.5rem', fontWeight: 900 }}
                        animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>BUZZ!</motion.div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{me?.name}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            <AnimatePresence>
              {isBuzzing && !answerSubmitted && (
                <motion.div className="col gap-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <input
                    className="input"
                    placeholder="Song name or artist..."
                    value={myAnswer}
                    onChange={e => setMyAnswer(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer()}
                    autoFocus
                    style={{ fontSize: '1rem', textAlign: 'center' }}
                  />
                  <button className="btn btn-gold btn-lg" onClick={handleSubmitAnswer} disabled={!myAnswer.trim()}>
                    Submit 🎵
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* QM marking */}
        {isQM && isController && buzzedPlayer && (
          <motion.div className="row gap-12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <button className="btn btn-green btn-lg flex-1" onClick={() => handleMark(true)}>✓ Correct</button>
            <button className="btn btn-red btn-lg flex-1" onClick={() => handleMark(false)}>✗ Wrong</button>
          </motion.div>
        )}

        {/* Buzzer indicator */}
        <AnimatePresence>
          {buzzedPlayer && (
            <motion.div className="buzz-indicator" style={{ borderColor: buzzedPlayer.colorHex, background: `${buzzedPlayer.colorHex}11` }}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <Avatar src={buzzedPlayer.avatar} name={buzzedPlayer.name} colorHex={buzzedPlayer.colorHex} size={44} />
              <div className="flex-1">
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: buzzedPlayer.colorHex }}>{buzzedPlayer.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Buzzed in!</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controller skips */}
        {isController && (
          <div className="row gap-8">
            {buzzedPlayer && <button className="btn btn-ghost flex-1" onClick={() => clearBuzzer(gameCode)}>Clear</button>}
            <button className="btn btn-ghost flex-1" onClick={handleSkip}>⏭ Skip</button>
          </div>
        )}

        {/* Wrong answerers */}
        {wrongAnswerers.length > 0 && (
          <div className="card" style={{ padding: '8px 14px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Got it wrong</div>
            <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
              {wrongAnswerers.map(pid => {
                const p = game?.players?.[pid]
                return p ? (
                  <div key={pid} className="row gap-4" style={{ background: 'rgba(230,57,70,0.1)', padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem' }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={20} />
                    {p.name}
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Scores</div>
          <div className="col gap-6">
            {[...allParticipants].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, i) => (
              <div key={p.id} className="row gap-8">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)', width: 16 }}>#{i + 1}</div>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={26} />
                <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex, fontWeight: 700, fontSize: '0.88rem' }}>{p.score || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
