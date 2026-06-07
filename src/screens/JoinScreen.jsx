import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { CameraCapture, Toast, MuteButton } from '../components/ui'

export default function JoinScreen() {
  const setScreen = useStore(s => s.setScreen)
  const setToast = useStore(s => s.setToast)
  const setMyAvatar = useStore(s => s.setMyAvatar)
  const { joinGame } = useGame()

  const [step, setStep] = useState('code') // 'code' | 'name' | 'photo'
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('player')
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)

  // Pre-fill code from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('code')
    if (c) setCode(c.toUpperCase())
  }, [])

  const handleCode = () => {
    if (!code.trim() || code.length < 4) {
      setToast({ message: 'Enter a 4-character game code', icon: '🎮' })
      return
    }
    setStep('name')
  }

  const handleName = () => {
    if (!name.trim()) {
      setToast({ message: 'Enter your name', icon: '👤' })
      return
    }
    setStep('photo')
  }

  const handleJoin = async (avatarData) => {
    setLoading(true)
    const av = avatarData || avatar
    try {
      await joinGame(code.toUpperCase(), name.trim(), av, role)
      if (av) setMyAvatar(av)
      setScreen('lobby')
    } catch (e) {
      setToast({ message: e.message || 'Could not join game. Check the code.', icon: '❌' })
      setLoading(false)
      setStep('code')
    }
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => step === 'code' ? setScreen('home') : setStep(step === 'name' ? 'code' : 'name')}>
          ← Back
        </button>
        <div className="topbar-logo">Join Game</div>
        <MuteButton />
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ margin: '0', borderRadius: 0 }}>
        <div className="progress-fill" style={{ width: `${step === 'code' ? 33 : step === 'name' ? 66 : 100}%` }} />
      </div>

      <div className="screen-inner center" style={{ justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {/* Step 1: Code */}
          {step === 'code' && (
            <motion.div
              key="code"
              className="col center gap-16"
              style={{ width: '100%', maxWidth: 360 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="col center gap-8">
                <div style={{ fontSize: '3rem' }}>🎮</div>
                <h2>Enter Game Code</h2>
                <p className="muted" style={{ fontSize: '0.9rem' }}>Ask the host for the 4-letter code</p>
              </div>

              <input
                className="input"
                style={{ textAlign: 'center', fontSize: '2rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', textTransform: 'uppercase' }}
                placeholder="ABCD"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                autoCapitalize="characters"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCode()}
              />

              <div className="col gap-8" style={{ width: '100%' }}>
                <label className="input-label">Join as</label>
                <div className="col gap-6">
                  {[
                    { value: 'player', label: '🎯 Player', desc: 'Play the game!' },
                    { value: 'cohost', label: '🎛️ Co-host', desc: 'Help control the game' },
                    { value: 'gamescreen', label: '📺 Game Screen', desc: 'Display screen for TV/projector' },
                  ].map(r => (
                    <div
                      key={r.value}
                      className="player-row"
                      style={{ cursor: 'pointer', borderColor: role === r.value ? 'var(--accent)' : 'var(--border)', background: role === r.value ? 'rgba(192,132,252,0.08)' : 'var(--surface)' }}
                      onClick={() => setRole(r.value)}
                    >
                      <div style={{ fontSize: '1.3rem' }}>{r.label.split(' ')[0]}</div>
                      <div className="flex-1">
                        <div style={{ fontWeight: 600 }}>{r.label.slice(2)}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{r.desc}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border2)', background: role === r.value ? 'var(--accent)' : 'transparent' }} />
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-lg btn-block" onClick={handleCode}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* Step 2: Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              className="col center gap-16"
              style={{ width: '100%', maxWidth: 360 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="col center gap-8">
                <div style={{ fontSize: '3rem' }}>👤</div>
                <h2>What's your name?</h2>
                <p className="muted" style={{ fontSize: '0.9rem' }}>This appears on the leaderboard</p>
              </div>

              <input
                className="input"
                style={{ textAlign: 'center', fontSize: '1.3rem', fontFamily: 'var(--font-head)' }}
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleName()}
              />

              <button className="btn btn-primary btn-lg btn-block" onClick={handleName}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* Step 3: Photo */}
          {step === 'photo' && (
            <motion.div
              key="photo"
              className="col center gap-16"
              style={{ width: '100%', maxWidth: 360 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <div className="col center gap-8">
                <div style={{ fontSize: '3rem' }}>📸</div>
                <h2>Take a selfie!</h2>
                <p className="muted" style={{ fontSize: '0.9rem' }}>Optional — it shows next to your name</p>
              </div>

              <CameraCapture
                onCapture={data => {
                  setAvatar(data)
                  handleJoin(data)
                }}
                onSkip={() => handleJoin(null)}
              />

              {loading && (
                <div className="loading-dots"><span /><span /><span /></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Toast />
    </div>
  )
}
