/**
 * ModelModelUNScreen — player-facing screen for Model Model UN arms-race game.
 * Each player is assigned a ceramic nation. Phases: rules → invest → select →
 * espionage → negotiate → resolve → card → (splitsteal | next round) → gameover
 */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { MMU_NATIONS, MMU_CARDS } from '../hooks/useGame'
import { Avatar } from '../components/ui'
import { ModelVillageScene } from '../components/ModelVillage'

const INVEST_DURATION  = 30000
const SELECT_DURATION  = 30000
const ESPIO_DURATION   = 15000
const NEGO_DURATION    = 60000
const RESOLVE_DURATION = 15000
const CARD_DURATION    = 6000
const GAMEOVER_DURATION = 6000

// ── small helpers ─────────────────────────────────────────────────────────────
function useTimer(startAt, duration) {
  const [left, setLeft] = useState(Math.ceil(duration / 1000))
  useEffect(() => {
    if (!startAt) return
    const tick = () => setLeft(Math.max(0, Math.ceil((duration - (Date.now() - startAt)) / 1000)))
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [startAt, duration])
  return left
}

function PhaseHeader({ icon, label, color = 'var(--gold)' }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 16px 4px' }}>
      <div style={{ fontSize: '2.2rem' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function TimerBar({ timeLeft, total, color = 'var(--gold)' }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (timeLeft / total) * 100)) : 0
  return (
    <div style={{ height: 5, background: 'var(--surface2)', flexShrink: 0 }}>
      <motion.div
        style={{ height: '100%', background: timeLeft <= 5 ? 'var(--red)' : color, width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'linear' }}
      />
    </div>
  )
}

function NationBadge({ nation, missiles, defense, isMe, isAlive }) {
  if (!nation) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
      background: isMe ? 'rgba(194,119,58,0.15)' : 'var(--surface2)',
      border: `1.5px solid ${isMe ? '#c2773a' : 'var(--border)'}`,
      borderRadius: 10, opacity: isAlive ? 1 : 0.35, position: 'relative',
    }}>
      <div style={{ fontSize: '1.6rem' }}>{nation.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isMe ? '#c2773a' : 'var(--text1)' }}>
          {nation.name}{isMe ? ' (you)' : ''}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {isAlive ? `🚀 ${missiles ?? 0} · 🛡️ ${defense ?? 10}%` : '💥 Eliminated'}
        </div>
      </div>
      {isMe && isAlive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c2773a' }} />}
    </div>
  )
}

// ── Phase views ───────────────────────────────────────────────────────────────
function RulesView({ game, myId, isController, onStart }) {
  const myNation = game.mmuNations?.[myId]
  const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
  const prizePool = game.mmuPrizePool || 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '16px 20px', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🧱</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: '#c2773a', margin: '8px 0 4px' }}>
          MODEL MODEL UN
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>A ceramic nation arms-race</div>
      </div>

      {myNation && (
        <div style={{ background: 'rgba(194,119,58,0.12)', border: '1.5px solid #c2773a', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>{myNation.emoji}</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#c2773a' }}>You represent</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{myNation.name}</div>
        </div>
      )}

      <div style={{ background: 'rgba(244,208,63,0.08)', border: '1px solid rgba(244,208,63,0.2)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--gold)', marginBottom: 8 }}>🏆 PRIZE POT: {prizePool} pts</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.6 }}>
          Last nation standing wins the full pot. Final 2 nations play <strong>Split or Steal</strong>.
          3+ surviving nations can agree to a truce and split it.
        </div>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>HOW TO PLAY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['⚡ Phase 1 — Arms Race', '30s. You receive 50 pts budget. Buy a missile (25pts), upgrade defences (25pts), or save points to your score.'],
            ['🎯 Phase 2 — Target Selection', '30s. Assign your missiles to targets. You don\'t have to fire them all.'],
            ['🔍 Phase 3 — Espionage', '15s. Your spy network reveals one piece of intelligence — but 25% of intel may be fabricated.'],
            ['🤝 Phase 4 — Negotiation', '60s. See shared intel, form alliances, and change your targets. Vote for truce here too.'],
            ['💥 Phase 5 — Resolution', '15s. Missiles fly. Your defence % is the chance each incoming missile is intercepted.'],
          ].map(([title, text]) => (
            <div key={title}>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text1)' }}>{title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', lineHeight: 1.5, marginTop: 2 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>SCORING</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text2)', lineHeight: 1.8 }}>
          🛡️ Your defence intercepts a missile → <strong>+50 pts</strong><br />
          🎯 Your missile hits a nation → <strong>+25 pts</strong><br />
          💰 Unspent budget each round → <strong>saved to your score</strong>
        </div>
      </div>

      {isController && (
        <motion.button className="btn btn-primary btn-lg" whileTap={{ scale: 0.96 }} onClick={onStart}
          style={{ background: '#c2773a', border: 'none', marginTop: 4 }}>
          Start Game ▶
        </motion.button>
      )}
      {!isController && (
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text3)', padding: '8px 0' }}>
          Waiting for host to start…
        </div>
      )}
    </div>
  )
}

