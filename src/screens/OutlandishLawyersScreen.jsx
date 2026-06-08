/**
 * OutlandishLawyersScreen
 *
 * 3 cases per Lawyers game round, each case = one full debate:
 *   intro → defence1 → prosecution1 → defence2 → prosecution2 → vote → results
 * After results: if cases remain → nextLawyersDebate, otherwise → endLawyersRound.
 *
 * Voting is anonymous — no live split shown until results.
 *
 * Courtroom scene: both debaters shown at podiums, active speaker scales up with
 * a glowing microphone. Audience players sit in the jury gallery row above.
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
  intro: 'Get ready…',
  defence1: 'Defence speaks — Round 1',
  prosecution1: 'Prosecution responds — Round 1',
  defence2: 'Defence rebuts — Round 2',
  prosecution2: 'Prosecution closes — Round 2',
  vote: 'Vote now!',
  results: 'Verdict',
}

// ── Courtroom scene ────────────────────────────────────────────────────────────
function CourtroomScene({ defender, prosecutor, audience, speakingId, defColor, prosColor, phase }) {
  const isDefSpeaking  = !!speakingId && speakingId === defender?.id
  const isProsSpeaking = !!speakingId && speakingId === prosecutor?.id
  const isTalking = isDefSpeaking || isProsSpeaking
  const isVoting  = phase === 'vote'
  const isResults = phase === 'results'

  return (
    <div style={{
      background: 'linear-gradient(180deg, #12090440 0%, #1e0e0699 100%)',
      border: '2px solid #5c3618',
      borderRadius: 16,
      padding: '10px 12px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Ceiling panelling */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 6,
        background: 'repeating-linear-gradient(90deg, #5c3618 0px, #5c3618 1px, #3d200a 1px, #3d200a 40px)',
        opacity: 0.6,
      }} />

      {/* Bench header */}
      <div style={{ textAlign: 'center', padding: '8px 0 6px', borderBottom: '1px solid #5c361844' }}>
        <span style={{
          fontSize: '0.62rem', color: '#c9a227', letterSpacing: '0.16em',
          textTransform: 'uppercase', fontWeight: 700,
        }}>
          ⚖️ Court in Session
        </span>
      </div>

      {/* Jury gallery — audience players */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8,
        padding: '8px 8px 6px',
        background: 'rgba(0,0,0,0.25)',
        borderBottom: '1px solid #5c361844',
        minHeight: 44,
        flexWrap: 'wrap',
      }}>
        {audience.length > 0
          ? audience.map(p => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                <span style={{ fontSize: '0.52rem', color: '#c9a22799', maxWidth: 36, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.split(' ')[0]}
                </span>
              </motion.div>
            ))
          : <span style={{ fontSize: '0.65rem', color: '#5c3618', alignSelf: 'center' }}>Jury gallery</span>}
      </div>

      {/* Courtroom floor — debaters at podiums */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '8px 16px 0', minHeight: 120,
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 100%)',
      }}>
        {/* Defence podium */}
        <DebaterPodium
          player={defender}
          label="Defence"
          emoji="🛡️"
          color={defColor}
          isSpeaking={isDefSpeaking}
          isResults={isResults}
          isVoting={isVoting}
          isTalking={isTalking}
        />

        {/* Centre — phase cue */}
        <div style={{ textAlign: 'center', paddingBottom: 28, flexShrink: 0 }}>
          {isTalking && (
            <motion.div
              key={speakingId}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ fontSize: '1.3rem' }}
            >
              🎙️
            </motion.div>
          )}
          {isVoting && <div style={{ fontSize: '1.2rem' }}>🗳️</div>}
          {isResults && <div style={{ fontSize: '1.2rem' }}>⚖️</div>}
          {phase === 'intro' && <div style={{ fontSize: '1.2rem' }}>🔔</div>}
        </div>

        {/* Prosecution podium */}
        <DebaterPodium
          player={prosecutor}
          label="Prosecution"
          emoji="⚔️"
          color={prosColor}
          isSpeaking={isProsSpeaking}
          isResults={isResults}
          isVoting={isVoting}
          isTalking={isTalking}
        />
      </div>

      {/* Floor strip */}
      <div style={{
        height: 12,
        background: 'repeating-linear-gradient(90deg, #3d200a 0px, #3d200a 60px, #2a1506 60px, #2a1506 61px)',
        marginTop: 2,
      }} />
    </div>
  )
}

