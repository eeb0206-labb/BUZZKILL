/**
 * DevAdminScreen — only accessible on localhost/dev.
 *
 * Click a genre → creates a test lobby pre-loaded with that genre.
 * Shows game code prominently so other devices can join via the normal join flow.
 * Host can start the round once testers have joined.
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { ALL_GENRES, GAME_TYPES } from '../data/genres'
import { db, ref, update } from '../firebase'

const GAME_TYPE_ORDER = ['quiz','draw','music','joke','hottake','whod','blitz','fill']

export default function DevAdminScreen() {
  const store = useStore()
  const { createGame } = useGame()
  const [loading, setLoading] = useState(null)
  const [filter, setFilter] = useState('all')
  const [createdCode, setCreatedCode] = useState(null)
  const [selectedGenre, setSelectedGenre] = useState(null)

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
        questionsPerRound: 3,
        totalRounds: 1,
        questionMaster: false,
        timers: { quizQuestion: 60, quizAnswer: 25, genreVote: 30 },
      })
      // Pre-set genre so genre vote is skipped, but stay in lobby so others can join
      await update(ref(db, `games/${code}`), {
        currentGenre: { id: genre.id, name: genre.name, emoji: genre.emoji, gameType: genre.gameType, color: genre.color },
        devTestGenre: genre.id, // flag so lobby knows to skip genre vote
      })
      setCreatedCode(code)
      setSelectedGenre(genre)
      store.setScreen('lobby')
      store.setToast({ message: `🧪 Test lobby created! Code: ${code}`, icon: '✅', duration: 5000 })
    } catch (err) {
      store.setToast({ message: `Error: ${err.message}`, icon: '⚠️' })
      console.error(err)
    }
    setLoading(null)
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => store.setScreen('home')}>← Home</button>
        <div className="topbar-logo" style={{ color: 'var(--red)' }}>🧪 Dev Admin</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>localhost only</div>
      </div>

      <div className="screen-inner">
        <div className="card" style={{ background: 'rgba(230,57,70,0.06)', borderColor: 'rgba(230,57,70,0.2)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--red)' }}>⚠️ Dev Mode</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
            Click a genre → creates a test lobby in <strong>lobby state</strong> with the genre pre-selected.
            Share the 4-letter code so other devices can join normally via "Join Game".
            Then hit <strong>Start Game</strong> in the lobby to begin.
          </div>
        </div>

        {/* Game type filter */}
        <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
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

        {/* Genre list */}
        {filtered.map(({ type, genres }) => type && (
          <div key={type.id}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              {type.icon} {type.label}
              <span style={{ color: 'var(--text2)', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>
                — {type.desc}
              </span>
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
                      {genre.id} · {genre.questions?.length || genre.prompts?.length || genre.pairs?.length || 0} items
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
    </div>
  )
}
