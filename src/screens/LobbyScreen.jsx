import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, QRCode, Modal, Toast, MuteButton, CameraCapture } from '../components/ui'
import { INSIDE_JOKE_CATEGORIES, ALL_GENRES } from '../data/genres'
import { db, ref, update } from '../firebase'
import AvatarCreator from '../components/AvatarCreator'
import AvatarSvg from '../components/AvatarSvg'
import { DEFAULT_AVATAR_CONFIG } from '../data/avatarParts'

// ── settings helpers ────────────────────────────────────────────────────────────
const TIMER_OPTIONS = [
  { label: 'Off', value: 0 }, { label: '10s', value: 10 }, { label: '15s', value: 15 },
  { label: '20s', value: 20 }, { label: '25s', value: 25 }, { label: '30s', value: 30 },
  { label: '45s', value: 45 }, { label: '1 min', value: 60 }, { label: '1:30', value: 90 },
  { label: '2 min', value: 120 }, { label: '3 min', value: 180 }, { label: '5 min', value: 300 },
]

function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', inset: 0, background: checked ? 'var(--accent)' : 'var(--bg2)', borderRadius: 12, transition: '0.2s' }}>
        <span style={{ position: 'absolute', width: 18, height: 18, background: 'white', borderRadius: '50%', top: 3, left: checked ? 23 : 3, transition: '0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </span>
    </label>
  )
}

function TimerSelect({ value, onChange, label }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <select className="input" value={value} onChange={e => onChange(Number(e.target.value))} style={{ padding: '10px 14px' }}>
        {TIMER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── role options ─────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { role: 'player',     icon: '🎮', title: 'Player' },
  { role: 'gamescreen', icon: '📺', title: 'TV Screen' },
]

// ── powerup info ─────────────────────────────────────────────────────────────────
const POWERUPS = [
  {
    icon: '🔍', name: 'Sneak Peek',
    desc: 'Reveals the first letter(s) of the answer — gives you a head start before buzzing in.',
  },
  {
    icon: '🤑', name: 'Steal',
    desc: 'Grab any power-up from another player\'s stash. They lose it, you gain it.',
  },
  {
    icon: '😈', name: 'Imposter',
    desc: 'Force another player\'s buzzer to fire — they must answer the question. If they get it wrong: you gain +50, they lose 25. If they get it right: they get their 100 points and you get nothing.',
  },
  {
    icon: '📋', name: 'Plagiarism',
    desc: 'Latch onto one player for the next 4 questions. Every time they get a correct answer, you automatically earn the same points.',
  },
  {
    icon: '🚫', name: 'Block',
    desc: 'Silence a chosen player. The next time they try to buzz in, nothing happens — their buzz is swallowed.',
  },
  {
    icon: '✖️', name: 'Double Points',
    desc: 'Activate before a round starts. All your correct answers score 2× points for the entire round.',
  },
]

// ── inside joke form ─────────────────────────────────────────────────────────────
function InsideJokeForm({ gameCode, myId, onAdded }) {
  const [form, setForm] = useState({ label: '', category: 'incident', context: '' })
  const [submitting, setSubmitting] = useState(false)
  const { submitInsideJoke } = useGame()
  const setToast = useStore(s => s.setToast)

  async function handleSubmit() {
    if (!form.label.trim()) { setToast({ message: 'Give the joke a name', icon: '⚠️' }); return }
    setSubmitting(true)
    await submitInsideJoke(gameCode, {
      label: form.label.trim(),
      category: form.category,
      context: form.context.trim(),
      submittedBy: myId,
    })
    setForm({ label: '', category: 'incident', context: '' })
    setSubmitting(false)
    onAdded?.()
    setToast({ message: '🤫 Inside joke added!', icon: '✓' })
  }

  return (
    <div className="col gap-10">
      <input className="input" placeholder='Name it — e.g. "The Tesco incident"'
        value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
      <div className="col gap-4">
        {INSIDE_JOKE_CATEGORIES.map(c => (
          <div key={c.id} className="row gap-8" style={{ cursor: 'pointer', padding: '4px 0' }}
            onClick={() => setForm(f => ({ ...f, category: c.id }))}>
            <span>{c.icon}</span>
            <span className="flex-1" style={{ fontSize: '0.88rem' }}>{c.label}</span>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border2)', background: form.category === c.id ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
          </div>
        ))}
      </div>
      <input className="input" placeholder="Context (optional) — what actually happened"
        value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} />
      <button className="btn btn-gold btn-block" onClick={handleSubmit}
        disabled={submitting || !form.label.trim()}>
        {submitting ? '...' : 'Add Joke ✓'}
      </button>
    </div>
  )
}