function DebaterPodium({ player, label, emoji, color, isSpeaking, isResults, isVoting, isTalking }) {
  const scale = isSpeaking ? 1.3 : 0.82
  const opacity = !isTalking || isSpeaking ? 1 : 0.55

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 70 }}
      animate={{ scale, opacity }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      {/* Mic pulse when speaking */}
      {isSpeaking && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 0.65 }}
          style={{ fontSize: '0.9rem', marginBottom: 2 }}
        >
          🎙️
        </motion.div>
      )}

      {/* Avatar with glow when speaking */}
      <motion.div
        animate={isSpeaking ? {
          filter: [`drop-shadow(0 0 6px ${color}88)`, `drop-shadow(0 0 14px ${color}cc)`, `drop-shadow(0 0 6px ${color}88)`],
        } : { filter: 'none' }}
        transition={{ duration: 1.1, repeat: isSpeaking ? Infinity : 0 }}
      >
        <Avatar src={player?.avatar} name={player?.name || '?'} colorHex={color} size={46} />
      </motion.div>

      <div style={{
        fontSize: '0.68rem', fontWeight: 700, color: isSpeaking ? color : '#c9a22788',
        maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'center',
      }}>
        {player?.name || '?'}
      </div>

      {/* Podium desk */}
      <div style={{
        width: 58, height: 18, marginTop: 2,
        background: `linear-gradient(180deg, ${isSpeaking ? color + '44' : '#4a2a0d'} 0%, #2a1506 100%)`,
        borderRadius: '4px 4px 0 0',
        borderTop: `2px solid ${isSpeaking ? color : '#7a5230'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '0.6rem' }}>{emoji}</span>
      </div>

      <div style={{ fontSize: '0.5rem', color: '#c9a22766', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </motion.div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────
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
    nextLawyersDebate,
  } = useGame()
  const { playCorrect, playRoundOver } = useSound()

  const [timeLeft, setTimeLeft]     = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [myVote, setMyVote]         = useState(null)
  const [advancing, setAdvancing]   = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const timerRef = useRef(null)

  const phase        = game?.lawyersPhase || 'intro'
  const statement    = game?.lawyersStatement || ''
  const defenderId   = game?.lawyersDefenderId
  const prosecutorId = game?.lawyersProsecutorId
  const defender     = game?.players?.[defenderId]
  const prosecutor   = game?.players?.[prosecutorId]
  const phaseStart   = game?.lawyersPhaseStart || 0
  const votes        = game?.lawyersVotes || {}
  const results      = game?.lawyersPoints
  const caseNum      = game?.lawyersRound || 1
  const totalCases   = game?.lawyersTotalRounds || 3
  const isLastCase   = caseNum >= totalCases

  useEffect(() => {
    if (!gameCode) return
    return subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') store.setScreen('round-over')
    })
  }, [gameCode])

  useEffect(() => {
    if (phase === 'vote') setMyVote(votes[myId] || null)
    if (phase === 'results') {
      setShowConfetti(true)
      playRoundOver()
      setTimeout(() => setShowConfetti(false), 4000)
    }
  }, [phase])

  // Sync timer from Firebase timestamp
  useEffect(() => {
    clearInterval(timerRef.current)
    const duration = PHASE_DURATIONS[phase] || 0
    if (duration <= 0) { setTimeLeft(0); return }
    const tick = () => setTimeLeft(Math.ceil(Math.max(0, duration - (Date.now() - phaseStart) / 1000)))
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, phaseStart])

  // Controller auto-advances when timer hits 0
  useEffect(() => {
    if (!isController || phase === 'results' || phase === 'intro') return
    if (timeLeft !== 0) return
    const t = setTimeout(async () => {
      if (phase === 'vote') {
        await revealLawyersResults(gameCode, game)
      } else if (phase !== 'results') {
        await advanceLawyersPhase(gameCode, phase)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [timeLeft, phase, isController])

  const isDebater       = myId === defenderId || myId === prosecutorId
  const myRole          = myId === defenderId ? 'defence' : myId === prosecutorId ? 'prosecution' : 'audience'
  const isMySpeakingTurn = ((phase === 'defence1' || phase === 'defence2') && myRole === 'defence')
                        || ((phase === 'prosecution1' || phase === 'prosecution2') && myRole === 'prosecution')
  const speakingId = (phase === 'defence1' || phase === 'defence2') ? defenderId
    : (phase === 'prosecution1' || phase === 'prosecution2') ? prosecutorId
    : null
  const speakingPlayer   = speakingId ? game?.players?.[speakingId] : null
  const isDefenceTurn    = phase === 'defence1' || phase === 'defence2'
  const speakingColor    = isDefenceTurn ? '#4895ef' : '#e63946'
  const isSpeechPhase    = ['defence1', 'prosecution1', 'defence2', 'prosecution2'].includes(phase)

  const allPlayers      = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const audience        = allPlayers.filter(p => p.id !== defenderId && p.id !== prosecutorId)
  const eligibleVoters  = audience // only audience votes
  const totalVotes      = Object.keys(votes).length

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
      if (phase === 'intro' || isSpeechPhase) {
        await advanceLawyersPhase(gameCode, phase)
      } else if (phase === 'vote') {
        await revealLawyersResults(gameCode, game)
      } else if (phase === 'results') {
        if (isLastCase) {
          await endLawyersRound(gameCode)
        } else {
          await nextLawyersDebate(gameCode, game)
        }
      }
    } finally {
      setAdvancing(false)
    }
  }

  // ── Not enough players guard ─────────────────────────────────────────────────
  // TV screen doesn't count — need ≥3 real players (2 debaters + 1 juror)
  if (allPlayers.length < 3) {
    return (
      <div className="screen">
        <div className="topbar">
          <div style={{ fontFamily: 'var(--font-head)', color: '#c084fc', fontSize: '0.95rem' }}>⚖️ Outlandish Lawyers</div>
        </div>
        <div className="screen-inner" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: '3rem' }}>⚖️</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', color: '#c084fc', textAlign: 'center' }}>
            Not enough players
          </div>
          <div className="card" style={{ textAlign: 'center', maxWidth: 300, background: 'rgba(192,132,252,0.06)', borderColor: 'rgba(192,132,252,0.3)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              Outlandish Lawyers needs at least <strong>3 players</strong> — 2 debaters and at least 1 juror to vote.
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 8 }}>
              Currently {allPlayers.length} player{allPlayers.length === 1 ? '' : 's'} (TV Screen doesn't count)
            </div>
          </div>
          {isController && (
            <button className="btn btn-ghost" onClick={() => endLawyersRound(gameCode)}>← Back to lobby</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Confetti active={showConfetti} />

      <div className="topbar">
        <div style={{ fontFamily: 'var(--font-head)', color: '#c084fc', fontSize: '0.95rem' }}>
          ⚖️ Case {caseNum}/{totalCases}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text3)' }}>
          {PHASE_LABELS[phase]}
        </div>
        <div className="row gap-4">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
          <MuteButton />
        </div>
      </div>

      <div className="screen-inner" style={{ gap: 12, paddingTop: 12 }}>

        {/* Statement */}
        <motion.div className="card"
          style={{ textAlign: 'center', padding: '14px 18px', background: 'rgba(192,132,252,0.06)', border: '1.5px solid rgba(192,132,252,0.3)' }}
          key={statement}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            The Statement
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.05rem', lineHeight: 1.45, color: '#c084fc' }}>
            "{statement}"
          </div>
        </motion.div>

        {/* Courtroom scene */}
        <AnimatePresence mode="wait">
          <motion.div key={`case-${caseNum}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CourtroomScene
              defender={defender}
              prosecutor={prosecutor}
              audience={audience}
              speakingId={speakingId}
              defColor="#4895ef"
              prosColor="#e63946"
              phase={phase}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── Speech phase: timer + cue ─── */}
        {isSpeechPhase && (
          <motion.div className="card col center"
            style={{ padding: '14px 18px', background: `${speakingColor}0c`, border: `1.5px solid ${speakingColor}44` }}
            key={phase}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
          >
            {isMySpeakingTurn ? (
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: speakingColor, textAlign: 'center', marginBottom: 4 }}>
                🎙️ Your turn — speak up!
              </div>
            ) : speakingPlayer ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)', textAlign: 'center', marginBottom: 4 }}>
                🎙️ <strong style={{ color: speakingColor }}>{speakingPlayer.name}</strong> is speaking…
              </div>
            ) : null}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '2.8rem', fontWeight: 700, lineHeight: 1,
              color: timeLeft <= 5 ? 'var(--red)' : speakingColor,
            }}>
              {timeLeft}s
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 4 }}>
              {['defence1', 'prosecution1'].includes(phase) ? 'Opening · 1 of 2' : 'Rebuttal · 2 of 2'}
            </div>
          </motion.div>
        )}

        {/* ── Intro phase ─── */}
        {phase === 'intro' && (
          <motion.div className="card col center gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', textAlign: 'center' }}>
              {caseNum > 1 ? `Case ${caseNum} of ${totalCases}` : 'Court is in session'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text2)', textAlign: 'center', lineHeight: 1.6 }}>
              {isDebater
                ? `You are ${myRole === 'defence' ? '🛡️ defending' : '⚔️ prosecuting'} the statement. Good luck!`
                : 'Listen closely — you\'ll vote on who argued best.'}
            </div>
            {isController && (
              <motion.button className="btn btn-primary btn-lg btn-block" whileTap={{ scale: 0.97 }}
                onClick={handleNext} disabled={advancing}>
                {advancing ? <div className="loading-dots"><span /><span /><span /></div> : '⚖️ Begin →'}
              </motion.button>
            )}
            {!isController && (
              <div style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>Waiting for host to start…</div>
            )}
          </motion.div>
        )}

        {/* ── Vote phase — anonymous ─── */}
        {phase === 'vote' && (
          <motion.div className="card col gap-12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', textAlign: 'center', color: 'var(--gold)' }}>
              🗳️ Who was more convincing?
            </div>

            {isDebater ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem', padding: '8px 0' }}>
                Debaters don't vote — sit tight!
              </div>
            ) : myVote ? (
              <motion.div className="col center gap-8" initial={{ scale: 0.85 }} animate={{ scale: 1 }}>
                <div style={{ fontSize: '2rem' }}>{myVote === 'defence' ? '🛡️' : '⚔️'}</div>
                <div style={{ fontWeight: 700, color: myVote === 'defence' ? '#4895ef' : '#e63946' }}>
                  Voted!
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                  {totalVotes}/{eligibleVoters.length} have voted — results hidden until everyone is done
                </div>
              </motion.div>
            ) : (
              <div className="row gap-10">
                {[
                  { side: 'defence',     label: 'Defence',     color: '#4895ef', emoji: '🛡️', player: defender },
                  { side: 'prosecution', label: 'Prosecution', color: '#e63946', emoji: '⚔️', player: prosecutor },
                ].map(({ side, label, color, emoji, player }) => (
                  <motion.button key={side} className="btn"
                    style={{
                      flex: 1, flexDirection: 'column', gap: 8, padding: '14px 8px',
                      background: `${color}10`, border: `2px solid ${color}55`,
                      color, fontFamily: 'var(--font-head)', fontSize: '0.95rem',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote(side)}
                  >
                    <div style={{ fontSize: '1.6rem' }}>{emoji}</div>
                    <Avatar src={player?.avatar} name={player?.name || '?'} colorHex={color} size={38} />
                    <div>{player?.name || label}</div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.7, fontFamily: 'var(--font-body)' }}>{label}</div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Only show total count, not split */}
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text3)' }}>
              {totalVotes}/{eligibleVoters.length} voted · votes revealed at end
              {timeLeft > 0 && <> · {timeLeft}s</>}
            </div>
          </motion.div>
        )}

        {/* ── Results phase ─── */}
        {phase === 'results' && results && (
          <motion.div className="card col gap-14" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', textAlign: 'center' }}>
              🏛️ The Verdict — Case {caseNum}
            </div>

            <div className="col gap-8">
              {[
                { key: 'defence', label: 'Defence', name: defender?.name, color: '#4895ef', emoji: '🛡️', pts: results.defence, count: results.defCount },
                { key: 'prosecution', label: 'Prosecution', name: prosecutor?.name, color: '#e63946', emoji: '⚔️', pts: results.prosecution, count: results.prosCount },
              ].map(({ key, label, name, color, emoji, pts, count }) => (
                <div key={key} className="row gap-8" style={{ alignItems: 'center' }}>
                  <span>{emoji}</span>
                  <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color }}>
                    {name} ({label}) · {count || 0} vote{count !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>+{pts}pts</span>
                </div>
              ))}
              <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--surface)', marginTop: 4 }}>
                <motion.div style={{ background: '#4895ef' }} initial={{ width: 0 }}
                  animate={{ width: `${(results.defCount || 0) / Math.max(1, (results.defCount || 0) + (results.prosCount || 0)) * 100}%` }}
                  transition={{ duration: 0.8 }} />
                <motion.div style={{ background: '#e63946' }} initial={{ width: 0 }}
                  animate={{ width: `${(results.prosCount || 0) / Math.max(1, (results.defCount || 0) + (results.prosCount || 0)) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.05 }} />
              </div>
            </div>

            <div style={{
              textAlign: 'center', padding: '10px 14px', borderRadius: 10, fontWeight: 700,
              background: results.majority === 'defence' ? 'rgba(72,149,239,0.1)' : 'rgba(230,57,70,0.1)',
              border: `1px solid ${results.majority === 'defence' ? 'rgba(72,149,239,0.3)' : 'rgba(230,57,70,0.3)'}`,
              color: results.majority === 'defence' ? '#4895ef' : '#e63946',
              fontSize: '0.88rem',
            }}>
              {results.majority === 'defence' ? '🛡️ Defence wins!' : '⚔️ Prosecution wins!'}
              <div style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>
                Audience who voted {results.majority} +50 pts each
              </div>
            </div>

            {isController && (
              <motion.button className={`btn btn-lg btn-block ${isLastCase ? 'btn-ghost' : 'btn-primary'}`}
                whileTap={{ scale: 0.97 }} onClick={handleNext} disabled={advancing}>
                {advancing
                  ? <div className="loading-dots"><span /><span /><span /></div>
                  : isLastCase ? '🏆 End Round →' : `Next Case (${caseNum + 1}/${totalCases}) →`}
              </motion.button>
            )}
            {!isController && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem' }}>
                <div className="loading-dots"><span /><span /><span /></div>
                <div style={{ marginTop: 8 }}>Waiting for host…</div>
              </div>
            )}
          </motion.div>
        )}

        {/* Skip button for host during speech phases */}
        {isController && isSpeechPhase && (
          <motion.button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center', color: 'var(--text3)', fontSize: '0.75rem' }}
            whileTap={{ scale: 0.95 }} onClick={handleNext} disabled={advancing}>
            Skip ({PHASE_LABELS[phase]}) →
          </motion.button>
        )}
      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
