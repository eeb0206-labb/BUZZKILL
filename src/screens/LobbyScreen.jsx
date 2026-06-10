import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, QRCode, Modal, Toast, MuteButton, CameraCapture } from '../components/ui'
import { INSIDE_JOKE_CATEGORIES, ALL_GENRES, GAME_TYPES, getGenreById } from '../data/genres'
import { db, ref, update } from '../firebase'
import AvatarCreator from '../components/AvatarCreator'
import AvatarSvg from '../components/AvatarSvg'
import { DEFAULT_AVATAR_CONFIG } from '../data/avatarParts'
import { useBuzzSpeech, useShouldBuzzSpeak, useBuzzSpeaking } from '../hooks/useBuzzSpeech'
import { getBuzzQuip } from '../data/hostQuips'
import BuzzHost from '../components/BuzzHost'

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
  const [form, setForm]       = useState({ label: '', category: 'incident', context: '' })
  // Extra state for special categories
  const [tfAnswer, setTfAnswer]   = useState(true)   // true = TRUE, false = FALSE
  const [tfFact, setTfFact]       = useState('')      // explanation shown on reveal
  const [ouItems, setOuItems]     = useState([])      // items list for ordersup
  const [ouDraft, setOuDraft]     = useState('')      // current item being typed
  const [submitting, setSubmitting] = useState(false)
  const { submitInsideJoke } = useGame()
  const setToast = useStore(s => s.setToast)

  const isTF = form.category === 'truefalse'
  const isOU = form.category === 'ordersup'

  function addOuItem() {
    const t = ouDraft.trim()
    if (!t) return
    setOuItems(prev => [...prev, t])
    setOuDraft('')
  }

  async function handleSubmit() {
    if (!form.label.trim()) { setToast({ message: isTF ? 'Enter a statement first' : isOU ? 'Give the order a name' : 'Give the joke a name', icon: '⚠️' }); return }
    if (isOU && ouItems.length < 3) { setToast({ message: 'Add at least 3 items to the order', icon: '⚠️' }); return }
    setSubmitting(true)
    const payload = {
      label: form.label.trim(),
      category: form.category,
      context: form.context.trim(),
      submittedBy: myId,
    }
    if (isTF) { payload.tfAnswer = tfAnswer; payload.tfFact = tfFact.trim() }
    if (isOU) { payload.ouItems = ouItems }
    await submitInsideJoke(gameCode, payload)
    setForm({ label: '', category: 'incident', context: '' })
    setTfAnswer(true); setTfFact(''); setOuItems([]); setOuDraft('')
    setSubmitting(false)
    onAdded?.()
    setToast({ message: isTF ? '🤔 True/False added!' : isOU ? '🍔 Order added!' : '🤫 Inside joke added!', icon: '✓' })
  }

  return (
    <div className="col gap-10">

      {/* Category picker — split into standard + special */}
      <div className="col gap-4">
        <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
          Standard
        </div>
        {INSIDE_JOKE_CATEGORIES.filter(c => !c.special).map(c => (
          <div key={c.id} className="row gap-8" style={{ cursor: 'pointer', padding: '4px 0' }}
            onClick={() => setForm(f => ({ ...f, category: c.id }))}>
            <span>{c.icon}</span>
            <span className="flex-1" style={{ fontSize: '0.88rem' }}>{c.label}</span>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border2)', background: form.category === c.id ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
          </div>
        ))}

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
          Custom rounds
        </div>
        {INSIDE_JOKE_CATEGORIES.filter(c => c.special).map(c => (
          <div key={c.id} className="row gap-8" style={{ cursor: 'pointer', padding: '4px 0' }}
            onClick={() => setForm(f => ({ ...f, category: c.id, label: '' }))}>
            <span>{c.icon}</span>
            <span className="flex-1" style={{ fontSize: '0.88rem' }}>{c.label}</span>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border2)', background: form.category === c.id ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* ── Standard category fields ─────────────────────── */}
      {!isTF && !isOU && (
        <>
          <input className="input" placeholder='Name it — e.g. "The Tesco incident"'
            value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          <input className="input" placeholder="Context (optional) — what actually happened"
            value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} />
        </>
      )}

      {/* ── True/False special fields ────────────────────── */}
      {isTF && (
        <motion.div className="col gap-10" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.05)', border: '1.5px solid rgba(16,185,129,0.2)', borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>🤔 Write a True or False statement</div>
          <input className="input" placeholder='e.g. "Penguins propose with pebbles"'
            value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          <div className="col gap-4">
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', fontWeight: 700 }}>Is this statement…</div>
            <div className="row gap-8">
              {[{ val: true, label: '✅ TRUE' }, { val: false, label: '❌ FALSE' }].map(({ val, label }) => (
                <motion.button key={String(val)} className="flex-1"
                  onClick={() => setTfAnswer(val)} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '10px 0', borderRadius: 10, border: `2px solid ${tfAnswer === val ? (val ? '#10b981' : '#e63946') : 'var(--border)'}`,
                    background: tfAnswer === val ? (val ? 'rgba(16,185,129,0.12)' : 'rgba(230,57,70,0.12)') : 'var(--surface)',
                    fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                    color: tfAnswer === val ? (val ? '#10b981' : '#e63946') : 'var(--text2)',
                  }}>
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
          <input className="input" placeholder="Explain it (shown after the answer — optional)"
            value={tfFact} onChange={e => setTfFact(e.target.value)} />
        </motion.div>
      )}

      {/* ── Orders Up! special fields ────────────────────── */}
      {isOU && (
        <motion.div className="col gap-10" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '12px 14px', background: 'rgba(249,115,22,0.05)', border: '1.5px solid rgba(249,115,22,0.2)', borderRadius: 12 }}>
          <div style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 700 }}>🍔 Build a custom order</div>
          <input className="input" placeholder='Location / name — e.g. "At the chippy"'
            value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />

          {/* Items added so far */}
          {ouItems.length > 0 && (
            <div className="col gap-4">
              {ouItems.map((item, i) => (
                <div key={i} className="row gap-8" style={{ padding: '6px 10px', background: 'rgba(249,115,22,0.07)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.2)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f97316', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                  <span className="flex-1" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item}</span>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => setOuItems(prev => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add item */}
          <div className="row gap-8">
            <input className="input flex-1" placeholder='Add an item — e.g. "5 hotdogs"'
              value={ouDraft} onChange={e => setOuDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOuItem() } }} />
            <button className="btn btn-ghost" style={{ flexShrink: 0 }} onClick={addOuItem} disabled={!ouDraft.trim()}>
              + Add
            </button>
          </div>

          {ouItems.length < 3 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
              Add at least 3 items · {ouItems.length}/3 minimum
            </div>
          )}
        </motion.div>
      )}

      <button className="btn btn-gold btn-block" onClick={handleSubmit}
        disabled={submitting || !form.label.trim() || (isOU && ouItems.length < 3)}>
        {submitting ? '...' : isTF ? 'Add Statement ✓' : isOU ? 'Add Order ✓' : 'Add Joke ✓'}
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
              photoSrc={profilePhoto}
              onPhotoChange={p => { setProfilePhoto(p); setProfilePhotoChanged(true) }}
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
function PlayerCard({ player, isMe, hostId, tvId, onRoleChange, onTransferHost }) {
  const isCurrentHost = player.id === hostId
  const isTV = player.id === tvId
  // Derive effective display role: TV assignment takes priority, host is treated as 'player' otherwise
  const effectiveRole = isTV ? 'gamescreen' : (isCurrentHost ? 'player' : player.role)
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
      {/* Role buttons — host changes any player's role including TV screen assignment */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        {ROLE_OPTIONS.map(({ role, icon, title }) => {
          const active = effectiveRole === role
          return (
            <motion.button key={role} title={title}
              onClick={() => { if (!active) onRoleChange(player.id, role) }}
              whileTap={{ scale: 0.9 }}
              style={{ padding: '3px 7px', borderRadius: 7, whiteSpace: 'nowrap', cursor: active ? 'default' : 'pointer',
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
function RulesSheet({ isQM, aiHost, hasScreen }) {
  const modeLabel = aiHost ? '⚡ Buzz (AI Host)' : '🎤 Question Master'
  const screenLabel = hasScreen ? '📺 Big Screen' : '📱 Phones Only'
  return (
    <div className="col gap-14">
      {/* Game mode */}
      <div className="card" style={{
        background: aiHost ? 'rgba(247,224,39,0.05)' : 'rgba(192,132,252,0.06)',
        borderColor: aiHost ? 'rgba(247,224,39,0.25)' : 'rgba(192,132,252,0.2)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {modeLabel} · {screenLabel}
          </div>
        </div>
        {aiHost ? (
          <div style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            Buzz runs the show. Questions appear automatically, players buzz in on their phones, and answers are judged without a host. Buzz provides commentary between rounds.
          </div>
        ) : (
          <div style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            One person is the Question Master — they read questions aloud, judge answers, and run the room. Perfect for a pub quiz vibe.
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
function PlaylistEditor({ playlist, onChange }) {
  const PLAYABLE = ALL_GENRES.filter(g => g.id !== 'insidejokes' && g.id !== 'custom' && !g.draft)
  const byType = Object.entries(GAME_TYPES).filter(([, t]) => t).map(([typeId, type]) => ({
    typeId, type, genres: PLAYABLE.filter(g => g.gameType === typeId),
  })).filter(g => g.genres.length > 0)

  function toggle(genreId) {
    if (playlist.includes(genreId)) {
      onChange(playlist.filter(id => id !== genreId))
    } else {
      onChange([...playlist, genreId])
    }
  }
  function move(idx, dir) {
    const next = [...playlist]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }
  function remove(idx) {
    onChange(playlist.filter((_, i) => i !== idx))
  }

  return (
    <div className="col gap-8">
      {/* Current playlist */}
      {playlist.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            📋 Your Playlist — {playlist.length} round{playlist.length !== 1 ? 's' : ''}
          </div>
          <div className="col gap-6">
            {playlist.map((id, idx) => {
              const g = getGenreById(id)
              if (!g) return null
              return (
                <div key={`${id}-${idx}`} className="row gap-8" style={{ alignItems: 'center', padding: '4px 0', borderBottom: idx < playlist.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text3)', minWidth: 20 }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>{g.emoji}</span>
                  <span className="flex-1" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{g.name}</span>
                  <div className="row gap-4">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0}
                      style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text3)' : 'var(--text2)', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '0.9rem', padding: '4px' }}>▲</button>
                    <button onClick={() => move(idx, 1)} disabled={idx === playlist.length - 1}
                      style={{ background: 'none', border: 'none', color: idx === playlist.length - 1 ? 'var(--text3)' : 'var(--text2)', cursor: idx === playlist.length - 1 ? 'default' : 'pointer', fontSize: '0.9rem', padding: '4px' }}>▼</button>
                    <button onClick={() => remove(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.9rem', padding: '4px' }}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Genre picker */}
      {byType.map(({ typeId, type, genres }) => (
        <div key={typeId} className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{type.icon} {type.label}</div>
          <div className="col gap-0">
            {genres.map(g => {
              const inPlaylist = playlist.includes(g.id)
              return (
                <div key={g.id} className="row gap-8"
                  style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', opacity: 1 }}
                  onClick={() => toggle(g.id)}>
                  <span style={{ fontSize: '1.2rem' }}>{g.emoji}</span>
                  <div className="flex-1">
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{g.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{g.desc || type.desc}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${inPlaylist ? 'var(--accent)' : 'var(--border)'}`,
                    background: inPlaylist ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {inPlaylist ? '✓' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

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
            {/* AI Host */}
            <div className="row gap-12" style={{ alignItems: 'center', marginBottom: 12 }}>
              <div className="flex-1">
                <div style={{ fontWeight: 700 }}>⚡ Buzz AI Host</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                  {localSettings.aiHost ? 'On — Buzz hosts the game' : 'Off — no AI host'}
                </div>
              </div>
              <Toggle checked={!!localSettings.aiHost} onChange={v => setS('aiHost', v)} />
            </div>
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

          {/* Buzz Voice (ElevenLabs) */}
          <div className="card col gap-12" style={{ borderColor: 'rgba(247,224,39,0.25)', background: 'rgba(247,224,39,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)' }}>⚡ Buzz Voice</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(247,224,39,0.6)', fontFamily: 'var(--font-mono)', background: 'rgba(247,224,39,0.08)', border: '1px solid rgba(247,224,39,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                ElevenLabs
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>
              Give Buzz a real voice. Create a voice in ElevenLabs, paste the API key and Voice ID here — Buzz will speak on the TV screen (or host's phone in phones-only mode).
            </div>
            <div>
              <label className="input-label">ElevenLabs API Key</label>
              <input
                type="password"
                className="input"
                placeholder="sk-..."
                value={localSettings.elevenLabsApiKey || ''}
                onChange={e => setS('elevenLabsApiKey', e.target.value)}
                autoComplete="off"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label className="input-label">Voice ID</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                value={localSettings.buzzVoiceId || ''}
                onChange={e => setS('buzzVoiceId', e.target.value)}
                autoComplete="off"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
            </div>
            {localSettings.elevenLabsApiKey && localSettings.buzzVoiceId && (
              <div style={{ fontSize: '0.75rem', color: 'rgba(87,204,153,0.9)', display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ Voice configured — Buzz will speak during the game
              </div>
            )}
            {(!localSettings.elevenLabsApiKey || !localSettings.buzzVoiceId) && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                Leave blank to use captions only
              </div>
            )}
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
          {/* Mode toggle */}
          <div className="card" style={{ gap: 0 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Game Mode</div>
            <div className="row gap-8">
              {[
                { id: false, label: '🎲 Random Rotation', desc: 'Vote on 3 random games each round' },
                { id: true, label: '📋 Curated Playlist', desc: 'Play specific games in a set order' },
              ].map(opt => (
                <button
                  key={String(opt.id)}
                  onClick={() => {
                    setS('playlistMode', opt.id)
                    if (!opt.id) setS('playlist', [])
                  }}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${!!localSettings.playlistMode === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: !!localSettings.playlistMode === opt.id ? 'rgba(192,132,252,0.1)' : 'var(--surface)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 3 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Playlist mode */}
          {localSettings.playlistMode ? (
            <PlaylistEditor
              playlist={localSettings.playlist || []}
              onChange={pl => { setS('playlist', pl); setS('totalRounds', pl.length || 1) }}
            />
          ) : (
            /* Random mode — genre exclusions */
            ['classic', 'themed', 'creative'].map(cat => (
              <div key={cat} className="card">
                <div style={{ fontWeight: 700, marginBottom: 10 }}>
                  {cat === 'classic' ? '📚 Classic' : cat === 'themed' ? '🎭 Themed' : '🎨 Creative'}
                </div>
                {ALL_GENRES.filter(g => g.category === cat && g.id !== 'insidejokes' && g.id !== 'custom' && !g.draft).map(g => (
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
            ))
          )}
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
  const aiHost = game?.settings?.aiHost ?? true
  const hasScreen = game?.settings?.hasScreen ?? false

  // Buzz lobby voice lines
  const { speakWithChance } = useBuzzSpeech()
  const shouldSpeak = useShouldBuzzSpeak(game)
  const buzzSpeaking = useBuzzSpeaking()
  const prevPlayerCountRef = useRef(0)

  // Lobby waiting — plays every 4 minutes while in the lobby
  useEffect(() => {
    if (!shouldSpeak || !aiHost) return
    const id = setInterval(() => {
      speakWithChance(getBuzzQuip('lobbyWaiting'), 'lobbyWaiting', null, 1.0)
    }, 4 * 60 * 1000)
    return () => clearInterval(id)
  }, [shouldSpeak, aiHost])

  // Player joins — 10% chance per new arrival
  useEffect(() => {
    const humanPlayers = players.filter(p => ['host', 'player', 'cohost'].includes(p.role))
    const count = humanPlayers.length
    if (prevPlayerCountRef.current > 0 && count > prevPlayerCountRef.current) {
      if (shouldSpeak && aiHost) {
        speakWithChance(getBuzzQuip('playerJoins'), 'playerJoins', null, 0.10)
      }
    }
    prevPlayerCountRef.current = count
  }, [players.length, shouldSpeak, aiHost])

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
    const isHost = playerId === game?.hostId
    const updates = {}
    if (newRole === 'gamescreen') {
      updates[`games/${gameCode}/players/${playerId}/role`] = 'gamescreen'
      updates[`games/${gameCode}/screens/tv`] = playerId
      updates[`games/${gameCode}/settings/hasScreen`] = true
    } else {
      // Restore host role if this player is the host, otherwise set to player
      updates[`games/${gameCode}/players/${playerId}/role`] = isHost ? 'host' : 'player'
      if (game?.screens?.tv === playerId) {
        updates[`games/${gameCode}/screens/tv`] = null
        updates[`games/${gameCode}/settings/hasScreen`] = false
      }
    }
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
                    tvId={game?.screens?.tv}
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

  // ── TV / GAME SCREEN LOBBY VIEW ──────────────────────────────────────────────
  if (store.isGameScreen()) {
    const humanPlayers = players.filter(p => ['host', 'player', 'cohost'].includes(p.role))
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 32, padding: '40px 48px',
        fontFamily: 'var(--font-body)',
      }}>
        {/* Top: Buzz + quip */}
        {aiHost && (
          <div style={{ position: 'absolute', top: 28, left: 32 }}>
            <BuzzHost
              quip={getBuzzQuip('lobbyWaiting')}
              event="idle"
              visible
              autoIdle
              idleInterval={8000}
              speakOnChange={shouldSpeak}
              speaking={buzzSpeaking}
            />
          </div>
        )}

        {/* Centre: game code + QR */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: '1.1rem',
            color: 'var(--text3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            Scan to join
          </div>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            display: 'inline-block',
            marginBottom: 20,
          }}>
            <QRCode value={joinUrl} size={200} />
          </div>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: '4rem',
            letterSpacing: '0.2em',
            color: 'var(--accent)',
            lineHeight: 1,
          }}>
            {gameCode}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginTop: 8 }}>
            {joinUrl}
          </div>
        </div>

        {/* Players joined */}
        {humanPlayers.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
            }}>
              {humanPlayers.length} player{humanPlayers.length !== 1 ? 's' : ''} joined
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {humanPlayers.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Avatar src={p.avatar} avatarConfig={p.avatarConfig} name={p.name} colorHex={p.colorHex} size={60} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', maxWidth: 80, textAlign: 'center', wordBreak: 'break-word' }}>
                    {p.name}
                    {p.id === game?.hostId && <span style={{ color: 'var(--gold)', fontSize: '0.65rem', display: 'block' }}>HOST</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {humanPlayers.length === 0 && (
          <div style={{ fontSize: '0.95rem', color: 'var(--text3)' }}>
            Waiting for players to join...
          </div>
        )}

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
            <RulesSheet isQM={isQM} aiHost={aiHost} hasScreen={hasScreen} />
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
              maxLength={20} placeholder="Display name" />
          </div>
          <AvatarCreator
            config={profileAvatarConfig}
            onChange={v => { setProfileAvatarConfig(v); setProfileAvatarChanged(true) }}
            photoSrc={profilePhoto}
            onPhotoChange={p => { setProfilePhoto(p); setProfilePhotoChanged(true) }}
          />
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
