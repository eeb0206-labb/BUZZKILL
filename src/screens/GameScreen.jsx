// TV/Projector display screen — shows the game state for the whole room.
// Adapts to every game.state: lobby / round-pick / powerup-select / quiz / round-over / final / etc.
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, QRCode } from '../components/ui'

// ── Helpers ───────────────────────────────────────────────────────────────────
const POWERUP_ICONS = { sneakPeek: '🔍', steal: '🤑', imposter: '😈', plagiarism: '📋', block: '🚫', doublePoints: '✖️' }

function allPlayers(game) {
  return Object.values(game?.players || {})
    .filter(p => p.role !== 'gamescreen')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ game, label }) {
  const genre = game?.currentGenre
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
      flexShrink: 0,
    }}>
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: '1.6rem',
        background: 'linear-gradient(135deg, var(--red), var(--gold))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
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

// ── Mini score bar (shown under quiz view) ────────────────────────────────────
function ScoreBar({ players, game }) {
  const buzzer = game?.buzzer
  const wrongList = game?.wrongAnswerers || []
  return (
    <div style={{
      display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
      padding: '10px 20px 14px', borderTop: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {players.map(p => {
        const isBuzzed = p.id === buzzer?.playerId
        const isWrong = wrongList.includes(p.id)
        return (
          <motion.div
            key={p.id}
            animate={isBuzzed
              ? { scale: [1, 1.07, 1], boxShadow: [`0 0 0px transparent`, `0 0 24px ${p.colorHex}aa`, `0 0 10px ${p.colorHex}55`] }
              : {}}
            transition={{ duration: 0.8, repeat: isBuzzed ? Infinity : 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 12px', borderRadius: 10,
              background: isBuzzed ? `${p.colorHex}1a` : 'var(--surface)',
              border: `1.5px solid ${isBuzzed ? p.colorHex : isWrong ? 'rgba(230,57,70,0.5)' : p.colorHex + '44'}`,
              opacity: isWrong && !isBuzzed ? 0.45 : 1,
            }}
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

// ── Full leaderboard ──────────────────────────────────────────────────────────
function Leaderboard({ players, game, title, showPowerups = false }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 24px', overflow: 'auto' }}>
      {title && (
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', textAlign: 'center', marginBottom: 6 }}>
          {title}
        </div>
      )}
      {players.map((p, i) => {
        const hasDbl = game?.powerupRound?.[p.id]
        const pups = Object.entries(p.powerups || {}).filter(([, c]) => c > 0)
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)',
              border: `1.5px solid ${i === 0 ? 'rgba(244,208,63,0.4)' : 'var(--border)'}`,
              borderRadius: 12, padding: '10px 14px',
            }}
          >
            <div style={{ fontSize: '1rem', width: 24, textAlign: 'center', flexShrink: 0, color: 'var(--text3)' }}>
              {medals[i] || `${i + 1}`}
            </div>
            <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </div>
              {showPowerups && pups.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                  {pups.map(([key, count]) => (
                    <span key={key} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px' }}>
                      {POWERUP_ICONS[key] || '⚡'} ×{count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.3rem',
                color: i === 0 ? 'var(--gold)' : p.colorHex,
              }}>
                {p.score || 0}
              </div>
              {typeof p.roundScore === 'number' && p.roundScore !== 0 && (
                <div style={{ fontSize: '0.7rem', color: p.roundScore > 0 ? 'var(--green)' : 'var(--red)' }}>
                  {p.roundScore > 0 ? '+' : ''}{p.roundScore}
                </div>
              )}
            </div>
            {hasDbl && (
              <div style={{ fontSize: '0.75rem', color: 'var(--gold)', background: 'rgba(244,208,63,0.12)', borderRadius: 6, padding: '2px 5px', fontWeight: 700 }}>
                ✖️×2
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── QUIZ VIEW ─────────────────────────────────────────────────────────────────
function QuizView({ game, players }) {
  const currentQ = game?.currentQ
  const buzzer = game?.buzzer
  const buzzedPlayer = buzzer ? game?.players?.[buzzer.playerId] : null
  const wrongList = game?.wrongAnswerers || []
  const isQM = game?.settings?.questionMaster

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 32px', gap: 16, position: 'relative', overflow: 'hidden' }}>
        {currentQ ? (
          <motion.div
            key={game?.currentQIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 36px', textAlign: 'center' }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.2rem, 3vw, 2.2rem)', lineHeight: 1.35 }}>
              {currentQ.q}
            </div>
            <AnimatePresence>
              {currentQ.hint && (wrongList.length > 0 || isQM) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 14, color: 'var(--gold)', fontSize: '1rem', overflow: 'hidden' }}
                >
                  💡 {currentQ.hint}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {game?.answerRevealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ marginTop: 18, background: 'rgba(87,204,153,0.1)', border: '1px solid rgba(87,204,153,0.35)', borderRadius: 10, padding: '10px 18px', color: 'var(--green)', fontSize: '1.2rem', fontWeight: 700 }}
                >
                  ✓ {currentQ.a}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <div style={{ marginTop: 10, fontSize: '0.9rem' }}>Loading question...</div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
          Q {(game?.currentQIndex || 0) + 1}{game?.settings?.questionsPerRound ? ` / ${game.settings.questionsPerRound}` : ''}
        </div>

        {wrongList.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Got it wrong:</span>
            {wrongList.map(pid => {
              const p = game?.players?.[pid]
              if (!p) return null
              return (
                <span key={pid} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(230,57,70,0.1)', borderRadius: 20, fontSize: '0.8rem' }}>
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={16} />
                  {p.name}
                </span>
              )
            })}
          </div>
        )}

        {/* ── BIG BUZZ-IN OVERLAY ─────────────────────────────────────────── */}
        <AnimatePresence>
          {buzzedPlayer && (
            <motion.div
              key={buzzer.playerId + (buzzer.timestamp || 0)}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${buzzedPlayer.colorHex}14`, backdropFilter: 'blur(6px)',
                borderRadius: 20, zIndex: 10,
              }}
            >
              <motion.div
                animate={{ boxShadow: [`0 0 0px ${buzzedPlayer.colorHex}00`, `0 0 80px ${buzzedPlayer.colorHex}88`, `0 0 40px ${buzzedPlayer.colorHex}44`] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ background: 'var(--bg)', border: `3px solid ${buzzedPlayer.colorHex}`, borderRadius: 24, padding: '36px 52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 280 }}
              >
                <Avatar src={buzzedPlayer.avatar} name={buzzedPlayer.name} colorHex={buzzedPlayer.colorHex} size={100} />
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: buzzedPlayer.colorHex, lineHeight: 1 }}>
                  {buzzedPlayer.name}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.14em', textAlign: 'center' }}>
                  🔔 is answering...
                  {buzzer.forcedBy && (
                    <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 4, textTransform: 'none', letterSpacing: 0 }}>
                      forced by {game?.players?.[buzzer.forcedBy]?.name}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScoreBar players={players} game={game} />
    </div>
  )
}

// ── POWERUP SELECT / BETWEEN-ROUNDS VIEW ────────────────────────────────────
function PowerupView({ game, players }) {
  const currentRound = game?.currentRound || 1
  const totalRounds = game?.settings?.totalRounds || 5
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '18px 24px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', marginBottom: 4 }}>
          ⚡ Round {currentRound} of {totalRounds}
        </div>
        <div style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>Players are choosing their powerups...</div>
      </div>
      <Leaderboard players={players} game={game} title="🏆 Current Standings" showPowerups />
    </div>
  )
}

// ── ROUND OVER VIEW ──────────────────────────────────────────────────────────
function RoundOverView({ game, players }) {
  const currentRound = game?.currentRound || 1
  const mvp = players[0]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '18px 24px 12px', flexShrink: 0 }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: 'var(--gold)' }}
        >
          🏆 Round {currentRound} Complete!
        </motion.div>
        {mvp && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ color: 'var(--text2)', fontSize: '0.88rem', marginTop: 6 }}>
            Leading: <strong style={{ color: mvp.colorHex }}>{mvp.name}</strong> · {mvp.score || 0} pts
          </motion.div>
        )}
      </div>
      <Leaderboard players={players} game={game} title="Overall Standings" showPowerups={false} />
    </div>
  )
}

// ── VOTE / ROUND-PICK VIEW ────────────────────────────────────────────────────
function VotingView({ game, players }) {
  const dealGenres = game?.dealGenres || []
  const roundVotes = game?.roundVotes || {}
  const voteCounts = {}
  Object.values(roundVotes).forEach(gid => { voteCounts[gid] = (voteCounts[gid] || 0) + 1 })
  const totalVoters = players.length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, padding: 32, overflow: 'auto' }}>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: '1.5rem' }}>
        🗳️ Vote for Next Round
      </div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {dealGenres.map(genre => {
          const count = voteCounts[genre.id] || 0
          const pct = totalVoters > 0 ? (count / totalVoters) * 100 : 0
          return (
            <motion.div key={genre.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'relative', overflow: 'hidden',
                background: 'var(--surface)',
                border: `2px solid ${count > 0 ? (genre.color || 'var(--accent)') : 'var(--border)'}`,
                borderRadius: 16, padding: '20px 28px', textAlign: 'center', minWidth: 130,
              }}
            >
              <motion.div animate={{ height: `${pct}%` }} transition={{ duration: 0.5 }}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `${genre.color || 'var(--accent)'}1e` }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>{genre.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{genre.name}</div>
                {count > 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', color: genre.color || 'var(--accent)', marginTop: 8, fontWeight: 700, fontSize: '1.2rem' }}>
                    {count} vote{count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {players.map(p => {
          const voted = !!roundVotes[p.id]
          return (
            <span key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem',
              background: voted ? 'rgba(87,204,153,0.1)' : 'var(--surface)',
              border: `1px solid ${voted ? 'rgba(87,204,153,0.35)' : 'var(--border)'}`,
            }}>
              <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={18} />
              {p.name} {voted ? '✓' : '...'}
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
  function handleLeave() {
    store.setMyRole('player')
    store.setGame(null)
    store.setGameCode(null)
    store.setScreen('home')
  }
  const top3 = players.slice(0, 3)
  const rest = players.slice(3)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const HEIGHTS = [80, 120, 60]
  const MEDALS = ['🥈', '🥇', '🥉']
  const RANK_FOR_IDX = [2, 1, 3]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32, overflow: 'auto' }}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        style={{ fontFamily: 'var(--font-head)', fontSize: '2.4rem', textAlign: 'center' }}
      >
        🎉 Game Over!
      </motion.div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, justifyContent: 'center' }}>
        {podiumOrder.map((p, idx) => {
          const rank = RANK_FOR_IDX[idx]
          return (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.12, type: 'spring', stiffness: 250, damping: 22 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
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
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        onClick={handleLeave}
        style={{ marginTop: 16, padding: '10px 28px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}
      >
        Leave Game
      </motion.button>
    </div>
  )
}

// ── LOBBY VIEW ────────────────────────────────────────────────────────────────
function LobbyView({ game }) {
  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const joinUrl = typeof window !== 'undefined' && game?.code
    ? `${window.location.origin}${window.location.pathname}?code=${game.code}`
    : ''
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20, padding: '24px 40px', overflow: 'auto' }}>
      {/* Code + QR side by side */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Join at {typeof window !== 'undefined' ? window.location.host : 'buzzkill.app'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '0.22em', color: 'var(--accent)', fontWeight: 900 }}>
            {game?.code}
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', color: 'var(--text2)', textAlign: 'center' }}>
            Waiting for players...
          </div>
        </div>
        {joinUrl && (
          <div style={{ flexShrink: 0 }}>
            <QRCode value={joinUrl} size={180} />
          </div>
        )}
      </div>

      {/* Player grid */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        {players.map(p => (
          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 18px', background: 'var(--surface)', border: `2px solid ${p.colorHex}55`, borderRadius: 14 }}>
            <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={56} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
          </motion.div>
        ))}
        {players.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>Scan the QR code or enter the code above to join</div>
        )}
      </div>
    </div>
  )
}

// ── GENERIC CREATIVE ROUND VIEW ───────────────────────────────────────────────
function GenericView({ game, players }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '18px 24px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem' }}>
          {game?.currentGenre?.emoji} {game?.currentGenre?.name || 'Game in progress...'}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 4 }}>Players are on their phones</div>
      </div>
      <Leaderboard players={players} game={game} title="🏆 Scores" showPowerups />
    </div>
  )
}

// ── ROOT COMPONENT ────────────────────────────────────────────────────────────
export default function GameScreen() {
  const store = useStore()
  const { game, gameCode } = { game: store.game, gameCode: store.gameCode }
  const { subscribeToGame } = useGame()

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

  const state = game.state
  const players = allPlayers(game)

  let stateLabel = ''
  if (state === 'quiz')              stateLabel = `Q${(game.currentQIndex || 0) + 1} / ${game.settings?.questionsPerRound || '?'}`
  else if (state === 'round-pick' || state === 'vote') stateLabel = 'Voting'
  else if (state === 'powerup-select') stateLabel = 'Powerups'
  else if (state === 'round-over')   stateLabel = 'Round Over'
  else if (state === 'final')        stateLabel = 'Final!'
  else if (state === 'lobby')        stateLabel = 'Lobby'
  else                               stateLabel = state || ''

  const isVoting = state === 'round-pick' || state === 'vote'
  const knownStates = ['quiz', 'powerup-select', 'round-over', 'round-pick', 'vote', 'final', 'lobby']
  const isCreative = !knownStates.includes(state) && !!state

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      <Header game={game} label={stateLabel} />

      <AnimatePresence mode="wait">
        <motion.div
          key={state || 'waiting'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
        >
          {state === 'lobby'           && <LobbyView game={game} />}
          {isVoting                    && <VotingView game={game} players={players} />}
          {state === 'powerup-select'  && <PowerupView game={game} players={players} />}
          {state === 'quiz'            && <QuizView game={game} players={players} />}
          {state === 'round-over'      && <RoundOverView game={game} players={players} />}
          {state === 'final'           && <FinalView game={game} players={players} />}
          {isCreative                  && <GenericView game={game} players={players} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
