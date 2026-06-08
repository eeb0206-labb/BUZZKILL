import { useCallback } from 'react'
import { db, ref, set, get, update, onValue, push, remove } from '../firebase'
import { useStore } from '../store'
import { PLAYER_COLORS, getRandomGenres, getGenreById } from '../data/genres'
import { DEFAULT_SETTINGS } from '../store'

// ── fuzzy answer matching (shared) ────────────────────────────────────────────
function answersMatch(submitted, correct) {
  if (!submitted || !correct) return false
  const stopWords = new Set(['the','a','an','of','in','at','for','to','and','or','is','was'])
  const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
  const strip = s => s.split(' ').filter(w => w && !stopWords.has(w)).join(' ')
  const a = norm(submitted)
  const b = norm(correct)
  if (a === b || a.includes(b) || b.includes(a)) return true
  const as = strip(a); const bs = strip(b)
  if (as && bs && (as === bs || as.includes(bs) || bs.includes(as))) return true
  const bWords = bs.split(' ').filter(w => w.length > 2)
  if (bWords.length >= 2 && bWords.every(w => as.includes(w))) return true
  return false
}

// ── code generation ────────────────────────────────────────────────────────────
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generatePlayerId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ── initial powerups — everyone starts with one Double Points; nothing else ──────
function buildInitialPowerups() {
  return { sneakPeek: 0, steal: 0, imposter: 0, plagiarism: 0, block: 0, doublePoints: 1 }
}

// Pool for random post-round deals — doublePoints is a starting gift, not in the pool
const POWERUP_POOL = ['sneakPeek', 'steal', 'imposter', 'plagiarism', 'block']

