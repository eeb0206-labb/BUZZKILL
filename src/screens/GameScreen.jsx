/**
 * GameScreen.jsx — TV/projector display. Read-only. Adapts to every game state + game type.
 *
 * Routing by state:
 *   'lobby'          → LobbyView
 *   'round-pick'     → VotingView
 *   'powerup-select' → PowerupView
 *   'round-over'     → RoundOverView
 *   'final'          → FinalView
 *   'lawyers'        → LawyersView
 *   'quiz' (by gameType):
 *      quiz / blitz  → QuizView
 *      music         → MusicBangersView
 *      draw          → DrawView
 *      joke          → JokeOffView
 *      hottake       → HotTakeView
 *      fill          → FillGapView
 *      whod          → WhodunnitView
 */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { useSound } from '../hooks/useSound'
import { Avatar, QRCode } from '../components/ui'
import { getGenreById, GAME_TYPES } from '../data/genres'
import SettingsOverlay from '../components/SettingsOverlay'
import BuzzHost from '../components/BuzzHost'
import { ModelVillageScene } from '../components/ModelVillage'
import { getBuzzQuip } from '../data/hostQuips'
import { useBuzzSpeech, useBuzzSpeaking } from '../hooks/useBuzzSpeech'

const POWERUP_ICONS = { sneakPeek: '🔍', steal: '🤑', imposter: '😈', plagiarism: '📋', block: '🚫', doublePoints: '✖️' }

const LAWYERS_DURATIONS  = { intro: 6, defence1: 30, prosecution1: 30, defence2: 30, prosecution2: 30, vote: 18, results: 0 }
const LAWYERS_LABELS     = { intro: 'Get ready…', defence1: 'Defence speaks', prosecution1: 'Prosecution responds', defence2: 'Defence rebuts', prosecution2: 'Prosecution closes', vote: 'Vote now!', results: 'Results' }
const HT_VOTE_TIME = 10

function allPlayers(game) {
  return Object.values(game?.players || {})
    .filter(p => p.role !== 'gamescreen')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function Header({ game, label }) {
  const genre = game?.currentGenre
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', background: 'linear-gradient(135deg, var(--red), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        ⚡ BUZZKILL
      </div>
      {genre && (
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: genre.color || 'var(--accent)' }}>
          {genre.emoji} {genre.name}
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text3)', textAlign: 'right', lineHeight: 1.4 }}>
        {label}
        {game?.currentRound > 0 && <><br />Round {game.currentRound}</>}
      </div>
    </div>
  )
}

function ScoreBar({ players, game }) {
  const buzzer = game?.buzzer
  const wrongList = game?.wrongAnswerers || []
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', padding: '10px 20px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
      {players.map(p => {
        const isBuzzed = p.id === buzzer?.playerId
        const isWrong  = wrongList.includes(p.id)
        return (
          <motion.div key={p.id}
            animate={isBuzzed ? { scale: [1, 1.07, 1], boxShadow: [`0 0 0px transparent`, `0 0 24px ${p.colorHex}aa`, `0 0 10px ${p.colorHex}55`] } : {}}
            transition={{ duration: 0.8, repeat: isBuzzed ? Infinity : 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 10, background: isBuzzed ? `${p.colorHex}1a` : 'var(--surface)', border: `1.5px solid ${isBuzzed ? p.colorHex : isWrong ? 'rgba(230,57,70,0.5)' : p.colorHex + '44'}`, opacity: isWrong && !isBuzzed ? 0.45 : 1 }}
          >
            <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={30} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: p.colorHex }}>{p.score || 0}</div>
            </div>
            {isWrong && !isBuzzed && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>✗</span>}
            {game?.powerupRound?.[p.id] && <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700 }}>×2</span>}
          </motion.div>
        )
      })}
    </div>
  )
}

