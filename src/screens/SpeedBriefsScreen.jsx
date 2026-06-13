/**
 * SpeedBriefsScreen — everyone writes a one-liner ad for the same weird pair of briefs.
 * Phases: input (60s) → reveal (5s/ad) → vote (30s) → results → next round / end
 * UI style inspired by Jackbox Survive the Internet — clean white ad cards on dark bg.
 */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, Toast, MuteButton } from '../components/ui'
import { useSound } from '../hooks/useSound'
import SettingsOverlay from '../components/SettingsOverlay'

const SB_INPUT_TIME  = 60
const SB_VOTE_TIME   = 30
const SB_REVEAL_TIME = 5  // seconds per ad during reveal

// ── AdCard — the white "print ad" card (Survive the Internet aesthetic) ───────
export function AdCard({ brief, tagline, player, isYours, compact, hideCredit, style }) {
  if (!brief || !tagline) return null
  return (
    <div style={{
      background: '#fff',
      borderRadius: compact ? 10 : 16,
      overflow: 'hidden',
      boxShadow: isYours
        ? `0 0 0 3px ${brief.color}, 0 6px 28px rgba(0,0,0,0.45)`
        : '0 4px 22px rgba(0,0,0,0.5)',
      width: '100%',
      flexShrink: 0,
      ...style,
    }}>
      {/* Product visual — brief colour + emoji + name */}
      <div style={{ background: brief.color, padding: compact ? '14px 16px' : '28px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: compact ? '2.6rem' : '5rem', lineHeight: 1.1 }}>{brief.emoji}</div>
        <div style={{
          color: '#fff', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
          fontSize: compact ? '0.6rem' : '0.9rem', marginTop: 6,
          textShadow: '0 1px 4px rgba(0,0,0,0.45)',
        }}>
          {brief.name}
        </div>
      </div>
      {/* Tagline copy */}
      <div style={{
        padding: compact ? '12px 14px' : '20px 22px',
        minHeight: compact ? 50 : 72,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: compact ? '0.9rem' : '1.25rem',
          color: '#111', lineHeight: 1.45, textAlign: 'center',
        }}>
          "{tagline}"
        </div>
      </div>
      {/* Player credit */}
      {!hideCredit && player && (
        <div style={{ borderTop: '1px solid #e8e8e8', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, background: '#fafafa' }}>
          <Avatar src={player.avatar} name={player.name} colorHex={player.colorHex} size={18} />
          <span style={{ fontSize: '0.7rem', color: '#666', fontStyle: 'italic', flex: 1 }}>{player.name}</span>
          {isYours && <span style={{ fontSize: '0.6rem', color: brief.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>yours</span>}
        </div>
      )}
    </div>
  )
}

// ── BriefBadge — small header showing the current brief ──────────────────────
function BriefBadge({ brief, compact }) {
  if (!brief) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: `${brief.color}22`, border: `1.5px solid ${brief.color}55`,
      borderRadius: 10, padding: compact ? '8px 12px' : '10px 16px',
    }}>
      <div style={{ fontSize: compact ? '1.5rem' : '2rem' }}>{brief.emoji}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: compact ? '0.85rem' : '1rem', color: 'var(--text1)' }}>{brief.name}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>Write a tagline to sell these</div>
      </div>
    </div>
  )
}

// ── Phase views ───────────────────────────────────────────────────────────────

function InputView({ game, myId, players }) {
  const { submitSBTagline } = useGame()
  const gameCode = useStore(s => s.gameCode)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const brief = game.sbBrief
  const submittedCount = Object.keys(game.sbSubmissions || {}).length
  const alreadySubmitted = !!game.sbSubmissions?.[myId]

  useEffect(() => {
    setText('')
    setSubmitted(false)
  }, [brief?.name])

  useEffect(() => {
    if (alreadySubmitted) setSubmitted(true)
  }, [alreadySubmitted])

  async function handleSubmit() {
    if (!text.trim() || submitted) return
    setSubmitted(true)
    await submitSBTagline(gameCode, myId, text.trim())
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <BriefBadge brief={brief} />
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text3)', lineHeight: 1.5 }}>
        One line. Make it sell. Make it weird. Make it <em>memorable</em>.
      </div>
      {!submitted ? (
        <>
          <textarea
            className="input"
            placeholder="Your killer tagline…"
            value={text}
            onChange={e => setText(e.target.value.slice(0, 120))}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            rows={3}
            autoFocus
            style={{ fontSize: '1rem', resize: 'none', textAlign: 'center', lineHeight: 1.5 }}
          />
          <div style={{ textAlign: 'right', fontSize: '0.68rem', color: 'var(--text3)' }}>{text.length}/120</div>
          <motion.button
            className="btn btn-primary btn-lg btn-block"
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            Submit ✓
          </motion.button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="card center col gap-8"
          style={{ background: 'rgba(87,204,153,0.08)', borderColor: 'rgba(87,204,153,0.3)', padding: 24 }}
        >
          <div style={{ fontSize: '1.5rem' }}>✓</div>
          <div style={{ fontWeight: 700, color: 'var(--green)' }}>Tagline submitted!</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{submittedCount}/{players.length} ready</div>
        </motion.div>
      )}
    </div>
  )
}