// Build a batch of Firebase updates that deals 1 random powerup to every eligible player
// who is NOT currently in first place. First-place player(s) get nothing.
// Also skips gamescreen roles.
function buildDealPowerupUpdates(code, game) {
  const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
  if (players.length === 0) return {}
  const maxScore = Math.max(...players.map(p => p.score || 0))
  const updates = {}
  const dealtMap = {}
  players.forEach(p => {
    if ((p.score || 0) >= maxScore) return // first place — no powerup
    const key = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)]
    updates[`games/${code}/players/${p.id}/powerups/${key}`] = (p.powerups?.[key] || 0) + 1
    dealtMap[p.id] = key
  })
  updates[`games/${code}/roundDealtPowerups`] = dealtMap
  return updates
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
          avatarConfig: store.myAvatarConfig || null,
          colorId: color.id,
          colorHex: color.hex,
          role: 'host',
          score: 0,
          roundScore: 0,
          powerups: buildInitialPowerups(),
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
  const joinGame = useCallback(async (code, name, avatar, role = 'player', avatarConfig = null) => {
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
      avatarConfig: avatarConfig || null,
      colorId: color.id,
      colorHex: color.hex,
      role,
      score: 0,
      roundScore: 0,
      powerups: buildInitialPowerups(),
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
    // Count real players (exclude TV screen) so minPlayers requirements are enforced
    const playerCount = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen').length
    const genres = getRandomGenres(3, excluded, used, playerCount)
    await update(ref(db, `games/${code}`), {
      dealGenres: genres.map(g => g.id),
      dealGenresAt: Date.now(), // timestamp used to sync the countdown timer across all devices
      roundVotes: {},
    })
    return genres
  }, [])

  // Cast a genre vote (player)
  const voteForGenre = useCallback(async (code, playerId, genreId) => {
    await update(ref(db, `games/${code}/roundVotes`), { [playerId]: genreId })
  }, [])

  // Lock in a genre and start round — also deals 1 random powerup to each eligible player
  const selectGenre = useCallback(async (code, game, genreId, genreName, genreEmoji, gameType, gameColor) => {
    const powerupUpdates = game ? buildDealPowerupUpdates(code, game) : {}
    await update(ref(db), {
      [`games/${code}/currentGenre`]: { id: genreId, name: genreName, emoji: genreEmoji, gameType, color: gameColor },
      [`games/${code}/state`]: 'powerup-select',
      [`games/${code}/powerupRound`]: {},
      ...powerupUpdates,
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
    const hasDoublePoints = !!game.powerupRound?.[buzzerId]
    // potAmount tracks accumulated penalties from wrong answers — each wrong answer
    // adds its individual penalty (25, or 50 with double points) to the pot.
    const potAmount = game.potAmount || 0

    let delta = 0
    let newPotAmount = potAmount
    if (correct) {
      // Winner collects the full pot (base 100 + accumulated penalties), doubled if active
      delta = (100 + potAmount) * (hasDoublePoints ? 2 : 1)
    } else {
      // Wrong answer: -25 normally, -50 with double points. That penalty also goes INTO the pot.
      const penalty = hasDoublePoints ? 50 : 25
      delta = -penalty
      newPotAmount = potAmount + penalty
    }

    // Plagiarism: if someone has this player as their target, they also score on correct answer
    const plagiarismTargets = game.plagiarismTargets || {}
    const plagiarists = Object.entries(plagiarismTargets)
      .filter(([pid, target]) => target === buzzerId && correct)
      .map(([pid]) => pid)

    const updates = {}
    updates[`games/${code}/players/${buzzerId}/score`] = (player.score || 0) + delta
    updates[`games/${code}/players/${buzzerId}/roundScore`] = (player.roundScore || 0) + delta

    if (!correct) {
      updates[`games/${code}/wrongAnswerers`] = [...wrongAnswerers, buzzerId]
      updates[`games/${code}/potAmount`] = newPotAmount
      // Track for Redemption Arc
      if (game.currentQ?.q) {
        const wrongQ = { q: game.currentQ.q, a: game.currentQ.a, hint: game.currentQ.hint || '' }
        const existingSnap = await get(ref(db, `games/${code}/playerWrongAnswers/${buzzerId}`))
        const existing = existingSnap.val() || []
        if (!existing.some(w => w.q === wrongQ.q)) {
          updates[`games/${code}/playerWrongAnswers/${buzzerId}`] = [...existing, wrongQ]
        }
      }
    }

    // Award plagiarists
    for (const pid of plagiarists) {
      const pp = game.players[pid]
      if (pp) {
        const pdelta = (100 + potAmount) * (game.powerupRound?.[pid] ? 2 : 1)
        updates[`games/${code}/players/${pid}/score`] = (pp.score || 0) + pdelta
        updates[`games/${code}/players/${pid}/roundScore`] = (pp.roundScore || 0) + pdelta
      }
    }

    updates[`games/${code}/buzzer`] = null

    if (correct) {
      updates[`games/${code}/wrongAnswerers`] = []
      updates[`games/${code}/potAmount`] = 0
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
        potAmount: 0,
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
      potAmount: 0,
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
        [`games/${code}/roundDealtPowerups`]: {},
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

  // Transfer host role to another player
  const transferHost = useCallback(async (code, fromId, toId) => {
    await update(ref(db), {
      [`games/${code}/hostId`]: toId,
      [`games/${code}/players/${toId}/role`]: 'host',
      [`games/${code}/players/${fromId}/role`]: 'player',
    })
  }, [])

  // Steal a powerup from a target player (takes their highest-value one)
  const stealPowerup = useCallback(async (code, fromId, targetId, powerupKey) => {
    const success = await usePowerup(code, fromId, 'steal')
    if (!success) return false
    // Decrement target's powerup
    const snap = await get(ref(db, `games/${code}/players/${targetId}/powerups/${powerupKey}`))
    const current = snap.val() || 0
    if (current <= 0) return false
    // Give to stealer, take from target
    const mySnap = await get(ref(db, `games/${code}/players/${fromId}/powerups/${powerupKey}`))
    const myCount = mySnap.val() || 0
    await update(ref(db), {
      [`games/${code}/players/${targetId}/powerups/${powerupKey}`]: current - 1,
      [`games/${code}/players/${fromId}/powerups/${powerupKey}`]: myCount + 1,
    })
    return true
  }, [usePowerup])

  // Save drawing strokes for Draw It game
  const saveDrawing = useCallback(async (code, dataUrl, drawerId, prompt) => {
    await update(ref(db, `games/${code}`), {
      drawingData: dataUrl,
      drawerId,
      drawPrompt: prompt,
    })
  }, [])

  // Submit a drawing guess
  const submitDrawGuess = useCallback(async (code, game, playerId, guess) => {
    const correct = answersMatch(guess, game.drawPrompt || '')
    if (correct) {
      const player = game.players?.[playerId]
      const pts = 100 * (game.powerupRound?.[playerId] ? 2 : 1)
      await update(ref(db), {
        [`games/${code}/players/${playerId}/score`]: (player?.score || 0) + pts,
        [`games/${code}/players/${playerId}/roundScore`]: (player?.roundScore || 0) + pts,
        [`games/${code}/drawWinner`]: playerId,
        [`games/${code}/drawWinGuess`]: guess,
      })
    }
    return correct
  }, [])

  // Advance draw round to next prompt (or end)
  const advanceDrawRound = useCallback(async (code, game) => {
    const nextIdx = (game.drawPromptIndex || 0) + 1
    const questionsPerRound = game.settings?.questionsPerRound || 8
    if (nextIdx >= questionsPerRound) {
      await update(ref(db, `games/${code}`), { state: 'round-over' })
    } else {
      await update(ref(db, `games/${code}`), {
        drawPromptIndex: nextIdx,
        drawingData: null,
        drawWinner: null,
        drawWinGuess: null,
      })
    }
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

  // ── True or False ─────────────────────────────────────────────────────────────
  // Phases: 'question' → 'reveal'. Everyone submits simultaneously (no buzzer).
  // Correct = 100 pts (×2 if double points). Wrong = -25 (×2 if double points).

  const startTrueOrFalse = useCallback(async (code, game) => {
    const genreData = getGenreById(game.currentGenre?.id)
    const baseQs = genreData?.questions || []
    // Blend in inside-joke True/False questions
    const insideJokeQs = Object.values(game.insideJokes || {})
      .filter(j => j.category === 'truefalse' && j.tfAnswer !== undefined)
      .map(j => ({ statement: j.label, answer: j.tfAnswer, fact: j.tfFact || '', isInsideJoke: true }))
    const questions = [...baseQs, ...insideJokeQs]
    if (questions.length === 0) return
    const used = game.tfUsedIndices || []
    const remaining = questions.map((_, i) => i).filter(i => !used.includes(i))
    const pool = remaining.length > 0 ? remaining : questions.map((_, i) => i)
    const idx = pool[Math.floor(Math.random() * pool.length)]
    await update(ref(db, `games/${code}`), {
      tfPhase: 'question',
      tfQuestion: questions[idx],
      tfSubmissions: {},
      tfIndex: idx,
      tfStartAt: Date.now(),
      tfCount: 1,
      tfUsedIndices: [...used, idx],
    })
  }, [])

  const submitTFAnswer = useCallback(async (code, playerId, answer) => {
    // answer: true | false
    await update(ref(db, `games/${code}/tfSubmissions`), { [playerId]: answer })
  }, [])

  const revealTFResults = useCallback(async (code, game) => {
    const correctAnswer = game.tfQuestion?.answer
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    const submissions = game.tfSubmissions || {}
    const updates = {}
    players.forEach(p => {
      const sub = submissions[p.id]
      if (sub === undefined) return // didn't answer
      const correct = sub === correctAnswer
      const base = correct ? 100 : -25
      const pts = base * (game?.powerupRound?.[p.id] ? 2 : 1)
      updates[`games/${code}/players/${p.id}/score`] = Math.max(0, (p.score || 0) + pts)
      updates[`games/${code}/players/${p.id}/roundScore`] = (p.roundScore || 0) + pts
    })
    updates[`games/${code}/tfPhase`] = 'reveal'
    await update(ref(db), updates)
  }, [])

  const nextTFQuestion = useCallback(async (code, game) => {
    const genreData = getGenreById(game.currentGenre?.id)
    const baseQs = genreData?.questions || []
    const insideJokeQs = Object.values(game.insideJokes || {})
      .filter(j => j.category === 'truefalse' && j.tfAnswer !== undefined)
      .map(j => ({ statement: j.label, answer: j.tfAnswer, fact: j.tfFact || '', isInsideJoke: true }))
    const questions = [...baseQs, ...insideJokeQs]
    const roundLimit = game.settings?.questionsPerRound || 8
    const count = (game.tfCount || 1) + 1
    if (count > roundLimit) {
      await update(ref(db, `games/${code}`), { state: 'round-over' }); return
    }
    const used = game.tfUsedIndices || []
    const remaining = questions.map((_, i) => i).filter(i => !used.includes(i))
    const pool = remaining.length > 0 ? remaining : questions.map((_, i) => i)
    const idx = pool[Math.floor(Math.random() * pool.length)]
    await update(ref(db, `games/${code}`), {
      tfPhase: 'question',
      tfQuestion: questions[idx],
      tfSubmissions: {},
      tfIndex: idx,
      tfStartAt: Date.now(),
      tfCount: count,
      tfUsedIndices: [...used, idx],
    })
  }, [])

  const endTFRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Orders Up! ─────────────────────────────────────────────────────────────────
  // Phases: 'memorize' (show full order) → 'order' (scrambled, player arranges)
  //         → 'reveal' (show correct + scores)
  // All 3 correct = 150 pts, 2 = 75, 1 = 25, 0 = 0. All ×2 if double points.
  // ouChallenge: 3 items shown scrambled. ouCorrectOrder: same 3 items in original sequence.

  const startOrdersUp = useCallback(async (code, game) => {
    const genreData = getGenreById(game.currentGenre?.id)
    const baseOrders = genreData?.orders || []
    // Blend in inside-joke orders (need at least 3 items)
    const insideJokeOrders = Object.values(game.insideJokes || {})
      .filter(j => j.category === 'ordersup' && Array.isArray(j.ouItems) && j.ouItems.length >= 3)
      .map(j => ({ label: j.label, items: j.ouItems, isInsideJoke: true }))
    const orders = [...baseOrders, ...insideJokeOrders]
    if (orders.length === 0) return
    const used = game.ouUsedOrders || []
    const remaining = orders.filter((_, i) => !used.includes(i))
    const pool = remaining.length > 0 ? remaining.map((_, i) => orders.indexOf(remaining[i])) : orders.map((_, i) => i)
    const orderIdx = pool[Math.floor(Math.random() * pool.length)]
    const order = orders[orderIdx]
    // Pick 3 random items from the list (by index) and record their original positions
    const allIndices = order.items.map((_, i) => i)
    const shuffled = [...allIndices].sort(() => Math.random() - 0.5)
    const pickedIndices = shuffled.slice(0, 3).sort((a, b) => Math.random() - 0.5) // scrambled for display
    const correctOrderIndices = [...pickedIndices].sort((a, b) => a - b) // sorted by original position
    const challenge = pickedIndices.map(i => order.items[i]) // scrambled items shown to players
    const correctOrder = correctOrderIndices.map(i => order.items[i]) // correct sequence
    await update(ref(db, `games/${code}`), {
      ouPhase: 'memorize',
      ouLabel: order.label,
      ouFullOrder: order.items,
      ouChallenge: challenge,
      ouCorrectOrder: correctOrder,
      ouSubmissions: {},
      ouStartAt: Date.now(),
      ouCount: (game.ouCount || 0) + 1,
      ouUsedOrders: [...used, orderIdx],
    })
  }, [])

  const submitOUAnswer = useCallback(async (code, playerId, orderedItems) => {
    // orderedItems: array of 3 item strings in player's chosen order
    await update(ref(db, `games/${code}/ouSubmissions`), { [playerId]: orderedItems })
  }, [])

  const advanceOUPhase = useCallback(async (code, currentPhase) => {
    if (currentPhase === 'memorize') {
      await update(ref(db, `games/${code}`), { ouPhase: 'order', ouOrderStart: Date.now() })
    }
  }, [])

  const revealOUResults = useCallback(async (code, game) => {
    const correctOrder = game.ouCorrectOrder || []
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    const submissions = game.ouSubmissions || {}
    const updates = {}
    const scoreMap = {}
    players.forEach(p => {
      const sub = submissions[p.id]
      if (!sub || !Array.isArray(sub)) return
      const correct = sub.filter((item, i) => item === correctOrder[i]).length
      const base = correct === 3 ? 150 : correct === 2 ? 75 : correct === 1 ? 25 : 0
      const pts = base * (game?.powerupRound?.[p.id] ? 2 : 1)
      scoreMap[p.id] = { correct, pts }
      if (pts !== 0) {
        updates[`games/${code}/players/${p.id}/score`] = (p.score || 0) + pts
        updates[`games/${code}/players/${p.id}/roundScore`] = (p.roundScore || 0) + pts
      }
    })
    updates[`games/${code}/ouPhase`] = 'reveal'
    updates[`games/${code}/ouScoreMap`] = scoreMap
    await update(ref(db), updates)
    return scoreMap
  }, [])

  const nextOUOrder = useCallback(async (code, game) => {
    const genreData = getGenreById(game.currentGenre?.id)
    const baseOrders = genreData?.orders || []
    const insideJokeOrders = Object.values(game.insideJokes || {})
      .filter(j => j.category === 'ordersup' && Array.isArray(j.ouItems) && j.ouItems.length >= 3)
      .map(j => ({ label: j.label, items: j.ouItems, isInsideJoke: true }))
    const orders = [...baseOrders, ...insideJokeOrders]
    const roundLimit = game.settings?.questionsPerRound || 5
    const count = game.ouCount || 1
    if (count >= roundLimit) {
      await update(ref(db, `games/${code}`), { state: 'round-over' }); return
    }
    const used = game.ouUsedOrders || []
    const remaining = orders.map((_, i) => i).filter(i => !used.includes(i))
    const pool = remaining.length > 0 ? remaining : orders.map((_, i) => i)
    const orderIdx = pool[Math.floor(Math.random() * pool.length)]
    const order = orders[orderIdx]
    const allIndices = order.items.map((_, i) => i)
    const shuffled = [...allIndices].sort(() => Math.random() - 0.5)
    const pickedIndices = shuffled.slice(0, 3).sort(() => Math.random() - 0.5)
    const correctOrderIndices = [...pickedIndices].sort((a, b) => a - b)
    const challenge = pickedIndices.map(i => order.items[i])
    const correctOrder = correctOrderIndices.map(i => order.items[i])
    await update(ref(db, `games/${code}`), {
      ouPhase: 'memorize',
      ouLabel: order.label,
      ouFullOrder: order.items,
      ouChallenge: challenge,
      ouCorrectOrder: correctOrder,
      ouSubmissions: {},
      ouStartAt: Date.now(),
      ouCount: count + 1,
      ouUsedOrders: [...used, orderIdx],
      ouScoreMap: {},
    })
  }, [])

  const endOURound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Return to lobby (play again — same players, scores reset) ────────────────
  const returnToLobby = useCallback(async (code, game) => {
    const playerUpdates = {}
    Object.values(game?.players || {}).forEach(p => {
      playerUpdates[`games/${code}/players/${p.id}/score`] = 0
      playerUpdates[`games/${code}/players/${p.id}/roundScore`] = 0
      playerUpdates[`games/${code}/players/${p.id}/powerups`] = buildInitialPowerups()
      playerUpdates[`games/${code}/players/${p.id}/secondLifeUsed`] = false
    })
    await update(ref(db), {
      ...playerUpdates,
      [`games/${code}/state`]: 'lobby',
      [`games/${code}/currentRound`]: 0,
      [`games/${code}/currentQIndex`]: 0,
      [`games/${code}/currentQ`]: null,
      [`games/${code}/currentGenre`]: null,
      [`games/${code}/wrongAnswerers`]: [],
      [`games/${code}/playerWrongAnswers`]: {},
      [`games/${code}/buzzer`]: null,
      [`games/${code}/answerRevealed`]: false,
      [`games/${code}/questionRevealed`]: false,
      [`games/${code}/submissions`]: {},
      [`games/${code}/votes`]: {},
      [`games/${code}/votePhase`]: null,
      [`games/${code}/powerupRound`]: {},
      [`games/${code}/usedGenres`]: [],
      [`games/${code}/roundVotes`]: {},
      [`games/${code}/jokePhase`]: null,
      [`games/${code}/jokeSubmissions`]: {},
      [`games/${code}/jokeVotes`]: {},
      [`games/${code}/htPhase`]: null,
      [`games/${code}/htVotes`]: {},
      [`games/${code}/whodPhase`]: null,
      [`games/${code}/whodAnswers`]: {},
      [`games/${code}/whodVotes`]: {},
      [`games/${code}/potAmount`]: 0,
      [`games/${code}/tfPhase`]: null,
      [`games/${code}/tfSubmissions`]: {},
      [`games/${code}/tfUsedIndices`]: [],
      [`games/${code}/ouPhase`]: null,
      [`games/${code}/ouSubmissions`]: {},
      [`games/${code}/ouScoreMap`]: {},
      [`games/${code}/ouUsedOrders`]: [],
    })
  }, [])

  // ── Trigger Redemption Arc ────────────────────────────────────────────────────
  const triggerRedemptionArc = useCallback(async (code, game) => {
    // Collect all wrong questions from all players (deduped)
    const allWrong = []
    const seen = new Set()
    Object.values(game?.playerWrongAnswers || {}).forEach(qs => {
      ;(qs || []).forEach(q => {
        if (!seen.has(q.q)) { seen.add(q.q); allWrong.push(q) }
      })
    })
    if (allWrong.length === 0) {
      await update(ref(db, `games/${code}`), { state: 'final' })
      return false
    }
    await update(ref(db, `games/${code}`), {
      state: 'quiz',
      currentGenre: { id: 'redemption', name: 'Redemption Arc', emoji: '⚡', gameType: 'redemption', color: '#f4d03f' },
      currentQIndex: 0,
      currentQ: null,
      wrongAnswerers: [],
      buzzer: null,
      answerRevealed: false,
      redemptionQuestions: allWrong,
    })
    return true
  }, [])

  // ── Joke Off helpers ──────────────────────────────────────────────────────────
  const startJokePrompt = useCallback(async (code, prompt) => {
    await update(ref(db, `games/${code}`), {
      jokePhase: 'submit',
      jokePrompt: prompt,
      jokeSubmissions: {},
      jokeVotes: {},
      jokePromptStartAt: Date.now(),
      jokePromptCount: 0,        // starts at 0; nextJokePrompt increments to 1, 2…
      jokePromptsUsed: [prompt], // track so we never repeat
    })
  }, [])

  const submitJoke = useCallback(async (code, playerId, text) => {
    await update(ref(db, `games/${code}/jokeSubmissions`), { [playerId]: text.trim() })
  }, [])

  const startJokeVoting = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { jokePhase: 'vote' })
  }, [])

  const voteJoke = useCallback(async (code, voterId, targetId) => {
    await update(ref(db, `games/${code}/jokeVotes`), { [voterId]: targetId })
  }, [])

  const revealJokeResults = useCallback(async (code, game) => {
    const votes = game.jokeVotes || {}
    const updates = {}
    // Tally votes per player
    const tally = {}
    Object.values(votes).forEach(targetId => { tally[targetId] = (tally[targetId] || 0) + 1 })
    const maxVotes = Math.max(...Object.values(tally), 0)
    // Award points: 100 per vote, +100 bonus for most votes. Double if powerupRound active.
    Object.entries(tally).forEach(([pid, count]) => {
      const p = game.players?.[pid]
      if (!p) return
      const bonus = count === maxVotes && count > 0 ? 100 : 0
      const base = count * 100 + bonus
      const pts = base * (game?.powerupRound?.[pid] ? 2 : 1)
      updates[`games/${code}/players/${pid}/score`] = (p.score || 0) + pts
      updates[`games/${code}/players/${pid}/roundScore`] = (p.roundScore || 0) + pts
    })
    updates[`games/${code}/jokePhase`] = 'results'
    await update(ref(db), updates)
    return tally
  }, [])

  const nextJokePrompt = useCallback(async (code, game) => {
    const genreData = getGenreById(game.currentGenre?.id)
    const prompts = genreData?.prompts || []
    const used = game.jokePromptsUsed || []
    const remaining = prompts.filter(p => !used.includes(p))
    const count = (game.jokePromptCount || 0) + 1
    const roundLimit = game.settings?.questionsPerRound || 5
    if (remaining.length === 0 || count >= roundLimit) {
      await update(ref(db, `games/${code}`), { state: 'round-over' })
    } else {
      const next = remaining[Math.floor(Math.random() * remaining.length)]
      await update(ref(db, `games/${code}`), {
        jokePhase: 'submit',
        jokePrompt: next,
        jokeSubmissions: {},
        jokeVotes: {},
        jokePromptsUsed: [...used, next],
        jokePromptStartAt: Date.now(),
        jokePromptCount: count,
      })
    }
  }, [])

  const endJokeRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Hot Take helpers ──────────────────────────────────────────────────────────
  const startHotTakePrompt = useCallback(async (code, prompt) => {
    await update(ref(db, `games/${code}`), {
      htPhase: 'vote',
      htPrompt: prompt,
      htVotes: {},
      htStartAt: Date.now(),
      htPromptCount: 0,       // starts at 0; nextHotTakePrompt increments to 1, 2…
      htPromptsUsed: [prompt], // track so we never repeat
    })
  }, [])

  const submitHotTakeVote = useCallback(async (code, playerId, vote) => {
    // vote: 'agree' | 'disagree'
    await update(ref(db, `games/${code}/htVotes`), { [playerId]: vote })
  }, [])

  const revealHotTakeResults = useCallback(async (code, game) => {
    const votes = game.htVotes || {}
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    const agrees = Object.values(votes).filter(v => v === 'agree').length
    const disagrees = Object.values(votes).filter(v => v === 'disagree').length
    const majority = agrees >= disagrees ? 'agree' : 'disagree'
    // Points: 75 to everyone in majority. Bonus 50 if unanimous. Double if powerupRound active.
    const updates = {}
    const isUnanimous = agrees === 0 || disagrees === 0
    players.forEach(p => {
      if (votes[p.id] === majority) {
        const base = 75 + (isUnanimous ? 50 : 0)
        const pts = base * (game?.powerupRound?.[p.id] ? 2 : 1)
        updates[`games/${code}/players/${p.id}/score`] = (p.score || 0) + pts
        updates[`games/${code}/players/${p.id}/roundScore`] = (p.roundScore || 0) + pts
      }
    })
    updates[`games/${code}/htPhase`] = 'results'
    await update(ref(db), updates)
    return { majority, agrees, disagrees, isUnanimous }
  }, [])

  const nextHotTakePrompt = useCallback(async (code, game) => {
    const genreData = getGenreById(game.currentGenre?.id)
    const prompts = genreData?.prompts || []
    const used = game.htPromptsUsed || []
    const remaining = prompts.filter(p => !used.includes(p))
    const roundLimit = game.settings?.questionsPerRound || 5
    const count = (game.htPromptCount || 0) + 1
    if (remaining.length === 0 || count >= roundLimit) {
      await update(ref(db, `games/${code}`), { state: 'round-over' })
    } else {
      const next = remaining[Math.floor(Math.random() * remaining.length)]
      await update(ref(db, `games/${code}`), {
        htPhase: 'vote',
        htPrompt: next,
        htVotes: {},
        htPromptsUsed: [...used, next],
        htPromptCount: count,
        htStartAt: Date.now(),
      })
    }
  }, [])

  const endHotTakeRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Whodunnit helpers ──────────────────────────────────────────────────────────
  const startWhodunnit = useCallback(async (code, game) => {
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    if (players.length < 2) return
    const count = (game.whodCount || 0) + 1
    const roundLimit = game.settings?.questionsPerRound || 3  // fewer rounds — each is a full scenario
    // End the round when we've hit the limit (only on subsequent plays, not first start)
    if (game.whodPhase && count > roundLimit) {
      await update(ref(db, `games/${code}`), { state: 'round-over' }); return
    }
    const imposterId = players[Math.floor(Math.random() * players.length)].id
    const genreData = getGenreById(game.currentGenre?.id)
    const pairs = genreData?.pairs || []
    const pair = pairs[Math.floor(Math.random() * pairs.length)] || { normal: 'What is your favourite film?', imposter: 'What is your favourite TV show?' }
    await update(ref(db, `games/${code}`), {
      whodPhase: 'answer',
      whodImposterId: imposterId,
      whodPrompt: pair.normal,
      whodImposterPrompt: pair.imposter,
      whodAnswers: {},
      whodVotes: {},
      whodStartAt: Date.now(),
      whodCount: count,
    })
  }, [])

  const submitWhodAnswer = useCallback(async (code, playerId, answer) => {
    await update(ref(db, `games/${code}/whodAnswers`), { [playerId]: answer.trim() })
  }, [])

  const startWhodVoting = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { whodPhase: 'vote' })
  }, [])

  const submitWhodVote = useCallback(async (code, voterId, targetId) => {
    await update(ref(db, `games/${code}/whodVotes`), { [voterId]: targetId })
  }, [])

  const revealWhodResults = useCallback(async (code, game) => {
    const imposterId = game.whodImposterId
    const votes = game.whodVotes || {}
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    // Count votes against imposter
    const votesOnImposter = Object.values(votes).filter(v => v === imposterId).length
    const majority = votesOnImposter > (players.length - 1) / 2
    const updates = {}
    if (majority) {
      // Imposter caught — detectives who voted correctly get points (doubled if powerupRound active)
      players.forEach(p => {
        if (p.id !== imposterId && votes[p.id] === imposterId) {
          const pts = 150 * (game?.powerupRound?.[p.id] ? 2 : 1)
          updates[`games/${code}/players/${p.id}/score`] = (p.score || 0) + pts
          updates[`games/${code}/players/${p.id}/roundScore`] = (p.roundScore || 0) + pts
        }
      })
    } else {
      // Imposter escaped — they get 200 points (doubled if powerupRound active)
      const imp = game.players?.[imposterId]
      if (imp) {
        const pts = 200 * (game?.powerupRound?.[imposterId] ? 2 : 1)
        updates[`games/${code}/players/${imposterId}/score`] = (imp.score || 0) + pts
        updates[`games/${code}/players/${imposterId}/roundScore`] = (imp.roundScore || 0) + pts
      }
    }
    updates[`games/${code}/whodPhase`] = 'results'
    updates[`games/${code}/whodCaught`] = majority
    await update(ref(db), updates)
    return majority
  }, [])

  const endWhodRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Outlandish Lawyers ───────────────────────────────────────────────────────
  // Phases: 'defence1' → 'prosecution1' → 'defence2' → 'prosecution2' → 'vote' → 'results'
  // Two random players debate an absurd statement. Audience votes on who was more convincing.
  // Points: debater gets Math.round(voteShare * 15) * 10 pts (0–150, multiples of 10).
  // Audience: +50 if they voted for the majority side.

  const startLawyers = useCallback(async (code, game) => {
    const genre = getGenreById('outlandishlawyers')
    const statements = genre?.statements || ['The floor is a very low ceiling']

    const participants = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
    // Need at least 3: 2 debaters + 1 juror to vote
    if (participants.length < 3) return false

    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const defender = shuffled[0]
    const prosecutor = shuffled[1]
    const statement = statements[Math.floor(Math.random() * statements.length)]
    const currentGenre = { id: 'outlandishlawyers', name: 'Outlandish Lawyers', emoji: '⚖️', gameType: 'lawyers', color: '#c084fc' }

    await update(ref(db, `games/${code}`), {
      state: 'lawyers',
      currentGenre,
      lawyersPhase: 'intro',
      lawyersDefenderId: defender.id,
      lawyersProsecutorId: prosecutor.id,
      lawyersStatement: statement,
      lawyersPhaseStart: Date.now(),
      lawyersVotes: {},
      lawyersPoints: null,
      lawyersRound: 1,
      lawyersTotalRounds: 3,
      lawyersUsedStatements: [statement],
    })
    return true
  }, [])

  // Start the next case within the same Lawyers game round (rounds 2 and 3)
  const nextLawyersDebate = useCallback(async (code, game) => {
    const genre = getGenreById('outlandishlawyers')
    const statements = genre?.statements || ['The floor is a very low ceiling']
    const participants = Object.values(game?.players || {}).filter(p => p.role !== 'gamescreen')
    if (participants.length < 3) return false

    // Fresh random debater pair each case
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const defender = shuffled[0]
    const prosecutor = shuffled[1]

    // Avoid repeating statements used in this game round
    const used = game.lawyersUsedStatements || [game.lawyersStatement].filter(Boolean)
    const remaining = statements.filter(s => !used.includes(s))
    const pool = remaining.length > 0 ? remaining : statements
    const statement = pool[Math.floor(Math.random() * pool.length)]

    await update(ref(db, `games/${code}`), {
      lawyersPhase: 'intro',
      lawyersDefenderId: defender.id,
      lawyersProsecutorId: prosecutor.id,
      lawyersStatement: statement,
      lawyersPhaseStart: Date.now(),
      lawyersVotes: {},
      lawyersPoints: null,
      lawyersRound: (game.lawyersRound || 1) + 1,
      lawyersUsedStatements: [...used, statement],
    })
    return true
  }, [])

  const advanceLawyersPhase = useCallback(async (code, currentPhase) => {
    const order = ['intro', 'defence1', 'prosecution1', 'defence2', 'prosecution2', 'vote', 'results']
    const idx = order.indexOf(currentPhase)
    const nextPhase = order[idx + 1] || 'results'
    await update(ref(db, `games/${code}`), {
      lawyersPhase: nextPhase,
      lawyersPhaseStart: Date.now(),
    })
    return nextPhase
  }, [])

  const submitLawyersVote = useCallback(async (code, myId, side) => {
    // side: 'defence' | 'prosecution'
    await update(ref(db), {
      [`games/${code}/lawyersVotes/${myId}`]: side,
    })
  }, [])

  const revealLawyersResults = useCallback(async (code, game) => {
    const votes = game?.lawyersVotes || {}
    const defenderId = game?.lawyersDefenderId
    const prosecutorId = game?.lawyersProsecutorId
    const voteValues = Object.values(votes)
    const total = voteValues.length
    if (total === 0) {
      // No votes — award nothing, just move on
      await update(ref(db, `games/${code}`), {
        lawyersPhase: 'results',
        lawyersPoints: { defence: 0, prosecution: 0 },
      })
      return
    }

    const defCount = voteValues.filter(v => v === 'defence').length
    const prosCount = total - defCount
    const defPts = Math.round((defCount / total) * 15) * 10
    const prosPts = 150 - defPts

    const playerUpdates = {}
    const majoritySide = defCount >= prosCount ? 'defence' : 'prosecution'
    // Award debater points — doubled if their powerupRound is active
    if (defenderId) {
      const d = game?.players?.[defenderId]
      if (d) {
        const finalDef = defPts * (game?.powerupRound?.[defenderId] ? 2 : 1)
        playerUpdates[`games/${code}/players/${defenderId}/score`] = (d.score || 0) + finalDef
        playerUpdates[`games/${code}/players/${defenderId}/roundScore`] = (d.roundScore || 0) + finalDef
      }
    }
    if (prosecutorId) {
      const p = game?.players?.[prosecutorId]
      if (p) {
        const finalPros = prosPts * (game?.powerupRound?.[prosecutorId] ? 2 : 1)
        playerUpdates[`games/${code}/players/${prosecutorId}/score`] = (p.score || 0) + finalPros
        playerUpdates[`games/${code}/players/${prosecutorId}/roundScore`] = (p.roundScore || 0) + finalPros
      }
    }
    // Award audience: +50 for voting with the majority — doubled if powerupRound active
    Object.entries(votes).forEach(([pid, side]) => {
      if (pid === defenderId || pid === prosecutorId) return
      if (side === majoritySide) {
        const p = game?.players?.[pid]
        if (p) {
          const audiencePts = 50 * (game?.powerupRound?.[pid] ? 2 : 1)
          playerUpdates[`games/${code}/players/${pid}/score`] = (p.score || 0) + audiencePts
          playerUpdates[`games/${code}/players/${pid}/roundScore`] = (p.roundScore || 0) + audiencePts
        }
      }
    })

    await update(ref(db), {
      ...playerUpdates,
      [`games/${code}/lawyersPhase`]: 'results',
      [`games/${code}/lawyersPoints`]: { defence: defPts, prosecution: prosPts, defCount, prosCount, majority: majoritySide },
    })
  }, [])

  const endLawyersRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Fill the Gap helpers ──────────────────────────────────────────────────────
  const startFillGap = useCallback(async (code, game) => {
    const genreData = getGenreById(game.currentGenre?.id)
    const prompts = genreData?.prompts || []
    const used = game.fgPromptsUsed || []
    const remaining = prompts.filter(p => !used.includes(p))
    const count = (game.fgPromptCount || 0) + 1
    const roundLimit = game.settings?.questionsPerRound || 5
    if (remaining.length === 0 || count > roundLimit) {
      await update(ref(db, `games/${code}`), { state: 'round-over' }); return
    }
    const prompt = remaining[Math.floor(Math.random() * remaining.length)]
    await update(ref(db, `games/${code}`), {
      fgPhase: 'input',
      fgPrompt: prompt,
      fgSubmissions: {},
      fgVotes: {},
      fgStartAt: Date.now(),
      fgPromptsUsed: [...used, prompt],
      fgPromptCount: count,
    })
  }, [])

  const submitFillAnswer = useCallback(async (code, playerId, text) => {
    await update(ref(db, `games/${code}/fgSubmissions`), { [playerId]: text.trim() })
  }, [])

  const startFillVoting = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { fgPhase: 'vote' })
  }, [])

  const voteFillAnswer = useCallback(async (code, voterId, targetId) => {
    await update(ref(db, `games/${code}/fgVotes`), { [voterId]: targetId })
  }, [])

  const revealFillResults = useCallback(async (code, game) => {
    const votes = game.fgVotes || {}
    const submissions = game.fgSubmissions || {}
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    const updates = {}
    // Participation points for everyone who submitted. Double if powerupRound active.
    players.forEach(p => {
      if (submissions[p.id]) {
        const base = 25
        const pts = base * (game?.powerupRound?.[p.id] ? 2 : 1)
        updates[`games/${code}/players/${p.id}/score`] = (p.score || 0) + pts
        updates[`games/${code}/players/${p.id}/roundScore`] = (p.roundScore || 0) + pts
      }
    })
    // Vote points: 75 per vote received + 100 bonus for winner. Double if powerupRound active.
    const tally = {}
    Object.values(votes).forEach(targetId => { tally[targetId] = (tally[targetId] || 0) + 1 })
    const maxVotes = Math.max(...Object.values(tally), 0)
    Object.entries(tally).forEach(([pid, count]) => {
      const p = game.players?.[pid]
      if (!p) return
      const bonus = count === maxVotes && count > 0 ? 100 : 0
      const baseVote = count * 75 + bonus
      const voteMultiplier = game?.powerupRound?.[pid] ? 2 : 1
      const votePts = baseVote * voteMultiplier
      // participation already applied above
      const participation = submissions[pid] ? (25 * voteMultiplier) : 0
      const current = (p.score || 0) + participation
      updates[`games/${code}/players/${pid}/score`] = current + votePts
      updates[`games/${code}/players/${pid}/roundScore`] = ((p.roundScore || 0) + participation) + votePts
    })
    updates[`games/${code}/fgPhase`] = 'results'
    await update(ref(db), updates)
    return tally
  }, [])

  const endFillRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Pause request helpers ─────────────────────────────────────────────────────
  const requestPause = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/pauseRequests`), { [playerId]: true })
  }, [])

  const cancelPauseRequest = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/pauseRequests`), { [playerId]: null })
  }, [])

  const unpauseGame = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { gamePaused: false, pauseRequests: {} })
  }, [])

  return {
    createGame, joinGame, subscribeToGame, updateGame, updatePlayer,
    dealGenres, voteForGenre, selectGenre,
    buzzIn, clearBuzzer, markAnswer, nextQuestion, loadFirstQuestion,
    startNextRound, startGame,
    submitInsideJoke, activatePowerupRound, usePowerup,
    blockPlayer, setPlagiarismTarget, submitVote, submitCreative,
    assignScreenRole, useSecondLife, forceAnswer,
    transferHost, stealPowerup, saveDrawing, submitDrawGuess, advanceDrawRound,
    returnToLobby, triggerRedemptionArc,
    startJokePrompt, submitJoke, startJokeVoting, voteJoke, revealJokeResults, nextJokePrompt, endJokeRound,
    startHotTakePrompt, submitHotTakeVote, revealHotTakeResults, nextHotTakePrompt, endHotTakeRound,
    startWhodunnit, submitWhodAnswer, startWhodVoting, submitWhodVote, revealWhodResults, endWhodRound,
    startLawyers, nextLawyersDebate, advanceLawyersPhase, submitLawyersVote, revealLawyersResults, endLawyersRound,
    startFillGap, submitFillAnswer, startFillVoting, voteFillAnswer, revealFillResults, endFillRound,
    startTrueOrFalse, submitTFAnswer, revealTFResults, nextTFQuestion, endTFRound,
    startOrdersUp, submitOUAnswer, advanceOUPhase, revealOUResults, nextOUOrder, endOURound,
    requestPause, cancelPauseRequest, unpauseGame,
  }
}
