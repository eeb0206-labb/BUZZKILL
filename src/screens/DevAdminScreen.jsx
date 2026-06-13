/**
 * DevAdminScreen — only accessible on localhost/dev.
 *
 * Tabs:
 *   🧪 Test    — click a genre to spin up a test lobby
 *   ❓ Questions — browse / edit all questions, answers, hints + per-genre voice IDs
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { ALL_GENRES, GAME_TYPES } from '../data/genres'
import { db, ref, update } from '../firebase'

const GAME_TYPE_ORDER = ['quiz','blitz','fill','draw','music','joke','hottake','whod','redemption','lawyers','truefalse','ordersup','fartdirection','speedbriefs','modelmodelun']

// ── Content field name per gameType ──────────────────────────────────────────
const CONTENT_FIELD = {
  quiz:     'questions',
  blitz:    'questions',
  music:    'questions',
  truefalse:'statements',
  ordersup: 'orders',
  fill:     'prompts',
  joke:     'prompts',
  hottake:  'prompts',
  draw:     'prompts',
  whod:     'questions',
  lawyers:  'prompts',
  speedbriefs: 'prompts',
  fartdirection: 'pairs',
  modelmodelun: 'questions',
}

// ── Empty item template per field type ───────────────────────────────────────
function blankItem(field) {
  if (field === 'questions') return { q: '', a: '', hint: '' }
  if (field === 'statements') return { statement: '', answer: false, fact: '' }
  if (field === 'orders') return { items: [], correct: [] }
  if (field === 'prompts') return { prompt: '' }
  if (field === 'pairs') return { a: '', b: '' }
  return {}
}

// ── Inline item editor ────────────────────────────────────────────────────────
function ItemEditor({ item, field, onChange, onDelete }) {
  const keys = Object.keys(item)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {keys.map(k => {
          const v = item[k]
          if (typeof v === 'boolean') {
            return (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text2)' }}>
                <input type="checkbox" checked={v} onChange={e => onChange({ ...item, [k]: e.target.checked })} />
                {k}
              </label>
            )
          }
          if (Array.isArray(v)) {
            return (
              <div key={k}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                <textarea
                  value={v.join('\n')}
                  onChange={e => onChange({ ...item, [k]: e.target.value.split('\n') })}
                  rows={3}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            )
          }
          return (
            <div key={k} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text3)', width: 36, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
              <input
                value={v ?? ''}
                onChange={e => onChange({ ...item, [k]: e.target.value })}
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '3px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
          )
        })}
      </div>
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '1rem', padding: '2px 4px', flexShrink: 0, marginTop: 2 }}
        title="Delete"
      >×</button>
    </div>
  )
}

// ── Genre question editor panel ───────────────────────────────────────────────
function GenreEditor({ genre, voices, onBack, onSaved }) {
  const field = CONTENT_FIELD[genre.gameType] || 'questions'
  const [items, setItems] = useState(null)
  const [voiceId, setVoiceId] = useState(voices[genre.id] || '')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // items come from the API-loaded genre data
    const raw = genre[field] || []
    setItems(raw.map(item => ({ ...item })))
  }, [genre.id, field])

  const filtered = items
    ? items.filter((item, i) => {
        if (!search) return true
        const text = Object.values(item).join(' ').toLowerCase()
        return text.includes(search.toLowerCase())
      })
    : null

  function updateItem(index, newItem) {
    setItems(prev => {
      const next = [...prev]
      const realIndex = items.indexOf(filtered[index])
      next[realIndex] = newItem
      return next
    })
  }

  function deleteItem(index) {
    setItems(prev => {
      const next = [...prev]
      const realIndex = items.indexOf(filtered[index])
      next.splice(realIndex, 1)
      return next
    })
  }

  function addItem() {
    setItems(prev => [...prev, blankItem(field)])
    setSearch('')
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genreId: genre.id, field, items, voiceId: voiceId || null }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    } catch (e) {
      alert('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  if (!items) return <div style={{ padding: 24, color: 'var(--text3)' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <span style={{ fontSize: '1.2rem' }}>{genre.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{genre.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{genre.id} · {items.length} {field}</div>
        </div>
        <motion.button
          className={`btn ${saved ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={save}
          disabled={saving}
          whileTap={{ scale: 0.95 }}
        >
          {saving ? '…' : saved ? '✓ Saved' : 'Save'}
        </motion.button>
      </div>

      {/* Voice ID */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>ElevenLabs Voice ID</span>
        <input
          value={voiceId}
          onChange={e => setVoiceId(e.target.value)}
          placeholder="Leave blank to use Buzz's default voice"
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </div>

      {/* Search + add */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 6 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${items.length} ${field}…`}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}
        />
        <button className="btn btn-primary btn-sm" onClick={addItem}>+ Add</button>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(filtered || []).map((item, i) => (
          <ItemEditor key={i} item={item} field={field} onChange={newItem => updateItem(i, newItem)} onDelete={() => deleteItem(i)} />
        ))}
        {filtered?.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 24, fontSize: '0.85rem' }}>
            {search ? 'No matches.' : 'No items yet — click + Add to create one.'}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Questions tab — genre list ────────────────────────────────────────────────
function QuestionsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/questions')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Loading genres…</div>
  if (!data) return <div style={{ padding: 32, color: 'var(--red)' }}>Failed to load — is the dev server running?</div>

  if (selectedGenre) {
    const live = data.genres.find(g => g.id === selectedGenre.id) || selectedGenre
    return (
      <GenreEditor
        genre={live}
        voices={data.voices}
        onBack={() => setSelectedGenre(null)}
        onSaved={load}
      />
    )
  }

  const genres = (data.genres || []).filter(g => {
    if (typeFilter !== 'all' && g.gameType !== typeFilter) return false
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.id.includes(search.toLowerCase())) return false
    return true
  })

  const grouped = GAME_TYPE_ORDER.map(gt => ({
    type: GAME_TYPES[gt],
    genres: genres.filter(g => g.gameType === gt),
  })).filter(g => g.genres.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${data.genres.length} genres…`}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter('all')}>All</button>
          {GAME_TYPE_ORDER.map(gt => {
            const t = GAME_TYPES[gt]
            if (!t) return null
            return (
              <button key={gt} className={`btn btn-sm ${typeFilter === gt ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter(gt)}>
                {t.icon} {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Genre list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {grouped.map(({ type, genres: gs }) => type && (
          <div key={type.id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              {type.icon} {type.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {gs.map(genre => {
                const field = CONTENT_FIELD[genre.gameType] || 'questions'
                const count = (genre[field] || []).length
                const hasVoice = !!data.voices[genre.id]
                return (
                  <motion.button
                    key={genre.id}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', gap: 10, textAlign: 'left' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGenre(genre)}
                  >
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{genre.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{genre.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                        {genre.id} · {count} {field}
                        {hasVoice && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>🎙 custom voice</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Edit →</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Test tab ──────────────────────────────────────────────────────────────────
function TestTab() {
  const store = useStore()
  const { createGame } = useGame()
  const [loading, setLoading] = useState(null)
  const [filter, setFilter] = useState('all')

  const grouped = GAME_TYPE_ORDER.map(gt => ({
    type: GAME_TYPES[gt],
    genres: ALL_GENRES.filter(g => g.gameType === gt),
  })).filter(g => g.genres.length > 0)

  const filtered = filter === 'all' ? grouped : grouped.filter(g => g.type?.id === filter)

  async function testGenre(genre) {
    setLoading(genre.id)
    try {
      const hostName = store.myName || 'Dev Host'
      const { code } = await createGame(hostName, {
        questionsPerRound: 5,
        totalRounds: 1,
        questionMaster: false,
        timers: { quizQuestion: 60, quizAnswer: 25, genreVote: 30 },
      })
      await update(ref(db, `games/${code}`), {
        currentGenre: { id: genre.id, name: genre.name, emoji: genre.emoji, gameType: genre.gameType, color: genre.color },
        devTestGenre: genre.id,
      })
      store.setScreen('lobby')
      store.setToast({ message: `🧪 Test lobby created! Code: ${code}`, icon: '✅', duration: 5000 })
    } catch (err) {
      store.setToast({ message: `Error: ${err.message}`, icon: '⚠️' })
    }
    setLoading(null)
  }

  return (
    <div style={{ padding: '12px 16px', overflow: 'auto', flex: 1 }}>
      <div className="card" style={{ background: 'rgba(230,57,70,0.06)', borderColor: 'rgba(230,57,70,0.2)', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--red)' }}>⚠️ Dev Mode</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
          Click a genre → creates a test lobby in <strong>lobby state</strong> with the genre pre-selected.
          Share the 4-letter code so other devices can join, then hit <strong>Start Game</strong>.
        </div>
      </div>

      <div className="row gap-6" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
        <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>All</button>
        {GAME_TYPE_ORDER.map(gt => {
          const t = GAME_TYPES[gt]
          if (!t) return null
          return (
            <button key={gt} className={`btn btn-sm ${filter === gt ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(gt)}>
              {t.icon} {t.label}
            </button>
          )
        })}
      </div>

      {filtered.map(({ type, genres }) => type && (
        <div key={type.id} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            {type.icon} {type.label}
            <span style={{ color: 'var(--text2)', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>— {type.desc}</span>
          </div>
          <div className="col gap-6">
            {genres.map(genre => (
              <motion.button
                key={genre.id}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', gap: 12, textAlign: 'left', borderColor: loading === genre.id ? genre.color : 'var(--border)', position: 'relative', overflow: 'hidden' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => testGenre(genre)}
                disabled={!!loading}
              >
                {loading === genre.id && (
                  <motion.div style={{ position: 'absolute', inset: 0, background: `${genre.color}22` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                )}
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{genre.emoji}</span>
                <div className="flex-1">
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{genre.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {genre.id} · {genre.questions?.length || genre.prompts?.length || genre.pairs?.length || genre.orders?.length || genre.statements?.length || 0} items
                  </div>
                </div>
                {loading === genre.id ? (
                  <div className="loading-dots"><span /><span /><span /></div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: genre.color }}>▶ Test</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function DevAdminScreen() {
  const store = useStore()
  const [tab, setTab] = useState('test')

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => store.setScreen('home')}>← Home</button>
        <div className="topbar-logo" style={{ color: 'var(--red)' }}>🧪 Dev Admin</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>localhost only</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {[['test', '🧪 Test Genres'], ['questions', '❓ Questions']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: tab === id ? 700 : 400,
              color: tab === id ? 'var(--accent)' : 'var(--text2)',
              borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'test' && <TestTab />}
        {tab === 'questions' && <QuestionsTab />}
      </div>
    </div>
  )
}
