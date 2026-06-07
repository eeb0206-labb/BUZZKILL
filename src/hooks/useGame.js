import { useCallback } from 'react'
import { db, ref, set, get, update, onValue, push, remove } from '../firebase'
import { useStore } from '../store'
import { PLAYER_COLORS, getRandomGenres } from '../data/genres'
import { DEFAULT_SETTINGS } from '../store'

// ── code generation ────────────────────────────────────────────────────────────
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generatePlayerId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ── initial powerups from settings ────────────────────────────────────────────
function buildInitialPowerups(settings) {
  const c = settings?.powerupCounts || DEFAULT_SETTINGS.powerupCounts
  return {
    sneakPeek: c.sneakPeek ?? 2,
    steal: c.steal ?? 1,
    imposter: c.imposter ?? 2,
    plagiarism: c.plagiarism ?? 1,
    block: c.block ?? 1,
    doublePoints: c.doublePoints ?? 1,
  }
}

// ── color assignment ───────────────────────────────────────────────────────────
function assignColor(players = {}) {
  const used = Object.values(players).map(p => p.colorId).filter(Boolean)
  const available = PLAYER_COLORS.filter(c => !used.includes(c.id))
  if (available.length > 0) return available[0]
  return PLAYER_COLORS[Object.keys(players).length % PLAYER_COLORS.length]
}

