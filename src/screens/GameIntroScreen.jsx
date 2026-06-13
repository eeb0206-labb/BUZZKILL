/**
 * GameIntroScreen — shown before every game round so players know the rules.
 * Controller sees a countdown + "Let's Go →" button that calls beginRound.
 * Players see the rules and "Get ready…".
 * TV (GameScreen) shows a matching big-screen version via GameIntroView.
 */
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { MuteButton } from '../components/ui'

const COUNTDOWN_SECONDS = 8

const GAME_RULES = {
  quiz:          { icon: '❓', steps: ['A question appears on screen', 'Buzz in first — then answer', 'Correct earns points · Wrong loses them (and opens it to someone else)'] },
  blitz:         { icon: '⚡', steps: ['Questions come fast — type your answer', 'Correct earns points · Wrong loses them', 'No buzzing here — just type and submit'] },
  fill:          { icon: '✏️', steps: ['A sentence with a blank appears on screen', 'Type the wittiest or funniest completion', 'Everyone votes — most votes wins the round'] },
  joke:          { icon: '😂', steps: ['You get a setup — write the punchline', 'All punchlines are shown anonymously', 'Vote for your favourite — most votes wins'] },
  hottake:       { icon: '🔥', steps: ['A statement appears — Agree or Disagree?', 'Rarer opinion = more points', 'You want to pick whatever fewer people choose'] },
  whod:          { icon: '🕵️', steps: ['Everyone gets the same question — except one player', 'That secret imposter answers a completely different question', 'Read answers out loud, then vote for who you think is lying'] },
  music:         { icon: '🎵', steps: ['A music clip plays on the big screen', 'Buzz in when you know the song or artist', 'Correct earns points · Wrong opens it up to someone else'] },
  draw:          { icon: '🎨', steps: ['One player gets a secret prompt to draw — on their phone', 'Everyone else watches on the big screen and types their guess', 'First correct guess earns points — and so does the artist'] },
  lawyers:       { icon: '⚖️', steps: ['Two players are assigned opposite sides of an absurd statement', 'Take turns making your case — 90 seconds each side', 'The audience votes on who argued most convincingly'] },
  redemption:    { icon: '🔄', steps: ['Questions come from your wrong answers earlier in the game', 'Get it right this time for 1.25× points', 'Your chance to claw back the leaderboard'] },
  truefalse:     { icon: '🤔', steps: ['A weird statement appears — is it True or False?', 'Everyone answers simultaneously on their phones', 'Correct earns points — no buzzing here'] },
  ordersup:      { icon: '🍔', steps: ["A customer's order is read out — memorise it!", 'Then pick 3 items and arrange them in the correct sequence', 'Accuracy wins points · speed is the tiebreaker'] },
  fartdirection: { icon: '💨', steps: ['A colour appears in a position — memorise it', 'A fart scrambles the wheel', 'Find the original colour in the new arrangement'] },
  speedbriefs:   { icon: '🩲', steps: ['You get a product and a brief to write a tagline for', 'Write the catchiest line you can in 60 seconds', 'The room votes for the best — most votes wins'] },
  modelmodelun:  { icon: '🏺', steps: ['Build your ceramic nation and stake your investment', 'Launch missiles, gather intel, forge alliances', 'Last model standing wins the prize pot'] },
  croc:          { icon: '🐊', steps: ['A trivia question appears on screen', 'One player secretly writes a fake — but convincing — answer', 'Everyone votes on which answer is the real one'] },
}

const DEFAULT_RULES = { icon: '🎮', steps: ['Get ready to play!', 'Follow the instructions on screen', 'Most points at the end wins'] }

export default function GameIntroScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const setScreen = store.setScreen
  const { subscribeToGame, beginRound } = useGame()

  const genre = game?.currentGenre
  const gameType = genre?.gameType
  const rules = GAME_RULES[gameType] || DEFAULT_RULES
  const accentColor = genre?.color || 'var(--accent)'

  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [launched, setLaunched] = useState(false)
  const timerRef = useRef(null)

  // Subscribe — forward to the correct game screen once the state changes
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'quiz') setScreen('quiz-host')
      if (g.state === 'powerup-select') setScreen('powerup-select')
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'final') setScreen('final')
      if (g.state === 'lobby') setScreen('lobby')
    })
    return unsub
  }, [gameCode])

  // Controller countdown — auto-launches when it hits 0
  useEffect(() => {
    if (!isController || launched) return
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current)
          handleLaunch()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [isController, launched])

  async function handleLaunch() {
    if (launched) return
    setLaunched(true)
    clearInterval(timerRef.current)
    await beginRound(gameCode, game)
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge" style={{ color: accentColor }}>
          {genre?.emoji} {genre?.name || 'Up Next'}
        </div>
        <div className="topbar-logo">Get Ready</div>
        <MuteButton />
      </div>

      <div className="screen-inner" style={{ justifyContent: 'center', gap: 20 }}>

        {/* Genre card */}
        <motion.div
          className="card col center gap-10"
          style={{
            textAlign: 'center', padding: '28px 20px',
            background: `${accentColor}12`,
            borderColor: `${accentColor}40`,
          }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>{rules.icon}</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.4rem, 5vw, 2rem)', color: accentColor }}>
            {genre?.name || 'Up Next'}
          </div>
        </motion.div>

        {/* Rules */}
        <div className="col gap-8">
          {rules.steps.map((step, i) => (
            <motion.div
              key={i}
              className="card row gap-12"
              style={{ alignItems: 'flex-start', padding: '12px 16px' }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <div style={{
                minWidth: 28, height: 28, borderRadius: '50%',
                background: `${accentColor}22`, border: `1.5px solid ${accentColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem',
                color: accentColor, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5, paddingTop: 4 }}>{step}</div>
            </motion.div>
          ))}
        </div>

        {/* Controller: countdown + launch button */}
        {isController && (
          <motion.div
            className="col gap-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              className="btn btn-gold btn-lg"
              onClick={handleLaunch}
              disabled={launched}
              style={{ fontSize: '1.1rem' }}
            >
              {launched ? 'Starting…' : `Let's Go →`}
            </button>
            {!launched && (
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text3)' }}>
                Auto-starting in {countdown}s
              </div>
            )}
          </motion.div>
        )}

        {/* Players: waiting indicator */}
        {!isController && (
          <motion.div
            className="card center col gap-8"
            style={{ background: 'rgba(0,0,0,0.2)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Waiting for host to start…</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