function RevealView({ game, myId, players }) {
  const brief = game.sbBrief
  const submissions = game.sbSubmissions || {}
  const subIds = Object.keys(submissions).sort()
  const idx = game.sbRevealIdx || 0
  const currentId = subIds[idx]
  const currentTagline = submissions[currentId]
  const currentPlayer = game.players?.[currentId]
  const isYours = currentId === myId
  const total = subIds.length

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 18px', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Ad {idx + 1} of {total}
        </div>
        {isYours && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '0.7rem', color: '#f72585', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⭐ That's yours!
          </motion.div>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0, justifyContent: 'center' }}>
        {subIds.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= idx ? '#f72585' : 'var(--surface2)', transition: 'background 0.3s' }} />
        ))}
      </div>

      {/* Ad card — animates on change */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentId}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ width: '100%', maxWidth: 340 }}
          >
            <AdCard
              brief={brief}
              tagline={currentTagline}
              player={currentPlayer}
              isYours={isYours}
              style={{ margin: '0 auto' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text3)', flexShrink: 0 }}>
        Next ad in a moment…
      </div>
    </div>
  )
}

function VoteView({ game, myId, players }) {
  const { submitSBVote } = useGame()
  const gameCode = useStore(s => s.gameCode)
  const [selected, setSelected] = useState(null)
  const [voted, setVoted] = useState(false)

  const brief = game.sbBrief
  const submissions = game.sbSubmissions || {}
  const votes = game.sbVotes || {}
  const myVote = votes[myId]
  const votedCount = Object.keys(votes).length
  const subIds = Object.keys(submissions).sort().filter(id => id !== myId)

  useEffect(() => {
    if (myVote) { setSelected(myVote); setVoted(true) }
  }, [myVote])

  async function handleVote() {
    if (!selected || voted) return
    setVoted(true)
    await submitSBVote(gameCode, myId, selected)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 18px', gap: 12 }}>
      <BriefBadge brief={brief} compact />
      <div style={{ fontSize: '0.78rem', color: 'var(--text2)', textAlign: 'center', fontWeight: 700 }}>
        {voted ? '✓ Voted!' : 'Pick the best ad (not yours)'}
        <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '0.72rem', marginLeft: 8 }}>
          {votedCount}/{players.length} voted
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {subIds.map(pid => {
          const tagline = submissions[pid]
          const player = game.players?.[pid]
          const isSelected = selected === pid
          return (
            <motion.div
              key={pid}
              whileTap={!voted ? { scale: 0.98 } : {}}
              onClick={() => !voted && setSelected(pid)}
              style={{
                background: isSelected ? '#fff' : 'var(--surface2)',
                border: `2px solid ${isSelected ? brief?.color || '#f72585' : 'var(--border)'}`,
                borderRadius: 12, overflow: 'hidden', cursor: voted ? 'default' : 'pointer',
                opacity: voted && !isSelected ? 0.45 : 1, transition: 'all 0.15s',
              }}
            >
              {/* Compact color stripe */}
              <div style={{ height: 5, background: brief?.color || '#f72585', opacity: isSelected ? 1 : 0.4 }} />
              <div style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{brief?.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Georgia, serif', fontStyle: 'italic',
                    fontSize: '0.9rem', color: isSelected ? '#111' : 'var(--text1)',
                    lineHeight: 1.45, marginBottom: 6,
                  }}>
                    "{tagline}"
                  </div>
                  {player && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar src={player.avatar} name={player.name} colorHex={player.colorHex} size={16} />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{player.name}</span>
                    </div>
                  )}
                </div>
                {isSelected && <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>⭐</div>}
              </div>
            </motion.div>
          )
        })}
        {subIds.length === 0 && (
          <div className="card center" style={{ color: 'var(--text3)', padding: 32 }}>
            No other submissions to vote on.
          </div>
        )}
      </div>

      {!voted && (
        <motion.button
          className="btn btn-primary btn-lg btn-block"
          whileTap={{ scale: 0.97 }}
          disabled={!selected}
          onClick={handleVote}
          style={{ flexShrink: 0 }}
        >
          Cast Vote ⭐
        </motion.button>
      )}
    </div>
  )
}