function InvestView({ game, myId, isController, myNation }) {
  const timeLeft = useTimer(game.mmuPhaseStartAt, INVEST_DURATION)
  const budget = 50
  const myChoice = game.mmuInvestChoices?.[myId] || {}
  const myLocked = !!game.mmuInvestLocked?.[myId]
  const [missile, setMissile] = useState(myChoice.missile ?? false)
  const [defense, setDefense] = useState(myChoice.defense ?? false)
  const { submitMMUInvestment } = useGame()
  const gameCode = useStore(s => s.gameCode)
  const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
  const lockedCount = Object.values(game.mmuInvestLocked || {}).filter(Boolean).length

  const spent = (missile ? 25 : 0) + (defense ? 25 : 0)
  const saved = budget - spent
  const myMissiles = game.mmuMissiles?.[myId] || 0
  const myDefense = game.mmuDefense?.[myId] || 10

  async function handleLock() {
    await submitMMUInvestment(gameCode, myId, { missile, defense }, true)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TimerBar timeLeft={timeLeft} total={INVEST_DURATION / 1000} color="#c2773a" />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PhaseHeader icon="⚡" label="Phase 1 — Arms Race" color="#c2773a" />
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
          {timeLeft}s · {lockedCount}/{alivePlayers.length} confirmed
        </div>

        {/* Budget display */}
        <div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.25)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: 'var(--gold)' }}>{budget} pt budget</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>
            {spent > 0 ? `Spending ${spent}pts` : 'Not spending anything'} · saving <strong>{saved}pts</strong> to score
          </div>
        </div>

        {/* Current stats */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem' }}>🚀</div>
            <div style={{ fontWeight: 700 }}>{myMissiles}{missile ? ` → ${myMissiles + 1}` : ''}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>missiles</div>
          </div>
          <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem' }}>🛡️</div>
            <div style={{ fontWeight: 700 }}>{myDefense}%{defense ? ` → ${Math.min(90, myDefense + 10)}%` : ''}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>defence</div>
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button
            className="btn"
            disabled={myLocked}
            onClick={() => setMissile(!missile)}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '14px 16px', borderRadius: 12, textAlign: 'left',
              background: missile ? 'rgba(194,119,58,0.18)' : 'var(--surface2)',
              border: `2px solid ${missile ? '#c2773a' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>🚀</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Buy a Missile</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>+1 missile · costs 25 pts</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${missile ? '#c2773a' : 'var(--border)'}`, background: missile ? '#c2773a' : 'transparent', flexShrink: 0 }} />
          </motion.button>

          <motion.button
            className="btn"
            disabled={myLocked}
            onClick={() => setDefense(!defense)}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '14px 16px', borderRadius: 12, textAlign: 'left',
              background: defense ? 'rgba(73,190,213,0.12)' : 'var(--surface2)',
              border: `2px solid ${defense ? '#4cc9f0' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>🛡️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Upgrade Defence</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>+10% intercept chance · costs 25 pts</div>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${defense ? '#4cc9f0' : 'var(--border)'}`, background: defense ? '#4cc9f0' : 'transparent', flexShrink: 0 }} />
          </motion.button>
        </div>

        {!myLocked ? (
          <motion.button className="btn btn-primary btn-lg" style={{ background: '#c2773a', border: 'none' }}
            whileTap={{ scale: 0.96 }} onClick={handleLock}>
            Confirm ({saved > 0 ? `saving ${saved}pts` : 'spending all'}) ✓
          </motion.button>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(194,119,58,0.1)', borderRadius: 10, color: '#c2773a', fontWeight: 700 }}>
            ✓ Confirmed — waiting for others…
          </div>
        )}
      </div>
    </div>
  )
}