function Leaderboard({ players, game, title, showPowerups = false }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 24px', overflow: 'auto' }}>
      {title && <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', textAlign: 'center', marginBottom: 6 }}>{title}</div>}
      {players.map((p, i) => {
        const hasDbl = game?.powerupRound?.[p.id]
        const pups = Object.entries(p.powerups || {}).filter(([, c]) => c > 0)
        return (
          <motion.div key={p.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: `1.5px solid ${i === 0 ? 'rgba(244,208,63,0.4)' : 'var(--border)'}`, borderRadius: 12, padding: '10px 14px' }}
          >
            <div style={{ fontSize: '1rem', width: 24, textAlign: 'center', flexShrink: 0, color: 'var(--text3)' }}>{medals[i] || `${i + 1}`}</div>
            <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              {showPowerups && pups.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  {pups.map(([key, count]) => <span key={key} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px' }}>{POWERUP_ICONS[key] || '⚡'} ×{count}</span>)}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.3rem', color: i === 0 ? 'var(--gold)' : p.colorHex }}>{p.score || 0}</div>
              {typeof p.roundScore === 'number' && p.roundScore !== 0 && (
                <div style={{ fontSize: '0.7rem', color: p.roundScore > 0 ? 'var(--green)' : 'var(--red)' }}>{p.roundScore > 0 ? '+' : ''}{p.roundScore}</div>
              )}
            </div>
            {hasDbl && <div style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(244,208,63,0.12)', borderRadius: 6, padding: '2px 5px', fontWeight: 700 }}>✖️×2</div>}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── BuzzOverlay — reused by quiz + music bangers ──────────────────────────────
function BuzzOverlay({ buzzedPlayer, buzzer }) {
  if (!buzzedPlayer) return null
  return (
    <AnimatePresence>
      <motion.div
        key={buzzer?.playerId + (buzzer?.timestamp || 0)}
        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${buzzedPlayer.colorHex}14`, backdropFilter: 'blur(6px)', zIndex: 10 }}
      >
        <motion.div
          animate={{ boxShadow: [`0 0 0px ${buzzedPlayer.colorHex}00`, `0 0 80px ${buzzedPlayer.colorHex}88`, `0 0 40px ${buzzedPlayer.colorHex}44`] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ background: 'var(--bg)', border: `3px solid ${buzzedPlayer.colorHex}`, borderRadius: 24, padding: '36px 52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 280 }}
        >
          <Avatar src={buzzedPlayer.avatar} name={buzzedPlayer.name} colorHex={buzzedPlayer.colorHex} size={100} />
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: buzzedPlayer.colorHex, lineHeight: 1 }}>{buzzedPlayer.name}</div>
          <div style={{ fontSize: '0.95rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>🔔 is answering…</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── QUIZ VIEW ─────────────────────────────────────────────────────────────────
function QuizView({ game, players }) {
  const currentQ   = game?.currentQ
  const buzzer     = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const wrongList  = game?.wrongAnswerers || []
  const isQM       = game?.settings?.questionMaster

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 32px', gap: 16, position: 'relative', overflow: 'hidden' }}>
        {currentQ ? (
          <motion.div key={game?.currentQIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 36px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.2rem, 3vw, 2.2rem)', lineHeight: 1.35 }}>{currentQ.q}</div>
            <AnimatePresence>
              {wrongList.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 10, color: 'var(--gold)', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden' }}>
                  🔥 Pot: {100 + (game?.potAmount || 0)} pts
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {currentQ.hint && wrongList.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 6, color: 'var(--text2)', fontSize: '0.9rem', overflow: 'hidden' }}>
                  💡 {currentQ.hint}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {game?.answerRevealed && (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ marginTop: 18, background: 'rgba(87,204,153,0.1)', border: '1px solid rgba(87,204,153,0.35)', borderRadius: 10, padding: '10px 18px', color: 'var(--green)', fontSize: '1.2rem', fontWeight: 700 }}>
                  ✓ {currentQ.a}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ marginTop: 10, fontSize: '0.9rem' }}>Loading question…</div>
          </div>
        )}
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
          Q {(game?.currentQIndex || 0) + 1}{game?.settings?.questionsPerRound ? ` / ${game.settings.questionsPerRound}` : ''}
        </div>
        {wrongList.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Got it wrong:</span>
            {wrongList.map(pid => { const p = game?.players?.[pid]; return p ? (
              <span key={pid} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(230,57,70,0.1)', borderRadius: 20, fontSize: '0.8rem' }}>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={16} />{p.name}
              </span>
            ) : null })}
          </div>
        )}
        <BuzzOverlay buzzedPlayer={buzzedPlayer} buzzer={buzzer} />
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── MUSIC BANGERS VIEW ────────────────────────────────────────────────────────
function MusicBangersView({ game, players }) {
  const currentQ     = game?.currentQ
  const buzzer       = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const wrongList    = game?.wrongAnswerers || []
  const qIndex       = game?.currentQIndex || 0
  const totalQ       = game?.settings?.questionsPerRound || 8

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px 32px', gap: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 5, height: 60, alignItems: 'flex-end' }}>
          {[...Array(16)].map((_, i) => (
            <motion.div key={i} style={{ width: 8, borderRadius: 4, background: '#f72585' }}
              animate={{ height: [`${20 + Math.random() * 15}%`, `${45 + Math.random() * 55}%`, `${20 + Math.random() * 15}%`] }}
              transition={{ repeat: Infinity, duration: 0.45 + Math.random() * 0.45, delay: i * 0.04, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <motion.div key={qIndex} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#f72585' }}>🎵 Name this tune!</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text3)', marginTop: 8 }}>Q{qIndex + 1} / {totalQ} — host is playing the clip</div>
        </motion.div>
        <AnimatePresence>
          {game?.answerRevealed && currentQ && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(247,37,133,0.1)', border: '1.5px solid rgba(247,37,133,0.4)', borderRadius: 14, padding: '14px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f72585' }}>🎵 {currentQ.a}</div>
              {currentQ.hint && <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginTop: 4 }}>({currentQ.hint})</div>}
            </motion.div>
          )}
        </AnimatePresence>
        {wrongList.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Wrong:</span>
            {wrongList.map(pid => { const p = game?.players?.[pid]; return p ? (
              <span key={pid} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(230,57,70,0.1)', borderRadius: 20, fontSize: '0.8rem' }}>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={16} />{p.name}
              </span>
            ) : null })}
          </div>
        )}
        <BuzzOverlay buzzedPlayer={buzzedPlayer} buzzer={buzzer} />
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── DRAW VIEW ─────────────────────────────────────────────────────────────────
function DrawView({ game, players }) {
  const rawPrompt = game?.currentQ
  const prompt    = typeof rawPrompt === 'string' ? rawPrompt : rawPrompt?.q || '?'
  const qIndex    = game?.currentQIndex || 0
  const totalQ    = game?.settings?.questionsPerRound || 5

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', gap: 24, overflow: 'hidden' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          🎨 Round {qIndex + 1} / {totalQ}
        </div>
        <motion.div key={qIndex} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          style={{ background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 24, padding: '32px 48px', textAlign: 'center', maxWidth: 600 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Draw this:</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.6rem, 4vw, 3rem)', lineHeight: 1.25 }}>{prompt}</div>
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text3)', fontSize: '0.88rem' }}>
          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.6 }}>✏️</motion.span>
          Players are drawing on their phones…
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {players.map(p => (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'var(--surface)', border: `1.5px solid ${p.colorHex}55`, fontSize: '0.82rem', fontWeight: 600 }}>
              <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={20} />{p.name}
            </span>
          ))}
        </div>
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── HOT TAKE VIEW ─────────────────────────────────────────────────────────────
function HotTakeView({ game, players }) {
  const phase     = game?.htPhase
  const prompt    = game?.htPrompt || ''
  const votes     = game?.htVotes || {}
  const promptNum = (game?.htPromptCount || 0) + 1
  const roundLimit = game?.settings?.questionsPerRound || 5
  const [timeLeft, setTimeLeft] = useState(HT_VOTE_TIME)

  useEffect(() => {
    if (phase !== 'vote' || !game?.htStartAt) return
    const tick = () => setTimeLeft(Math.max(0, Math.ceil(HT_VOTE_TIME - (Date.now() - game.htStartAt) / 1000)))
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [phase, game?.htStartAt])

  const agreeVoters    = players.filter(p => votes[p.id] === 'agree')
  const disagreeVoters = players.filter(p => votes[p.id] === 'disagree')
  const pendingVoters  = players.filter(p => !votes[p.id])
  const totalVoted     = Object.keys(votes).length
  const majority       = agreeVoters.length >= disagreeVoters.length ? 'agree' : 'disagree'
  const isUnanimous    = agreeVoters.length === 0 || disagreeVoters.length === 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: 14, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Statement {promptNum} / {roundLimit}
        </div>
        <motion.div key={prompt} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(247,37,133,0.06)', border: '1.5px solid rgba(247,37,133,0.2)', borderRadius: 16, padding: '16px 24px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', lineHeight: 1.4 }}>"{prompt}"</div>
        </motion.div>

        {/* Vote phase — three columns */}
        {phase === 'vote' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>
            {/* AGREE */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,68,0,0.06)', border: '1.5px solid rgba(255,68,0,0.2)', borderRadius: 14, padding: '12px 14px', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: '#ff4400', textAlign: 'center' }}>🔥 AGREE</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
                {agreeVoters.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', background: 'rgba(255,68,0,0.1)', borderRadius: 10 }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={26} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                  </motion.div>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 700, color: '#ff4400', textAlign: 'center' }}>{agreeVoters.length}</div>
            </div>

            {/* Centre — timer + pending */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0, minWidth: 72 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 900, color: timeLeft <= 3 ? 'var(--red)' : 'var(--text2)' }}>{timeLeft}s</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text3)', textAlign: 'center' }}>{totalVoted}/{players.length}<br />voted</div>
              {pendingVoters.map(p => (
                <motion.div key={p.id} animate={{ opacity: [0.35, 1, 0.35] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={20} />
                </motion.div>
              ))}
            </div>

            {/* DISAGREE */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(72,149,239,0.06)', border: '1.5px solid rgba(72,149,239,0.2)', borderRadius: 14, padding: '12px 14px', overflow: 'hidden', minHeight: 0 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: '#4895ef', textAlign: 'center' }}>❄️ DISAGREE</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
                {disagreeVoters.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', background: 'rgba(72,149,239,0.1)', borderRadius: 10 }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={26} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                  </motion.div>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 700, color: '#4895ef', textAlign: 'center' }}>{disagreeVoters.length}</div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {phase === 'results' && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', minHeight: 0 }}>
            <div style={{ height: 24, borderRadius: 12, overflow: 'hidden', display: 'flex', background: 'var(--surface)', flexShrink: 0 }}>
              <motion.div style={{ background: '#ff4400', display: 'flex', alignItems: 'center', justifyContent: 'center' }} initial={{ width: 0 }} animate={{ width: `${players.length > 0 ? (agreeVoters.length / players.length) * 100 : 0}%` }} transition={{ duration: 0.8 }}>
                {agreeVoters.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', padding: '0 8px' }}>🔥 {agreeVoters.length}</span>}
              </motion.div>
              <motion.div style={{ background: '#4895ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }} initial={{ width: 0 }} animate={{ width: `${players.length > 0 ? (disagreeVoters.length / players.length) * 100 : 0}%` }} transition={{ duration: 0.8, delay: 0.05 }}>
                {disagreeVoters.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', padding: '0 8px' }}>❄️ {disagreeVoters.length}</span>}
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ textAlign: 'center', padding: '12px 20px', background: majority === 'agree' ? 'rgba(255,68,0,0.08)' : 'rgba(72,149,239,0.08)', border: `1.5px solid ${majority === 'agree' ? 'rgba(255,68,0,0.3)' : 'rgba(72,149,239,0.3)'}`, borderRadius: 14 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: majority === 'agree' ? '#ff4400' : '#4895ef' }}>
                {majority === 'agree' ? '🔥 The room AGREES!' : '❄️ The room DISAGREES!'}
              </div>
              {isUnanimous && <div style={{ fontSize: '0.82rem', color: 'var(--gold)', marginTop: 4 }}>✨ Unanimous! +50 bonus pts each</div>}
            </motion.div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', overflow: 'auto' }}>
              {players.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.07 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 12, background: votes[p.id] === 'agree' ? 'rgba(255,68,0,0.1)' : 'rgba(72,149,239,0.1)', border: `1.5px solid ${votes[p.id] === 'agree' ? 'rgba(255,68,0,0.3)' : 'rgba(72,149,239,0.3)'}` }}>
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                  <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{p.name}</span>
                  <span style={{ fontSize: '1rem' }}>{votes[p.id] === 'agree' ? '🔥' : '❄️'}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!phase && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '0.9rem' }}>
            Waiting for host to start the round…
          </div>
        )}
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── JOKE OFF VIEW ─────────────────────────────────────────────────────────────
function JokeOffView({ game, players }) {
  const phase      = game?.jokePhase
  const prompt     = game?.jokePrompt || ''
  const subs       = game?.jokeSubmissions || {}
  const votes      = game?.jokeVotes || {}
  const promptNum  = (game?.jokePromptCount || 0) + 1
  const roundLimit = game?.settings?.questionsPerRound || 5

  const tally = {}
  Object.values(votes).forEach(tid => { tally[tid] = (tally[tid] || 0) + 1 })
  const maxVotes = Math.max(...Object.values(tally), 0)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: 14, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Round {promptNum} / {roundLimit}</div>
        <motion.div key={prompt} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(255,174,0,0.06)', border: '1.5px solid rgba(255,174,0,0.2)', borderRadius: 16, padding: '14px 22px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>The prompt</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 2.2vw, 1.6rem)', lineHeight: 1.4 }}>{prompt}</div>
        </motion.div>

        {/* Submit phase */}
        {(phase === 'submit' || !phase) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
            <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.9rem' }}>✍️ Players are writing their jokes…</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', overflow: 'auto' }}>
              {players.map(p => {
                const done = !!subs[p.id]
                return (
                  <motion.div key={p.id} animate={done ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: done ? 'rgba(87,204,153,0.1)' : 'var(--surface)', border: `1.5px solid ${done ? 'rgba(87,204,153,0.4)' : 'var(--border)'}` }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                    <span style={{ fontSize: '0.9rem' }}>{done ? '✓' : '…'}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Vote phase — show all jokes */}
        {phase === 'vote' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 }}>
            <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.82rem' }}>🗳️ Voting on phones — best joke wins!</div>
            {Object.entries(subs).map(([pid, joke]) => {
              const p = game?.players?.[pid]
              const vc = tally[pid] || 0
              return (
                <motion.div key={pid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 12, background: vc === maxVotes && vc > 0 ? 'rgba(244,208,63,0.08)' : 'var(--surface)', border: `1.5px solid ${vc === maxVotes && vc > 0 ? 'rgba(244,208,63,0.4)' : 'var(--border)'}` }}>
                  {p && <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.75rem', color: p?.colorHex, marginBottom: 2 }}>{p?.name}</div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{joke}</div>
                  </div>
                  {vc > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{vc}🗳️</div>}
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Results */}
        {phase === 'results' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 }}>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: 'var(--gold)' }}>🏆 Results</div>
            {Object.entries(subs).sort(([a], [b]) => (tally[b] || 0) - (tally[a] || 0)).map(([pid, joke], i) => {
              const p = game?.players?.[pid]
              const vc = tally[pid] || 0
              const pts = vc * 100 + (vc === maxVotes && vc > 0 ? 100 : 0)
              return (
                <motion.div key={pid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 12, background: i === 0 && vc > 0 ? 'rgba(244,208,63,0.1)' : 'var(--surface)', border: `1.5px solid ${i === 0 && vc > 0 ? 'rgba(244,208,63,0.4)' : 'var(--border)'}` }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text3)', width: 20, flexShrink: 0 }}>#{i + 1}</div>
                  {p && <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.75rem', color: p?.colorHex, marginBottom: 2 }}>{p?.name}</div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{joke}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{vc} vote{vc !== 1 ? 's' : ''}</div>
                    {pts > 0 && <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>+{pts}</div>}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── FILL THE GAP VIEW ─────────────────────────────────────────────────────────
function FillGapView({ game, players }) {
  const phase      = game?.fgPhase
  const prompt     = game?.fgPrompt || ''
  const subs       = game?.fgSubmissions || {}
  const votes      = game?.fgVotes || {}
  const promptNum  = game?.fgPromptCount || 1
  const roundLimit = game?.settings?.questionsPerRound || 5

  const tally = {}
  Object.values(votes).forEach(tid => { tally[tid] = (tally[tid] || 0) + 1 })
  const maxVotes = Math.max(...Object.values(tally), 0)

  // Highlight the blank in the prompt
  const parts = prompt.split('___')
  const promptDisplay = parts.length > 1
    ? parts.reduce((acc, part, i) => {
        if (i > 0) acc.push(<span key={`b${i}`} style={{ background: 'rgba(72,149,239,0.25)', borderBottom: '2px solid #4895ef', padding: '0 6px', borderRadius: 4, color: '#4895ef', fontWeight: 700 }}>___</span>)
        acc.push(<span key={`p${i}`}>{part}</span>)
        return acc
      }, [])
    : prompt

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: 14, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Round {promptNum} / {roundLimit}</div>
        <motion.div key={prompt} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(72,149,239,0.06)', border: '1.5px solid rgba(72,149,239,0.2)', borderRadius: 16, padding: '14px 22px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', color: '#4895ef', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Fill the gap</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 2.2vw, 1.5rem)', lineHeight: 1.5 }}>{promptDisplay}</div>
        </motion.div>

        {(phase === 'input' || !phase) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
            <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.9rem' }}>✍️ Players are filling in the gap…</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', overflow: 'auto' }}>
              {players.map(p => {
                const done = !!subs[p.id]
                return (
                  <motion.div key={p.id} animate={done ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: done ? 'rgba(87,204,153,0.1)' : 'var(--surface)', border: `1.5px solid ${done ? 'rgba(87,204,153,0.4)' : 'var(--border)'}` }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                    <span>{done ? '✓' : '…'}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {phase === 'vote' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 }}>
            <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.82rem' }}>🗳️ Vote for the best answer!</div>
            {Object.entries(subs).map(([pid, answer]) => {
              const p = game?.players?.[pid]
              const vc = tally[pid] || 0
              return (
                <motion.div key={pid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: vc === maxVotes && vc > 0 ? 'rgba(244,208,63,0.08)' : 'var(--surface)', border: `1.5px solid ${vc === maxVotes && vc > 0 ? 'rgba(244,208,63,0.4)' : 'var(--border)'}` }}>
                  {p && <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={26} />}
                  <span style={{ flex: 1, fontFamily: 'var(--font-head)', fontSize: '1rem' }}>{answer}</span>
                  {vc > 0 && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>{vc}🗳️</span>}
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 }}>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: 'var(--gold)' }}>🏆 Results</div>
            {Object.entries(subs).sort(([a], [b]) => (tally[b] || 0) - (tally[a] || 0)).map(([pid, answer], i) => {
              const p = game?.players?.[pid]
              const vc = tally[pid] || 0
              const pts = vc * 75 + (vc === maxVotes && vc > 0 ? 100 : 0) + 25
              return (
                <motion.div key={pid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: i === 0 && vc > 0 ? 'rgba(244,208,63,0.1)' : 'var(--surface)', border: `1.5px solid ${i === 0 && vc > 0 ? 'rgba(244,208,63,0.4)' : 'var(--border)'}` }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text3)', width: 20 }}>#{i + 1}</div>
                  {p && <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={26} />}
                  <span style={{ flex: 1, fontFamily: 'var(--font-head)', fontSize: '1rem' }}>{answer}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{vc} vote{vc !== 1 ? 's' : ''}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>+{pts}</div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── WHODUNNIT VIEW ────────────────────────────────────────────────────────────
function WhodunnitView({ game, players }) {
  const phase      = game?.whodPhase
  const question   = game?.whodPrompt || ''
  const answers    = game?.whodAnswers || {}
  const votes      = game?.whodVotes || {}
  const imposterId = game?.whodImposterId
  const imposterQ  = game?.whodImposterPrompt || ''
  const caught     = game?.whodCaught
  const roundNum   = game?.whodCount || 1
  const roundLimit = game?.settings?.questionsPerRound || 3

  const voteTally = {}
  Object.values(votes).forEach(tid => { voteTally[tid] = (voteTally[tid] || 0) + 1 })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: 14, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Case {roundNum} / {roundLimit}
        </div>
        <motion.div key={question} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(72,149,239,0.06)', border: '1.5px solid rgba(72,149,239,0.2)', borderRadius: 16, padding: '14px 22px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', color: '#4895ef', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Everyone was asked</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 2.2vw, 1.5rem)', lineHeight: 1.4 }}>"{question}"</div>
          {phase !== 'results' && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 8 }}>🕵️ But one player secretly got a different question…</div>}
        </motion.div>

        {(phase === 'answer' || !phase) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
            <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.9rem' }}>✍️ Players are writing their answers…</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', overflow: 'auto' }}>
              {players.map(p => {
                const done = !!answers[p.id]
                return (
                  <motion.div key={p.id} animate={done ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: done ? 'rgba(87,204,153,0.1)' : 'var(--surface)', border: `1.5px solid ${done ? 'rgba(87,204,153,0.4)' : 'var(--border)'}` }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={28} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                    <span>{done ? '✓' : '…'}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {phase === 'vote' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 }}>
            <div style={{ textAlign: 'center', color: '#4895ef', fontWeight: 700, fontSize: '0.85rem' }}>🔍 Who gave a suspicious answer? Vote on your phones!</div>
            {Object.entries(answers).map(([pid, answer]) => {
              const p = game?.players?.[pid]
              const vc = voteTally[pid] || 0
              return (
                <motion.div key={pid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'var(--surface)', border: `1.5px solid ${p?.colorHex + '44'}` }}>
                  {p && <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={30} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.75rem', color: p?.colorHex, marginBottom: 2 }}>{p?.name}</div>
                    <div style={{ fontSize: '0.92rem' }}>{answer}</div>
                  </div>
                  {vc > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#4895ef' }}>{vc}🕵️</div>}
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto', minHeight: 0 }}>
            {imposterId && game?.players?.[imposterId] && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ textAlign: 'center', padding: '14px 18px', background: caught ? 'rgba(87,204,153,0.08)' : 'rgba(230,57,70,0.08)', border: `1.5px solid ${caught ? 'rgba(87,204,153,0.3)' : 'rgba(230,57,70,0.3)'}`, borderRadius: 14 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', color: caught ? 'var(--green)' : 'var(--red)' }}>
                  {caught ? '🕵️ Imposter CAUGHT!' : '😈 Imposter ESCAPED!'}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <Avatar src={game.players[imposterId].avatar} name={game.players[imposterId].name} colorHex={game.players[imposterId].colorHex} size={44} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700 }}>{game.players[imposterId].name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>was asked: "{imposterQ}"</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 8 }}>
                  {caught ? 'Detectives who spotted them: +150 pts each' : `${game.players[imposterId].name} blended in perfectly: +200 pts`}
                </div>
              </motion.div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
              {Object.entries(answers).map(([pid, answer], i) => {
                const p = game?.players?.[pid]
                const isImp = pid === imposterId
                return (
                  <motion.div key={pid} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
                    style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 14px', borderRadius: 10, background: isImp ? 'rgba(230,57,70,0.08)' : 'var(--surface)', border: `1.5px solid ${isImp ? 'rgba(230,57,70,0.35)' : 'var(--border)'}` }}>
                    {p && <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={26} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', color: isImp ? 'var(--red)' : p?.colorHex }}>
                        {p?.name}{isImp ? ' 😈' : ''}
                      </div>
                      <div style={{ fontSize: '0.88rem' }}>{answer}</div>
                      {isImp && <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Their question: "{imposterQ}"</div>}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── TRUE OR FALSE VIEW ────────────────────────────────────────────────────────
function TrueFalseView({ game, players }) {
  const phase       = game?.tfPhase
  const question    = game?.tfQuestion
  const submissions = game?.tfSubmissions || {}
  const count       = game?.tfCount || 1
  const limit       = game?.settings?.questionsPerRound || 8
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)
  const VOTE_TIME = 15

  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase !== 'question' || !game?.tfStartAt) return
    const tick = () => setTimeLeft(Math.max(0, Math.ceil(VOTE_TIME - (Date.now() - game.tfStartAt) / 1000)))
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.tfStartAt])

  const totalVoted = Object.keys(submissions).length
  const trueVoters  = players.filter(p => submissions[p.id] === true)
  const falseVoters = players.filter(p => submissions[p.id] === false)
  const correctAnswer = question?.answer

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 24px', gap: 12, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Statement {count}/{limit}
          </span>
          {phase === 'question' && timeLeft > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: timeLeft <= 5 ? 'var(--red)' : '#10b981', marginLeft: 'auto' }}>
              {timeLeft}s · {totalVoted}/{players.length} answered
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={question?.statement} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '18px 24px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '0.68rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>
              🤔 True or False?
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 2.5vw, 1.7rem)', lineHeight: 1.4 }}>
              "{question?.statement}"
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Vote phase — anonymous */}
        {phase === 'question' && (
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            {[
              { label: '✅ TRUE',  color: '#10b981', count: trueVoters.length },
              { label: '❌ FALSE', color: '#e63946', count: falseVoters.length },
            ].map(({ label, color, count: c }) => (
              <div key={label} style={{ flex: 1, background: `${color}0d`, border: `1.5px solid ${color}33`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color, marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color }}>{c}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 4 }}>voted</div>
              </div>
            ))}
          </div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && question && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto', minHeight: 0 }}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ textAlign: 'center', padding: '14px 18px', borderRadius: 14, fontFamily: 'var(--font-head)', fontSize: '1.5rem',
                background: correctAnswer ? 'rgba(16,185,129,0.1)' : 'rgba(230,57,70,0.1)',
                border: `2px solid ${correctAnswer ? 'rgba(16,185,129,0.4)' : 'rgba(230,57,70,0.4)'}`,
                color: correctAnswer ? '#10b981' : '#e63946',
              }}>
              {correctAnswer ? '✅ TRUE' : '❌ FALSE'}
              {question.fact && (
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-body)', color: 'var(--text2)', marginTop: 8, lineHeight: 1.5, fontWeight: 400 }}>
                  {question.fact}
                </div>
              )}
            </motion.div>
            <div style={{ display: 'flex', gap: 10, overflow: 'auto', flexWrap: 'wrap', justifyContent: 'center' }}>
              {players.map((p, i) => {
                const sub = game?.tfSubmissions?.[p.id]
                const correct = sub === correctAnswer
                const noAnswer = sub === undefined
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.06 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 12,
                      background: noAnswer ? 'var(--surface)' : correct ? 'rgba(16,185,129,0.1)' : 'rgba(230,57,70,0.1)',
                      border: `1.5px solid ${noAnswer ? 'var(--border)' : correct ? 'rgba(16,185,129,0.4)' : 'rgba(230,57,70,0.4)'}` }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                    <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{p.name}</span>
                    <span style={{ fontSize: '0.85rem' }}>
                      {noAnswer ? '–' : sub === true ? '✅ True' : '❌ False'}
                    </span>
                    {!noAnswer && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: correct ? '#10b981' : '#e63946', fontWeight: 700 }}>
                        {correct ? '+100' : '-25'}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {!phase && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            Waiting for host to start…
          </div>
        )}
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── ORDERS UP! — DINER RESTAURANT SCENE (TV) ─────────────────────────────────

// Distribute order items across players so each avatar "owns" some items
function distributeItems(items, players) {
  const n = players.length || 1
  const buckets = players.map(() => [])
  items.forEach((item, i) => buckets[i % n].push({ item, idx: i }))
  return buckets
}

// Speech bubble coming from an avatar
function SpeechBubble({ items, color, side = 'bottom', visible = true }) {
  if (!visible || items.length === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22, delay: (items[0]?.idx || 0) * 0.07 }}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 8,
        background: color ? `${color}22` : 'rgba(30,18,8,0.92)',
        border: `1.5px solid ${color || 'rgba(249,115,22,0.4)'}`,
        borderRadius: 10,
        padding: '7px 10px',
        minWidth: 90,
        maxWidth: 150,
        textAlign: 'left',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {/* Tail */}
      <div style={{
        position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
        borderTop: `8px solid ${color || 'rgba(249,115,22,0.4)'}`,
      }} />
      {items.map(({ item, idx }) => (
        <div key={idx} style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
          <span style={{ color: '#f97316', fontFamily: 'var(--font-mono)', marginRight: 3 }}>{idx + 1}.</span>
          <span style={{ color: 'var(--text)' }}>{item}</span>
        </div>
      ))}
    </motion.div>
  )
}

function OrdersUpView({ game, players }) {
  const phase        = game?.ouPhase
  const fullOrder    = game?.ouFullOrder  || []
  const challenge    = game?.ouChallenge  || []
  const correctOrder = game?.ouCorrectOrder || []
  const label        = game?.ouLabel      || 'The Order'
  const submissions  = game?.ouSubmissions || {}
  const scoreMap     = game?.ouScoreMap   || {}
  const count        = game?.ouCount      || 1
  const limit        = game?.settings?.questionsPerRound || 5
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)
  const MEM_TIME   = 15
  const ORDER_TIME = 25

  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase === 'memorize' && game?.ouStartAt) {
      const tick = () => setTimeLeft(Math.max(0, Math.ceil(MEM_TIME   - (Date.now() - game.ouStartAt)    / 1000)))
      tick(); timerRef.current = setInterval(tick, 500)
    } else if (phase === 'order' && game?.ouOrderStart) {
      const tick = () => setTimeLeft(Math.max(0, Math.ceil(ORDER_TIME - (Date.now() - game.ouOrderStart) / 1000)))
      tick(); timerRef.current = setInterval(tick, 500)
    }
    return () => clearInterval(timerRef.current)
  }, [phase, game?.ouStartAt, game?.ouOrderStart])

  const totalSubmitted = Object.keys(submissions).length
  const buckets        = distributeItems(fullOrder, players)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ─── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', flexShrink: 0,
        background: 'linear-gradient(90deg, rgba(194,65,12,0.15) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(249,115,22,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🍔</span>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.05rem', color: '#f97316', lineHeight: 1 }}>
              {label}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
              Order {count}/{limit}
            </div>
          </div>
        </div>
        {(phase === 'memorize' || phase === 'order') && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, color: timeLeft <= 5 ? 'var(--red)' : '#f97316' }}>
              {timeLeft}s
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {phase === 'memorize' ? 'memorise' : 'order now'}
            </div>
          </div>
        )}
        {phase === 'reveal' && (
          <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: 'var(--gold)' }}>✅ Results</span>
        )}
      </div>

      {/* ─── MEMORIZE PHASE — Diner scene with customer avatars ──────────────── */}
      {phase === 'memorize' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          {/* Counter scene */}
          <div style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(20,10,4,0.6) 0%, rgba(40,18,6,0.9) 100%)',
          }}>
            {/* Diner wallpaper stripes */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.07,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(249,115,22,0.6) 28px, rgba(249,115,22,0.6) 30px)',
            }} />

            {/* Menu chalkboard — top centre */}
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(8,22,14,0.85)', border: '2.5px solid rgba(87,204,153,0.45)',
              borderRadius: 12, padding: '8px 18px', minWidth: 180, textAlign: 'center', zIndex: 5,
            }}>
              <div style={{ fontSize: '0.6rem', color: '#57cc99', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4 }}>
                📋 Today's Order
              </div>
              {fullOrder.map((item, i) => (
                <motion.div key={item}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '2px 0' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#57cc99', fontWeight: 700, fontSize: '0.68rem', minWidth: 16 }}>{i + 1}.</span>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left' }}>{item}</span>
                </motion.div>
              ))}
            </div>

            {/* Customers row — avatars at the counter with speech bubbles */}
            <div style={{
              position: 'absolute', bottom: 54, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              gap: Math.max(12, Math.min(36, 200 / (players.length || 1))),
              padding: '0 24px',
            }}>
              {players.map((p, pi) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + pi * 0.07 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}
                >
                  {/* Speech bubble with this player's items */}
                  <SpeechBubble items={buckets[pi] || []} color={p.colorHex} />

                  {/* Avatar */}
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={50} />
                  <span style={{ fontSize: '0.62rem', color: 'var(--text2)', fontWeight: 700, maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Counter bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 54,
              background: 'linear-gradient(180deg, #7c2d12 0%, #431407 100%)',
              borderTop: '3px solid #c2410c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Counter surface pattern */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 1px, transparent 1px, transparent 60px)' }} />
              <span style={{ fontSize: '0.6rem', color: 'rgba(249,115,22,0.5)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700 }}>
                ─── ORDERS UP ───
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── ORDER PHASE — challenge items + customer status ─────────────────── */}
      {phase === 'order' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 24px', overflow: 'hidden', minHeight: 0 }}>

          <div style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontSize: '0.95rem', textAlign: 'center', flexShrink: 0 }}>
            🔀 What order did these appear in the full list?
          </div>

          {/* 3 challenge items */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {challenge.map((item, i) => (
              <motion.div key={item}
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 320, damping: 24 }}
                style={{
                  flex: 1, padding: '18px 10px', borderRadius: 14, textAlign: 'center',
                  background: 'rgba(249,115,22,0.08)', border: '2px solid rgba(249,115,22,0.3)',
                  fontWeight: 700, fontSize: 'clamp(0.78rem, 1.5vw, 1rem)',
                }}>
                {item}
              </motion.div>
            ))}
          </div>

          {/* Customer status row */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, flexWrap: 'wrap', overflow: 'auto',
          }}>
            {players.map((p, pi) => {
              const done = !!submissions[p.id]
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + pi * 0.06 }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '10px 14px', borderRadius: 14,
                    background: done ? 'rgba(87,204,153,0.08)' : 'rgba(249,115,22,0.05)',
                    border: `2px solid ${done ? 'rgba(87,204,153,0.4)' : 'rgba(249,115,22,0.2)'}`,
                    transition: 'all 0.3s',
                  }}>
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={42} />
                  <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{p.name}</span>
                  <span style={{ fontSize: '0.82rem' }}>{done ? '✅ Done' : '⏳…'}</span>
                </motion.div>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', flexShrink: 0 }}>
            {totalSubmitted}/{players.length} orders submitted
          </div>
        </motion.div>
      )}

      {/* ─── REVEAL PHASE ────────────────────────────────────────────────────── */}
      {phase === 'reveal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: 'flex', gap: 16, padding: '14px 20px', overflow: 'hidden', minHeight: 0 }}>

          {/* Correct order list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', minHeight: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', color: 'var(--green)', fontSize: '0.85rem', marginBottom: 4, flexShrink: 0 }}>
              ✅ The correct order
            </div>
            {correctOrder.map((item, i) => (
              <motion.div key={item}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(87,204,153,0.08)', border: '1.5px solid rgba(87,204,153,0.3)',
                }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', minWidth: 20, fontSize: '0.82rem' }}>{i + 1}.</span>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Player score cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontSize: '0.85rem', marginBottom: 4, flexShrink: 0 }}>
              🏆 Scores
            </div>
            {players.map((p, pi) => {
              const sm  = scoreMap[p.id]
              const sub = submissions[p.id]
              const medal = sm?.correct === 3 ? '🎯' : sm?.correct === 2 ? '✌️' : sm?.correct === 1 ? '🤏' : '💀'
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + pi * 0.08 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 12,
                    background: sm?.pts > 0 ? 'rgba(244,208,63,0.07)' : 'rgba(100,100,100,0.06)',
                    border: `1.5px solid ${p.colorHex}33`,
                  }}>
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    {sub && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.join(' → ')}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.95rem' }}>{medal}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: sm?.pts > 0 ? 'var(--gold)' : 'var(--text3)' }}>
                      {sm ? `+${sm.pts}` : '—'}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {!phase && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
          Waiting for host to start…
        </div>
      )}

      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── F-ART DIRECTION (TV) ─────────────────────────────────────────────────────
function _fdTextColor(hex) {
  if (!hex || hex.length < 7) return '#fff'
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#000' : '#fff'
}
function _fdAccuracy(h1, h2) {
  if (!h1 || !h2 || h1.length < 7 || h2.length < 7) return 0
  const r1=parseInt(h1.slice(1,3),16),g1=parseInt(h1.slice(3,5),16),b1=parseInt(h1.slice(5,7),16)
  const r2=parseInt(h2.slice(1,3),16),g2=parseInt(h2.slice(3,5),16),b2=parseInt(h2.slice(5,7),16)
  return Math.round((1 - Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2) / 441.67) * 100)
}

function FartDirectionView({ game, players }) {
  const phase      = game?.fdPhase
  const target     = game?.fdTargetColor
  const submissions = game?.fdSubmissions || {}
  const scoreMap   = game?.fdScoreMap    || {}
  const count      = game?.fdCount || 1
  const limit      = game?.settings?.questionsPerRound || 5
  const PICK_TIME  = 20

  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase !== 'pick' || !game?.fdPickStartAt) return
    const tick = () => setTimeLeft(Math.max(0, Math.ceil(PICK_TIME - (Date.now() - game.fdPickStartAt) / 1000)))
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, game?.fdPickStartAt])

  const MEDALS = ['🥇', '🥈', '🥉']
  const RANK_COLS = ['#f4d03f', '#c0c0c0', '#cd7f32']

  if (phase === 'show') {
    const tc = _fdTextColor(target)
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: target || '#222', position: 'relative' }}>
        <motion.div
          animate={{ opacity: [0.12, 0.3, 0.12] }} transition={{ duration: 1.6, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.18)' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative' }}>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: '5rem' }}>🎨</motion.div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: tc, textShadow: tc === '#000' ? '0 2px 10px rgba(255,255,255,0.5)' : '0 2px 10px rgba(0,0,0,0.5)', textAlign: 'center', lineHeight: 1.2 }}>
            REMEMBER<br />THIS COLOUR!
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: tc, opacity: 0.6 }}>
            Colour {count}/{limit}
          </div>
        </div>
        <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 4, ease: 'linear' }}
          style={{ height: 8, background: tc === '#000' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)' }} />
      </div>
    )
  }

  if (phase === 'pick') {
    const submitted = Object.keys(submissions)
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 6, background: 'var(--surface2)', flexShrink: 0 }}>
          <motion.div animate={{ width: `${(timeLeft / PICK_TIME) * 100}%` }} transition={{ duration: 0.9, ease: 'linear' }}
            style={{ height: '100%', background: timeLeft <= 5 ? 'var(--red)' : '#a855f7' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '20px 32px' }}>
          <motion.div animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
            style={{ fontSize: 'clamp(4rem, 10vw, 7rem)' }}>
            💨
          </motion.div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)', textAlign: 'center', color: '#a855f7' }}>
            Find the colour!
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--text2)' }}>
            {timeLeft}s · {submitted.length}/{players.length} locked in
          </div>
          {/* Player submission status */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            {players.map(p => {
              const done = submissions[p.id]
              return (
                <motion.div key={p.id}
                  animate={done ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: done ? 1 : 0.45 }}
                >
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={44} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: done ? '#a855f7' : 'var(--text3)' }}>
                    {done ? '✅' : '⏳'}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'reveal') {
    const ranked = players
      .map(p => ({ ...p, ...(scoreMap[p.id] || { rank: 99, pts: 0, color: null }) }))
      .sort((a, b) => a.rank - b.rank)

    return (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left — target colour */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '20px 16px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Target</div>
          <motion.div
            initial={{ scale: 0.7 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            style={{ width: 120, height: 120, borderRadius: 20, background: target, border: '3px solid rgba(255,255,255,0.15)' }}
          />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text3)' }}>{target?.toUpperCase()}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            Colour {count}/{limit}
          </div>
        </div>

        {/* Right — player results */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 8, overflow: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            💨 Results
          </div>
          {ranked.map((p, i) => {
            const medal = MEDALS[p.rank - 1]
            const rc = RANK_COLS[p.rank - 1] || 'var(--text3)'
            const acc = p.color ? _fdAccuracy(target, p.color) : 0
            return (
              <motion.div key={p.id}
                initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', borderRadius: 12, padding: '10px 14px', border: `1.5px solid ${p.rank === 1 ? 'rgba(244,208,63,0.35)' : 'var(--border)'}` }}
              >
                <div style={{ fontSize: '1.2rem', width: 28, textAlign: 'center' }}>{medal || `${p.rank}`}</div>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.color && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text3)' }}>
                      {acc}% match
                    </div>
                  )}
                </div>
                {p.color && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: p.color, border: '2px solid rgba(255,255,255,0.12)', flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: p.pts > 0 ? rc : 'var(--text3)' }}>
                      {p.pts > 0 ? `+${p.pts}` : '—'}
                    </div>
                  </div>
                )}
                {!p.color && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>No pick</div>}
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-dots"><span /><span /><span /></div>
    </div>
  )
}

// ── SPEED BRIEFS (TV) ────────────────────────────────────────────────────────
function SpeedBriefsView({ game, players }) {
  const phase = game?.sbPhase
  const brief = game?.sbBrief
  const submissions = game?.sbSubmissions || {}
  const votes = game?.sbVotes || {}
  const results = game?.sbResults
  const round = game?.sbRound || 1
  const roundLimit = game?.settings?.questionsPerRound || 5
  const subIds = Object.keys(submissions).sort()

  const revealIdx = game?.sbRevealIdx || 0
  const currentRevealId = subIds[revealIdx]

  // Vote tallies for display during results
  const voteTotals = results?.voteTotals || {}
  const ranked = results?.ranked || []
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 24px', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', color: '#f72585' }}>
            🩲 Speed Briefs — Round {round}/{roundLimit}
          </div>
          {brief && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 2 }}>
              {brief.emoji} {brief.name}
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'right' }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: '#f72585' }}>
            {phase === 'input' ? '✏️ Writing…' : phase === 'reveal' ? `Ad ${revealIdx + 1}/${subIds.length}` : phase === 'vote' ? '⭐ Voting' : phase === 'results' ? '🏆 Results' : '—'}
          </div>
          <div style={{ marginTop: 2 }}>{Object.keys(votes).length}/{players.filter(p => p.role !== 'gamescreen').length} voted</div>
        </div>
      </div>

      {/* Input phase — show who has submitted */}
      {phase === 'input' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', textAlign: 'center', marginBottom: 4 }}>
            Players are writing their taglines for <strong style={{ color: '#f72585' }}>{brief?.emoji} {brief?.name}</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {players.filter(p => p.role !== 'gamescreen').map(p => {
              const done = !!submissions[p.id]
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: done ? 1 : 0.4 }}>
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                  <div style={{ fontSize: '0.6rem', color: done ? '#57cc99' : 'var(--text3)' }}>{done ? '✓' : '…'}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reveal phase — billboard */}
      {phase === 'reveal' && currentRevealId && brief && (
        <div style={{ flex: 1, display: 'flex', gap: 20, alignItems: 'stretch', overflow: 'hidden' }}>
          {/* Left: product panel */}
          <div style={{ width: '38%', background: brief.color, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, flexShrink: 0 }}>
            <div style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', lineHeight: 1 }}>{brief.emoji}</div>
            <div style={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0 2px 6px rgba(0,0,0,0.4)', fontSize: 'clamp(0.8rem, 1.8vw, 1.3rem)', marginTop: 10, textAlign: 'center' }}>
              {brief.name}
            </div>
          </div>
          {/* Right: tagline + player */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRevealId}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              style={{ flex: 1, background: '#fff', borderRadius: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(16px, 3vw, 32px)', overflow: 'hidden' }}
            >
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(1.2rem, 3vw, 2.4rem)', color: '#111', lineHeight: 1.4, textAlign: 'center', marginBottom: 20 }}>
                "{submissions[currentRevealId]}"
              </div>
              {game.players?.[currentRevealId] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <Avatar src={game.players[currentRevealId].avatar} name={game.players[currentRevealId].name} colorHex={game.players[currentRevealId].colorHex} size={28} />
                  <span style={{ fontSize: '0.85rem', color: '#555', fontStyle: 'italic' }}>{game.players[currentRevealId].name}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Vote phase — show all ads compactly */}
      {phase === 'vote' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textAlign: 'center' }}>Players are voting for their favourite ad</div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignContent: 'flex-start' }}>
            {subIds.map(pid => {
              const player = game.players?.[pid]
              const hasVoted = !!votes[pid]
              return (
                <div key={pid} style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', width: 'clamp(140px, 20vw, 200px)', opacity: 0.92 }}>
                  <div style={{ height: 4, background: brief?.color }} />
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(0.65rem, 1.2vw, 0.82rem)', color: '#111', lineHeight: 1.4, marginBottom: 6 }}>
                      "{submissions[pid]}"
                    </div>
                    {player && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Avatar src={player.avatar} name={player.name} colorHex={player.colorHex} size={14} />
                        <span style={{ fontSize: '0.55rem', color: '#888' }}>{player.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Results phase */}
      {phase === 'results' && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ranked.map(({ pid, votes: v }, i) => {
            const player = game.players?.[pid]
            const pts = results?.scoreChanges?.[pid] || 0
            return (
              <motion.div
                key={pid}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', borderRadius: 12, overflow: 'hidden' }}
              >
                <div style={{ width: 48, background: brief?.color, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  {medals[i] || brief?.emoji}
                </div>
                <div style={{ flex: 1, padding: '10px 4px', minWidth: 0 }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(0.75rem, 1.5vw, 1rem)', color: '#111', lineHeight: 1.35, marginBottom: 4 }}>
                    "{submissions[pid]}"
                  </div>
                  {player && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar src={player.avatar} name={player.name} colorHex={player.colorHex} size={18} />
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>{player.name}</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', padding: '10px 14px', flexShrink: 0 }}>
                  {v > 0 && <div style={{ fontWeight: 700, fontSize: '0.85rem', color: i === 0 ? '#b8860b' : '#555' }}>{v} vote{v !== 1 ? 's' : ''}</div>}
                  <div style={{ fontSize: '0.8rem', color: '#57cc99', fontWeight: 700 }}>+{pts}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── MODEL MODEL UN (TV) ───────────────────────────────────────────────────────
function ModelModelUNView({ game, players }) {
  const phase = game?.mmuPhase
  const nations = game?.mmuNations || {}
  const missiles = game?.mmuMissiles || {}
  const defense = game?.mmuDefense || {}
  const alive = game?.mmuAlive || {}
  const cards = game?.mmuCards || {}
  const prizePool = game?.mmuPrizePool || 0
  const round = game?.mmuRound || 1
  const startAt = game?.mmuPhaseStartAt

  const alivePlayers = Object.entries(alive).filter(([, v]) => v).map(([id]) => id)
  const allPlayers = players.filter(p => p.role !== 'gamescreen')

  const DURATIONS = { invest: 30, select: 30, espionage: 15, negotiate: 60, resolve: 15, card: 6 }
  const totalSecs = DURATIONS[phase] || 0
  const [timeLeft, setTimeLeft] = useState(totalSecs)
  const timerRef = useRef(null)

  useEffect(() => {
    clearInterval(timerRef.current)
    if (!startAt || !totalSecs) return
    const tick = () => setTimeLeft(Math.max(0, Math.ceil(totalSecs - (Date.now() - startAt) / 1000)))
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, startAt, totalSecs])

  // Resolve phase: fire off events at their delays
  // firedEvents = missile launched (for in-flight indicator)
  // landedEvents = missile landed/exploded 1.4s later (for hit/save animation)
  const resolution = game?.mmuResolution
  const [firedEvents, setFiredEvents] = useState([])
  const [landedEvents, setLandedEvents] = useState([])
  useEffect(() => {
    if (phase !== 'resolve' || !resolution?.events || !startAt) return
    setFiredEvents([])
    setLandedEvents([])
    const timers = []
    resolution.events.forEach((evt, i) => {
      const evtTagged = { ...evt, _i: i }
      const when = Math.max(0, (startAt + evt.delay) - Date.now())
      timers.push(setTimeout(() => setFiredEvents(prev => [...prev, evtTagged]), when))
      timers.push(setTimeout(() => setLandedEvents(prev => [...prev, evtTagged]), when + 1400))
    })
    return () => timers.forEach(clearTimeout)
  }, [phase, startAt])

  const PHASE_INFO = {
    rules:      { icon: '📜', label: 'Briefing', color: '#c2773a' },
    invest:     { icon: '⚡', label: `Phase 1 — Arms Race · Round ${round}`, color: '#c2773a' },
    select:     { icon: '🎯', label: 'Phase 2 — Target Selection', color: '#e63946' },
    espionage:  { icon: '🔍', label: 'Phase 3 — Intelligence', color: '#a855f7' },
    negotiate:  { icon: '🤝', label: 'Phase 4 — Negotiation', color: '#57cc99' },
    resolve:    { icon: '💥', label: 'Phase 5 — Resolution', color: '#e63946' },
    card:       { icon: '🃏', label: 'Special Cards', color: 'var(--gold)' },
    truce:      { icon: '🕊️', label: 'Peace Treaty', color: '#57cc99' },
    gameover:   { icon: '🏆', label: 'GAME OVER', color: 'var(--gold)' },
  }
  const info = PHASE_INFO[phase] || { icon: '🧱', label: 'Model Model UN', color: '#c2773a' }

  // Nations grid
  function NationCard({ playerId }) {
    const nation = nations[playerId]
    const isAlive = alive[playerId] !== false
    const card = cards[playerId]
    const hitLanded = landedEvents.filter(e => e.target === playerId && e.type === 'hit')
    const savedShield = landedEvents.filter(e => e.target === playerId && e.type === 'shielded')
    const savedIntercept = landedEvents.filter(e => e.target === playerId && e.type === 'intercepted')
    const wasJustHit = hitLanded.length > 0
    const wasJustShielded = savedShield.length > 0 && !wasJustHit
    const wasJustIntercepted = savedIntercept.length > 0 && !wasJustHit
    const wasJustSaved = wasJustShielded || wasJustIntercepted
    const flyingHere = firedEvents.filter(e => e.target === playerId && !landedEvents.some(l => l._i === e._i))
    const inFlight = flyingHere.length > 0
    const p = players.find(pl => pl.id === playerId)

    return (
      <div style={{
        position: 'relative', overflow: 'visible',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, minWidth: 'clamp(90px, 12vw, 150px)',
        opacity: isAlive ? 1 : 0.28, transition: 'opacity 0.4s',
      }}>
        {/* Incoming missile 🚀 arc */}
        <AnimatePresence>
          {inFlight && flyingHere.map((e, mi) => {
            const fromLeft = mi % 2 === 0
            return (
              <motion.div
                key={`fly-${e._i}`}
                initial={{ x: fromLeft ? -50 : 50, y: -60, rotate: fromLeft ? 150 : 210, opacity: 0 }}
                animate={{ x: 0, y: 15, rotate: fromLeft ? 168 : 192, opacity: 1 }}
                exit={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.0, ease: 'easeIn' }}
                style={{ position: 'absolute', top: 0, fontSize: 'clamp(0.8rem, 1.6vw, 1.1rem)', pointerEvents: 'none', zIndex: 30, filter: 'drop-shadow(0 0 8px #e63946)' }}
              >
                🚀
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Impact flash overlay */}
        <AnimatePresence>
          {wasJustHit && (
            <motion.div key="flash"
              initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }}
              style={{ position: 'absolute', inset: -4, background: '#e63946', borderRadius: 8, zIndex: 25, pointerEvents: 'none' }}
            />
          )}
        </AnimatePresence>

        {/* SVG village scene: avatar behind buildings, colored roof, table, shield */}
        <ModelVillageScene
          player={p}
          roofColor={p?.colorHex || '#c2773a'}
          nation={nation}
          missiles={missiles[playerId] ?? 0}
          destroyed={wasJustHit && !isAlive}
          inFlight={inFlight}
          shielded={wasJustShielded}
          interceptions={wasJustIntercepted ? [1] : []}
          avatarSize={28}
          scale={0.78}
        />

        {/* Nation name + stats */}
        <div style={{ fontWeight: 700, fontSize: 'clamp(0.5rem, 1.1vw, 0.68rem)', textAlign: 'center', lineHeight: 1.2, color: isAlive ? 'var(--text1)' : 'var(--text3)' }}>
          {nation?.name || p?.name || playerId}
        </div>
        {isAlive && !wasJustHit && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.45rem, 0.95vw, 0.62rem)', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.4 }}>
            🚀{missiles[playerId] ?? 0} · 🛡️{defense[playerId] ?? 10}%
            {card && ' · 🃏'}
          </div>
        )}
        {wasJustShielded && <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.9rem)' }}>🛡️ blocked!</div>}
        {wasJustIntercepted && <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.9rem)' }}>✈️ intercepted!</div>}
      </div>
    )
  }

  const PHASE_INSTRUCTIONS = {
    rules:      'Players are reading the rules. Host will start the game shortly.',
    invest:     'Nations are deciding whether to buy missiles, upgrade defences, or save their 50pt budget.',
    select:     'Nations are secretly selecting their targets. No peeking!',
    espionage:  'Spy networks are active. Each nation receives one piece of intelligence — 25% may be fabricated.',
    negotiate:  'Diplomats are talking. Players can see all shared intel and adjust their targets. Players may propose a truce.',
    resolve:    'MISSILES IN THE AIR! Watch the villages carefully…',
    card:       'Special intelligence cards are being distributed for next round.',
    gameover:   'The conflict is over. Calculating final scores…',
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Timer bar */}
      {totalSecs > 0 && (
        <div style={{ height: 5, background: 'var(--surface2)', flexShrink: 0 }}>
          <motion.div style={{ height: '100%', background: timeLeft <= 5 ? '#e63946' : info.color, width: `${(timeLeft / totalSecs) * 100}%` }}
            transition={{ duration: 0.8, ease: 'linear' }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 20px', gap: 14 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(0.9rem, 2vw, 1.3rem)', color: info.color }}>{info.label}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>
              {PHASE_INSTRUCTIONS[phase] || ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: timeLeft <= 5 && totalSecs > 0 ? '#e63946' : 'var(--text2)' }}>
              {totalSecs > 0 ? `${timeLeft}s` : ''}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>🏆 Pool: {prizePool}pts</div>
          </div>
        </div>

        {/* Nations grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {allPlayers.map(p => <NationCard key={p.id} playerId={p.id} />)}
        </div>

        {/* Resolve phase event log — shows when missile lands */}
        {phase === 'resolve' && landedEvents.length > 0 && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Events</div>
            <AnimatePresence>
              {landedEvents.map((e, i) => {
                const attNation = nations[e.attacker]
                const tgtNation = nations[e.target]
                let text = ''
                if (e.type === 'hit') text = `💥 ${attNation?.emoji || '?'} ${attNation?.name} destroyed ${tgtNation?.emoji || '?'} ${tgtNation?.name}${e.heatseeker ? ' (Heatseeker!)' : ''}!`
                else if (e.type === 'intercepted') text = `🛡️ ${tgtNation?.emoji || '?'} ${tgtNation?.name} intercepted a missile from ${attNation?.emoji || '?'} ${attNation?.name}!`
                else if (e.type === 'shielded') text = `🛡️ ${tgtNation?.emoji || '?'} ${tgtNation?.name}'s Shield blocked a missile from ${attNation?.emoji || '?'} ${attNation?.name}!`
                else if (e.type === 'wasted') text = `🚀 A missile from ${attNation?.emoji || '?'} ${attNation?.name} had no target.`
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: '0.78rem', padding: '4px 8px', background: 'var(--surface2)', borderRadius: 6, color: e.type === 'hit' ? '#e63946' : e.type === 'wasted' ? 'var(--text3)' : '#57cc99' }}>
                    {text}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Split/Steal result */}
        {phase === 'gameover' && game.mmuSplitResult && (
          <div style={{ background: 'rgba(244,208,63,0.08)', border: '1px solid rgba(244,208,63,0.2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            {(() => {
              const { stealers, splitters } = game.mmuSplitResult
              if (stealers.length === 0) return <div style={{ color: '#57cc99', fontWeight: 700 }}>🕊️ Both nations signed the peace treaty — pot split equally!</div>
              if (stealers.length === 2) return <div style={{ color: '#e63946', fontWeight: 700 }}>💣 Both nations attacked — the prize pot was destroyed!</div>
              const stealerNation = nations[stealers[0]]
              return <div style={{ color: 'var(--gold)', fontWeight: 700 }}>⚔️ {stealerNation?.emoji} {stealerNation?.name} launched the final strike and claims the prize pot!</div>
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── LAWYERS COURTROOM (TV) ────────────────────────────────────────────────────
function TVCourtroomScene({ defender, prosecutor, audience, speakingId, phase }) {
  const isDefSpeaking  = !!speakingId && speakingId === defender?.id
  const isProsSpeaking = !!speakingId && speakingId === prosecutor?.id
  const isTalking      = isDefSpeaking || isProsSpeaking

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(18,9,4,0.55) 0%, rgba(30,14,6,0.85) 100%)',
      border: '2px solid #5c3618', borderRadius: 16, overflow: 'hidden', position: 'relative',
    }}>
      {/* Wood panelling strip */}
      <div style={{ height: 8, background: 'repeating-linear-gradient(90deg,#5c3618 0px,#5c3618 1px,#3d200a 1px,#3d200a 40px)', opacity: 0.7 }} />

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '7px 0', borderBottom: '1px solid #5c361833' }}>
        <span style={{ fontSize: '0.62rem', color: '#c9a227', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>⚖️ Court in Session</span>
      </div>

      {/* Jury gallery */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '8px 16px 7px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid #5c361833', minHeight: 52, flexWrap: 'wrap', alignItems: 'center' }}>
        {audience.length > 0
          ? audience.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={32} />
                <span style={{ fontSize: '0.52rem', color: '#c9a22788', maxWidth: 42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
            ))
          : <span style={{ fontSize: '0.7rem', color: '#5c3618' }}>Jury gallery</span>}
      </div>

      {/* Courtroom floor */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '14px 40px 0', minHeight: 150, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.4) 100%)' }}>
        {/* Defence */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 90 }}
          animate={{ scale: isDefSpeaking ? 1.35 : 0.8, opacity: !isTalking || isDefSpeaking ? 1 : 0.5 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}>
          {isDefSpeaking && (
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 0.65 }} style={{ fontSize: '1.1rem' }}>🎙️</motion.div>
          )}
          <motion.div
            animate={isDefSpeaking ? { filter: ['drop-shadow(0 0 6px #4895ef88)', 'drop-shadow(0 0 18px #4895efcc)', 'drop-shadow(0 0 6px #4895ef88)'] } : { filter: 'none' }}
            transition={{ duration: 1.1, repeat: isDefSpeaking ? Infinity : 0 }}>
            <Avatar src={defender?.avatar} name={defender?.name || '?'} colorHex="#4895ef" size={54} />
          </motion.div>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: isDefSpeaking ? '#4895ef' : '#c9a22777', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{defender?.name || '?'}</div>
          <div style={{ width: 70, height: 22, background: `linear-gradient(180deg,${isDefSpeaking ? '#4895ef33' : '#4a2a0d'} 0%,#2a1506 100%)`, borderRadius: '4px 4px 0 0', borderTop: `2.5px solid ${isDefSpeaking ? '#4895ef' : '#7a5230'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.7rem' }}>🛡️</span>
          </div>
          <div style={{ fontSize: '0.52rem', color: '#c9a22755', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Defence</div>
        </motion.div>

        {/* Centre cue */}
        <div style={{ textAlign: 'center', paddingBottom: 34, flexShrink: 0 }}>
          {isTalking && <motion.div key={speakingId} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ fontSize: '1.8rem' }}>🎙️</motion.div>}
          {phase === 'vote'    && <div style={{ fontSize: '1.8rem' }}>🗳️</div>}
          {phase === 'results' && <div style={{ fontSize: '1.8rem' }}>⚖️</div>}
          {phase === 'intro'   && <div style={{ fontSize: '1.8rem' }}>🔔</div>}
        </div>

        {/* Prosecution */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 90 }}
          animate={{ scale: isProsSpeaking ? 1.35 : 0.8, opacity: !isTalking || isProsSpeaking ? 1 : 0.5 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}>
          {isProsSpeaking && (
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 0.65 }} style={{ fontSize: '1.1rem' }}>🎙️</motion.div>
          )}
          <motion.div
            animate={isProsSpeaking ? { filter: ['drop-shadow(0 0 6px #e6394688)', 'drop-shadow(0 0 18px #e63946cc)', 'drop-shadow(0 0 6px #e6394688)'] } : { filter: 'none' }}
            transition={{ duration: 1.1, repeat: isProsSpeaking ? Infinity : 0 }}>
            <Avatar src={prosecutor?.avatar} name={prosecutor?.name || '?'} colorHex="#e63946" size={54} />
          </motion.div>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: isProsSpeaking ? '#e63946' : '#c9a22777', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{prosecutor?.name || '?'}</div>
          <div style={{ width: 70, height: 22, background: `linear-gradient(180deg,${isProsSpeaking ? '#e6394633' : '#4a2a0d'} 0%,#2a1506 100%)`, borderRadius: '4px 4px 0 0', borderTop: `2.5px solid ${isProsSpeaking ? '#e63946' : '#7a5230'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.7rem' }}>⚔️</span>
          </div>
          <div style={{ fontSize: '0.52rem', color: '#c9a22755', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prosecution</div>
        </motion.div>
      </div>

      {/* Floor strip */}
      <div style={{ height: 14, background: 'repeating-linear-gradient(90deg,#3d200a 0px,#3d200a 60px,#2a1506 60px,#2a1506 61px)', marginTop: 2 }} />
    </div>
  )
}

// ── LAWYERS VIEW ──────────────────────────────────────────────────────────────
function LawyersView({ game, players }) {
  const phase      = game?.lawyersPhase || 'intro'
  const statement  = game?.lawyersStatement || ''
  const defenderId = game?.lawyersDefenderId
  const prosId     = game?.lawyersProsecutorId
  const defender   = game?.players?.[defenderId]
  const prosecutor = game?.players?.[prosId]
  const phaseStart = game?.lawyersPhaseStart || 0
  const votes      = game?.lawyersVotes || {}
  const results    = game?.lawyersPoints
  const caseNum    = game?.lawyersRound || 1
  const totalCases = game?.lawyersTotalRounds || 3
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef   = useRef(null)

  useEffect(() => {
    clearInterval(timerRef.current)
    const dur = LAWYERS_DURATIONS[phase] || 0
    if (dur <= 0) { setTimeLeft(0); return }
    const tick = () => setTimeLeft(Math.max(0, Math.ceil(dur - (Date.now() - phaseStart) / 1000)))
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [phase, phaseStart])

  const totalVotes = Object.keys(votes).length
  const eligible   = players.filter(p => p.id !== defenderId && p.id !== prosId)
  const isDefTurn  = phase === 'defence1' || phase === 'defence2'
  const isProsTurn = phase === 'prosecution1' || phase === 'prosecution2'
  const isSpeech   = isDefTurn || isProsTurn
  const speakingId = isDefTurn ? defenderId : isProsTurn ? prosId : null
  const activeSpeaker = speakingId ? game?.players?.[speakingId] : null
  const speakColor = isDefTurn ? '#4895ef' : isProsTurn ? '#e63946' : '#c084fc'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 24px', gap: 10, overflow: 'hidden', minHeight: 0 }}>

        {/* Case counter + statement */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.8rem', color: '#c084fc', whiteSpace: 'nowrap' }}>
            Case {caseNum}/{totalCases}
          </div>
          <motion.div key={statement} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            style={{ flex: 1, background: 'rgba(192,132,252,0.06)', border: '1.5px solid rgba(192,132,252,0.22)', borderRadius: 12, padding: '9px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(0.85rem, 2vw, 1.25rem)', lineHeight: 1.4, color: '#c084fc' }}>"{statement}"</div>
          </motion.div>
          {isSpeech && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 900, color: timeLeft <= 5 ? 'var(--red)' : speakColor, flexShrink: 0, minWidth: 44, textAlign: 'center' }}>{timeLeft}s</div>}
        </div>

        {/* Courtroom scene — takes most of the space */}
        <AnimatePresence mode="wait">
          <motion.div key={`case-${caseNum}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flexShrink: 0 }}>
            <TVCourtroomScene
              defender={defender}
              prosecutor={prosecutor}
              audience={eligible}
              speakingId={speakingId}
              phase={phase}
            />
          </motion.div>
        </AnimatePresence>

        {/* Phase label */}
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '0.88rem', color: speakColor, flexShrink: 0 }}>
          {LAWYERS_LABELS[phase]}
          {['defence1','prosecution1'].includes(phase) ? ' · Opening 1/2' : ['defence2','prosecution2'].includes(phase) ? ' · Rebuttal 2/2' : ''}
        </div>

        {phase === 'intro' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '0.9rem', textAlign: 'center' }}>
            The debate is about to begin.<br />Phones away — listen closely!
          </div>
        )}

        {isSpeech && activeSpeaker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.8rem' }}>
            No interrupting!
          </motion.div>
        )}

        {/* Vote phase — anonymous: only total count shown */}
        {phase === 'vote' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <div style={{ textAlign: 'center', color: 'var(--gold)', fontFamily: 'var(--font-head)', fontSize: '1.1rem' }}>
              🗳️ Vote on your phones!{timeLeft > 0 ? ` · ${timeLeft}s` : ''}
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text2)', fontWeight: 600 }}>
              {totalVotes} / {eligible.length} voted · results hidden until everyone is done
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', overflow: 'auto' }}>
              {eligible.map(p => {
                const hasVoted = !!votes[p.id]
                return (
                  <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', background: hasVoted ? 'rgba(87,204,153,0.1)' : 'var(--surface)', border: `1px solid ${hasVoted ? 'rgba(87,204,153,0.35)' : 'var(--border)'}` }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={16} />{p.name} {hasVoted ? '✓' : '…'}
                  </span>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Results — now reveal the split */}
        {phase === 'results' && results && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', minHeight: 0 }}>
            <div style={{ height: 22, borderRadius: 11, overflow: 'hidden', display: 'flex', background: 'var(--surface)' }}>
              <motion.div style={{ background: '#4895ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }} initial={{ width: 0 }} animate={{ width: `${((results.defCount || 0) / Math.max(1, (results.defCount || 0) + (results.prosCount || 0))) * 100}%` }} transition={{ duration: 0.8 }}>
                {(results.defCount || 0) > 0 && <span style={{ fontSize: '0.72rem', color: '#fff', padding: '0 6px' }}>🛡️ {results.defCount}</span>}
              </motion.div>
              <motion.div style={{ background: '#e63946', display: 'flex', alignItems: 'center', justifyContent: 'center' }} initial={{ width: 0 }} animate={{ width: `${((results.prosCount || 0) / Math.max(1, (results.defCount || 0) + (results.prosCount || 0))) * 100}%` }} transition={{ duration: 0.8, delay: 0.05 }}>
                {(results.prosCount || 0) > 0 && <span style={{ fontSize: '0.72rem', color: '#fff', padding: '0 6px' }}>⚔️ {results.prosCount}</span>}
              </motion.div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#4895ef' }}>🛡️ {defender?.name} — +{results.defence || 0}pts</span>
              <span style={{ color: '#e63946' }}>⚔️ {prosecutor?.name} — +{results.prosecution || 0}pts</span>
            </div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ textAlign: 'center', padding: '12px 18px', background: results.majority === 'defence' ? 'rgba(72,149,239,0.1)' : 'rgba(230,57,70,0.1)', border: `1.5px solid ${results.majority === 'defence' ? 'rgba(72,149,239,0.3)' : 'rgba(230,57,70,0.3)'}`, borderRadius: 12 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: results.majority === 'defence' ? '#4895ef' : '#e63946' }}>
                {results.majority === 'defence' ? '🛡️ Defence wins the case!' : '⚔️ Prosecution wins the case!'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>
                Audience who voted {results.majority}: +50 pts
                {!caseNum >= totalCases && <> · Case {caseNum}/{totalCases}</>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── POWERUP VIEW ──────────────────────────────────────────────────────────────
function PowerupView({ game, players }) {
  const currentRound = game?.currentRound || 1
  const totalRounds  = game?.settings?.totalRounds || 5
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '18px 24px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', marginBottom: 4 }}>⚡ Round {currentRound} of {totalRounds}</div>
        <div style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>Players are choosing their powerups…</div>
      </div>
      <Leaderboard players={players} game={game} title="🏆 Current Standings" showPowerups />
    </div>
  )
}

// ── ROUND OVER VIEW ───────────────────────────────────────────────────────────
function RoundOverView({ game, players }) {
  const currentRound = game?.currentRound || 1
  const mvp = players[0]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '18px 24px 12px', flexShrink: 0 }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: 'var(--gold)' }}>
          🏆 Round {currentRound} Complete!
        </motion.div>
        {mvp && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ color: 'var(--text2)', fontSize: '0.88rem', marginTop: 6 }}>
            Leading: <strong style={{ color: mvp.colorHex }}>{mvp.name}</strong> · {mvp.score || 0} pts
          </motion.div>
        )}
      </div>
      <Leaderboard players={players} game={game} title="Overall Standings" />
    </div>
  )
}

// ── VOTING VIEW ───────────────────────────────────────────────────────────────
function VotingView({ game, players }) {
  // dealGenres in Firebase is an array of ID strings — map to full objects
  const dealGenres = (game?.dealGenres || []).map(id => getGenreById(id)).filter(Boolean)
  const roundVotes = game?.roundVotes || {}
  const voteCounts = {}
  Object.values(roundVotes).forEach(gid => { voteCounts[gid] = (voteCounts[gid] || 0) + 1 })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, padding: 32, overflow: 'auto' }}>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '1.5rem' }}>🗳️ Vote for Next Round</div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {dealGenres.map(genre => {
          const count = voteCounts[genre.id] || 0
          const pct   = players.length > 0 ? (count / players.length) * 100 : 0
          return (
            <motion.div key={genre.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: `2px solid ${count > 0 ? (genre.color || 'var(--accent)') : 'var(--border)'}`, borderRadius: 16, padding: '20px 28px', textAlign: 'center', minWidth: 130 }}>
              <motion.div animate={{ height: `${pct}%` }} transition={{ duration: 0.5 }}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `${genre.color || 'var(--accent)'}1e` }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>{genre.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{genre.name}</div>
                {count > 0 && <div style={{ fontFamily: 'var(--font-mono)', color: genre.color || 'var(--accent)', marginTop: 8, fontWeight: 700, fontSize: '1.2rem' }}>{count} vote{count !== 1 ? 's' : ''}</div>}
              </div>
            </motion.div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {players.map(p => {
          const voted = !!roundVotes[p.id]
          return (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', background: voted ? 'rgba(87,204,153,0.1)' : 'var(--surface)', border: `1px solid ${voted ? 'rgba(87,204,153,0.35)' : 'var(--border)'}` }}>
              <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={18} />{p.name} {voted ? '✓' : '…'}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── FINAL VIEW ────────────────────────────────────────────────────────────────
function FinalView({ game, players }) {
  const store = useStore()
  const top3  = players.slice(0, 3)
  const rest  = players.slice(3)
  const podiumOrder  = [top3[1], top3[0], top3[2]].filter(Boolean)
  const HEIGHTS      = [80, 120, 60]
  const MEDALS       = ['🥈', '🥇', '🥉']
  const RANK_FOR_IDX = [2, 1, 3]

  function handleLeave() {
    store.setMyRole('player'); store.setGame(null); store.setGameCode(null); store.setScreen('home')
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32, overflow: 'auto' }}>
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        style={{ fontFamily: 'var(--font-head)', fontSize: '2.4rem', textAlign: 'center' }}>🎉 Game Over!</motion.div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, justifyContent: 'center' }}>
        {podiumOrder.map((p, idx) => {
          const rank = RANK_FOR_IDX[idx]
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + idx * 0.12, type: 'spring', stiffness: 250, damping: 22 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={rank === 1 ? 76 : 56} />
              <div style={{ fontWeight: 700, fontSize: rank === 1 ? '1.05rem' : '0.88rem', textAlign: 'center', maxWidth: 100 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: p.colorHex, fontWeight: 700, fontSize: rank === 1 ? '1.4rem' : '1.1rem' }}>{p.score || 0}</div>
              <div style={{ width: rank === 1 ? 100 : 82, height: HEIGHTS[idx], background: rank === 1 ? 'rgba(244,208,63,0.2)' : 'var(--surface)', border: `2px solid ${rank === 1 ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, fontSize: '1.5rem' }}>
                {MEDALS[idx]}
              </div>
            </motion.div>
          )
        })}
      </div>
      {rest.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {rest.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '0.75rem' }}>#{i + 4}</span>
              <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={30} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: p.colorHex, fontSize: '0.9rem' }}>{p.score || 0}</span>
            </div>
          ))}
        </div>
      )}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={handleLeave}
        style={{ marginTop: 16, padding: '10px 28px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
        Leave Game
      </motion.button>
    </div>
  )
}

