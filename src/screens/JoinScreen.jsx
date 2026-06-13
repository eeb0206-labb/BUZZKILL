import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Toast, MuteButton } from '../components/ui'
import AvatarCreator from '../components/AvatarCreator'
import { DEFAULT_AVATAR_CONFIG, randomAvatarConfig } from '../data/avatarParts'

export default function JoinScreen() {
  const store = useStore()
  const setScreen = store.setScreen
  const setToast = store.setToast
  const { joinGame } = useGame()

  // Pre-fill code from URL ?code= param, skip code step if present
  const urlCode = new URLSearchParams(window.location.search).get('code')?.toUpperCase() || ''
  const [step, setStep] = useState(urlCode ? 'name' : 'code')
  const [code, setCode] = useState(urlCode)
  const [name, setName] = useState(store.myName || '')
  // Pre-populate avatarConfig from store if available, else random
  const [avatarConfig, setAvatarConfig] = useState(
    () => store.myAvatarConfig || randomAvatarConfig()
  )
  const [photoSrc, setPhotoSrc] = useState(null)
  const [loading, setLoading] = useState(false)

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
    setStep('avatar')
  }

  const handleJoin = async () => {
    if (loading) return
    setLoading(true)
    try {
      await joinGame(code.toUpperCase(), name.trim(), photoSrc, 'player', avatarConfig)
      store.setMyAvatarConfig(avatarConfig)
      setScreen('lobby')
    } catch (e) {
      setToast({ message: e.message || 'Could not join game. Check the code.', icon: '❌' })
      setLoading(false)
      setStep('code')
    }
  }

  const stepNum = step === 'code' ? 1 : step === 'name' ? 2 : 3
  const progress = stepNum / 3

  function goBack() {
    if (step === 'code') setScreen('home')
    else if (step === 'name') setStep('code')
    else setStep('name')
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={goBack}>← Back</button>
        <div className="topbar-logo">Join Game</div>
        <MuteButton />
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ margin: 0, borderRadius: 0 }}>
        <motion.div
          className="progress-fill"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="screen-inner center" style={{ justifyContent: step === 'avatar' ? 'flex-start' : 'center', paddingTop: step === 'avatar' ? 16 : 0 }}>
        <AnimatePresence mode="wait">

          {/* ── Step 1: Game Code ───────────────────────────────────────────── */}
          {step === 'code' && (
            <motion.div
              key="code"
              className="col center gap-16"
              style={{ width: '100%', maxWidth: 360 }}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
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
              <button className="btn btn-primary btn-lg btn-block" onClick={handleCode}>
                Continue →
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Name ─────────────────────────────────────────────────── */}
          {step === 'name' && (
            <motion.div
              key="name"
              className="col center gap-16"
              style={{ width: '100%', maxWidth: 360 }}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
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

          {/* ── Step 3: Avatar Builder ────────────────────────────────────────── */}
          {step === 'avatar' && (
            <motion.div
              key="avatar"
              className="col gap-16"
              style={{ width: '100%', maxWidth: 440 }}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            >
              <div className="col center gap-4">
                <h2 style={{ textAlign: 'center' }}>Build your character</h2>
                <p className="muted" style={{ fontSize: '0.85rem', textAlign: 'center' }}>Customise your avatar — or just go random!</p>
              </div>

              <AvatarCreator config={avatarConfig} onChange={setAvatarConfig} photoSrc={photoSrc} onPhotoChange={setPhotoSrc} />

              <motion.button
                className="btn btn-primary btn-lg btn-block"
                whileTap={{ scale: 0.97 }}
                onClick={handleJoin}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? (
                  <div className="loading-dots"><span /><span /><span /></div>
                ) : `Join as ${name} →`}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <Toast />
    </div>
  )
}
