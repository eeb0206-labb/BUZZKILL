/**
 * OutlandishLawyersScreen — Talking Points-style debate round.
 *
 * Two random players are assigned:
 *   Defence   — must argue IN FAVOUR of the absurd statement
 *   Prosecution — must argue AGAINST the absurd statement
 *
 * Phases:
 *   intro        — 5s countdown, show statement + roles
 *   defence1     — Defence speaks for 30s
 *   prosecution1 — Prosecution responds for 30s
 *   defence2     — Defence rebuts for 30s
 *   prosecution2 — Prosecution closes for 30s
 *   vote         — Audience votes: Defence or Prosecution (15s)
 *   results      — Points revealed
 *
 * Points:
 *   - Debaters: Math.round(voteShare × 15) × 10  (0–150, multiples of 10)
 *   - Audience: +50 if they voted for the majority side
 *
 * Same screen renders for all roles. Debaters see a timer + microphone cue.
 * Audience see the statement + who's speaking + vote phase.
 * Host/controller sees the "Next Phase" button + end game controls.
 */
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Confetti, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import SettingsOverlay from '../components/SettingsOverlay'

const PHASE_DURATIONS = {
  intro: 6,
  defence1: 30,
  prosecution1: 30,
  defence2: 30,
  prosecution2: 30,
  vote: 18,
  results: 0,
}

const PHASE_LABELS = {
  intro: 'Starting soon...',
  defence1: 'Defence speaks',
  prosecution1: 'Prosecution responds',
  defence2: 'Defence rebuts',
  prosecution2: 'Prosecution closes',
  vote: 'Vote now!',
  results: 'Results',
}

const PHASE_COLORS = {
  defence1: '#4895ef',
  defence2: '#4895ef',
  prosecution1: '#e63946',
  prosecution2: '#e63946',
  vote: '#f4d03f',
  results: '#57cc99',
  intro: '#c084fc',
}