function ResultsView({ game, myId, isController, players }) {
  const { nextSBRound, endSBRound } = useGame()
  const gameCode = useStore(s => s.gameCode)
  const brief = game.sbBrief
  const submissions = game.sbSubmissions || {}
  const results = game.sbResults
  const ranked = results?.ranked || []
  const scoreChanges = results?.scoreChanges || {}
  const roundLimit = game.settings?.questionsPerRound || 5
  const round = game.sbRound || 1

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Round {round} results
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#f72585', marginTop: 2 }}>
          {brief?.emoji} {brief?.name}
        </div>
      </div>

      {ranked.map(({ pid, votes: v }, i) => {
        const tagline = submissions[pid]
        const player = game.players?.[pid]
        const pts = scoreChanges[pid] || 0
        const isMe = pid === myId
        const medal = medals[i]

        return (
          <motion.div
            key={pid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              background: isMe ? `${brief?.color}18` : 'var(--surface2)',
              border: `1.5px solid ${i === 0 && v > 0 ? 'var(--gold)' : isMe ? brief?.color + '55' : 'var(--border)'}`,
              borderRadius: 12, overflow: 'hidden',
            }}
          >
            <div style={{ height: 4, background: brief?.color, opacity: v > 0 ? 1 : 0.2 }} />
            <div style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{medal || brief?.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text1)', lineHeight: 1.4, marginBottom: 6 }}>
                  "{tagline}"
                </div>
                {player && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar src={player.avatar} name={player.name} colorHex={player.colorHex} size={16} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{player.name}</span>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {v > 0 && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: i === 0 ? 'var(--gold)' : 'var(--accent)' }}>
                    {v} vote{v !== 1 ? 's' : ''}
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#57cc99', fontWeight: 700 }}>+{pts}pts</div>
              </div>
            </div>
          </motion.div>
        )
      })}

      {isController && (
        <div className="row gap-8" style={{ marginTop: 8 }}>
          <button className="btn btn-ghost flex-1" onClick={() => endSBRound(gameCode)}>End Round</button>
          {round < roundLimit && (
            <button className="btn btn-primary flex-1" onClick={() => nextSBRound(gameCode, game)}>Next Brief →</button>
          )}
        </div>
      )}
      {!isController && (
        <div className="card center col gap-6" style={{ color: 'var(--text3)', padding: 20 }}>
          <div className="loading-dots"><span /><span /><span /></div>
          <div style={{ fontSize: '0.8rem' }}>Waiting for host…</div>
        </div>
      )}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SpeedBriefsScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const {
    subscribeToGame, startSpeedBriefs,
    advanceSBToReveal, advanceSBReveal,
    revealSBResults, endSBRound,
  } = useGame()
  const { startMusic, stopMusic } = useSound()

  const [showSettings, setShowSettings] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)
  const autoRef = useRef(false)

  const phase = game?.sbPhase
  const brief = game?.sbBrief
  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const roundLimit = game?.settings?.questionsPerRound || 5
  const round = game?.sbRound || 1

  // Subscribe
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, g => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final') store.setScreen('final')
    })
    return unsub
  }, [gameCode])

  // Music
  useEffect(() => { startMusic(); return stopMusic }, [])

  // Auto-start
  useEffect(() => {
    if (!isController || phase || !game?.currentGenre) return
    startSpeedBriefs(gameCode, game)
  }, [isController, phase, game?.currentGenre?.id, gameCode])

  // Reset autoRef on phase change
  useEffect(() => { autoRef.current = false }, [phase])

  // Timer — input uses sbStartAt, vote uses sbVoteStartAt
  useEffect(() => {
    clearInterval(timerRef.current)
    if (phase === 'input' && game?.sbStartAt) {
      const elapsed = Math.floor((Date.now() - game.sbStartAt) / 1000)
      setTimeLeft(Math.max(0, SB_INPUT_TIME - elapsed))
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    } else if (phase === 'vote' && game?.sbVoteStartAt) {
      const elapsed = Math.floor((Date.now() - game.sbVoteStartAt) / 1000)
      setTimeLeft(Math.max(0, SB_VOTE_TIME - elapsed))
      timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase, game?.sbStartAt, game?.sbVoteStartAt])

  // Auto-advance: input → reveal
  useEffect(() => {
    if (phase !== 'input' || !isController || autoRef.current || !game?.sbStartAt || game?.gamePaused) return
    const elapsed = Date.now() - game.sbStartAt
    const allIn = players.length > 0 && Object.keys(game.sbSubmissions || {}).length >= players.length
    if (elapsed >= SB_INPUT_TIME * 1000 || allIn) {
      autoRef.current = true
      setTimeout(() => advanceSBToReveal(gameCode, game), 600)
    }
  }, [timeLeft, phase, isController, game?.sbStartAt])

  // Auto-advance: reveal — controller fires advanceSBReveal 5s after each sbRevealIdxAt
  useEffect(() => {
    if (phase !== 'reveal' || !isController || !game?.sbRevealIdxAt || game?.gamePaused) return
    const elapsed = Date.now() - game.sbRevealIdxAt
    const t = setTimeout(() => {
      if (useStore.getState().game?.gamePaused) return
      advanceSBReveal(gameCode, useStore.getState().game)
    }, Math.max(200, SB_REVEAL_TIME * 1000 - elapsed))
    return () => clearTimeout(t)
  }, [phase, game?.sbRevealIdxAt, isController, gameCode])

  // Auto-advance: vote → results
  useEffect(() => {
    if (phase !== 'vote' || !isController || autoRef.current || !game?.sbVoteStartAt || game?.gamePaused) return
    const elapsed = Date.now() - game.sbVoteStartAt
    const allVoted = players.length > 0 && Object.keys(game.sbVotes || {}).length >= players.length
    if (elapsed >= SB_VOTE_TIME * 1000 || allVoted) {
      autoRef.current = true
      setTimeout(async () => { await revealSBResults(gameCode, game); autoRef.current = false }, 600)
    }
  }, [timeLeft, phase, isController, game?.sbVoteStartAt])

  // Auto-advance: results → next brief or end round (8s)
  useEffect(() => {
    if (phase !== 'results' || !isController) return
    const t = setTimeout(async () => {
      const currentRound = game?.sbRound || 1
      const limit = game?.settings?.questionsPerRound || 5
      if (currentRound < limit) {
        await nextSBRound(gameCode, game)
      } else {
        await endSBRound(gameCode)
      }
    }, 8000)
    return () => clearTimeout(t)
  }, [phase, isController])

  const genre = game?.currentGenre
  const timerColor = phase === 'vote' ? '#f72585' : 'var(--accent)'
  const timerTotal = phase === 'input' ? SB_INPUT_TIME : SB_VOTE_TIME

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} Speed Briefs</div>
        <div className="topbar-logo" style={{ color: '#f72585' }}>🩲 {round}/{roundLimit}</div>
        <div className="row gap-8">
          <MuteButton />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>

      {/* Timer bar — input + vote only */}
      {(phase === 'input' || phase === 'vote') && (
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            style={{ background: timeLeft < 8 ? 'var(--red)' : timerColor }}
            animate={{ width: `${(timeLeft / timerTotal) * 100}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.div key="input" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ textAlign: 'center', padding: '6px 0', fontSize: '0.75rem', color: timeLeft < 8 ? 'var(--red)' : 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {timeLeft}s · {Object.keys(game?.sbSubmissions || {}).length}/{players.length} submitted
              </div>
              <InputView game={game} myId={myId} players={players} />
            </motion.div>
          )}
          {phase === 'reveal' && (
            <motion.div key="reveal" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RevealView game={game} myId={myId} players={players} />
            </motion.div>
          )}
          {phase === 'vote' && (
            <motion.div key="vote" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ textAlign: 'center', padding: '4px 0', fontSize: '0.75rem', color: timeLeft < 8 ? 'var(--red)' : 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {timeLeft}s
              </div>
              <VoteView game={game} myId={myId} players={players} />
            </motion.div>
          )}
          {phase === 'results' && (
            <motion.div key="results" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsView game={game} myId={myId} isController={isController} players={players} />
            </motion.div>
          )}
          {!phase && (
            <motion.div key="loading" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="col center gap-8">
                <div className="loading-dots"><span /><span /><span /></div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Speed Briefs loading…</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SettingsOverlay show={showSettings} onClose={() => setShowSettings(false)} />
      <Toast />
    </div>
  )
}