// ── profile modal content (shared between host + player views) ────────────────
function ProfileModalContent({ profileMode, setProfileMode, profileName, setProfileName, profileAvatarConfig, setProfileAvatarConfig, profilePhoto, setProfilePhoto, setProfilePhotoChanged, profileSaving, onCancel, onSave }) {
  return (
    <div className="col gap-12">
      {/* Tab toggle */}
      <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 3, gap: 3, border: '1px solid var(--border)' }}>
        {[['name', '👤 Name'], ['avatar', '🎨 Avatar']].map(([id, label]) => (
          <motion.button key={id} onClick={() => setProfileMode(id)} whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: profileMode === id ? 'var(--accent)' : 'transparent',
              color: profileMode === id ? '#fff' : 'var(--text2)',
              fontWeight: profileMode === id ? 700 : 400, fontSize: '0.88rem',
              fontFamily: 'var(--font-body)', transition: 'background 0.15s',
            }}>
            {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {profileMode === 'name' && (
          <motion.div key="name" className="col gap-14"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div>
              <label className="input-label">Your Name</label>
              <input className="input" value={profileName} onChange={e => setProfileName(e.target.value)}
                maxLength={20} placeholder="Display name" autoFocus />
            </div>
            <div className="row gap-8">
              <button className="btn btn-ghost flex-1" onClick={onCancel}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={onSave} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save ✓'}
              </button>
            </div>
          </motion.div>
        )}

        {profileMode === 'avatar' && (
          <motion.div key="avatar" className="col gap-12"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <AvatarCreator
              config={profileAvatarConfig}
              onChange={setProfileAvatarConfig}
            />
            <div className="row gap-8">
              <button className="btn btn-ghost flex-1" onClick={onCancel}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={onSave} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save ✓'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── player card (host view) ──────────────────────────────────────────────────────
function PlayerCard({ player, isMe, hostId, onRoleChange, onTransferHost }) {
  const isCurrentHost = player.id === hostId
  return (
    <motion.div className="card col center gap-8" initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }} layout
      style={{ padding: '14px 10px', position: 'relative', textAlign: 'center' }}>
      {isCurrentHost && (
        <div style={{ position: 'absolute', top: 6, right: 6, fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.06em', color: 'var(--gold)', background: 'rgba(244,208,63,0.12)',
          borderRadius: 4, padding: '2px 5px' }}>HOST</div>
      )}
      <Avatar src={player.avatar} avatarConfig={player.avatarConfig} name={player.name} colorHex={player.colorHex} size={56} />
      <div style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: 1.2 }}>
        {player.name}
        {isMe && <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '0.8rem' }}> (you)</span>}
      </div>
      {/* Role buttons — shown for everyone, including host (so host can become TV Screen) */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        {ROLE_OPTIONS.map(({ role, icon, title }) => {
          const active = player.role === role || (isCurrentHost && role === 'player')
          return (
            <motion.button key={role} title={title} onClick={() => onRoleChange(player.id, role)}
              whileTap={{ scale: 0.9 }}
              style={{ padding: '3px 7px', borderRadius: 7, whiteSpace: 'nowrap', cursor: 'pointer',
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
                background: active ? 'rgba(192,132,252,0.2)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text3)',
                fontSize: '0.75rem', fontWeight: active ? 700 : 400, transition: 'all 0.15s' }}>
              {icon} {title}
            </motion.button>
          )
        })}
      </div>
      {/* Transfer host button — only on other players' cards (not yourself, not already host) */}
      {!isMe && !isCurrentHost && onTransferHost && (
        <motion.button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.72rem', color: 'var(--gold)', borderColor: 'rgba(244,208,63,0.3)', padding: '2px 8px' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onTransferHost(player.id)}
          title="Give this player host controls"
        >
          👑 Make Host
        </motion.button>
      )}
    </motion.div>
  )
}