export default function OutlandishLawyersScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()

  const {
    subscribeToGame,
    advanceLawyersPhase,
    submitLawyersVote,
    revealLawyersResults,
    endLawyersRound,
  } = useGame()
  const { playCorrect, playRoundOver } = useSound()

  const [timeLeft, setTimeLeft] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [myVote, setMyVote] = useState(null)
  const [advancing, setAdvancing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const timerRef = useRef(null)
  const phase = game?.lawyersPhase || 'intro'
  const statement = game?.lawyersStatement || ''
  const defenderId = game?.lawyersDefenderId
  const prosecutorId = game?.lawyersProsecutorId
  const defender = game?.players?.[defenderId]
  const prosecutor = game?.players?.[prosecutorId]
  const phaseStart = game?.lawyersPhaseStart || 0
  const votes = game?.lawyersVotes || {}
  const results = game?.lawyersPoints

  // Subscribe to game state
  useEffect(() => {
    if (!gameCode) return
    return subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') store.setScreen('round-over')
    })
  }, [gameCode])

  // Reset vote when phase changes to vote
  useEffect(() => {
    if (phase === 'vote') setMyVote(votes[myId] || null)
    if (phase === 'results') {
      setShowConfetti(true)
      playRoundOver()
      setTimeout(() => setShowConfetti(false), 4000)
    }
  }, [phase])

  // Countdown timer
  useEffect(() => {
    clearInterval(timerRef.current)
    const duration = PHASE_DURATIONS[phase] || 0
    if (duration <= 0) { setTimeLeft(0); return }

    const updateTimer = () => {
      const elapsed = (Date.now() - phaseStart) / 1000
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(Math.ceil(remaining))
    }
    updateTimer()
    timerRef.current = setInterval(updateTimer, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, phaseStart])

  // Auto-advance when timer hits 0 (host only, non-results phases)
  useEffect(() => {
    if (!isController || phase === 'results' || phase === 'intro') return
    if (timeLeft !== 0) return
    const t = setTimeout(async () => {
      if (phase === 'prosecution2') {
        await advanceLawyersPhase(gameCode, phase) // → vote
      } else if (phase === 'vote') {
        await revealLawyersResults(gameCode, game)
      } else if (phase !== 'results') {
        await advanceLawyersPhase(gameCode, phase)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [timeLeft, phase, isController])

  // Derived state
  const isDebater = myId === defenderId || myId === prosecutorId
  const myRole = myId === defenderId ? 'defence' : myId === prosecutorId ? 'prosecution' : 'audience'
  const isMySpeakingTurn = (phase === 'defence1' || phase === 'defence2') && myRole === 'defence'
    || (phase === 'prosecution1' || phase === 'prosecution2') && myRole === 'prosecution'
  const speakingId = (phase === 'defence1' || phase === 'defence2') ? defenderId
    : (phase === 'prosecution1' || phase === 'prosecution2') ? prosecutorId
    : null
  const speakingPlayer = speakingId ? game?.players?.[speakingId] : null
  const isDefenceTurn = phase === 'defence1' || phase === 'defence2'

  const totalVotes = Object.keys(votes).length
  const defVotes = Object.values(votes).filter(v => v === 'defence').length
  const prosVotes = totalVotes - defVotes
  const allPlayers = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const eligibleVoters = allPlayers.filter(p => p.id !== defenderId && p.id !== prosecutorId)

  async function handleVote(side) {
    if (myVote || isDebater) return
    setMyVote(side)
    await submitLawyersVote(gameCode, myId, side)
    playCorrect()
  }

  async function handleNext() {
    if (advancing) return
    setAdvancing(true)
    try {
      if (phase === 'intro' || (phase !== 'vote' && phase !== 'results' && phase !== 'prosecution2')) {
        await advanceLawyersPhase(gameCode, phase)
      } else if (phase === 'prosecution2') {
        await advanceLawyersPhase(gameCode, phase) // → vote
      } else if (phase === 'vote') {
        await revealLawyersResults(gameCode, game)
      } else if (phase === 'results') {
        await endLawyersRound(gameCode)
      }
    } finally {
      setAdvancing(false)
    }
  }

  const phaseColor = PHASE_COLORS[phase] || 'var(--accent)'
  const speakingColor = isDefenceTurn ? '#4895ef' : '#e63946'

  return (
    <div className="screen">
      <Confetti active={showConfetti} />

      <div className="topbar">
        <div style={{ fontFamily: 'var(--font-head)', color: '#c084fc', fontSize: '1rem' }}>
          ⚖️ Outlandish Lawyers
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)' }}>
          {PHASE_LABELS[phase]}
        </div>
        <div className="row gap-4">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)} style={{ fontSize: '1rem', padding: '6px 8px' }}>⚙️</button>
          <MuteButton />
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 16 }}>

        {/* ── Statement card ─────────────────────────────────────────────── */}
        <motion.div
          className="card"
          style={{
            textAlign: 'center', padding: '20px 24px',
            background: 'rgba(192,132,252,0.06)',
            border: '1.5px solid rgba(192,132,252,0.3)',
          }}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            The Statement
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', lineHeight: 1.4, color: '#c084fc' }}>
            "{statement}"
          </div>
        </motion.div>

        {/* ── Debaters ────────────────────────────────────────────────────── */}
        <div className="row gap-8" style={{ justifyContent: 'space-around' }}>
          {[
            { player: defender, role: 'Defence', color: '#4895ef', emoji: '🛡️', active: isDefenceTurn && phase !== 'intro' && phase !== 'vote' && phase !== 'results' },
            { player: prosecutor, role: 'Prosecution', color: '#e63946', emoji: '⚔️', active: !isDefenceTurn && phase !== 'intro' && phase !== 'vote' && phase !== 'results' },
          ].map(({ player, role, color, emoji, active }) => (
            <motion.div
              key={role}
              animate={active ? {
                boxShadow: [`0 0 0px ${color}00`, `0 0 24px ${color}77`, `0 0 12px ${color}44`],
                borderColor: [color + '44', color, color + '66'],
              } : {}}
              transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
              style={{
                flex: 1, background: active ? `${color}10` : 'var(--surface)',
                border: `2px solid ${active ? color : color + '33'}`,
                borderRadius: 14, padding: '12px 10px', textAlign: 'center',
                maxWidth: 160,
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{emoji}</div>
              <Avatar src={player?.avatar} name={player?.name || '?'} colorHex={color} size={active ? 52 : 44} />
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 6, lineHeight: 1.2 }}>
                {player?.name || '?'}
              </div>
              <div style={{ fontSize: '0.7rem', color, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {role}
              </div>
              {myId === player?.id && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 4 }}>You</div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Timer (during speech phases) ──────────────────────────────── */}
        {['defence1', 'prosecution1', 'defence2', 'prosecution2'].includes(phase) && (
          <motion.div
            className="card col center"
            style={{
              padding: '20px',
              background: `${speakingColor}0c`,
              border: `1.5px solid ${speakingColor}44`,
            }}
            key={phase}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          >
            {isMySpeakingTurn ? (
              <>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: speakingColor, marginBottom: 8 }}>
                  🎙️ Your turn — speak up!
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text2)', textAlign: 'center', lineHeight: 1.5 }}>
                  {isDefenceTurn ? 'Defend the statement. Make it convincing!' : 'Tear it apart. Win the audience over.'}
                </div>
              </>
            ) : speakingPlayer ? (
              <div style={{ fontSize: '0.9rem', color: 'var(--text2)', textAlign: 'center' }}>
                🎙️ <strong style={{ color: speakingColor }}>{speakingPlayer.name}</strong> is speaking...
              </div>
            ) : null}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 700,
              color: timeLeft <= 5 ? 'var(--red)' : speakingColor,
              marginTop: 12, lineHeight: 1,
            }}>
              {timeLeft}s
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>
              {PHASE_LABELS[phase]} · Round {['defence1','prosecution1'].includes(phase) ? '1 of 2' : '2 of 2'}
            </div>
          </motion.div>
        )}

        {/* ── Intro phase ─────────────────────────────────────────────────── */}
        {phase === 'intro' && (
          <motion.div className="card col center gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', textAlign: 'center' }}>
              Get ready to debate!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
              4 rounds of 30 seconds each. Defence goes first, then Prosecution.<br />
              Audience votes after all 4 rounds. No interrupting!
            </div>
            {isController && (
              <motion.button className="btn btn-primary btn-lg btn-block" whileTap={{ scale: 0.97 }}
                onClick={handleNext} disabled={advancing}>
                {advancing ? <div className="loading-dots"><span /><span /><span /></div> : '⚖️ Start Debate →'}
              </motion.button>
            )}
            {!isController && (
              <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Waiting for host to start...</div>
            )}
          </motion.div>
        )}

        {/* ── Vote phase ─────────────────────────────────────────────────── */}
        {phase === 'vote' && (
          <motion.div className="card col gap-14" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', textAlign: 'center', color: 'var(--gold)' }}>
              🗳️ Who was more convincing?
            </div>

            {isDebater ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.88rem', padding: '8px 0' }}>
                Debaters can't vote — sit tight!
              </div>
            ) : myVote ? (
              <div className="col center gap-6">
                <div style={{ fontSize: '1.5rem' }}>{myVote === 'defence' ? '🛡️' : '⚔️'}</div>
                <div style={{ fontWeight: 700, color: myVote === 'defence' ? '#4895ef' : '#e63946' }}>
                  You voted {myVote === 'defence' ? 'Defence' : 'Prosecution'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Waiting for others...</div>
              </div>
            ) : (
              <div className="row gap-10" style={{ justifyContent: 'center' }}>
                {[
                  { side: 'defence', label: 'Defence', color: '#4895ef', emoji: '🛡️', player: defender },
                  { side: 'prosecution', label: 'Prosecution', color: '#e63946', emoji: '⚔️', player: prosecutor },
                ].map(({ side, label, color, emoji, player }) => (
                  <motion.button
                    key={side}
                    className="btn"
                    style={{
                      flex: 1, flexDirection: 'column', gap: 8, padding: '16px 12px',
                      background: `${color}10`, border: `2px solid ${color}55`,
                      color, fontFamily: 'var(--font-head)', fontSize: '1rem',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(side)}
                  >
                    <div style={{ fontSize: '1.8rem' }}>{emoji}</div>
                    <Avatar src={player?.avatar} name={player?.name || '?'} colorHex={color} size={40} />
                    <div>{player?.name || label}</div>
                    <div style={{ fontSize: '0.75rem', color, opacity: 0.7, fontFamily: 'var(--font-body)' }}>{label}</div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Vote count */}
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text3)' }}>
              {Object.keys(votes).length} / {eligibleVoters.length} voted
              {timeLeft > 0 && <> · {timeLeft}s left</>}
            </div>
          </motion.div>
        )}

        {/* ── Results phase ───────────────────────────────────────────────── */}
        {phase === 'results' && results && (
          <motion.div className="card col gap-16" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', textAlign: 'center' }}>
              🏛️ The Verdict
            </div>

            {/* Vote bar */}
            <div className="col gap-8">
              <div className="row gap-8" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '1rem' }}>🛡️</span>
                <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#4895ef' }}>
                  {defender?.name} (Defence) · {results.defCount || 0} vote{results.defCount !== 1 ? 's' : ''}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#4895ef', fontWeight: 700, fontSize: '1.1rem' }}>
                  +{results.defence}pts
                </span>
              </div>
              {/* Split bar */}
              <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--surface)' }}>
                <motion.div
                  style={{ background: '#4895ef', borderRadius: '6px 0 0 6px' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${results.defCount / Math.max(1, (results.defCount || 0) + (results.prosCount || 0)) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                <motion.div
                  style={{ background: '#e63946', borderRadius: '0 6px 6px 0' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(results.prosCount || 0) / Math.max(1, (results.defCount || 0) + (results.prosCount || 0)) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                />
              </div>
              <div className="row gap-8" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '1rem' }}>⚔️</span>
                <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#e63946' }}>
                  {prosecutor?.name} (Prosecution) · {results.prosCount || 0} vote{results.prosCount !== 1 ? 's' : ''}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#e63946', fontWeight: 700, fontSize: '1.1rem' }}>
                  +{results.prosecution}pts
                </span>
              </div>
            </div>

            {/* Majority side winner */}
            <div style={{
              textAlign: 'center', padding: '10px 16px',
              background: results.majority === 'defence' ? 'rgba(72,149,239,0.1)' : 'rgba(230,57,70,0.1)',
              border: `1px solid ${results.majority === 'defence' ? 'rgba(72,149,239,0.3)' : 'rgba(230,57,70,0.3)'}`,
              borderRadius: 10,
              fontSize: '0.88rem',
              color: results.majority === 'defence' ? '#4895ef' : '#e63946',
              fontWeight: 700,
            }}>
              {results.majority === 'defence' ? '🛡️' : '⚔️'} {results.majority === 'defence' ? 'Defence' : 'Prosecution'} wins the vote!
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>
                Audience members who voted {results.majority} earned +50 pts
              </div>
            </div>

            {isController && (
              <motion.button className="btn btn-primary btn-lg btn-block" whileTap={{ scale: 0.97 }}
                onClick={handleNext} disabled={advancing} style={{ marginTop: 4 }}>
                {advancing ? <div className="loading-dots"><span /><span /><span /></div> : '🏆 End Round →'}
              </motion.button>
            )}
            {!isController && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem' }}>
                <div className="loading-dots"><span /><span /><span /></div>
                <div style={{ marginTop: 8 }}>Waiting for host...</div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Manual advance button (host, non-intro/results) ─────────────── */}
        {isController && ['defence1', 'prosecution1', 'defence2', 'prosecution2'].includes(phase) && (
          <motion.button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'center', color: 'var(--text3)', fontSize: '0.8rem' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={advancing}
          >
            Skip ({PHASE_LABELS[phase]}) →
          </motion.button>
        )}
      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