// ── main hook ──────────────────────────────────────────────────────────────────
export function useGame() {
  const store = useStore()

  // Create a new game
  const createGame = useCallback(async (hostName, settings = {}) => {
    let code = generateCode()
    // Ensure unique code
    for (let i = 0; i < 5; i++) {
      const snap = await get(ref(db, `games/${code}`))
      if (!snap.exists()) break
      code = generateCode()
    }

    const hostId = generatePlayerId()
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }
    const color = PLAYER_COLORS[0]

    const gameData = {
      code,
      hostId,
      createdAt: Date.now(),
      state: 'lobby',
      currentRound: 0,
      currentQIndex: 0,
      usedGenres: [],
      currentGenre: null,
      currentQ: null,
      questionRevealed: false,
      answerRevealed: false,
      buzzer: null,
      wrongAnswerers: [],
      submissions: {},
      votes: {},
      votePhase: null,
      roundScores: {},
      roundVotes: {},
      dealGenres: null,
      blocked: {},
      plagiarismTargets: {},
      powerupRound: {},
      insideJokes: [],
      settings: mergedSettings,
      screens: { tv: null, control: null },
      players: {
        [hostId]: {
          id: hostId,
          name: hostName,
          avatar: null,
          colorId: color.id,
          colorHex: color.hex,
          role: 'host',
          score: 0,
          roundScore: 0,
          powerups: buildInitialPowerups(mergedSettings),
          secondLifeUsed: false,
          isOnline: true,
          joinedAt: Date.now(),
        },
      },
    }

    await set(ref(db, `games/${code}`), gameData)

    store.setMyId(hostId)
    store.setMyName(hostName)
    store.setMyRole('host')
    store.setMyColor(color.hex)
    store.setGameCode(code)

    return { code, hostId }
  }, [store])

  // Join an existing game
  const joinGame = useCallback(async (code, name, avatar, role = 'player') => {
    const snap = await get(ref(db, `games/${code}`))
    if (!snap.exists()) throw new Error('Game not found')

    const game = snap.val()
    if (game.state !== 'lobby' && role === 'player') throw new Error('Game already started')

    const players = game.players || {}
    const color = assignColor(players)
    const playerId = generatePlayerId()

    const playerData = {
      id: playerId,
      name,
      avatar: avatar || null,
      colorId: color.id,
      colorHex: color.hex,
      role,
      score: 0,
      roundScore: 0,
      powerups: buildInitialPowerups(game.settings),
      secondLifeUsed: false,
      isOnline: true,
      joinedAt: Date.now(),
    }

    await update(ref(db, `games/${code}/players/${playerId}`), playerData)

    store.setMyId(playerId)
    store.setMyName(name)
    store.setMyRole(role)
    store.setMyColor(color.hex)
    store.setGameCode(code)

    return { playerId, color }
  }, [store])

  // Subscribe to game state
  const subscribeToGame = useCallback((code, onUpdate) => {
    const gameRef = ref(db, `games/${code}`)
    const unsub = onValue(gameRef, (snap) => {
      if (snap.exists()) {
        const game = snap.val()
        store.setGame(game)
        onUpdate?.(game)
      }
    })
    return unsub
  }, [store])

  // Update game state (host/controller only)
  const updateGame = useCallback(async (code, updates) => {
    await update(ref(db, `games/${code}`), updates)
  }, [])

  // Update player data
  const updatePlayer = useCallback(async (code, playerId, updates) => {
    await update(ref(db, `games/${code}/players/${playerId}`), updates)
  }, [])

  // Deal genres for round pick
  const dealGenres = useCallback(async (code, game) => {
    const excluded = game.settings?.excludedGenres || []
    const used = game.usedGenres || []
    const genres = getRandomGenres(3, excluded, used)
    await update(ref(db, `games/${code}`), {
      dealGenres: genres.map(g => g.id),
      roundVotes: {},
    })
    return genres
  }, [])

  // Cast a genre vote (player)
  const voteForGenre = useCallback(async (code, playerId, genreId) => {
    await update(ref(db, `games/${code}/roundVotes`), { [playerId]: genreId })
  }, [])

  // Lock in a genre and start round
  const selectGenre = useCallback(async (code, genreId, genreName, genreEmoji, gameType, gameColor) => {
    await update(ref(db, `games/${code}`), {
      currentGenre: { id: genreId, name: genreName, emoji: genreEmoji, gameType, color: gameColor },
      state: 'powerup-select',
      powerupRound: {},
    })
  }, [])

  // Buzz in (player)
  const buzzIn = useCallback(async (code, playerId, playerColor) => {
    const now = Date.now()
    await update(ref(db, `games/${code}`), {
      buzzer: { playerId, timestamp: now, colorId: playerColor },
      questionRevealed: true,
    })
  }, [])

  // Clear buzzer
  const clearBuzzer = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { buzzer: null })
  }, [])

  // Mark answer correct/wrong
  const markAnswer = useCallback(async (code, game, correct) => {
    const buzzerId = game.buzzer?.playerId
    if (!buzzerId) return
    const player = game.players?.[buzzerId]
    if (!player) return

    const wrongAnswerers = game.wrongAnswerers || []
    const isBonus = !correct ? false : wrongAnswerers.length > 0
    const hasDoublePoints = game.powerupRound?.[buzzerId]
    const settings = game.settings || DEFAULT_SETTINGS

    let delta = 0
    if (correct) {
      delta = (100 + (isBonus ? 50 : 0)) * (hasDoublePoints ? 2 : 1)
    } else {
      delta = -25
    }

    // Plagiarism: if someone has this player as their target, they also score
    const plagiarismTargets = game.plagiarismTargets || {}
    const plagiarists = Object.entries(plagiarismTargets)
      .filter(([pid, target]) => target === buzzerId && correct)
      .map(([pid]) => pid)

    const updates = {}
    updates[`games/${code}/players/${buzzerId}/score`] = (player.score || 0) + delta
    updates[`games/${code}/players/${buzzerId}/roundScore`] = (player.roundScore || 0) + delta

    if (!correct) {
      // Add to wrong answerers
      const newWrong = [...wrongAnswerers, buzzerId]
      updates[`games/${code}/wrongAnswerers`] = newWrong
    } else {
      // Clear wrong answerers for next question cycle
    }

    // Award plagiarists
    for (const pid of plagiarists) {
      const pp = game.players[pid]
      if (pp) {
        const pdelta = 100 * (game.powerupRound?.[pid] ? 2 : 1)
        updates[`games/${code}/players/${pid}/score`] = (pp.score || 0) + pdelta
        updates[`games/${code}/players/${pid}/roundScore`] = (pp.roundScore || 0) + pdelta
      }
    }

    updates[`games/${code}/buzzer`] = null

    if (correct) {
      updates[`games/${code}/wrongAnswerers`] = []
      updates[`games/${code}/answerRevealed`] = true
    }

    await update(ref(db), updates)
    return delta
  }, [])

  // Advance to next question
  const nextQuestion = useCallback(async (code, game, questions) => {
    const nextIdx = (game.currentQIndex || 0) + 1
    const questionsPerRound = game.settings?.questionsPerRound || DEFAULT_SETTINGS.questionsPerRound

    if (nextIdx >= questionsPerRound || nextIdx >= questions.length) {
      // Round over
      await update(ref(db, `games/${code}`), {
        state: 'round-over',
        buzzer: null,
        wrongAnswerers: [],
        currentQ: null,
        answerRevealed: false,
        currentQIndex: nextIdx,
      })
    } else {
      const q = questions[nextIdx]
      await update(ref(db, `games/${code}`), {
        currentQ: q,
        currentQIndex: nextIdx,
        buzzer: null,
        wrongAnswerers: [],
        questionRevealed: false,
        answerRevealed: false,
        hintRevealed: false,
      })
    }
  }, [])

  // Load first question
  const loadFirstQuestion = useCallback(async (code, questions) => {
    if (!questions || questions.length === 0) return
    await update(ref(db, `games/${code}`), {
      currentQ: questions[0],
      currentQIndex: 0,
      buzzer: null,
      wrongAnswerers: [],
      questionRevealed: false,
      answerRevealed: false,
      hintRevealed: false,
      state: 'quiz',
    })
  }, [])

  // Start next round
  const startNextRound = useCallback(async (code, game) => {
    const nextRound = (game.currentRound || 0) + 1
    const totalRounds = game.settings?.totalRounds || DEFAULT_SETTINGS.totalRounds

    if (nextRound > totalRounds) {
      await update(ref(db, `games/${code}`), { state: 'final' })
    } else {
      // Reset round scores
      const playerUpdates = {}
      Object.keys(game.players || {}).forEach(pid => {
        playerUpdates[`games/${code}/players/${pid}/roundScore`] = 0
      })
      await update(ref(db), {
        ...playerUpdates,
        [`games/${code}/currentRound`]: nextRound,
        [`games/${code}/currentQIndex`]: 0,
        [`games/${code}/currentQ`]: null,
        [`games/${code}/plagiarismTargets`]: {},
        [`games/${code}/powerupRound`]: {},
        [`games/${code}/state`]: 'round-pick',
        [`games/${code}/dealGenres`]: null,
        [`games/${code}/roundVotes`]: {},
      })
    }
  }, [])

  // Submit inside joke
  const submitInsideJoke = useCallback(async (code, joke) => {
    const jokeRef = push(ref(db, `games/${code}/insideJokes`))
    await set(jokeRef, joke)
  }, [])

  // Activate powerup (doublePoints for round)
  const activatePowerupRound = useCallback(async (code, playerId, active) => {
    await update(ref(db, `games/${code}/powerupRound`), { [playerId]: active })
  }, [])

  // Use a powerup (decrement count)
  const usePowerup = useCallback(async (code, playerId, powerupKey) => {
    const snap = await get(ref(db, `games/${code}/players/${playerId}/powerups/${powerupKey}`))
    const current = snap.val() || 0
    if (current <= 0) return false
    await update(ref(db, `games/${code}/players/${playerId}/powerups`), {
      [powerupKey]: current - 1,
    })
    return true
  }, [])

  // Block a player (next buzz)
  const blockPlayer = useCallback(async (code, fromPlayerId, targetPlayerId) => {
    const success = await usePowerup(code, fromPlayerId, 'block')
    if (success) {
      await update(ref(db, `games/${code}/blocked`), { [targetPlayerId]: fromPlayerId })
    }
    return success
  }, [usePowerup])

  // Set plagiarism target
  const setPlagiarismTarget = useCallback(async (code, playerId, targetPlayerId) => {
    const success = await usePowerup(code, playerId, 'plagiarism')
    if (success) {
      await update(ref(db, `games/${code}/plagiarismTargets`), { [playerId]: targetPlayerId })
    }
    return success
  }, [usePowerup])

  // Submit vote
  const submitVote = useCallback(async (code, voterId, submitterId) => {
    await update(ref(db, `games/${code}/votes`), { [voterId]: submitterId })
  }, [])

  // Submit creative answer
  const submitCreative = useCallback(async (code, playerId, text) => {
    await update(ref(db, `games/${code}/submissions`), { [playerId]: text })
  }, [])

  // Assign screen role
  const assignScreenRole = useCallback(async (code, playerId, screenRole) => {
    const current = await get(ref(db, `games/${code}/screens`))
    const screens = current.val() || {}
    // Remove any existing assignment for this role
    const newScreens = { ...screens }
    Object.keys(newScreens).forEach(k => { if (newScreens[k] === playerId) newScreens[k] = null })
    if (screenRole) newScreens[screenRole] = playerId
    await update(ref(db, `games/${code}`), { screens: newScreens })
  }, [])

  // Start game from lobby
  const startGame = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), {
      state: 'round-pick',
      currentRound: 1,
      startedAt: Date.now(),
    })
  }, [])

  // Use second life
  const useSecondLife = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/players/${playerId}`), { secondLifeUsed: true })
  }, [])

  // Imposter: force a player to answer
  const forceAnswer = useCallback(async (code, fromId, targetId) => {
    const success = await usePowerup(code, fromId, 'imposter')
    if (success) {
      await update(ref(db, `games/${code}`), {
        buzzer: { playerId: targetId, timestamp: Date.now(), forcedBy: fromId, colorId: 'red' },
        questionRevealed: true,
      })
    }
    return success
  }, [usePowerup])

  return {
    createGame, joinGame, subscribeToGame, updateGame, updatePlayer,
    dealGenres, voteForGenre, selectGenre,
    buzzIn, clearBuzzer, markAnswer, nextQuestion, loadFirstQuestion,
    startNextRound, startGame,
    submitInsideJoke, activatePowerupRound, usePowerup,
    blockPlayer, setPlagiarismTarget, submitVote, submitCreative,
    assignScreenRole, useSecondLife, forceAnswer,
  }
}