// ── rules sheet ──────────────────────────────────────────────────────────────────
function RulesSheet({ isQM }) {
  return (
    <div className="col gap-14">
      {/* Game mode */}
      <div className="card" style={{ background: isQM ? 'rgba(192,132,252,0.06)' : 'rgba(87,204,153,0.06)', borderColor: isQM ? 'rgba(192,132,252,0.2)' : 'rgba(87,204,153,0.2)' }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.95rem' }}>
          {isQM ? '🎙️ Question Master Mode' : '🤖 No-Host Mode (this game)'}
        </div>
        {isQM ? (
          <div style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            One person runs the game from their phone. They read each question aloud, hear spoken answers, and decide what's right or wrong. In subjective rounds like Hot Takes they rank answers and pick winners. Great for a pub quiz feel.
          </div>
        ) : (
          <div style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            The game runs itself — questions appear on screen, players buzz in on their phones, and answers are judged automatically. No one has to be in charge. Great for a fast, casual vibe.
          </div>
        )}
      </div>

      {/* How a round works */}
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>How a Round Works</div>
        {[
          ['🗳️', 'Vote', 'Everyone votes on a genre from 3 random options. Most votes wins.'],
          ['❓', 'Questions', 'Questions appear. First to buzz in must answer. +100 correct, −25 wrong. If someone already got it wrong and you get it right, you earn a +50 bonus on top.'],
          ['⚡', 'Powerups', 'Use your powerups strategically — before buzzing or between rounds.'],
          ['🏆', 'Scores', 'Leaderboard shown at the end of each round.'],
        ].map(([icon, label, text]) => (
          <div key={label} className="row gap-10" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.2rem', flexShrink: 0, width: 28, textAlign: 'center' }}>{icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>{text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Powerups */}
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Your Powerups</div>
        {POWERUPS.map(p => (
          <div key={p.name} className="row gap-10" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.4rem', flexShrink: 0, width: 28, textAlign: 'center' }}>{p.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── settings form ────────────────────────────────────────────────────────────────
function SettingsForm({ localSettings, setS, setTimer, setPowerup, toggleGenreExclude, settingsTab, setSettingsTab, showQMInfo, setShowQMInfo }) {
  const SETTINGS_TABS = [
    { id: 'game', label: '🎮 Game' },
    { id: 'timers', label: '⏱ Timers' },
    { id: 'powerups', label: '⚡ Power' },
    { id: 'genres', label: '🎯 Genres' },
  ]

  return (
    <div className="col gap-12">
      <div className="tabs">
        {SETTINGS_TABS.map(t => (
          <button key={t.id} className={`tab ${settingsTab === t.id ? 'active' : ''}`} onClick={() => setSettingsTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {settingsTab === 'game' && (
        <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card">
            {/* Question Master */}
            <div className="row gap-12" style={{ alignItems: 'flex-start', marginBottom: showQMInfo ? 10 : 12 }}>
              <div className="flex-1">
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Question Master Mode
                  <button onClick={() => setShowQMInfo(v => !v)}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--text3)',
                      background: showQMInfo ? 'var(--text3)' : 'transparent', color: showQMInfo ? 'var(--bg)' : 'var(--text3)',
                      fontSize: '0.68rem', fontStyle: 'italic', fontFamily: 'serif', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    i
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                  {localSettings.questionMaster ? 'On — host judges answers' : 'Off — game judges automatically'}
                </div>
              </div>
              <Toggle checked={!!localSettings.questionMaster} onChange={v => setS('questionMaster', v)} />
            </div>
            <AnimatePresence>
              {showQMInfo && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ background: 'rgba(192,132,252,0.07)', border: '1px solid rgba(192,132,252,0.2)',
                    borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--accent)' }}>Question Master mode</strong> puts one person in charge from their phone. They read questions aloud, decide if spoken answers are right or wrong, and rank answers in subjective rounds (Hot Takes, Whodunnit). Turn it off for a fully automatic, no-host game.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <label className="input-label">Answer Mode</label>
              <select className="input" value={localSettings.answerMode || 'host-judges'} onChange={e => setS('answerMode', e.target.value)} style={{ padding: '10px 14px' }}>
                <option value="host-judges">Host Judges (spoken answers)</option>
                <option value="multiple-choice">Multiple Choice (on phones)</option>
                <option value="typed">Type Answer (on phones)</option>
              </select>
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Round Settings</div>
            <div className="col gap-10">
              <div>
                <label className="input-label">Questions per Round — <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{localSettings.questionsPerRound || 8}</span></label>
                <input type="range" min={3} max={15} value={localSettings.questionsPerRound || 8}
                  onChange={e => setS('questionsPerRound', Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div>
                <label className="input-label">Total Rounds — <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{localSettings.totalRounds || 5}</span></label>
                <input type="range" min={1} max={10} value={localSettings.totalRounds || 5}
                  onChange={e => setS('totalRounds', Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div>
                <label className="input-label">Max Players</label>
                <input type="number" className="input" min={2} max={20} value={localSettings.maxPlayers || 10}
                  onChange={e => setS('maxPlayers', Number(e.target.value))} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="row gap-12">
              <div className="flex-1">
                <div style={{ fontWeight: 700 }}>3 Random Genres per Round</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Players vote from 3 options each round</div>
              </div>
              <Toggle checked={!!localSettings.threeRandomGenres} onChange={v => setS('threeRandomGenres', v)} />
            </div>
          </div>
        </motion.div>
      )}

      {settingsTab === 'timers' && localSettings.timers && (
        <motion.div className="card col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontWeight: 700 }}>⏱ Timer Settings</div>
          <TimerSelect label="Quiz — Question Display" value={localSettings.timers.quizQuestion} onChange={v => setTimer('quizQuestion', v)} />
          <TimerSelect label="Quiz — Answer Window" value={localSettings.timers.quizAnswer} onChange={v => setTimer('quizAnswer', v)} />
          <TimerSelect label="Creative Rounds" value={localSettings.timers.creative} onChange={v => setTimer('creative', v)} />
          <TimerSelect label="Blitz — Per Question" value={localSettings.timers.blitzPerQ} onChange={v => setTimer('blitzPerQ', v)} />
          <TimerSelect label="Vote Reveal" value={localSettings.timers.voteReveal} onChange={v => setTimer('voteReveal', v)} />
          <TimerSelect label="Vote Open Period" value={localSettings.timers.voteOpen} onChange={v => setTimer('voteOpen', v)} />
          <TimerSelect label="Genre Vote Period" value={localSettings.timers.genreVote} onChange={v => setTimer('genreVote', v)} />
        </motion.div>
      )}

      {settingsTab === 'powerups' && localSettings.powerupCounts && (
        <motion.div className="card col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontWeight: 700 }}>⚡ Powerup Counts</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Set to 0 to disable.</div>
          {[
            { key: 'sneakPeek', label: '🔍 Sneak Peek' }, { key: 'steal', label: '🤑 Steal' },
            { key: 'imposter', label: '😈 Imposter' }, { key: 'plagiarism', label: '📋 Plagiarism' },
            { key: 'block', label: '🚫 Block' }, { key: 'doublePoints', label: '✖️ Double Points' },
          ].map(p => (
            <div key={p.key} className="row gap-12" style={{ alignItems: 'center' }}>
              <div className="flex-1" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.label}</div>
              <input type="number" className="input" style={{ width: 64, textAlign: 'center', padding: '8px' }}
                min={0} max={5} value={localSettings.powerupCounts[p.key]}
                onChange={e => setPowerup(p.key, e.target.value)} />
            </div>
          ))}
        </motion.div>
      )}

      {settingsTab === 'genres' && (
        <motion.div className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {['classic', 'themed', 'creative'].map(cat => (
            <div key={cat} className="card">
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                {cat === 'classic' ? '📚 Classic' : cat === 'themed' ? '🎭 Themed' : '🎨 Creative'}
              </div>
              {ALL_GENRES.filter(g => g.category === cat && g.id !== 'insidejokes' && g.id !== 'custom').map(g => (
                <div key={g.id} className="row gap-8"
                  style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => toggleGenreExclude(g.id)}>
                  <span>{g.emoji}</span>
                  <span className="flex-1" style={{ fontSize: '0.9rem' }}>{g.name}</span>
                  <input type="checkbox" readOnly
                    checked={!(localSettings.excludedGenres || []).includes(g.id)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ── main component ──────────────────────────────────────────────────────────────
export default function LobbyScreen() {
  const store = useStore()
  const game = store.game
  const myId = store.myId
  const gameCode = store.gameCode
  const isHost = store.isHost()
  const isController = store.isController()
  // Show host controls if you're the controller OR you're the Firebase host (even set as TV screen)
  const showHostView = isController || isHost
  const { subscribeToGame, startGame, updateGame, updatePlayer, transferHost } = useGame()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('game')
  const [localSettings, setLocalSettings] = useState(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [showQMInfo, setShowQMInfo] = useState(false)
  const [qrFullscreen, setQrFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [profilePhotoChanged, setProfilePhotoChanged] = useState(false)
  const [profileAvatarConfig, setProfileAvatarConfig] = useState(null)
  const [profileAvatarChanged, setProfileAvatarChanged] = useState(false)
  const [profileMode, setProfileMode] = useState('name') // 'name' | 'avatar'
  const [profileSaving, setProfileSaving] = useState(false)
  const [playerTab, setPlayerTab] = useState('jokes') // 'jokes' | 'rules'

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?code=${gameCode}`
    : ''

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-pick') store.setScreen('round-pick')
      const myPlayer = g.players?.[myId]
      if (myPlayer?.role) {
        // Use getState() to avoid stale closure — myRole changes after initial mount
        const currentRole = useStore.getState().myRole
        if (myPlayer.role !== currentRole) useStore.getState().setMyRole(myPlayer.role)
      }
    })
    return unsub
  }, [gameCode])

  const players = Object.values(game?.players || {})
  const insideJokes = game?.insideJokes ? Object.values(game.insideJokes) : []
  const isQM = game?.settings?.questionMaster ?? false

  function copyCode() {
    navigator.clipboard?.writeText(joinUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStartGame() {
    const count = players.filter(p => ['host', 'player', 'cohost'].includes(p.role)).length
    if (count < 1) { store.setToast({ message: 'Need at least 1 player to start!', icon: '⚠️' }); return }
    await startGame(gameCode)
  }

  async function changePlayerRole(playerId, newRole) {
    const updates = { [`games/${gameCode}/players/${playerId}/role`]: newRole }
    if (newRole === 'gamescreen') updates[`games/${gameCode}/screens/tv`] = playerId
    else if (game?.screens?.tv === playerId) updates[`games/${gameCode}/screens/tv`] = null
    await update(ref(db), updates)
  }

  async function handleTransferHost(toPlayerId) {
    if (!myId || !toPlayerId) return
    await transferHost(gameCode, myId, toPlayerId)
    // Our own role will be updated by the Firebase subscription → isController becomes false → UI switches
  }

  function openSettings() {
    setLocalSettings(game?.settings ? JSON.parse(JSON.stringify(game.settings)) : {})
    setSettingsTab('game'); setShowQMInfo(false); setSettingsOpen(true)
  }

  async function saveSettings() {
    if (!localSettings) return
    setSettingsSaving(true)
    await updateGame(gameCode, { settings: localSettings })
    setSettingsSaving(false); setSettingsOpen(false)
    store.setToast({ message: 'Settings saved ✓', icon: '⚙️' })
  }

  function openProfile() {
    const me = game?.players?.[myId]
    setProfileName(me?.name || store.myName || '')
    setProfilePhoto(me?.avatar || null)
    setProfilePhotoChanged(false)
    setProfileAvatarConfig(me?.avatarConfig || store.myAvatarConfig || DEFAULT_AVATAR_CONFIG)
    setProfileAvatarChanged(false)
    setProfileMode('name')
    setProfileOpen(true)
  }

  async function saveProfile() {
    if (!profileName.trim()) { store.setToast({ message: 'Name can\'t be empty', icon: '⚠️' }); return }
    setProfileSaving(true)
    const updates = { name: profileName.trim() }
    if (profilePhotoChanged) updates.avatar = profilePhoto
    if (profileAvatarChanged) updates.avatarConfig = profileAvatarConfig
    await updatePlayer(gameCode, myId, updates)
    store.setMyName(profileName.trim())
    if (profilePhotoChanged && profilePhoto) store.setMyAvatar(profilePhoto)
    if (profileAvatarChanged && profileAvatarConfig) store.setMyAvatarConfig(profileAvatarConfig)
    setProfileSaving(false); setProfileOpen(false)
    store.setToast({ message: 'Profile updated ✓', icon: '👤' })
  }

  const settingsHelpers = {
    setS: (k, v) => setLocalSettings(s => ({ ...s, [k]: v })),
    setTimer: (k, v) => setLocalSettings(s => ({ ...s, timers: { ...s.timers, [k]: v } })),
    setPowerup: (k, v) => setLocalSettings(s => ({ ...s, powerupCounts: { ...s.powerupCounts, [k]: parseInt(v) || 0 } })),
    toggleGenreExclude: (id) => setLocalSettings(s => ({
      ...s, excludedGenres: (s.excludedGenres || []).includes(id)
        ? (s.excludedGenres || []).filter(g => g !== id)
        : [...(s.excludedGenres || []), id],
    })),
  }

  const myPlayer = game?.players?.[myId]

  // ── topbar ──────────────────────────────────────────────────────────────────
  const topbar = (
    <div className="topbar">
      <button className="btn btn-ghost btn-sm" onClick={() => { store.setScreen('home'); store.setGame(null) }}>
        ✕ Leave
      </button>
      <div className="topbar-logo">Lobby</div>
      <div className="row gap-4">
        {store.isGameScreen() && isHost && (
          <div style={{ fontSize: '0.65rem', color: 'var(--accent)', background: 'rgba(192,132,252,0.15)', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>📺 TV+HOST</div>
        )}
        {(isController || isHost) && (
          <motion.button className="btn btn-ghost btn-sm" onClick={openSettings} whileTap={{ scale: 0.9 }}
            title="Game settings" style={{ fontSize: '1rem', padding: '6px 8px' }}>⚙️</motion.button>
        )}
        <MuteButton />
      </div>
    </div>
  )

  // ── fullscreen QR overlay ────────────────────────────────────────────────────
  const qrOverlay = (
    <AnimatePresence>
      {qrFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQrFullscreen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(8,5,20,0.97)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Tap anywhere to close
          </div>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
            <QRCode value={joinUrl} size={280} />
          </motion.div>
          <div className="game-code" style={{ fontSize: '2.8rem', letterSpacing: '0.2em', cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); copyCode() }}>
            {gameCode}
          </div>
          {copied && (
            <div style={{ fontSize: '0.82rem', color: 'var(--green)' }}>✓ Link copied!</div>
          )}
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', maxWidth: 280, textAlign: 'center', wordBreak: 'break-all' }}>
            {joinUrl}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── HOST VIEW (also shown if host is in TV screen role) ─────────────────────
  if (showHostView) {
    return (
      <div className="screen">
        {topbar}
        <div className="screen-inner" style={{ gap: 14 }}>

          {/* Game code + QR */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="row gap-14" style={{ alignItems: 'center' }}>
              <div className="col gap-8" style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Game Code
                </div>
                <motion.div className="game-code"
                  style={{ fontSize: '2.4rem', letterSpacing: '0.15em', cursor: 'pointer', lineHeight: 1 }}
                  onClick={copyCode} whileTap={{ scale: 0.95 }}>
                  {gameCode}
                </motion.div>
                <motion.button className="btn btn-ghost btn-sm" onClick={copyCode} whileTap={{ scale: 0.93 }}
                  style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}>
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </motion.button>
              </div>
              {/* QR code — click to fullscreen */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setQrFullscreen(true)}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                title="Tap to go fullscreen">
                <QRCode value={joinUrl} size={100} />
              </motion.div>
            </div>
          </div>

          {/* My profile strip (host can edit too) */}
          <motion.div
            className="card"
            style={{ padding: '10px 14px', cursor: 'pointer' }}
            onClick={openProfile}
            whileTap={{ scale: 0.98 }}
          >
            <div className="row gap-10" style={{ alignItems: 'center' }}>
              <Avatar
                src={myPlayer?.avatar || null}
                avatarConfig={myPlayer?.avatarConfig || null}
                name={myPlayer?.name || store.myName}
                colorHex={myPlayer?.colorHex}
                size={44}
              />
              <div className="flex-1">
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{myPlayer?.name || store.myName || 'Host'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Tap to edit your avatar ✏️</div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gold)', background: 'rgba(244,208,63,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>HOST</div>
            </div>
          </motion.div>

          {/* Players */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Players ({players.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <AnimatePresence>
                {players.map(p => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    isMe={p.id === myId}
                    hostId={game?.hostId}
                    onRoleChange={changePlayerRole}
                    onTransferHost={handleTransferHost}
                  />
                ))}
              </AnimatePresence>
              {players.length === 0 && (
                <div className="card center" style={{ gridColumn: 'span 2', padding: 24, color: 'var(--text3)', fontSize: '0.85rem' }}>
                  No one has joined yet — share the code above
                </div>
              )}
            </div>
          </div>

          {insideJokes.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textAlign: 'center' }}>
              🤫 {insideJokes.length} inside joke{insideJokes.length !== 1 ? 's' : ''} added
            </div>
          )}

          <motion.button className="btn btn-green btn-lg btn-block" whileTap={{ scale: 0.97 }}
            onClick={handleStartGame} style={{ marginTop: 'auto' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            🚀 Start Game
          </motion.button>
        </div>

        {/* Settings modal */}
        <Modal show={settingsOpen} onClose={() => setSettingsOpen(false)} title="⚙️ Game Settings">
          {localSettings && (
            <div className="col gap-4">
              <SettingsForm
                localSettings={localSettings}
                settingsTab={settingsTab}
                setSettingsTab={setSettingsTab}
                showQMInfo={showQMInfo}
                setShowQMInfo={setShowQMInfo}
                {...settingsHelpers}
              />
              <button className="btn btn-primary btn-block" onClick={saveSettings} disabled={settingsSaving}
                style={{ marginTop: 8 }}>
                {settingsSaving ? 'Saving...' : 'Save Settings ✓'}
              </button>
            </div>
          )}
        </Modal>

        {/* Profile edit modal (host) */}
        <Modal show={profileOpen} onClose={() => setProfileOpen(false)} title="✏️ Edit Profile">
          <ProfileModalContent
            profileMode={profileMode} setProfileMode={setProfileMode}
            profileName={profileName} setProfileName={setProfileName}
            profileAvatarConfig={profileAvatarConfig}
            setProfileAvatarConfig={v => { setProfileAvatarConfig(v); setProfileAvatarChanged(true) }}
            profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto}
            setProfilePhotoChanged={setProfilePhotoChanged}
            profileSaving={profileSaving}
            onCancel={() => setProfileOpen(false)}
            onSave={saveProfile}
          />
        </Modal>

        {qrOverlay}
        <Toast />
      </div>
    )
  }

  // ── PLAYER VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="screen">
      {topbar}

      <div className="screen-inner" style={{ gap: 14 }}>

        {/* My profile strip */}
        <motion.div
          className="card"
          style={{ padding: '10px 14px', cursor: 'pointer' }}
          onClick={openProfile}
          whileTap={{ scale: 0.98 }}
        >
          <div className="row gap-10" style={{ alignItems: 'center' }}>
            <Avatar
              src={myPlayer?.avatar || null}
              avatarConfig={myPlayer?.avatarConfig || null}
              name={myPlayer?.name || store.myName}
              colorHex={myPlayer?.colorHex}
              size={44}
            />
            <div className="flex-1">
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{myPlayer?.name || store.myName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Tap to edit your avatar ✏️</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>✏️</div>
          </div>
        </motion.div>

        {/* Waiting status */}
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text3)' }}>
          Waiting for the host to start the game...
        </div>

        {/* Tab toggle: Jokes / Rules */}
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 10, padding: 3, gap: 3 }}>
          {[['jokes', '🤫 Inside Jokes'], ['rules', '📋 How to Play']].map(([id, label]) => (
            <motion.button key={id} onClick={() => setPlayerTab(id)} whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: playerTab === id ? 'var(--surface2)' : 'transparent',
                color: playerTab === id ? 'var(--text)' : 'var(--text3)',
                fontWeight: playerTab === id ? 700 : 400, fontSize: '0.85rem',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}>
              {label}
            </motion.button>
          ))}
        </div>

        {/* Jokes tab */}
        {playerTab === 'jokes' && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card" style={{ background: 'rgba(244,208,63,0.04)', borderColor: 'rgba(244,208,63,0.2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Add an inside joke</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>
                Inside jokes get woven into the questions. The more the better!
              </div>
              <InsideJokeForm gameCode={gameCode} myId={myId} />
            </div>

            {insideJokes.length > 0 && (
              <div className="col gap-6">
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {insideJokes.length} added so far
                </div>
                {insideJokes.map((joke, i) => (
                  <motion.div key={i} className="player-row" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }} style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: '1.1rem' }}>
                      {INSIDE_JOKE_CATEGORIES.find(c => c.id === joke.category)?.icon || '💬'}
                    </span>
                    <div className="flex-1">
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{joke.label}</div>
                      {joke.context && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                          "{joke.context.slice(0, 50)}{joke.context.length > 50 ? '...' : ''}"
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Rules tab */}
        {playerTab === 'rules' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <RulesSheet isQM={isQM} />
          </motion.div>
        )}

        {/* Game code at bottom */}
        <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 8 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Share with friends
          </div>
          <motion.div className="game-code"
            style={{ fontSize: '1.8rem', letterSpacing: '0.2em', cursor: 'pointer', display: 'inline-block' }}
            onClick={copyCode} whileTap={{ scale: 0.95 }}>
            {gameCode}
          </motion.div>
          {copied && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 4 }}>
              ✓ Copied!
            </motion.div>
          )}
        </div>
      </div>

      {/* Profile edit modal */}
      <Modal show={profileOpen} onClose={() => setProfileOpen(false)} title="✏️ Edit Profile">
        <div className="col gap-14">
          <div>
            <label className="input-label">Your Name</label>
            <input className="input" value={profileName} onChange={e => setProfileName(e.target.value)}
              maxLength={20} placeholder="Display name" autoFocus />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: 10 }}>Profile Photo</label>
            {profilePhoto && (
              <div className="col center" style={{ gap: 8, marginBottom: 12 }}>
                <img src={profilePhoto} alt="current"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                <button className="btn btn-ghost btn-sm" onClick={() => { setProfilePhoto(null); setProfilePhotoChanged(true) }}>Remove photo</button>
              </div>
            )}
            {!profilePhoto ? (
              <CameraCapture
                onCapture={data => { setProfilePhoto(data); setProfilePhotoChanged(true) }}
                onSkip={null}
              />
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => { setProfilePhoto(null); setProfilePhotoChanged(true) }}
                style={{ alignSelf: 'flex-start' }}>
                📷 Retake / Change
              </button>
            )}
          </div>
          <div className="row gap-8">
            <button className="btn btn-ghost flex-1" onClick={() => setProfileOpen(false)}>Cancel</button>
            <button className="btn btn-primary flex-1" onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save ✓'}
            </button>
          </div>
        </div>
      </Modal>

      {qrOverlay}
      <Toast />
    </div>
  )
}
