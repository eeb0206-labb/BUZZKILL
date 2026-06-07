import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, TimerRing, Toast, MuteButton } from '../components/ui'
import { getGenreById, GAME_TYPES } from '../data/genres'

export default function RoundPickScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const isGameScreen = store.isGameScreen()
  const setScreen = store.setScreen
  const { subscribeToGame, dealGenres, voteForGenre, selectGenre } = useGame()

  const [genres, setGenres] = useState([])
  const [myVote, setMyVote] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [winner, setWinner] = useState(null)
  const [dealing, setDealing] = useState(false)
  const [allVotedCountdown, setAllVotedCountdown] = useState(null) // 5..0
  const allVotedTimerRef = useRef(null)
  const lockingRef = useRef(false)

  const settings = store.getSettings()
  const totalTime = settings.timers?.genreVote || 200
  const allPlayers = Object.values(game?.players || {})
  const players = allPlayers // keep for rendering
  // Voters = anyone who isn't a passive gamescreen
  const voters = allPlayers.filter(p => p.role !== 'gamescreen')
  const voterCount = voters.length || 1
  const votes = game?.roundVotes || {}
  // legacy: used for vote-bar percentage
  const playerCount = voterCount

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      // Navigate away if state changes
      if (g.state === 'powerup-select') setScreen('powerup-select')
      if (g.state === 'quiz') setScreen('quiz-host')
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'final') setScreen('final')

      // Load genres from game
      if (g.dealGenres) {
        const gs = g.dealGenres.map(id => getGenreById(id)).filter(Boolean)
        setGenres(gs)
      }
    })
    return unsub
  }, [gameCode])

  // Deal genres (controller only, on mount)
  useEffect(() => {
    if (!isController || !game || game.dealGenres) return
    setDealing(true)
    dealGenres(gameCode, game).then(() => setDealing(false))
  }, [isController, game?.dealGenres])

  // Load genres from existing game state
  useEffect(() => {
    if (game?.dealGenres) {
      const gs = game.dealGenres.map(id => getGenreById(id)).filter(Boolean)
      setGenres(gs)
    }
  }, [game?.dealGenres])

  // Timer countdown
  useEffect(() => {
    if (!genres.length || !totalTime) return
    setTimeLeft(totalTime)
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          if (isController) autoLock()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [genres.length, totalTime, isController])

  // Auto-countdown when all voters have voted (controller only — one device triggers it)
  useEffect(() => {
    if (!isController || winner || lockingRef.current || !genres.length) return
    const votesCast = Object.keys(votes).length
    if (votesCast >= voterCount && voterCount > 0) {
      // All voted — start 5s countdown
      if (allVotedTimerRef.current) return // already running
      let t = 5
      setAllVotedCountdown(t)
      allVotedTimerRef.current = setInterval(() => {
        t -= 1
        setAllVotedCountdown(t)
        if (t <= 0) {
          clearInterval(allVotedTimerRef.current)
          allVotedTimerRef.current = null
          if (!lockingRef.current) {
            lockingRef.current = true
            autoLock()
          }
        }
      }, 1000)
    } else {
      // Votes rescinded / not all in yet — cancel countdown
      if (allVotedTimerRef.current) {
        clearInterval(allVotedTimerRef.current)
        allVotedTimerRef.current = null
      }
      setAllVotedCountdown(null)
    }
    return () => {
      if (allVotedTimerRef.current) {
        clearInterval(allVotedTimerRef.current)
        allVotedTimerRef.current = null
      }
    }
  }, [Object.keys(votes).length, voterCount, isController, winner, genres.length])

  // Vote counts per genre
  function voteCountFor(genreId) {
    return Object.values(votes).filter(v => v === genreId).length
  }

  function getLeadingGenre() {
    if (!genres.length) return null
    return genres.reduce((best, g) => {
      const count = voteCountFor(g.id)
      return count > voteCountFor(best?.id || '') ? g : best
    }, genres[0])
  }

  async function autoLock() {
    const leading = getLeadingGenre()
    if (leading) await lockInGenre(leading)
  }

  async function handleVote(genre) {
    if (!myId || isGameScreen) return
    setMyVote(genre.id)
    await voteForGenre(gameCode, myId, genre.id)
  }

  async function lockInGenre(genre) {
    if (lockingRef.current) return
    lockingRef.current = true
    // Cancel any running all-voted countdown
    if (allVotedTimerRef.current) {
      clearInterval(allVotedTimerRef.current)
      allVotedTimerRef.current = null
    }
    setAllVotedCountdown(null)
    setWinner(genre)
    await new Promise(r => setTimeout(r, 1000))
    await selectGenre(gameCode, genre.id, genre.name, genre.emoji, genre.gameType, genre.color)
  }

  const currentRound = game?.currentRound || 1
  const totalRounds = settings.totalRounds || 5

  return (
    <div className="screen">
      <div className="topbar">
        <div className="row gap-8">
          <div className="round-badge">
            Round {currentRound}/{totalRounds}
          </div>
        </div>
        <div className="topbar-logo">Pick a Round</div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Timer + vote count */}
        <motion.div
          className="row"
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
            {Object.keys(votes).length}/{voterCount} voted
          </div>
          {totalTime > 0 && (
            <TimerRing seconds={timeLeft} total={totalTime} size={60} />
          )}
        </motion.div>

        {/* All-voted countdown banner */}
        <AnimatePresence>
          {allVotedCountdown !== null && allVotedCountdown > 0 && !winner && (
            <motion.div
              className="card center"
              style={{ background: 'rgba(192,132,252,0.1)', borderColor: 'var(--accent)', gap: 4 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>All votes in! Starting in…</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--accent)', fontWeight: 700 }}>
                {allVotedCountdown}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {(dealing || !genres.length) && (
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
              const votePercent = playerCount > 0 ? (voteCount / playerCount) * 100 : 0

              // Who voted for this
              const voters = players.filter(p => votes[p.id] === genre.id)

              return (
                <motion.div
                  key={genre.id}
                  className={`genre-card ${isMyVote ? 'voted' : ''} ${isWinner ? 'winner' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => !isGameScreen && handleVote(genre)}
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
                  {voters.length > 0 && (
                    <div className="row gap-4" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                      {voters.map(p => (
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

        {/* Controller actions — Start Round immediately */}
        {isController && genres.length > 0 && !winner && (
          <motion.div
            className="col gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="divider">or start now</div>
            <div className="row gap-8">
              {genres.map(g => (
                <button
                  key={g.id}
                  className="btn btn-ghost flex-1"
                  style={{ border: `1px solid ${g.color}44`, color: g.color, fontSize: '0.8rem', padding: '10px 8px' }}
                  onClick={() => lockInGenre(g)}
                >
                  {g.emoji} Start {g.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Winner announcement */}
        <AnimatePresence>
          {winner && (
            <motion.div
              className="card col center gap-8"
              style={{ background: `${winner.color}11`, borderColor: winner.color, marginTop: 8 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div style={{ fontSize: '3rem' }}>{winner.emoji}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem' }}>{winner.name} wins!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>Starting round...</div>
              <div className="loading-dots"><span /><span /><span /></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voter hint for players */}
        {!isController && !isGameScreen && !myVote && genres.length > 0 && (
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