function SelectView({ game, myId, isController, myNation }) {
  const timeLeft = useTimer(game.mmuPhaseStartAt, SELECT_DURATION)
  const { submitMMUTargets } = useGame()
  const gameCode = useStore(s => s.gameCode)
  const myMissiles = game.mmuMissiles?.[myId] || 0
  const myCard = game.mmuCards?.[myId]
  const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
  const opponents = alivePlayers.filter(id => id !== myId)
  const lockedCount = Object.values(game.mmuTargetsLocked || {}).filter(Boolean).length
  const isLocked = !!game.mmuTargetsLocked?.[myId]

  // localTargets = array of targetIds (one per missile to fire), length <= myMissiles
  const [localTargets, setLocalTargets] = useState([])
  const [heatseekerArmed, setHeatseekerArmed] = useState(false)
  const { useMMUHeatseeker } = useGame()

  const missilesLeft = myMissiles - localTargets.length

  function assignMissile(targetId) {
    if (isLocked || localTargets.length >= myMissiles) return
    setLocalTargets([...localTargets, targetId])
  }

  function removeMissile(idx) {
    if (isLocked) return
    setLocalTargets(localTargets.filter((_, i) => i !== idx))
  }

  async function handleLock() {
    await submitMMUTargets(gameCode, myId, localTargets)
    if (heatseekerArmed) await useMMUHeatseeker(gameCode, myId)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TimerBar timeLeft={timeLeft} total={SELECT_DURATION / 1000} color="#e63946" />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PhaseHeader icon="🎯" label="Phase 2 — Target Selection" color="#e63946" />
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
          {timeLeft}s · {lockedCount}/{alivePlayers.length} locked
        </div>

        {/* Missile counter */}
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 4 }}>Missiles to assign</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: myMissiles }, (_, i) => (
              <div key={i} style={{ fontSize: '1.4rem', opacity: i < localTargets.length ? 0.35 : 1 }} title={i < localTargets.length ? 'Assigned' : 'Available'}>
                🚀
              </div>
            ))}
            {myMissiles === 0 && <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>No missiles — hold fire this round</div>}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>
            {missilesLeft > 0 ? `${missilesLeft} unassigned (will hold fire)` : myMissiles > 0 ? 'All missiles assigned' : ''}
          </div>
        </div>

        {/* Heatseeker card option */}
        {myCard === 'heatseeker' && !isLocked && (
          <motion.button className="btn" whileTap={{ scale: 0.97 }}
            onClick={() => setHeatseekerArmed(!heatseekerArmed)}
            style={{
              padding: '10px 14px', borderRadius: 10, textAlign: 'left',
              background: heatseekerArmed ? 'rgba(230,57,70,0.15)' : 'var(--surface2)',
              border: `2px solid ${heatseekerArmed ? '#e63946' : 'rgba(244,208,63,0.4)'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
            <span style={{ fontSize: '1.4rem' }}>🎯</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold)' }}>Use Heatseeker Card</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>First missile bypasses enemy defences</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', border: `2px solid ${heatseekerArmed ? '#e63946' : 'var(--border)'}`, background: heatseekerArmed ? '#e63946' : 'transparent' }} />
          </motion.button>
        )}

        {/* Target assignment */}
        {opponents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Assign targets — tap to add a missile
            </div>
            {opponents.map(id => {
              const nation = game.mmuNations?.[id]
              const p = game.players?.[id]
              const missilesOnThis = localTargets.filter(t => t === id).length
              return (
                <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <motion.button
                    className="btn"
                    disabled={isLocked || missilesLeft === 0}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => assignMissile(id)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: missilesOnThis > 0 ? 'rgba(230,57,70,0.12)' : 'var(--surface2)',
                      border: `1.5px solid ${missilesOnThis > 0 ? '#e63946' : 'var(--border)'}`,
                    }}>
                    <span style={{ fontSize: '1.6rem' }}>{nation?.emoji || '?'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{nation?.name || id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                        🚀 {game.mmuMissiles?.[id] ?? 0} · 🛡️ {game.mmuDefense?.[id] ?? 10}%
                      </div>
                    </div>
                    {missilesOnThis > 0 && (
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#e63946' }}>
                        {'🚀'.repeat(missilesOnThis)}
                      </div>
                    )}
                  </motion.button>
                  {missilesOnThis > 0 && (
                    <motion.button className="btn btn-ghost" style={{ padding: '8px 10px', flexShrink: 0, borderRadius: 8 }}
                      whileTap={{ scale: 0.92 }} onClick={() => removeMissile(localTargets.lastIndexOf(id))}>
                      ✕
                    </motion.button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!isLocked ? (
          <motion.button className="btn btn-primary btn-lg" style={{ background: '#e63946', border: 'none' }}
            whileTap={{ scale: 0.96 }} onClick={handleLock}>
            {localTargets.length === 0 ? 'Hold Fire 🕊️' : `Lock In Targets (${localTargets.length} missile${localTargets.length !== 1 ? 's' : ''}) 🎯`}
          </motion.button>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(230,57,70,0.1)', borderRadius: 10, color: '#e63946', fontWeight: 700 }}>
            ✓ Targets locked — waiting for others…
          </div>
        )}
      </div>
    </div>
  )
}

function EspionageView({ game, myId }) {
  const timeLeft = useTimer(game.mmuPhaseStartAt, ESPIO_DURATION)
  const myIntel = game.mmuIntel?.[myId]
  const myCard = game.mmuCards?.[myId]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TimerBar timeLeft={timeLeft} total={ESPIO_DURATION / 1000} color="#a855f7" />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PhaseHeader icon="🔍" label="Phase 3 — Espionage" color="#a855f7" />

        {myCard && (
          <div style={{
            background: 'rgba(244,208,63,0.1)', border: '1.5px solid rgba(244,208,63,0.3)',
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              🃏 Special Card Active
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold)' }}>
              {MMU_CARDS[myCard]?.label || myCard}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4, lineHeight: 1.5 }}>
              {MMU_CARDS[myCard]?.desc}
            </div>
          </div>
        )}

        <div style={{ background: 'rgba(168,85,247,0.1)', border: '1.5px solid rgba(168,85,247,0.25)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Intelligence Report
          </div>
          {myIntel ? (
            <>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {myIntel.text}
              </div>
              {myIntel.isFabricated && (
                <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#f77f00', fontStyle: 'italic' }}>
                  ⚠️ This intelligence may be fabricated — trust at your own risk.
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Gathering intelligence…</div>
          )}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
          Use this information wisely in the negotiation phase.
          <br />25% of all intel is fabricated by double agents.
        </div>

        <div style={{ textAlign: 'center', padding: '10px', background: 'var(--surface2)', borderRadius: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
            Negotiation begins in {timeLeft}s…
          </div>
        </div>
      </div>
    </div>
  )
}

function NegotiateView({ game, myId, isController }) {
  const timeLeft = useTimer(game.mmuPhaseStartAt, NEGO_DURATION)
  const { submitMMUReady, changeMMUTargets, proposeMMUTruce, cancelMMUTruce } = useGame()
  const gameCode = useStore(s => s.gameCode)
  const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
  const opponents = alivePlayers.filter(id => id !== myId)
  const isReady = !!game.mmuNegotiateReady?.[myId]
  const readyCount = Object.values(game.mmuNegotiateReady || {}).filter(Boolean).length
  const hasTruceVote = !!game.mmuTruceVotes?.[myId]
  const truceVoteCount = Object.values(game.mmuTruceVotes || {}).filter(Boolean).length

  // Current final targets for me (can be changed here)
  const myCurrentTargets = game.mmuFinalTargets?.[myId] || []
  const myMissiles = game.mmuMissiles?.[myId] || 0
  const [localTargets, setLocalTargets] = useState(myCurrentTargets)
  const [changed, setChanged] = useState(false)

  function assignMissile(targetId) {
    if (isReady || localTargets.length >= myMissiles) return
    const next = [...localTargets, targetId]
    setLocalTargets(next); setChanged(true)
  }

  function removeMissile(idx) {
    if (isReady) return
    const next = localTargets.filter((_, i) => i !== idx)
    setLocalTargets(next); setChanged(true)
  }

  async function handleUpdateTargets() {
    await changeMMUTargets(gameCode, myId, localTargets)
    setChanged(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TimerBar timeLeft={timeLeft} total={NEGO_DURATION / 1000} color="#57cc99" />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PhaseHeader icon="🤝" label="Phase 4 — Negotiation" color="#57cc99" />
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
          {timeLeft}s · {readyCount}/{alivePlayers.length} ready
        </div>

        {/* All Intel (visible to all) */}
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            📢 Shared Intelligence
          </div>
          {Object.entries(game.mmuIntel || {}).map(([pid, intel]) => {
            const nation = game.mmuNations?.[pid]
            return (
              <div key={pid} style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 3 }}>
                  {nation?.emoji} {nation?.name || pid}{pid === myId ? ' (you)' : ''}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text3)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {intel?.text || '—'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Change targets (if have missiles) */}
        {myMissiles > 0 && !isReady && (
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Change targets? (optional)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {opponents.map(id => {
                const nation = game.mmuNations?.[id]
                const missilesOnThis = localTargets.filter(t => t === id).length
                const missilesLeft = myMissiles - localTargets.length
                return (
                  <div key={id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <motion.button className="btn" disabled={missilesLeft === 0} whileTap={{ scale: 0.95 }}
                      onClick={() => assignMissile(id)}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                        background: missilesOnThis > 0 ? 'rgba(230,57,70,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${missilesOnThis > 0 ? '#e63946' : 'transparent'}`,
                      }}>
                      <span>{nation?.emoji}</span>
                      <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{nation?.name}</span>
                      {missilesOnThis > 0 && <span style={{ fontSize: '0.8rem', color: '#e63946' }}>{'🚀'.repeat(missilesOnThis)}</span>}
                    </motion.button>
                    {missilesOnThis > 0 && (
                      <button className="btn btn-ghost" style={{ padding: '6px 8px', borderRadius: 6, fontSize: '0.8rem' }}
                        onClick={() => removeMissile(localTargets.lastIndexOf(id))}>✕</button>
                    )}
                  </div>
                )
              })}
            </div>
            {changed && (
              <motion.button className="btn btn-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={handleUpdateTargets}
                style={{ marginTop: 8, background: '#57cc99', border: 'none', color: '#000', width: '100%' }}>
                Update Targets ✓
              </motion.button>
            )}
          </div>
        )}

        {/* Truce vote */}
        {alivePlayers.length <= 4 && (
          <div style={{ background: 'rgba(87,204,153,0.08)', border: '1px solid rgba(87,204,153,0.2)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#57cc99', marginBottom: 6 }}>🕊️ Propose Truce</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 8 }}>
              If ALL {alivePlayers.length} remaining nations agree, the prize pot is split equally.
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 8 }}>
              {truceVoteCount}/{alivePlayers.length} votes
            </div>
            {!hasTruceVote ? (
              <button className="btn btn-sm" onClick={() => proposeMMUTruce(gameCode, myId)}
                style={{ background: '#57cc99', border: 'none', color: '#000' }}>
                Vote for Truce 🤝
              </button>
            ) : (
              <button className="btn btn-sm btn-ghost" onClick={() => cancelMMUTruce(gameCode, myId)}>
                Withdraw truce vote
              </button>
            )}
          </div>
        )}

        {!isReady ? (
          <motion.button className="btn btn-primary btn-lg" style={{ background: '#57cc99', border: 'none', color: '#000' }}
            whileTap={{ scale: 0.96 }} onClick={() => submitMMUReady(gameCode, myId)}>
            Ready for Resolution ✓
          </motion.button>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(87,204,153,0.1)', borderRadius: 10, color: '#57cc99', fontWeight: 700 }}>
            ✓ Ready — waiting for others…
          </div>
        )}
      </div>
    </div>
  )
}