// ── LOBBY VIEW ────────────────────────────────────────────────────────────────
function LobbyView({ game }) {
  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const joinUrl  = typeof window !== 'undefined' && game?.code
    ? `${window.location.origin}${window.location.pathname}?code=${game.code}`
    : ''
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20, padding: '24px 40px', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Join at {typeof window !== 'undefined' ? window.location.host : 'buzzkill.app'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '0.22em', color: 'var(--accent)', fontWeight: 900 }}>{game?.code}</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', color: 'var(--text2)', textAlign: 'center' }}>Waiting for players…</div>
        </div>
        {joinUrl && <div style={{ flexShrink: 0 }}><QRCode value={joinUrl} size={180} /></div>}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        {players.map(p => (
          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 18px', background: 'var(--surface)', border: `2px solid ${p.colorHex}55`, borderRadius: 14 }}>
            <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={56} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
          </motion.div>
        ))}
        {players.length === 0 && <div style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>Scan the QR code or enter the code above to join</div>}
      </div>
    </div>
  )
}

// ── TV CONTROLS — visible only on the gamescreen device ───────────────────────
// Auto-hides after 5s of inactivity; any mouse move / touch reveals it.
// ── Buzz TV corner ────────────────────────────────────────────────────────────

function TVBuzzCorner({ game, gameCode }) {
  const store = useStore()
  const settings = store.getSettings()
  const aiHost = settings.aiHost ?? true
  const [quip, setQuip] = useState(() => getBuzzQuip('idle'))
  const [event, setEvent] = useState('idle')
  const prevStateRef = useRef(null)
  const prevQIndexRef = useRef(null)
  const prevAnswerRevRef = useRef(false)
  const prevWrongCountRef = useRef(0)
  const idleTimer = useRef(null)
  const { speakWithChance } = useBuzzSpeech()
  const speaking = useBuzzSpeaking()

  // Speak a quip, optionally gated by probability (0–1). Returns true if spoken.
  function setQuipAndSpeak(q, evt = 'generic', chance = 1.0) {
    const spoke = speakWithChance(q, evt, null, chance)
    if (spoke) { setQuip(q); setEvent(evt) }
    return spoke
  }

  function scheduleIdle() {
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      const q = getBuzzQuip('idle')
      setQuip(q)
      setEvent('idle')
      speakWithChance(q, 'idle', null, 1.0)
      scheduleIdle()
    }, 14000 + Math.random() * 8000)
  }

  useEffect(() => {
    scheduleIdle()
    return () => clearTimeout(idleTimer.current)
  }, [])

  useEffect(() => {
    if (!game) return
    const state = game.state
    const qIdx = game.currentQIndex
    const prevState = prevStateRef.current
    const prevQIdx = prevQIndexRef.current
    prevStateRef.current = state
    prevQIndexRef.current = qIdx

    // First mount
    if (prevState === null) {
      setQuipAndSpeak(getBuzzQuip('roundStart', { gameCode, round: game.currentRound }), 'roundStart', 0.40)
      scheduleIdle()
      return
    }

    // State transitions
    if (state !== prevState) {
      if (state === 'quiz') {
        prevAnswerRevRef.current = false
        prevWrongCountRef.current = 0
        setQuipAndSpeak(getBuzzQuip('roundStart', { gameCode, round: game.currentRound }), 'roundStart', 0.40)
        scheduleIdle()
      } else if (state === 'round-over') {
        setQuipAndSpeak(getBuzzQuip('roundEnd', { gameCode, round: game.currentRound }), 'roundEnd', 0.40)
        scheduleIdle()
      } else if (state === 'final') {
        const sorted = Object.values(game.players || {})
          .filter(p => p.role !== 'gamescreen')
          .sort((a, b) => (b.score || 0) - (a.score || 0))
        setQuipAndSpeak(getBuzzQuip('gameEnd', {
          winner: sorted[0]?.name,
          loser: sorted[sorted.length - 1]?.name,
        }), 'gameEnd', 1.0)
        scheduleIdle()
      } else if (state === 'round-pick') {
        const q = getBuzzQuip('idle')
        setQuip(q); setEvent('idle')
        scheduleIdle()
      }
      return
    }

    // New question within same round — reset answer tracking
    if (state === 'quiz' && qIdx !== prevQIdx && prevQIdx !== null) {
      prevAnswerRevRef.current = false
      prevWrongCountRef.current = 0
      scheduleIdle()
    }
  }, [game?.state, game?.currentQIndex, game?.currentRound])

  // Correct answer (15%)
  useEffect(() => {
    const isRevealed = !!game?.answerRevealed
    if (isRevealed && !prevAnswerRevRef.current) {
      clearTimeout(idleTimer.current)
      setQuipAndSpeak(getBuzzQuip('correct'), 'correct', 0.15)
      scheduleIdle()
    }
    prevAnswerRevRef.current = isRevealed
  }, [game?.answerRevealed])

  // Wrong answer (8%)
  useEffect(() => {
    const count = game?.wrongAnswerers?.length || 0
    if (count > prevWrongCountRef.current) {
      clearTimeout(idleTimer.current)
      setQuipAndSpeak(getBuzzQuip('wrong'), 'wrong', 0.08)
      scheduleIdle()
    }
    prevWrongCountRef.current = count
  }, [game?.wrongAnswerers?.length])

  if (!aiHost) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: 20,
      zIndex: 2500,
      maxWidth: 460,
    }}>
      <BuzzHost quip={quip} event={event} visible autoIdle={false} speaking={speaking} size={80} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function GameScreenControls() {
  const store = useStore()
  const { setMusicVolume } = useSound()
  const [visible, setVisible] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const hideTimer = useRef(null)

  const sfxVol   = store.sfxVolume   ?? 0.8
  const musicVol = store.musicVolume ?? 0.5
  const sfxOn    = store.sfxEnabled  !== false
  const musicOn  = store.musicEnabled !== false

  const resetHideTimer = useCallback(() => {
    setVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), 5000)
  }, [])

  useEffect(() => {
    resetHideTimer()
    window.addEventListener('mousemove', resetHideTimer)
    window.addEventListener('touchstart', resetHideTimer)
    return () => {
      clearTimeout(hideTimer.current)
      window.removeEventListener('mousemove', resetHideTimer)
      window.removeEventListener('touchstart', resetHideTimer)
    }
  }, [resetHideTimer])

  function handleSfxVolume(v) {
    store.setSfxVolume(v)
  }
  function handleMusicVolume(v) {
    store.setMusicVolume(v)
    setMusicVolume(v)
  }
  function handleExit() {
    store.setMyRole('player')
    store.setGame(null)
    store.setGameCode(null)
    store.setScreen('home')
  }

  return (
    <>
      {/* Full SettingsOverlay (same one used by players) */}
      <SettingsOverlay show={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Persistent, auto-hiding TV control bar */}
      <motion.div
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 3000, pointerEvents: visible ? 'auto' : 'none',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(10,8,24,0.82)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 40, padding: '8px 14px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
        onClick={resetHideTimer}
      >
        {/* SFX volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => store.setSfxEnabled(!sfxOn)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: sfxOn ? 1 : 0.35, padding: '2px 4px', color: 'white' }}
            title="Toggle sound effects"
          >
            {sfxOn ? '🔊' : '🔇'}
          </button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={sfxOn ? sfxVol : 0}
            onChange={e => handleSfxVolume(parseFloat(e.target.value))}
            style={{ width: 72, accentColor: 'var(--accent)', cursor: 'pointer' }}
            title="SFX volume"
          />
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

        {/* Music volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => { const next = !musicOn; store.setMusicEnabled(next); setMusicVolume(next ? musicVol : 0) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: musicOn ? 1 : 0.35, padding: '2px 4px', color: 'white' }}
            title="Toggle music"
          >
            🎵
          </button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={musicOn ? musicVol : 0}
            onChange={e => handleMusicVolume(parseFloat(e.target.value))}
            style={{ width: 72, accentColor: 'var(--accent)', cursor: 'pointer' }}
            title="Music volume"
          />
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

        {/* More settings */}
        <button
          onClick={() => setSettingsOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '2px 6px', color: 'rgba(255,255,255,0.7)', borderRadius: 6 }}
          title="More settings"
        >
          ⚙️
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

        {/* Exit */}
        <AnimatePresence mode="wait">
          {confirmExit ? (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>Exit game?</span>
              <button
                onClick={handleExit}
                style={{ background: 'var(--red)', border: 'none', borderRadius: 6, color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', cursor: 'pointer' }}
              >Yes, exit</button>
              <button
                onClick={() => setConfirmExit(false)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer' }}
              >Cancel</button>
            </motion.div>
          ) : (
            <motion.button key="exit-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmExit(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', padding: '2px 6px', whiteSpace: 'nowrap' }}
              title="Exit game"
            >
              ✕ Exit
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function GameScreen() {
  const store = useStore()
  const { game, gameCode } = { game: store.game, gameCode: store.gameCode }
  const { subscribeToGame } = useGame()
  const isTV = store.myRole === 'gamescreen'

  useEffect(() => {
    if (!gameCode) return
    return subscribeToGame(gameCode, () => {})
  }, [gameCode])

  if (!game) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', opacity: 0.35 }}>⚡ BUZZKILL</div>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    )
  }

  const state    = game.state
  const gameType = game?.currentGenre?.gameType
  const players  = allPlayers(game)

  // State label for header
  let stateLabel = ''
  if (state === 'quiz') {
    if      (gameType === 'music')   stateLabel = `🎵 Q${(game.currentQIndex || 0) + 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'draw')    stateLabel = `🎨 Round ${(game.currentQIndex || 0) + 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'joke')    stateLabel = `😂 Round ${(game.jokePromptCount || 0) + 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'hottake') stateLabel = `🔥 Statement ${(game.htPromptCount || 0) + 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'fill')    stateLabel = `✏️ Round ${game.fgPromptCount || 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'whod')       stateLabel = `🕵️ Case ${game.whodCount || 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'truefalse')     stateLabel = `🤔 ${game.tfCount || 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'ordersup')      stateLabel = `🍔 Order ${game.ouCount || 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'fartdirection')  stateLabel = `💨 Colour ${game.fdCount || 1}/${game.settings?.questionsPerRound || '?'}`
    else if (gameType === 'speedbriefs')   stateLabel = `🩲 Brief ${game.sbRound || 1}/${game.settings?.questionsPerRound || '?'} · ${game.sbPhase || '—'}`
    else if (gameType === 'modelmodelun')  stateLabel = `🧱 Round ${game.mmuRound || 1} · ${game.mmuPhase || '—'}`
    else stateLabel = `Q${(game.currentQIndex || 0) + 1}/${game.settings?.questionsPerRound || '?'}`
  } else if (state === 'lawyers')        stateLabel = `⚖️ Case ${game.lawyersRound || 1}/${game.lawyersTotalRounds || 3}`
  else if (state === 'round-pick' || state === 'vote') stateLabel = 'Voting'
  else if (state === 'powerup-select')   stateLabel = 'Powerups'
  else if (state === 'round-over')       stateLabel = 'Round Over'
  else if (state === 'final')            stateLabel = 'Final!'
  else if (state === 'lobby')            stateLabel = 'Lobby'
  else stateLabel = state || ''

  // AnimatePresence key: only animate on major state/gameType transitions
  const viewKey = `${state}-${gameType || 'q'}`

  function renderView() {
    if (state === 'lobby')                                return <LobbyView game={game} />
    if (state === 'round-pick' || state === 'vote')       return <VotingView game={game} players={players} />
    if (state === 'powerup-select')                       return <PowerupView game={game} players={players} />
    if (state === 'round-over')                           return <RoundOverView game={game} players={players} />
    if (state === 'final')                                return <FinalView game={game} players={players} />
    if (state === 'lawyers')                              return <LawyersView game={game} players={players} />
    if (state === 'quiz') {
      switch (gameType) {
        case 'music':   return <MusicBangersView game={game} players={players} />
        case 'draw':    return <DrawView game={game} players={players} />
        case 'joke':    return <JokeOffView game={game} players={players} />
        case 'hottake': return <HotTakeView game={game} players={players} />
        case 'fill':       return <FillGapView game={game} players={players} />
        case 'whod':       return <WhodunnitView game={game} players={players} />
        case 'truefalse':     return <TrueFalseView game={game} players={players} />
        case 'ordersup':      return <OrdersUpView game={game} players={players} />
        case 'fartdirection':  return <FartDirectionView game={game} players={players} />
        case 'speedbriefs':    return <SpeedBriefsView game={game} players={players} />
        case 'modelmodelun':   return <ModelModelUNView game={game} players={players} />
        default:           return <QuizView game={game} players={players} />
      }
    }
    return <QuizView game={game} players={players} />
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <Header game={game} label={stateLabel} />
      <AnimatePresence mode="wait">
        <motion.div key={viewKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {renderView()}
        </motion.div>
      </AnimatePresence>
      {isTV && <TVBuzzCorner game={game} gameCode={gameCode} />}
      {isTV && <GameScreenControls />}
    </div>
  )
}
