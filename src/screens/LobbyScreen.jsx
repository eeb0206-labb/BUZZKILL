import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, QRCode, PlayerList, Modal, Toast, MuteButton, showToast } from '../components/ui'
import { INSIDE_JOKE_CATEGORIES } from '../data/genres'

export default function LobbyScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isHost = store.isHost()
  const isController = store.isController()
  const setScreen = store.setScreen
  const { subscribeToGame, startGame, assignScreenRole, submitInsideJoke, updateGame } = useGame()

  const [tab, setTab] = useState('players')
  const [jokeModal, setJokeModal] = useState(false)
  const [jokeForm, setJokeForm] = useState({ label: '', category: 'incident', context: '' })
  const [screenModal, setScreenModal] = useState(null) // player to assign screen
  const [copied, setCopied] = useState(false)

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?code=${gameCode}`
    : ''

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-pick') setScreen('round-pick')
    })
    return unsub
  }, [gameCode, subscribeToGame, setScreen])

  const players = Object.values(game?.players || {})
  const insideJokes = game?.insideJokes ? Object.values(game.insideJokes) : []

  function copyCode() {
    navigator.clipboard?.writeText(gameCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStartGame() {
    if (players.filter(p => p.role === 'player').length === 0) {
      store.setToast({ message: 'Need at least one player to start!', icon: '⚠️' })
      return
    }
    await startGame(gameCode)
  }

  async function submitJoke() {
    if (!jokeForm.label.trim()) {
      store.setToast({ message: 'Add a label for the joke', icon: '⚠️' })
      return
    }
    await submitInsideJoke(gameCode, {
      label: jokeForm.label.trim(),
      category: jokeForm.category,
      context: jokeForm.context.trim(),
      submittedBy: myId,
    })
    setJokeForm({ label: '', category: 'incident', context: '' })
    setJokeModal(false)
    store.setToast({ message: 'Inside joke added! 🤫', icon: '✓' })
  }

  async function handleAssignScreen(player, role) {
    await assignScreenRole(gameCode, player.id, role)
    setScreenModal(null)
    store.setToast({ message: `${player.name} assigned as ${role}`, icon: '📺' })
  }

  const TABS = [
    { id: 'players', label: `👥 Players (${players.length})` },
    { id: 'share', label: '🔗 Share' },
    { id: 'jokes', label: `🤫 Jokes (${insideJokes.length})` },
    ...(isController ? [{ id: 'screens', label: '📺 Screens' }] : []),
  ]

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => { store.setScreen('home'); store.setGame(null) }}>✕ Leave</button>
        <div className="topbar-logo">Lobby</div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Game code + status */}
        <motion.div
          className="card col center gap-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface2))' }}
        >
          <div className="caption">Game Code</div>
          <div className="game-code" onClick={copyCode} style={{ cursor: 'pointer' }}>
            {gameCode}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
            {copied ? '✓ Copied!' : 'Tap to copy'} · {players.length} player{players.length !== 1 ? 's' : ''} connected
          </div>
          {!isController && (
            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', textAlign: 'center' }}>
              Waiting for host to start...
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="tabs" style={{ overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}
              style={{ whiteSpace: 'nowrap', flex: 'none', padding: '8px 14px' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Players tab */}
        {tab === 'players' && (
          <motion.div className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PlayerList
              players={game?.players || {}}
              myId={myId}
              showScore={false}
              onAction={isController ? (p => setScreenModal(p)) : null}
              actionLabel={isController ? '📺' : null}
            />
            {players.length === 0 && (
              <div className="card center" style={{ padding: 32, color: 'var(--text3)' }}>
                Share the code to invite players!
              </div>
            )}
          </motion.div>
        )}

        {/* Share tab */}
        {tab === 'share' && (
          <motion.div className="col center gap-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card col center gap-12">
              <p style={{ fontSize: '0.85rem', color: 'var(--text2)', textAlign: 'center' }}>
                Scan to join or share the link
              </p>
              <QRCode value={joinUrl} size={180} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)', wordBreak: 'break-all', textAlign: 'center' }}>
                {joinUrl}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={copyCode}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
            <div className="card col gap-8" style={{ width: '100%' }}>
              <div style={{ fontWeight: 700 }}>Game Settings</div>
              <div className="col gap-4">
                {[
                  ['Mode', game?.settings?.questionMaster ? 'Question Master' : 'Auto-judge'],
                  ['Rounds', `${game?.settings?.totalRounds || 5} rounds × ${game?.settings?.questionsPerRound || 8} questions`],
                  ['Genres', game?.settings?.threeRandomGenres ? '3 random per round' : 'Full selection'],
                  ['Answer Mode', { 'host-judges': 'Host judges', 'multiple-choice': 'Multiple choice', 'typed': 'Type answer' }[game?.settings?.answerMode || 'host-judges']],
                ].map(([k, v]) => (
                  <div key={k} className="row">
                    <span className="muted flex-1" style={{ fontSize: '0.85rem' }}>{k}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Inside Jokes tab */}
        {tab === 'jokes' && (
          <motion.div className="col gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card" style={{ background: 'rgba(244,208,63,0.05)', borderColor: 'rgba(244,208,63,0.2)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                Add inside jokes to make questions personal. They'll be woven into AI-generated rounds.
              </div>
            </div>

            {insideJokes.map((joke, i) => (
              <motion.div key={i} className="player-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div style={{ fontSize: '1.2rem' }}>
                  {INSIDE_JOKE_CATEGORIES.find(c => c.id === joke.category)?.icon || '💬'}
                </div>
                <div className="flex-1">
                  <div style={{ fontWeight: 600 }}>{joke.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
                    {INSIDE_JOKE_CATEGORIES.find(c => c.id === joke.category)?.label}
                    {joke.context ? ` · "${joke.context.slice(0, 40)}${joke.context.length > 40 ? '...' : ''}"` : ''}
                  </div>
                </div>
              </motion.div>
            ))}

            <button className="btn btn-gold btn-block" onClick={() => setJokeModal(true)}>
              + Add Inside Joke
            </button>
          </motion.div>
        )}

        {/* Screens tab */}
        {tab === 'screens' && isController && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card" style={{ background: 'rgba(192,132,252,0.05)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                Assign screen roles. The <strong>TV/Game Screen</strong> shows questions for everyone to read.
                The <strong>Control Screen</strong> has host powers to advance questions.
              </div>
            </div>
            {players.map(p => (
              <div key={p.id} className="player-row" style={{ borderColor: p.id === myId ? 'var(--accent)' : 'var(--border)' }}>
                <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={40} />
                <div className="flex-1">
                  <div style={{ fontWeight: 600 }}>{p.name} {p.id === myId ? '(You)' : ''}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
                    {p.role} ·
                    {game?.screens?.tv === p.id ? ' 📺 TV Screen' : ''}
                    {game?.screens?.control === p.id ? ' 🎛️ Control' : ''}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setScreenModal(p)}>Assign</button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Start game */}
        {isController && (
          <motion.button
            className="btn btn-green btn-lg btn-block"
            whileTap={{ scale: 0.97 }}
            onClick={handleStartGame}
            style={{ marginTop: 8 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            🚀 Start Game
          </motion.button>
        )}
      </div>

      {/* Inside Joke Modal */}
      <Modal show={jokeModal} onClose={() => setJokeModal(false)} title="🤫 Add Inside Joke">
        <div className="col gap-12">
          <div>
            <label className="input-label">What is it? (name, place, incident...)</label>
            <input className="input" placeholder='e.g. "The Tesco incident"' value={jokeForm.label}
              onChange={e => setJokeForm(f => ({ ...f, label: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="input-label">Category</label>
            <div className="col gap-6">
              {INSIDE_JOKE_CATEGORIES.map(c => (
                <div key={c.id} className="row gap-8" style={{ cursor: 'pointer' }} onClick={() => setJokeForm(f => ({ ...f, category: c.id }))}>
                  <span>{c.icon}</span>
                  <span className="flex-1" style={{ fontSize: '0.9rem' }}>{c.label}</span>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border2)', background: jokeForm.category === c.id ? 'var(--accent)' : 'transparent' }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">Context (optional — adds a right/wrong answer)</label>
            <textarea className="input textarea" placeholder='e.g. "Ethan tried to ride the trolley down the aisle"'
              value={jokeForm.context} onChange={e => setJokeForm(f => ({ ...f, context: e.target.value }))} />
          </div>
          <div className="row gap-8">
            <button className="btn btn-ghost flex-1" onClick={() => setJokeModal(false)}>Cancel</button>
            <button className="btn btn-gold flex-1" onClick={submitJoke}>Add ✓</button>
          </div>
        </div>
      </Modal>

      {/* Screen assign modal */}
      {screenModal && (
        <Modal show={true} onClose={() => setScreenModal(null)} title={`Assign ${screenModal.name}`}>
          <div className="col gap-8">
            {[
              { role: null, label: '🎮 Player', desc: 'Normal game participant' },
              { role: 'tv', label: '📺 TV/Game Screen', desc: 'Display screen for everyone to read' },
              { role: 'control', label: '🎛️ Control Screen', desc: 'Has host controls (next question etc)' },
            ].map(({ role: r, label, desc }) => (
              <div key={label} className="player-row" style={{ cursor: 'pointer' }}
                onClick={() => handleAssignScreen(screenModal, r)}>
                <div className="flex-1">
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <Toast />
    </div>
  )
}