function VillageScene({ nation, player, flyingToMe, landedOnMe, showDestroyed, showShield, interceptions }) {
  const inFlight = flyingToMe.length > 0 && !showDestroyed
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <ModelVillageScene
        player={player}
        roofColor={player?.colorHex || '#c2773a'}
        nation={nation}
        destroyed={showDestroyed}
        inFlight={inFlight}
        shielded={showShield}
        interceptions={interceptions}
        avatarSize={52}
        scale={1.0}
      />
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#c2773a', marginTop: 5, textAlign: 'center' }}>
        {nation?.name || 'Your Nation'}
      </div>
    </div>
  )
}

function ResolveView({ game, myId }) {
  const timeLeft = useTimer(game.mmuPhaseStartAt, RESOLVE_DURATION)
  const resolution = game.mmuResolution
  const myNation = game.mmuNations?.[myId]
  const wasKilled = resolution?.kills?.includes(myId)
  const nations = game.mmuNations || {}
  const alive = game.mmuAlive || {}
  const allPlayers = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
  const otherPlayers = allPlayers.filter(p => p.id !== myId)
  const myPlayer = game.players?.[myId]
  const allEvents = resolution?.events || []

  const [firedAll, setFiredAll] = useState([])
  const [flyingToMe, setFlyingToMe] = useState([])
  const [landedOnMe, setLandedOnMe] = useState([])

  useEffect(() => {
    if (!allEvents.length || !game.mmuPhaseStartAt) return
    setFiredAll([])
    setFlyingToMe([])
    setLandedOnMe([])
    const timers = []
    allEvents.forEach((evt, i) => {
      const when = Math.max(0, (game.mmuPhaseStartAt + evt.delay) - Date.now())
      timers.push(setTimeout(() => setFiredAll(prev => [...prev, evt]), when))
      if (evt.target === myId) {
        const key = `m-${i}`
        timers.push(setTimeout(() => {
          setFlyingToMe(prev => [...prev, { ...evt, key, idx: i }])
          timers.push(setTimeout(() => {
            setFlyingToMe(prev => prev.filter(m => m.key !== key))
            setLandedOnMe(prev => [...prev, { ...evt, key }])
          }, 1400))
        }, when))
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [game.mmuPhaseStartAt, myId])

  const allFired = firedAll.length >= allEvents.length
  const showDestroyed = wasKilled && allFired && flyingToMe.length === 0
  const showSurvived = !wasKilled && allFired && landedOnMe.length > 0 && flyingToMe.length === 0
  const showSafe = !wasKilled && allFired && landedOnMe.length === 0 && timeLeft <= 0
  const shieldLanded = landedOnMe.filter(e => e.type === 'shielded')
  const interceptionLanded = landedOnMe.filter(e => e.type === 'intercepted')
  const showShield = shieldLanded.length > 0 && !showDestroyed

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TimerBar timeLeft={timeLeft} total={RESOLVE_DURATION / 1000} color="#e63946" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 16px', gap: 8 }}>

        <div style={{ textAlign: 'center', color: '#e63946', fontFamily: 'var(--font-head)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
          💥 RESOLUTION — ROUND {game.mmuRound || 1}
        </div>

        {/* Other nations — compact cards that update as events fire */}
        {otherPlayers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {otherPlayers.map(p => {
              const nation = nations[p.id]
              const hitFired = firedAll.some(e => e.target === p.id && e.type === 'hit')
              const savedFired = firedAll.some(e => e.target === p.id && (e.type === 'shielded' || e.type === 'intercepted'))
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 58, textAlign: 'center' }}>
                  <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={20} />
                  <motion.div
                    animate={hitFired ? { rotate: [-10, 10, 0], scale: [1, 1.3, 0.8] } : savedFired ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.5 }}
                    style={{ opacity: hitFired ? 0.3 : 1, transition: 'opacity 0.4s' }}
                  >
                    {/* Tiny model village: colored roof triangle over beige wall */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {hitFired ? (
                        <span style={{ fontSize: '1.1rem' }}>💥</span>
                      ) : (
                        <svg width="40" height="28" viewBox="0 0 40 28" style={{ display: 'block' }}>
                          <polygon points="4,14 20,3 36,14" fill={p.colorHex || '#c2773a'} />
                          <rect x="7" y="14" width="26" height="14" fill="#c8b89a" />
                          <rect x="15" y="17" width="10" height="11" fill="rgba(90,60,35,0.7)" rx="1" />
                        </svg>
                      )}
                      <div style={{ height: 4, width: 40, background: 'rgba(80,55,30,0.8)', borderRadius: '0 0 3px 3px' }} />
                    </div>
                  </motion.div>
                  <div style={{ fontSize: '0.5rem', color: hitFired ? 'var(--text3)' : 'var(--text2)', lineHeight: 1.2 }}>{nation?.name}</div>
                  {savedFired && !hitFired && <div style={{ fontSize: '0.55rem' }}>🛡️</div>}
                </div>
              )
            })}
          </div>
        )}

        {/* Main village scene */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8, minHeight: 180 }}>

          {/* Incoming missiles — animate from different angles */}
          <AnimatePresence>
            {flyingToMe.map((m, i) => {
              const fromLeft = m.idx % 2 === 0
              return (
                <motion.div
                  key={m.key}
                  initial={{
                    x: fromLeft ? -100 : 100,
                    y: -140,
                    rotate: fromLeft ? 145 : 215,
                    scale: 0.8,
                    opacity: 0,
                  }}
                  animate={{
                    x: fromLeft ? -20 : 20,
                    y: 10,
                    rotate: fromLeft ? 165 : 195,
                    scale: 1.2,
                    opacity: 1,
                  }}
                  exit={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1.1, ease: 'easeIn' }}
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: fromLeft ? '20%' : '60%',
                    fontSize: '2rem',
                    pointerEvents: 'none',
                    zIndex: 20,
                    filter: 'drop-shadow(0 0 10px #e63946)',
                  }}
                >
                  🚀
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Screen flash on missile impact */}
          <AnimatePresence>
            {landedOnMe.filter(e => e.type === 'hit').map((evt, i) => (
              <motion.div
                key={`flash-${i}`}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute', inset: 0, background: '#e63946',
                  pointerEvents: 'none', zIndex: 30, borderRadius: 4,
                }}
              />
            ))}
          </AnimatePresence>

          {/* Village scene */}
          <VillageScene
            nation={myNation}
            player={myPlayer}
            flyingToMe={flyingToMe}
            landedOnMe={landedOnMe}
            showDestroyed={showDestroyed}
            showShield={showShield}
            interceptions={interceptionLanded}
          />
        </div>

        {/* Status text */}
        <div style={{ textAlign: 'center', minHeight: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {flyingToMe.length > 0 && !showDestroyed ? (
              <motion.div key="incoming" initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#e63946' }}>
                  ⚠️ INCOMING MISSILE!
                </div>
              </motion.div>
            ) : showDestroyed ? (
              <motion.div key="dead" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: '#e63946' }}>💀 Your nation has fallen!</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>You'll spectate the rest of the game.</div>
              </motion.div>
            ) : showSurvived ? (
              <motion.div key="survived" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: '#57cc99' }}>
                  {shieldLanded.length > 0 ? '🛡️ Shield held — you survived!' : interceptionLanded.length > 0 ? '✈️ Air defences intercepted it!' : '🎖️ You survived!'}
                </div>
              </motion.div>
            ) : showSafe ? (
              <motion.div key="safe" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.9rem', color: '#57cc99' }}>🕊️ No missiles targeted you this round.</div>
              </motion.div>
            ) : (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text3)', fontWeight: 400 }}>
                  ⏳ Hold tight…
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)' }}>{timeLeft}s</div>
      </div>
    </div>
  )
}

