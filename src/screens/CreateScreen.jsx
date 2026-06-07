import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { ALL_GENRES, GENRES } from '../data/genres'
import { Toast, MuteButton } from '../components/ui'

const TIMER_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '20s', value: 20 },
  { label: '25s', value: 25 },
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '1 min', value: 60 },
  { label: '1:30', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
]

const TimerSelect = ({ value, onChange, label }) => (
  <div>
    <label className="input-label">{label}</label>
    <select className="input" value={value} onChange={e => onChange(Number(e.target.value))} style={{ padding: '10px 14px' }}>
      {TIMER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

export default function CreateScreen() {
  const setScreen = useStore(s => s.setScreen)
  const setToast = useStore(s => s.setToast)
  const { createGame } = useGame()

  const [hostName, setHostName] = useState('')
  const [tab, setTab] = useState('game')
  const [loading, setLoading] = useState(false)

  const [settings, setSettings] = useState({
    questionMaster: true,
    answerMode: 'host-judges',
    questionsPerRound: 8,
    totalRounds: 5,
    threeRandomGenres: true,
    maxPlayers: 10,
    anthropicApiKey: '',
    excludedGenres: [],
    timers: {
      quizQuestion: 60,
      quizAnswer: 25,
      creative: 120,
      blitzPerQ: 8,
      voteReveal: 12,
      voteOpen: 30,
      genreVote: 200,
    },
    powerupCounts: {
      sneakPeek: 2,
      steal: 1,
      imposter: 2,
      plagiarism: 1,
      block: 1,
      doublePoints: 1,
    },
  })

  function setSetting(key, val) {
    setSettings(s => ({ ...s, [key]: val }))
  }
  function setTimer(key, val) {
    setSettings(s => ({ ...s, timers: { ...s.timers, [key]: val } }))
  }
  function setPowerup(key, val) {
    setSettings(s => ({ ...s, powerupCounts: { ...s.powerupCounts, [key]: parseInt(val) || 0 } }))
  }

  const toggleGenreExclude = (genreId) => {
    setSettings(s => ({
      ...s,
      excludedGenres: s.excludedGenres.includes(genreId)
        ? s.excludedGenres.filter(id => id !== genreId)
        : [...s.excludedGenres, genreId],
    }))
  }

  const handleCreate = async () => {
    if (!hostName.trim()) {
      setToast({ message: 'Enter your name first!', icon: '👤' })
      return
    }
    setLoading(true)
    try {
      const { code } = await createGame(hostName.trim(), settings)
      setScreen('lobby')
    } catch (e) {
      setToast({ message: 'Failed to create game. Check your connection.', icon: '❌' })
      setLoading(false)
    }
  }

  const TABS = [
    { id: 'game', label: '🎮 Game' },
    { id: 'timers', label: '⏱ Timers' },
    { id: 'powerups', label: '⚡ Power' },
    { id: 'genres', label: '🎯 Genres' },
  ]

  return (
    <div className="screen">
      {/* Header */}
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('home')}>← Back</button>
        <div className="topbar-logo">Create Game</div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Host name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <label className="input-label">Your Name (Host)</label>
          <input
            className="input"
            placeholder="e.g. Ethan"
            value={hostName}
            onChange={e => setHostName(e.target.value)}
            maxLength={20}
            autoFocus
          />
        </motion.div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Game tab */}
        {tab === 'game' && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card">
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="flex-1">
                  <div style={{ fontWeight: 700 }}>Question Master Mode</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Host reads questions and judges answers</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.questionMaster} onChange={e => setSetting('questionMaster', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', inset: 0, background: settings.questionMaster ? 'var(--accent)' : 'var(--bg2)', borderRadius: 12, transition: '0.2s' }}>
                    <span style={{ position: 'absolute', width: 18, height: 18, background: 'white', borderRadius: '50%', top: 3, left: settings.questionMaster ? 23 : 3, transition: '0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </span>
                </label>
              </div>

              <div>
                <label className="input-label">Answer Mode</label>
                <select className="input" value={settings.answerMode} onChange={e => setSetting('answerMode', e.target.value)} style={{ padding: '10px 14px' }}>
                  <option value="host-judges">Host Judges (spoken answers)</option>
                  <option value="multiple-choice">Multiple Choice (on phones)</option>
                  <option value="typed">Type Answer (on phones)</option>
                </select>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Round Settings</div>
              <div className="col gap-8">
                <div>
                  <label className="input-label">Questions per Round</label>
                  <input type="range" min={3} max={15} value={settings.questionsPerRound}
                    onChange={e => setSetting('questionsPerRound', Number(e.target.value))}
                    style={{ width: '100%' }} />
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="caption">3</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>{settings.questionsPerRound}</span>
                    <span className="caption">15</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Total Rounds</label>
                  <input type="range" min={1} max={10} value={settings.totalRounds}
                    onChange={e => setSetting('totalRounds', Number(e.target.value))}
                    style={{ width: '100%' }} />
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="caption">1</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>{settings.totalRounds}</span>
                    <span className="caption">10</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Max Players</label>
                  <input type="number" className="input" min={2} max={20} value={settings.maxPlayers}
                    onChange={e => setSetting('maxPlayers', Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Genre Selection</div>
              <div className="row">
                <div className="flex-1" style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                  Show 3 random genres each round
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.threeRandomGenres} onChange={e => setSetting('threeRandomGenres', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', inset: 0, background: settings.threeRandomGenres ? 'var(--accent)' : 'var(--bg2)', borderRadius: 12, transition: '0.2s' }}>
                    <span style={{ position: 'absolute', width: 18, height: 18, background: 'white', borderRadius: '50%', top: 3, left: settings.threeRandomGenres ? 23 : 3, transition: '0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </span>
                </label>
              </div>
              <div style={{ marginTop: 10 }}>
                <label className="input-label">Anthropic API Key (optional — for AI questions)</label>
                <input
                  className="input"
                  type="password"
                  placeholder="sk-ant-..."
                  value={settings.anthropicApiKey}
                  onChange={e => setSetting('anthropicApiKey', e.target.value)}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>
                  Without a key, built-in question banks are used. Get a key at console.anthropic.com
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Timers tab */}
        {tab === 'timers' && (
          <motion.div className="card col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontWeight: 700 }}>⏱ Timer Settings</div>
            <TimerSelect label="Quiz — Question Display" value={settings.timers.quizQuestion} onChange={v => setTimer('quizQuestion', v)} />
            <TimerSelect label="Quiz — Answer Window" value={settings.timers.quizAnswer} onChange={v => setTimer('quizAnswer', v)} />
            <TimerSelect label="Creative Rounds (Draw/Joke/Fill)" value={settings.timers.creative} onChange={v => setTimer('creative', v)} />
            <TimerSelect label="Blitz — Per Question" value={settings.timers.blitzPerQ} onChange={v => setTimer('blitzPerQ', v)} />
            <TimerSelect label="Vote Reveal — Per Entry" value={settings.timers.voteReveal} onChange={v => setTimer('voteReveal', v)} />
            <TimerSelect label="Vote Open Period" value={settings.timers.voteOpen} onChange={v => setTimer('voteOpen', v)} />
            <TimerSelect label="Genre Vote Period" value={settings.timers.genreVote} onChange={v => setTimer('genreVote', v)} />
          </motion.div>
        )}

        {/* Powerups tab */}
        {tab === 'powerups' && (
          <motion.div className="card col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ fontWeight: 700 }}>⚡ Powerup Settings</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Set to 0 to disable a powerup.</div>
            {[
              { key: 'sneakPeek', label: '🔍 Sneak Peek', desc: 'Shows answer initials' },
              { key: 'steal', label: '🤑 Steal', desc: 'Take someone\'s sneak peek' },
              { key: 'imposter', label: '😈 Imposter', desc: 'Force someone to answer' },
              { key: 'plagiarism', label: '📋 Plagiarism', desc: 'Copy a player\'s correct answers for a round' },
              { key: 'block', label: '🚫 Block', desc: 'Silence someone\'s next buzz' },
              { key: 'doublePoints', label: '✖️ Double Points', desc: '2× points for the whole round' },
            ].map(p => (
              <div key={p.key} className="row gap-12">
                <div className="flex-1">
                  <div style={{ fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{p.desc}</div>
                </div>
                <input
                  type="number"
                  className="input"
                  style={{ width: 64, textAlign: 'center', padding: '8px' }}
                  min={0} max={5}
                  value={settings.powerupCounts[p.key]}
                  onChange={e => setPowerup(p.key, e.target.value)}
                />
              </div>
            ))}
          </motion.div>
        )}

        {/* Genres tab */}
        {tab === 'genres' && (
          <motion.div className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card" style={{ background: 'rgba(192,132,252,0.05)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                Tick genres to <strong style={{ color: 'var(--red)' }}>exclude</strong> them from the game.
              </div>
            </div>
            {['classic', 'themed', 'creative'].map(cat => (
              <div key={cat} className="card">
                <div style={{ fontWeight: 700, marginBottom: 10, textTransform: 'capitalize' }}>
                  {cat === 'classic' ? '📚 Classic' : cat === 'themed' ? '🎭 Themed' : '🎨 Creative'}
                </div>
                {ALL_GENRES.filter(g => g.category === cat && g.id !== 'insidejokes' && g.id !== 'custom').map(g => (
                  <div key={g.id} className="row gap-8" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => toggleGenreExclude(g.id)}>
                    <span>{g.emoji}</span>
                    <span className="flex-1" style={{ fontSize: '0.9rem' }}>{g.name}</span>
                    <input type="checkbox" readOnly checked={!settings.excludedGenres.includes(g.id)}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {/* Create button */}
        <motion.button
          className="btn btn-primary btn-lg btn-block"
          whileTap={{ scale: 0.97 }}
          onClick={handleCreate}
          disabled={loading || !hostName.trim()}
          style={{ marginTop: 8 }}
        >
          {loading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : '🎮 Create Lobby'}
        </motion.button>
      </div>
      <Toast />
    </div>
  )
}
