/**
 * SettingsOverlay — slides up from the bottom on any in-game screen.
 * Contains:
 *  - Sound Effects: toggle + volume slider
 *  - Background Music: toggle + volume slider
 *  - Pause game (controller only)
 *  - End game / Return to lobby (controller only)
 *  - Leave game (all non-controllers)
 */
import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { useSound } from '../hooks/useSound'
import { db, ref as fbRef, update as fbUpdate, remove as fbRemove } from '../firebase'

export default function SettingsOverlay({ show, onClose }) {
  const store = useStore()
  const isController = store.isController()
  const { returnToLobby, requestPause, cancelPauseRequest, unpauseGame } = useGame()
  const { setMusicVolume } = useSound()

  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  // Pause request helpers
  const myId = store.myId
  const game = store.game
  const gameCode = store.gameCode

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?code=${gameCode}`
    : ''

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(joinUrl).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }, [joinUrl])

  const sfxVol    = store.sfxVolume
  const musicVol  = store.musicVolume
  const sfxOn     = store.sfxEnabled
  const musicOn   = store.musicEnabled

  function handleSfxVolume(e) {
    const v = parseFloat(e.target.value)
    store.setSfxVolume(v)
  }

  function handleMusicVolume(e) {
    const v = parseFloat(e.target.value)
    store.setMusicVolume(v)
    setMusicVolume(v)
  }

  function toggleSfx() {
    store.setSfxEnabled(!sfxOn)
  }

  function toggleMusic() {
    const next = !musicOn
    store.setMusicEnabled(next)
    setMusicVolume(next ? musicVol : 0)
  }

  async function handleEndGame() {
    await fbUpdate(fbRef(db, `games/${store.gameCode}`), { state: 'final' })
    onClose()
    setConfirmEnd(false)
  }

  async function handleReturnToLobby() {
    await returnToLobby(store.gameCode, store.game)
    store.setScreen('lobby')
    onClose()
  }

  async function handleLeaveGame() {
    const myId = store.myId
    if (gameCode && myId) {
      try { await fbRemove(fbRef(db, `games/${gameCode}/players/${myId}`)) } catch (_) {}
    }
    store.setMyRole('player')
    store.setGame(null)
    store.setGameCode(null)
    store.setScreen('home')
    onClose()
  }

  const players = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
  const pauseRequests = game?.pauseRequests || {}
  const myPauseRequest = !!pauseRequests[myId]
  const pauseCount = Object.values(pauseRequests).filter(Boolean).length
  const threshold = Math.ceil(players.length / 3)
  const gamePaused = game?.gamePaused

  async function handlePauseRequest() {
    if (!myId || !gameCode) return
    if (myPauseRequest) {
      await cancelPauseRequest(gameCode, myId)
    } else {
      await requestPause(gameCode, myId)
      // Auto-trigger pause if threshold met
      const newCount = pauseCount + 1
      if (newCount >= threshold && !gamePaused) {
        await fbUpdate(fbRef(db, `games/${gameCode}`), { gamePaused: true, pausedAt: Date.now() })
      }
    }
  }

  async function handleUnpause() {
    if (!gameCode) return
    await unpauseGame(gameCode)
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 501,
              background: 'var(--surface-2)', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20,
              maxWidth: 480, margin: '0 auto',
            }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto -8px' }} />

            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', textAlign: 'center' }}>
              ⚙️ Settings
            </div>

            {/* ── Share code ─────────────────────────────────────────────────── */}
            {gameCode && (
              <div
                onClick={copyCode}
                style={{
                  background: 'rgba(192,132,252,0.08)', border: '1.5px solid rgba(192,132,252,0.25)',
                  borderRadius: 14, padding: '12px 16px', cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Join code — tap to copy link
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.25em', color: 'var(--accent)' }}>
                  {gameCode}
                </div>
                <div style={{ fontSize: '0.72rem', color: codeCopied ? 'var(--green)' : 'var(--text3)', marginTop: 4 }}>
                  {codeCopied ? '✓ Link copied!' : 'Share with anyone to join mid-game'}
                </div>
              </div>
            )}

            {/* ── Sound Effects ──────────────────────────────────────────────── */}
            <div className="card" style={{ gap: 14 }}>
              <div className="row gap-10" style={{ marginBottom: 2 }}>
                <span style={{ fontSize: '1.2rem' }}>🔊</span>
                <div className="flex-1" style={{ fontWeight: 700 }}>Sound Effects</div>
                <button
                  className={`toggle-btn ${sfxOn ? 'active' : ''}`}
                  onClick={toggleSfx}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: '1px solid var(--border)',
                    background: sfxOn ? 'var(--accent)' : 'var(--surface)', color: sfxOn ? '#fff' : 'var(--text3)',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  {sfxOn ? 'ON' : 'OFF'}
                </button>
              </div>
              {sfxOn && (
                <div className="row gap-10">
                  <span style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>🔈</span>
                  <input
                    type="range" min={0} max={1} step={0.05} value={sfxVol}
                    onChange={handleSfxVolume}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>🔊</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text2)', width: 30, textAlign: 'right' }}>
                    {Math.round(sfxVol * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* ── Background Music ───────────────────────────────────────────── */}
            <div className="card" style={{ gap: 14 }}>
              <div className="row gap-10" style={{ marginBottom: 2 }}>
                <span style={{ fontSize: '1.2rem' }}>🎵</span>
                <div className="flex-1" style={{ fontWeight: 700 }}>Background Music</div>
                <button
                  onClick={toggleMusic}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: '1px solid var(--border)',
                    background: musicOn ? 'var(--accent)' : 'var(--surface)', color: musicOn ? '#fff' : 'var(--text3)',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  {musicOn ? 'ON' : 'OFF'}
                </button>
              </div>
              {musicOn && (
                <div className="row gap-10">
                  <span style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>🔈</span>
                  <input
                    type="range" min={0} max={1} step={0.05} value={musicVol}
                    onChange={handleMusicVolume}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>🔊</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text2)', width: 30, textAlign: 'right' }}>
                    {Math.round(musicVol * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* ── Game controls (host only) ───────────────────────────────────── */}
            {isController && (
              <div className="col gap-8">
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Host Controls
                </div>

                <AnimatePresence mode="wait">
                  {confirmEnd ? (
                    <motion.div key="confirm" className="card col gap-8" style={{ borderColor: 'var(--red)', background: 'rgba(230,57,70,0.06)' }}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--red)' }}>End the game?</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>Takes everyone to the final scoreboard immediately.</div>
                      <div className="row gap-8">
                        <button className="btn btn-ghost flex-1" onClick={() => setConfirmEnd(false)}>Cancel</button>
                        <button className="btn btn-red flex-1" onClick={handleEndGame}>Yes, end it</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="btns" className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <button
                        className="btn btn-ghost btn-block"
                        onClick={() => fbUpdate(fbRef(db, `games/${gameCode}`), { gamePaused: true, pausedAt: Date.now() })}
                      >
                        ⏸ Pause Game
                      </button>
                      <button className="btn btn-ghost btn-block" onClick={handleReturnToLobby}>
                        🏠 Return to Lobby
                        <span style={{ fontSize: '0.72rem', color: 'var(--text3)', marginLeft: 6 }}>
                          (scores reset, everyone stays)
                        </span>
                      </button>
                      <button className="btn btn-ghost btn-block" style={{ color: 'var(--red)' }} onClick={() => setConfirmEnd(true)}>
                        🏁 End Game Now
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Pause request (non-controller) ──────────────────────────────── */}
            {!isController && (
              <div className="card" style={{ gap: 10 }}>
                <div style={{ fontWeight: 700 }}>⏸ Pause Request</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
                  {gamePaused
                    ? 'Game is paused — waiting for host to resume.'
                    : `${pauseCount} / ${threshold} requests needed to pause`}
                </div>
                {!gamePaused && (
                  <button
                    className={`btn btn-block ${myPauseRequest ? 'btn-gold' : 'btn-ghost'}`}
                    onClick={handlePauseRequest}
                  >
                    {myPauseRequest ? '✓ Pause Requested (tap to cancel)' : '⏸ Request Pause'}
                  </button>
                )}
                {gamePaused && isController && (
                  <button className="btn btn-green btn-block" onClick={handleUnpause}>▶ Resume Game</button>
                )}
              </div>
            )}

            {/* ── Host unpause (if paused) ─────────────────────────────────────── */}
            {isController && gamePaused && (
              <div className="card" style={{ borderColor: 'rgba(244,208,63,0.4)', background: 'rgba(244,208,63,0.06)', gap: 8 }}>
                <div style={{ fontWeight: 700, color: 'var(--gold)' }}>⏸ Game is Paused</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>Players requested a break.</div>
                <button className="btn btn-green btn-block" onClick={handleUnpause}>▶ Resume Game</button>
              </div>
            )}

            {/* ── Leave game (non-controller) ─────────────────────────────────── */}
            {!isController && (
              <AnimatePresence mode="wait">
                {confirmLeave ? (
                  <motion.div key="conf-leave" className="card col gap-8" style={{ borderColor: 'var(--red)' }}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ fontWeight: 700 }}>Leave the game?</div>
                    <div className="row gap-8">
                      <button className="btn btn-ghost flex-1" onClick={() => setConfirmLeave(false)}>Stay</button>
                      <button className="btn btn-red flex-1" onClick={handleLeaveGame}>Leave</button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button key="leave-btn" className="btn btn-ghost btn-block"
                    style={{ color: 'var(--text3)' }} onClick={() => setConfirmLeave(true)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Leave Game
                  </motion.button>
                )}
              </AnimatePresence>
            )}

            <button className="btn btn-ghost btn-block" onClick={onClose} style={{ marginTop: 4 }}>
              Done
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