function CardView({ game, myId }) {
  const timeLeft = useTimer(game.mmuPhaseStartAt, CARD_DURATION)
  const myCard = game.mmuCards?.[myId]
  const cardInfo = myCard ? MMU_CARDS[myCard] : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TimerBar timeLeft={timeLeft} total={CARD_DURATION / 1000} color="var(--gold)" />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
        <PhaseHeader icon="🃏" label="Intelligence Report" color="var(--gold)" />
        {cardInfo ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}
            style={{ background: 'rgba(244,208,63,0.1)', border: '2px solid rgba(244,208,63,0.4)', borderRadius: 16, padding: '20px 24px', textAlign: 'center', maxWidth: 300 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
              {cardInfo.label.split(' ')[0]}
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: 6 }}>
              {cardInfo.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              {cardInfo.desc}
            </div>
            <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text3)', fontStyle: 'italic' }}>
              {cardInfo.mode === 'auto' ? 'Activates automatically next round' : 'You must choose to activate this'}
            </div>
          </motion.div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤷</div>
            No special card this round.
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
          Next round in {timeLeft}s…
        </div>
      </div>
    </div>
  )
}

function SplitStealView({ game, myId }) {
  const { submitMMUSplitSteal } = useGame()
  const gameCode = useStore(s => s.gameCode)
  const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
  const myVote = game.mmuSplitSteal?.[myId]
  const voteCount = Object.values(game.mmuSplitSteal || {}).filter(Boolean).length
  const opponent = alivePlayers.find(id => id !== myId)
  const opponentNation = game.mmuNations?.[opponent]
  const prizePool = game.mmuPrizePool || 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '16px 20px', gap: 16, justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem' }}>⚔️</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: 'var(--gold)', marginTop: 8 }}>FINAL ULTIMATUM</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: 4 }}>
          Two nations remain. The prize pot is <strong>{prizePool} pts</strong>.
        </div>
      </div>

      {opponentNation && (
        <div style={{ textAlign: 'center', padding: '10px', background: 'var(--surface2)', borderRadius: 10 }}>
          <span style={{ fontSize: '1.6rem' }}>{opponentNation.emoji}</span>
          <span style={{ marginLeft: 8, fontWeight: 700 }}>{opponentNation.name}</span>
          {game.mmuSplitSteal?.[opponent] && (
            <div style={{ fontSize: '0.72rem', color: '#57cc99', marginTop: 4 }}>✓ Has voted</div>
          )}
        </div>
      )}

      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.7 }}>
        <strong>🤝 Truce (split):</strong> Both nations live in peace — pot shared equally.<br />
        <strong>⚔️ Attack (steal):</strong> The only attacker wins the entire pot. Both attack = no one wins.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <motion.button
          className="btn btn-lg"
          disabled={!!myVote}
          whileTap={{ scale: 0.96 }}
          onClick={() => submitMMUSplitSteal(gameCode, myId, 'split')}
          style={{
            padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: '1rem',
            background: myVote === 'split' ? 'rgba(87,204,153,0.25)' : 'var(--surface2)',
            border: `2px solid ${myVote === 'split' ? '#57cc99' : 'var(--border)'}`,
            color: myVote === 'split' ? '#57cc99' : 'var(--text1)',
          }}>
          🕊️ Sign the Truce (Split)
        </motion.button>
        <motion.button
          className="btn btn-lg"
          disabled={!!myVote}
          whileTap={{ scale: 0.96 }}
          onClick={() => submitMMUSplitSteal(gameCode, myId, 'steal')}
          style={{
            padding: '16px', borderRadius: 12, fontWeight: 700, fontSize: '1rem',
            background: myVote === 'steal' ? 'rgba(230,57,70,0.25)' : 'var(--surface2)',
            border: `2px solid ${myVote === 'steal' ? '#e63946' : 'var(--border)'}`,
            color: myVote === 'steal' ? '#e63946' : 'var(--text1)',
          }}>
          ⚔️ Launch Final Strike (Steal)
        </motion.button>
      </div>

      {myVote && (
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text3)' }}>
          {voteCount < 2 ? 'Waiting for your opponent…' : 'Both nations have decided…'}
        </div>
      )}
    </div>
  )
}

