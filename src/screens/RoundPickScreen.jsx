import React, { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, TimerRing, Toast, MuteButton } from '../components/ui'
import { getGenreById, GAME_TYPES } from '../data/genres'
import BuzzHost from '../components/BuzzHost'
import { getBuzzQuip } from '../data/hostQuips'
import { useShouldBuzzSpeak } from '../hooks/useBuzzSpeech'

export default function RoundPickScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const isGameScreen = store.isGameScreen()
  const setScreen = store.setScreen
  const { subscribeToGame, dealGenres, voteForGenre, selectGenre, updateGame } = useGame()

  const [genres, setGenres] = useState([])
  const [myVote, setMyVote] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [winner, setWinner] = useState(null)
  const [dealing, setDealing] = useState(false)
  // displayCountdown: derived by ALL clients from game.allVotedAt (Firebase timestamp)
  const [displayCountdown, setDisplayCountdown] = useState(null)

  // Refs — don't cause re-renders, survive effect cleanups
  const allVotedTimerRef = useRef(null)   // setTimeout for controller to fire lockInGenre
  const displayTimerRef = useRef(null)    // setInterval for countdown display on all clients
  const lockingRef = useRef(false)        // only set inside lockInGenre — nowhere else
  const mainTimerRef = useRef(null)

  const settings = store.getSettings()
  const totalTime = settings.timers?.genreVote || 200
  const aiHost = settings.aiHost ?? true
  const allPlayers = Object.values(game?.players || {})

  const shouldSpeak = useShouldBuzzSpeak(game)

  const buzzGenreQuip = useMemo(() => {
    if (!aiHost || !winner) return null
    return getBuzzQuip('genreReveal', {
      gameCode,
      genreId: winner.id,
      genreName: winner.name,
      round: game?.currentRound,
    })
  }, [aiHost, winner?.id, gameCode])
  const voters = allPlayers.filter(p => p.role !== 'gamescreen')
  const voterCount = voters.length || 1
  const votes = game?.roundVotes || {}

  // ── Firebase subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'powerup-select') setScreen('powerup-select')
      if (g.state === 'quiz') setScreen('quiz-host')
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'final') setScreen('final')
      if (g.dealGenres) {
        const gs = g.dealGenres.map(id => getGenreById(id)).filter(Boolean)
        setGenres(gs)
      }
    })
    return unsub
  }, [gameCode])

  // ── Deal genres on mount (controller only) ───────────────────────────────────
  useEffect(() => {
    if (!isController || !game) return
    // Playlist mode: pick the pre-configured genre for this round
    const playlist = game.settings?.playlist || []
    if (playlist.length > 0 && !game.dealGenres) {
      const roundIdx = (game.currentRound || 1) - 1
      const playlistGenre = getGenreById(playlist[roundIdx] || playlist[0])
      if (playlistGenre) {
        // Brief delay so all players see the "Up next" screen before locking in
        setDealing(true)
        setTimeout(() => lockInGenre(playlistGenre), 2800)
        return
      }
    }
    // Dev mode: if a specific genre was pre-selected, lock it in immediately
    if (game.devTestGenre && !game.dealGenres) {
      const preGenre = getGenreById(game.devTestGenre)
      if (preGenre) {
        lockInGenre(preGenre)
        return
      }
    }
    if (game.dealGenres) return
    setDealing(true)
    dealGenres(gameCode, game).then(() => setDealing(false))
  }, [isController, game?.dealGenres, game?.devTestGenre, game?.settings?.playlist, game?.currentRound])

  // ── Load genres from existing game state ─────────────────────────────────────
  useEffect(() => {
    if (game?.dealGenres) {
      const gs = game.dealGenres.map(id => getGenreById(id)).filter(Boolean)
      setGenres(gs)
    }
  }, [game?.dealGenres])

  // ── Main countdown timer — synced from Firebase dealGenresAt timestamp ───────
  // Each device derives timeLeft from the same origin, so they stay in sync.
  useEffect(() => {
    if (!genres.length || !totalTime) return
    if (mainTimerRef.current) clearInterval(mainTimerRef.current)

    const tick = () => {
      const origin = game?.dealGenresAt || Date.now()
      const elapsed = Math.floor((Date.now() - origin) / 1000)
      const remaining = Math.max(0, totalTime - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(mainTimerRef.current)
        mainTimerRef.current = null
        // Only controller auto-locks when the main timer expires
        if (isController && !lockingRef.current) lockInGenre(pickWinner())
      }
    }

    tick() // immediate first tick
    mainTimerRef.current = setInterval(tick, 1000)
    return () => { clearInterval(mainTimerRef.current); mainTimerRef.current = null }
  }, [genres.length, totalTime, isController, game?.dealGenresAt])

  // ── All-voted: controller writes allVotedAt timestamp to Firebase ────────────
  // Other clients derive their own countdown display from that timestamp.
  // Using setTimeout (not interval) — fires once to call lockInGenre.
  useEffect(() => {
    if (!isController || winner || !genres.length) return
    const votesCast = Object.keys(votes).length

    if (votesCast >= voterCount && voterCount > 0) {
      // Already counting down or locking — don't double-start
      if (allVotedTimerRef.current || lockingRef.current || game?.allVotedAt) return
      // Write timestamp to Firebase so ALL clients can see and compute the countdown
      updateGame(gameCode, { allVotedAt: Date.now() })
      allVotedTimerRef.current = setTimeout(() => {
        allVotedTimerRef.current = null
        lockInGenre(pickWinner())
      }, 5000)
    } else {
      // Votes dropped below threshold — cancel
      if (allVotedTimerRef.current) {
        clearTimeout(allVotedTimerRef.current)
        allVotedTimerRef.current = null
      }
      if (game?.allVotedAt) {
        updateGame(gameCode, { allVotedAt: null })
      }
    }
    // ← intentionally no cleanup return here (avoids cancelling mid-countdown on re-render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(votes).length, voterCount, isController, winner, genres.length, game?.allVotedAt])

  // ── All clients: derive displayCountdown from game.allVotedAt ────────────────
  useEffect(() => {
    clearInterval(displayTimerRef.current)
    if (!game?.allVotedAt) {
      setDisplayCountdown(null)
      return
    }
    const tick = () => {
      const remaining = Math.max(0, 5 - Math.floor((Date.now() - game.allVotedAt) / 1000))
      setDisplayCountdown(remaining)
    }
    tick()
    displayTimerRef.current = setInterval(tick, 250)
    return () => clearInterval(displayTimerRef.current)
  }, [game?.allVotedAt])

  // ── Unmount cleanup ───────────────────────────────────────────────────────────
  useEffect(() => () => {
    clearTimeout(allVotedTimerRef.current)
    clearInterval(displayTimerRef.current)
  }, [])

  // ── Vote helpers ─────────────────────────────────────────────────────────────
  function voteCountFor(genreId) {
    return Object.values(votes).filter(v => v === genreId).length
  }

  // Returns the genre with the most votes; randomly breaks ties (coin toss)
  function pickWinner() {
    if (!genres.length) return null
    const counts = genres.map(g => ({ g, n: voteCountFor(g.id) }))
    const maxVotes = Math.max(...counts.map(c => c.n))
    const tied = counts.filter(c => c.n === maxVotes).map(c => c.g)
    return tied[Math.floor(Math.random() * tied.length)]
  }

  async function handleVote(genre) {
    if (!myId || isGameScreen) return
    setMyVote(genre.id)
    await voteForGenre(gameCode, myId, genre.id)
  }

  // ── Lock in a genre and start the round ─────────────────────────────────────
  async function lockInGenre(genre) {
    if (!genre || lockingRef.current) return
    lockingRef.current = true

    // Cancel any running countdowns
    if (allVotedTimerRef.current) {
      clearTimeout(allVotedTimerRef.current)
      allVotedTimerRef.current = null
    }
    // Clear the Firebase timestamp so other clients stop showing the banner
    if (game?.allVotedAt) updateGame(gameCode, { allVotedAt: null })
    setWinner(genre)

    await new Promise(r => setTimeout(r, 1200))
    await selectGenre(gameCode, game, genre.id, genre.name, genre.emoji, genre.gameType, genre.color)
  }

  const currentRound = game?.currentRound || 1
  const totalRounds = settings.totalRounds || 5

  return (
    <div className="screen">
      <div className="topbar">
        <div className="row gap-8">
          <div className="round-badge">Round {currentRound}/{totalRounds}</div>
        </div>
        <div className="topbar-logo">Pick a Round</div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Vote count + timer — timer only shown for non-controller (controller sees countdown banner) */}
        <motion.div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
            {Object.keys(votes).length}/{voterCount} voted
          </div>
          {totalTime > 0 && timeLeft > 0 && !winner && (
            <TimerRing seconds={timeLeft} total={totalTime} size={60} />
          )}
        </motion.div>

        {/* All-voted banner — visible on ALL screens, countdown synced via Firebase allVotedAt */}
        <AnimatePresence>
          {!winner && game?.allVotedAt && (
            <motion.div
              className="card center"
              style={{ background: 'rgba(192,132,252,0.1)', borderColor: 'var(--accent)', gap: 4 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>All votes in! Starting in…</div>
              {displayCountdown !== null ? (
                <motion.div
                  key={displayCountdown}
                  initial={{ scale: 1.3, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--accent)', fontWeight: 700 }}
                >
                  {displayCountdown}
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--accent)', fontWeight: 700 }}
                >
                  ●●●
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist "Up next" state */}
        {dealing && (settings.playlist || []).length > 0 && (() => {
          const roundIdx = (game?.currentRound || 1) - 1
          const nextGenre = getGenreById((settings.playlist || [])[roundIdx] || (settings.playlist || [])[0])
          if (!nextGenre) return null
          return (
            <motion.div className="col center" style={{ padding: 40, gap: 16 }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Round {game?.currentRound || 1} of {(settings.playlist || []).length}
              </div>
              <div style={{ fontSize: '4rem' }}>{nextGenre.emoji}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', textAlign: 'center' }}>{nextGenre.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>Get ready…</div>
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: nextGenre.color || 'var(--accent)', fontWeight: 700 }}
              >●●●</motion.div>
            </motion.div>
          )
        })()}

        {/* Standard loading state (random mode) */}
        {dealing && !(settings.playlist || []).length && (
          <div className="col center" style={{ padding: 40 }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <p className="muted" style={{ marginTop: 12 }}>Shuffling genres...</p>
          </div>
        )}

        {/* Genre cards */}
        {genres.length > 0 && (
          <div className="col gap-12">
            {genres.map((genre, i) => {
              const voteCount = voteCountFor(genre.id)
              const isMyVote = myVote === genre.id
              const isWinner = winner?.id === genre.id
              const votePercent = voterCount > 0 ? (voteCount / voterCount) * 100 : 0
              const votersForGenre = allPlayers.filter(p => votes[p.id] === genre.id)

              return (
                <motion.div
                  key={genre.id}
                  className={`genre-card ${isMyVote ? 'voted' : ''} ${isWinner ? 'winner' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => !isGameScreen && !winner && handleVote(genre)}
                  style={{ borderColor: isWinner ? 'var(--gold)' : isMyVote ? 'var(--accent)' : undefined }}
                >
                  <div className="row gap-12">
                    <div style={{ fontSize: '2.8rem' }}>{genre.emoji}</div>
                    <div className="flex-1 text-left">
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem' }}>{genre.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 2 }}>
                        {GAME_TYPES[genre.gameType]?.desc || genre.gameType}
                      </div>
                      <div className="genre-type-badge" style={{ background: genre.color + '22', color: genre.color }}>
                        {GAME_TYPES[genre.gameType]?.icon} {GAME_TYPES[genre.gameType]?.label}
                      </div>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: isMyVote ? 'var(--accent)' : 'var(--text2)' }}>
                        {voteCount}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>vote{voteCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Vote bar */}
                  <div className="vote-bar">
                    <motion.div
                      className="vote-bar-fill"
                      style={{ background: genre.color }}
                      animate={{ width: `${votePercent}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  {/* Voter avatars */}
                  {votersForGenre.length > 0 && (
                    <div className="row gap-4" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                      {votersForGenre.map(p => (
                        <Avatar key={p.id} src={p.avatar} name={p.name} colorHex={p.colorHex} size={24} />
                      ))}
                    </div>
                  )}

                  {/* Winner crown */}
                  {isWinner && (
                    <motion.div
                      style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '2rem' }}
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      👑
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Winner announcement */}
        <AnimatePresence>
          {winner && (
            <motion.div
              className="col gap-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Buzz genre intro quip */}
              {aiHost && buzzGenreQuip && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <BuzzHost quip={buzzGenreQuip} featured visible event="genreReveal" genreId={winner?.id} speakOnChange={shouldSpeak} />
                </motion.div>
              )}

              <motion.div
                className="card col center gap-8"
                style={{ background: `${winner.color}11`, borderColor: winner.color }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: aiHost ? 0.3 : 0 }}
              >
                <div style={{ fontSize: '3rem' }}>{winner.emoji}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem' }}>{winner.name} wins!</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>Starting round...</div>
                <div className="loading-dots"><span /><span /><span /></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint for players */}
        {!isController && !isGameScreen && !myVote && genres.length > 0 && !winner && (
          <motion.div
            className="card center"
            style={{ background: 'rgba(192,132,252,0.05)', color: 'var(--accent)', fontSize: '0.9rem' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            👆 Tap a genre to vote!
          </motion.div>
        )}
      </div>
      <Toast />
    </div>
  )
}