function GameoverView({ game, myId }) {
  const myNation = game.mmuNations?.[myId]
  const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
  const isAlive = alivePlayers.includes(myId)
  const splitResult = game.mmuSplitResult
  const truceResult = game.mmuTruceResult

  let outcomeText = ''
  let outcomeColor = 'var(--text2)'

  if (truceResult) {
    outcomeText = isAlive ? `🕊️ Peace treaty signed — you split ${truceResult.share} pts!` : '🕊️ The surviving nations signed a peace treaty.'
    outcomeColor = '#57cc99'
  } else if (splitResult) {
    const iStealed = splitResult.stealers.includes(myId)
    const iSplit = splitResult.splitters.includes(myId)
    if (splitResult.stealers.length === 0) {
      outcomeText = '🤝 Both nations signed the truce — pot split equally!'
      outcomeColor = '#57cc99'
    } else if (splitResult.stealers.length === 2) {
      outcomeText = '💣 Both nations attacked — the prize pot was destroyed!'
      outcomeColor = '#e63946'
    } else if (iStealed) {
      outcomeText = '⚔️ You launched the final strike — you win the prize pot!'
      outcomeColor = 'var(--gold)'
    } else if (iSplit) {
      outcomeText = '😔 You signed the treaty but your opponent attacked — they took everything.'
      outcomeColor = '#e63946'
    }
  } else if (isAlive) {
    outcomeText = '🏆 Your nation is the last standing! You win the prize pot!'
    outcomeColor = 'var(--gold)'
  } else {
    outcomeText = '💥 Your nation was destroyed. Better luck next time!'
    outcomeColor = 'var(--text3)'
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '20px', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
        style={{ fontSize: '3.5rem' }}>
        {isAlive ? '🏆' : '💥'}
      </motion.div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', textAlign: 'center', color: outcomeColor }}>
        {outcomeText}
      </div>
      {myNation && (
        <div style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text2)' }}>
          {myNation.emoji} {myNation.name}
        </div>
      )}
      <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Calculating final scores…</div>
    </div>
  )
}

function SpectatorView({ game, myId, phase }) {
  const myNation = game.mmuNations?.[myId]
  const phaseLabels = {
    invest: '⚡ Arms Race', select: '🎯 Target Selection', espionage: '🔍 Espionage',
    negotiate: '🤝 Negotiation', resolve: '💥 Resolution', card: '🃏 Cards',
    splitsteal: '⚔️ Final Ultimatum', gameover: '🏆 Game Over',
  }
  const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '16px 20px', gap: 14, alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem' }}>👁️</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: 'var(--text3)', marginTop: 8 }}>
          {myNation?.emoji} {myNation?.name} has fallen
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Spectating the remaining conflict</div>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 4 }}>Current Phase</div>
        <div style={{ fontWeight: 700 }}>{phaseLabels[phase] || phase}</div>
      </div>

      <div style={{ width: '100%' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Surviving Nations ({alivePlayers.length})
        </div>
        {alivePlayers.map(id => {
          const nation = game.mmuNations?.[id]
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '1.4rem' }}>{nation?.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{nation?.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                  🚀 {game.mmuMissiles?.[id] ?? 0} · 🛡️ {game.mmuDefense?.[id] ?? 10}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ModelModelUNScreen() {
  const store = useStore()
  const game = store.game
  const myId = store.myId
  const gameCode = store.gameCode
  const isController = store.isController()
  const {
    startModelModelUN, advanceMMURules, advanceMMUToSelect, advanceMMUToEspionage,
    advanceMMUToNegotiate, advanceMMUToResolve, checkMMUAfterResolve,
    advanceMMUToNextRound, finalizeMMUSplitSteal, checkMMUTruceVotes, endMMUGame,
    subscribeToGame,
  } = useGame()

  const mmuPhase = game?.mmuPhase
  const mmuAlive = game?.mmuAlive || {}
  const alivePlayers = Object.entries(mmuAlive).filter(([, v]) => v).map(([id]) => id)
  const myNation = game?.mmuNations?.[myId]
  const isAlive = mmuAlive[myId] !== false
  const myMissiles = game?.mmuMissiles?.[myId] || 0

  // Screen navigation subscription
  useEffect(() => {
    if (!gameCode) return
    return subscribeToGame(gameCode, g => {
      if (g.state === 'round-over') store.setScreen('round-over')
      if (g.state === 'final')      store.setScreen('final')
      if (g.state === 'lobby')      store.setScreen('lobby')
    })
  }, [gameCode])

  // Auto-start: when controller enters quiz state with no mmuPhase set yet
  useEffect(() => {
    if (!isController || mmuPhase || !game?.currentGenre) return
    startModelModelUN(gameCode, game)
  }, [isController, mmuPhase, game?.currentGenre?.id, gameCode])

  // ── Controller timers ──────────────────────────────────────────────────────
  // Invest → Select (30s or all locked)
  useEffect(() => {
    if (!isController || mmuPhase !== 'invest') return
    const elapsed = Date.now() - (game.mmuPhaseStartAt || Date.now())
    const remaining = Math.max(0, INVEST_DURATION - elapsed)
    const t = setTimeout(() => advanceMMUToSelect(gameCode, game), remaining)
    return () => clearTimeout(t)
  }, [mmuPhase, isController])

  useEffect(() => {
    if (!isController || mmuPhase !== 'invest') return
    const locked = game.mmuInvestLocked || {}
    if (alivePlayers.length > 0 && alivePlayers.every(id => locked[id])) {
      advanceMMUToSelect(gameCode, game)
    }
  }, [game?.mmuInvestLocked, mmuPhase, isController])

  // Select → Espionage (30s or all locked)
  useEffect(() => {
    if (!isController || mmuPhase !== 'select') return
    const elapsed = Date.now() - (game.mmuPhaseStartAt || Date.now())
    const remaining = Math.max(0, SELECT_DURATION - elapsed)
    const t = setTimeout(() => advanceMMUToEspionage(gameCode, game), remaining)
    return () => clearTimeout(t)
  }, [mmuPhase, isController])

  useEffect(() => {
    if (!isController || mmuPhase !== 'select') return
    const locked = game.mmuTargetsLocked || {}
    if (alivePlayers.length > 0 && alivePlayers.every(id => locked[id])) {
      advanceMMUToEspionage(gameCode, game)
    }
  }, [game?.mmuTargetsLocked, mmuPhase, isController])

  // Espionage → Negotiate (15s auto)
  useEffect(() => {
    if (!isController || mmuPhase !== 'espionage') return
    const elapsed = Date.now() - (game.mmuPhaseStartAt || Date.now())
    const remaining = Math.max(0, ESPIO_DURATION - elapsed)
    const t = setTimeout(() => advanceMMUToNegotiate(gameCode), remaining)
    return () => clearTimeout(t)
  }, [mmuPhase, isController])

  // Negotiate → Resolve (60s or all ready)
  useEffect(() => {
    if (!isController || mmuPhase !== 'negotiate') return
    const elapsed = Date.now() - (game.mmuPhaseStartAt || Date.now())
    const remaining = Math.max(0, NEGO_DURATION - elapsed)
    const t = setTimeout(() => advanceMMUToResolve(gameCode, game), remaining)
    return () => clearTimeout(t)
  }, [mmuPhase, isController])

  useEffect(() => {
    if (!isController || mmuPhase !== 'negotiate') return
    const ready = game.mmuNegotiateReady || {}
    if (alivePlayers.length > 0 && alivePlayers.every(id => ready[id])) {
      advanceMMUToResolve(gameCode, game)
    }
  }, [game?.mmuNegotiateReady, mmuPhase, isController])

  // Truce votes check (during negotiate)
  useEffect(() => {
    if (!isController || mmuPhase !== 'negotiate') return
    const votes = game.mmuTruceVotes || {}
    if (alivePlayers.length > 0 && alivePlayers.every(id => votes[id])) {
      checkMMUTruceVotes(gameCode, game)
    }
  }, [game?.mmuTruceVotes, mmuPhase, isController])

  // Resolve → check result (15s auto)
  useEffect(() => {
    if (!isController || mmuPhase !== 'resolve') return
    const elapsed = Date.now() - (game.mmuPhaseStartAt || Date.now())
    const remaining = Math.max(0, RESOLVE_DURATION - elapsed)
    const t = setTimeout(() => checkMMUAfterResolve(gameCode, game), remaining)
    return () => clearTimeout(t)
  }, [mmuPhase, isController])

  // Card → Next round (6s auto)
  useEffect(() => {
    if (!isController || mmuPhase !== 'card') return
    const elapsed = Date.now() - (game.mmuPhaseStartAt || Date.now())
    const remaining = Math.max(0, CARD_DURATION - elapsed)
    const t = setTimeout(() => advanceMMUToNextRound(gameCode, game), remaining)
    return () => clearTimeout(t)
  }, [mmuPhase, isController])

  // SplitSteal → check when all voted
  useEffect(() => {
    if (!isController || mmuPhase !== 'splitsteal') return
    const votes = game.mmuSplitSteal || {}
    const keys = Object.keys(votes).filter(k => votes[k])
    if (alivePlayers.length === 2 && keys.length >= 2) {
      finalizeMMUSplitSteal(gameCode, game)
    }
  }, [game?.mmuSplitSteal, mmuPhase, isController])

  // Gameover → round-over (6s auto)
  useEffect(() => {
    if (!isController || mmuPhase !== 'gameover') return
    const elapsed = Date.now() - (game.mmuPhaseStartAt || Date.now())
    const remaining = Math.max(0, GAMEOVER_DURATION - elapsed)
    const t = setTimeout(() => endMMUGame(gameCode), remaining)
    return () => clearTimeout(t)
  }, [mmuPhase, isController])

  if (!game) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    )
  }

  // Spectator view for eliminated players (except during gameover/splitsteal where they should see the result)
  if (!isAlive && mmuPhase !== 'gameover' && mmuPhase !== 'splitsteal' && mmuPhase !== 'rules') {
    return (
      <div className="screen">
        <div className="topbar">
          <div style={{ fontFamily: 'var(--font-head)', color: '#c2773a' }}>🧱 Model Model UN</div>
          {myNation && <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{myNation.emoji} {myNation.name}</div>}
        </div>
        <SpectatorView game={game} myId={myId} phase={mmuPhase} />
      </div>
    )
  }

  function renderPhase() {
    switch (mmuPhase) {
      case 'rules':
        return <RulesView game={game} myId={myId} isController={isController} onStart={() => advanceMMURules(gameCode)} />
      case 'invest':
        return <InvestView game={game} myId={myId} isController={isController} myNation={myNation} />
      case 'select':
        return <SelectView game={game} myId={myId} isController={isController} myNation={myNation} />
      case 'espionage':
        return <EspionageView game={game} myId={myId} />
      case 'negotiate':
        return <NegotiateView game={game} myId={myId} isController={isController} />
      case 'resolve':
        return <ResolveView game={game} myId={myId} />
      case 'card':
        return <CardView game={game} myId={myId} />
      case 'splitsteal':
        return <SplitStealView game={game} myId={myId} />
      case 'gameover':
        return <GameoverView game={game} myId={myId} />
      default:
        return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>Loading…</div>
    }
  }

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ fontFamily: 'var(--font-head)', color: '#c2773a' }}>🧱 Model Model UN</div>
        {myNation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text3)' }}>
            <span>{myNation.emoji}</span>
            <span>{myNation.name}</span>
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text3)' }}>
          R{game.mmuRound || 1} · 🚀{myMissiles} · 🛡️{game.mmuDefense?.[myId] ?? 10}%
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={mmuPhase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {renderPhase()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
