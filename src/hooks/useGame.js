import { useCallback } from 'react'
import { db, ref, set, get, update, onValue, push, remove } from '../firebase'
import { useStore } from '../store'
import { PLAYER_COLORS, getRandomGenres, getGenreById } from '../data/genres'
import { DEFAULT_SETTINGS } from '../store'
import { SB_BRIEFS } from '../data/sbBriefs'
import { getCrocQuestions } from '../data/questions/crocgame'

// ── F-Art Direction colour helpers ───────────────────────────────────────────
function hslToHexFD(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function generateFDColor() {
  const h = Math.random() * 360
  const s = 55 + Math.random() * 35 // 55–90% — avoid muddy greys
  const l = 45 + Math.random() * 15 // 45–60% — avoid near-black and near-white
  return hslToHexFD(h, s, l)
}

function colorDistanceFD(hex1, hex2) {
  if (!hex1 || !hex2 || hex1.length < 7 || hex2.length < 7) return 999
  const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16)
  const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}
// ── end F-Art Direction helpers ───────────────────────────────────────────────

// ── Model Model UN helpers ─────────────────────────────────────────────────────
export const MMU_NATIONS = [
  { name: 'Bricklandia',  emoji: '🧱' },
  { name: 'Clayhaven',    emoji: '🏺' },
  { name: 'Plasterburg',  emoji: '🏛️' },
  { name: 'Papiermaché',  emoji: '📜' },
  { name: 'Ceramica',     emoji: '🏆' },
  { name: 'Terracottia',  emoji: '🫙' },
  { name: 'Moldovia',     emoji: '🌍' },
  { name: 'Sculpton',     emoji: '✏️' },
]

export const MMU_CARDS = {
  shield:      { id: 'shield',      label: '🛡️ Shield',        mode: 'auto',   desc: 'Automatically blocks the first missile fired at you this round.' },
  heatseeker:  { id: 'heatseeker',  label: '🎯 Heatseeker',     mode: 'manual', desc: 'Activate to make one of your missiles bypass enemy defences — guaranteed hit.' },
  intelreveal: { id: 'intelreveal', label: '🔍 Intel Reveal',   mode: 'auto',   desc: 'Your spy report this round is guaranteed 100% accurate — no fabricated intel.' },
  radar:       { id: 'radar',       label: '📡 Radar',          mode: 'auto',   desc: 'You will see exactly how many missiles are targeting you before they launch.' },
}

function generateMMUIntel(forPlayerId, game) {
  const aliveMap = game.mmuAlive || {}
  const alivePlayers = Object.entries(aliveMap).filter(([, v]) => v).map(([id]) => id)
  const others = alivePlayers.filter(id => id !== forPlayerId)
  if (others.length === 0) return { text: 'No intelligence available.', isFabricated: false }

  // Intel Reveal card = guaranteed accurate
  const hasRevealCard = game.mmuCards?.[forPlayerId] === 'intelreveal'
  const isFabricated = hasRevealCard ? false : Math.random() < 0.25

  const subjectId = others[Math.floor(Math.random() * others.length)]
  const subjectNation = game.mmuNations?.[subjectId] || { name: 'Unknown', emoji: '?' }
  const subjectLabel = `${subjectNation.emoji} ${subjectNation.name}`

  const intelType = Math.floor(Math.random() * 5)
  let text = ''

  if (!isFabricated) {
    switch (intelType) {
      case 0: {
        const tgts = game.mmuTargets?.[subjectId] || []
        if (tgts.length === 0) {
          text = `${subjectLabel} is holding fire this round.`
        } else {
          const tgtNation = game.mmuNations?.[tgts[0]]
          text = tgts[0] === forPlayerId
            ? `⚠️ ${subjectLabel} has you in their sights!`
            : `${subjectLabel} is targeting ${tgtNation ? tgtNation.emoji + ' ' + tgtNation.name : 'an unknown nation'}.`
        }
        break
      }
      case 1: {
        const m = game.mmuMissiles?.[subjectId] || 0
        text = `${subjectLabel} has ${m} missile${m !== 1 ? 's' : ''} in their arsenal.`
        break
      }
      case 2: {
        const d = game.mmuDefense?.[subjectId] || 10
        text = `${subjectLabel}'s anti-air defence is at ${d}%.`
        break
      }
      case 3: {
        const inv = game.mmuInvestChoices?.[subjectId]
        if (inv?.missile) text = `${subjectLabel} just acquired a new missile this round! ⚡`
        else if (inv?.defense) text = `${subjectLabel} upgraded their defences this round. 🛡️`
        else text = `${subjectLabel} didn't invest in upgrades this round.`
        break
      }
      case 4: {
        const attackers = alivePlayers.filter(id => id !== forPlayerId && (game.mmuTargets?.[id] || []).includes(forPlayerId))
        if (attackers.length > 0) {
          const atkNation = game.mmuNations?.[attackers[0]] || { emoji: '?', name: '?' }
          text = `🚨 You are being targeted by ${atkNation.emoji} ${atkNation.name}!`
        } else {
          text = 'No missiles are currently aimed at your territory.'
        }
        break
      }
      default: text = 'Intelligence reports are inconclusive.'
    }
  } else {
    // Fabricated — plausible but wrong
    switch (intelType) {
      case 0: {
        const fakeTgt = others.filter(id => id !== subjectId)[0] || subjectId
        const fakeTgtNation = game.mmuNations?.[fakeTgt] || { emoji: '?', name: '?' }
        text = `${subjectLabel} is reportedly targeting ${fakeTgtNation.emoji} ${fakeTgtNation.name}. (unverified)`
        break
      }
      case 1: {
        const fakeM = Math.floor(Math.random() * 4)
        text = `${subjectLabel} reportedly has ${fakeM} missile${fakeM !== 1 ? 's' : ''}. (unverified)`
        break
      }
      case 2: {
        const fakeD = [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)]
        text = `${subjectLabel}'s defence is supposedly at ${fakeD}%. (unverified)`
        break
      }
      case 3: {
        text = `${subjectLabel} has allegedly stockpiled extra missiles. (unverified)`
        break
      }
      case 4: {
        text = 'Sources claim you are being targeted this round. (unverified)'
        break
      }
      default: text = 'Intelligence reports are inconclusive. (unverified)'
    }
  }

  // Radar card: append targeting count
  const hasRadar = game.mmuCards?.[forPlayerId] === 'radar'
  if (hasRadar) {
    const incomingCount = alivePlayers.filter(id => id !== forPlayerId && (game.mmuTargets?.[id] || []).includes(forPlayerId)).length
    text += incomingCount > 0
      ? `\n📡 Radar: ${incomingCount} missile${incomingCount !== 1 ? 's are' : ' is'} targeting you!`
      : '\n📡 Radar: No missiles detected heading your way.'
  }

  return { text, isFabricated }
}

function calculateMMUResolution(game) {
  const aliveSet = new Set(
    Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
  )
  const finalTargets = game.mmuFinalTargets || {}
  const defense = game.mmuDefense || {}
  const cards = game.mmuCards || {}
  const heatseekerUsed = game.mmuHeatseekerUsed || {}

  const events = []
  const pendingKills = new Set()
  const shieldUsed = new Set()
  const shieldHolders = new Set(
    Object.entries(cards).filter(([, v]) => v === 'shield').map(([id]) => id)
  )

  for (const [attackerId, targetList] of Object.entries(finalTargets)) {
    if (!aliveSet.has(attackerId)) continue
    const usesHeatseeker = heatseekerUsed[attackerId] && cards[attackerId] === 'heatseeker'

    for (let i = 0; i < (targetList || []).length; i++) {
      const targetId = targetList[i]
      if (!targetId || !aliveSet.has(targetId)) {
        events.push({ type: 'wasted', attacker: attackerId, target: targetId || null, delay: Math.floor(Math.random() * 8000) + 1000 })
        continue
      }
      if (shieldHolders.has(targetId) && !shieldUsed.has(targetId)) {
        shieldUsed.add(targetId)
        events.push({ type: 'shielded', attacker: attackerId, target: targetId, delay: Math.floor(Math.random() * 8000) + 1000 })
        continue
      }
      if (usesHeatseeker && i === 0) {
        events.push({ type: 'hit', attacker: attackerId, target: targetId, heatseeker: true, delay: Math.floor(Math.random() * 8000) + 1000 })
        pendingKills.add(targetId)
        continue
      }
      const defPct = defense[targetId] || 10
      if (Math.random() * 100 < defPct) {
        events.push({ type: 'intercepted', attacker: attackerId, target: targetId, delay: Math.floor(Math.random() * 8000) + 1000 })
      } else {
        events.push({ type: 'hit', attacker: attackerId, target: targetId, delay: Math.floor(Math.random() * 8000) + 1000 })
        pendingKills.add(targetId)
      }
    }
  }

  events.sort((a, b) => a.delay - b.delay)

  // Score changes: surviving a hit attempt = +50, successfully hitting = +25
  const scoreChanges = {}
  events.forEach(e => {
    if ((e.type === 'intercepted' || e.type === 'shielded') && !pendingKills.has(e.target)) {
      scoreChanges[e.target] = (scoreChanges[e.target] || 0) + 50
    }
    if (e.type === 'hit' && !pendingKills.has(e.attacker)) {
      scoreChanges[e.attacker] = (scoreChanges[e.attacker] || 0) + 25
    }
  })

  return { events, kills: Array.from(pendingKills), scoreChanges }
}

function dealMMUCards(alivePlayers, existingCards) {
  const TYPES = Object.keys(MMU_CARDS)
  const next = {}
  alivePlayers.forEach(id => {
    // Unused cards expire; deal fresh
    next[id] = Math.random() < 0.5 ? TYPES[Math.floor(Math.random() * TYPES.length)] : null
  })
  return next
}
// ── end Model Model UN helpers ─────────────────────────────────────────────────

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

// ── initial powerups — everyone starts with one Double Points ────────────────────
function buildInitialPowerups() {
  return { doublePoints: 1 }
}

// No powerups are dealt between rounds — double points is a one-time starting gift
function buildDealPowerupUpdates(_code, _game) {
  return {}
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

  const kickPlayer = useCallback(async (code, playerId) => {
    await remove(ref(db, `games/${code}/players/${playerId}`))
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

  // Lock in a genre — always goes to game-intro first so players see the rules screen.
  // beginRound (below) handles the actual game-type-specific setup when host taps "Let's Go".
  const selectGenre = useCallback(async (code, game, genreId, genreName, genreEmoji, gameType, gameColor) => {
    await update(ref(db), {
      [`games/${code}/currentGenre`]: { id: genreId, name: genreName, emoji: genreEmoji, gameType, color: gameColor },
      [`games/${code}/powerupRound`]: {},
      [`games/${code}/state`]: 'game-intro',
    })
  }, [])

  // Transition from game-intro to the actual round. Handles per-game-type setup that was
  // previously in selectGenre. For whod, setup is combined into one Firebase update to
  // prevent the "!phase" loading flash on player phones.
  const beginRound = useCallback(async (code, game) => {
    const gameType = game.currentGenre?.gameType
    if (gameType === 'lawyers') {
      await update(ref(db, `games/${code}`), { state: 'powerup-select' })
    } else if (gameType === 'croc') {
      const count = game?.settings?.questionsPerRound || 8
      const questions = getCrocQuestions(count)
      const submitSeconds = game?.settings?.crocSubmitSeconds || 60
      await update(ref(db, `games/${code}`), {
        state: 'quiz',
        crocPhase: 'submit',
        crocQIndex: 0,
        crocQuestions: questions,
        crocCurrentQ: questions[0],
        crocBluffs: {},
        crocOptions: [],
        crocVotes: {},
        crocScoreDeltas: {},
        crocCorrectVoters: [],
        crocNoneRight: false,
        crocUniqueKnowledge: null,
        crocRevealIdx: -1,
        crocCorrectSubmitters: {},
        crocTimerEnds: Date.now() + submitSeconds * 1000,
      })
    } else if (gameType === 'whod') {
      // Combine whodunnit setup + state change into one atomic update so WhodunnitScreen
      // never mounts with an empty whodPhase.
      const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
      if (players.length < 2) return
      const imposterId = players[Math.floor(Math.random() * players.length)].id
      const genreData = getGenreById(game.currentGenre?.id)
      const pairs = genreData?.pairs || []
      const pair = pairs[Math.floor(Math.random() * pairs.length)] || { normal: 'What is your favourite film?', imposter: 'What is your favourite TV show?' }
      await update(ref(db, `games/${code}`), {
        state: 'quiz',
        whodPhase: 'answer',
        whodImposterId: imposterId,
        whodPrompt: pair.normal,
        whodImposterPrompt: pair.imposter,
        whodAnswers: {},
        whodVotes: {},
        whodStartAt: Date.now(),
        whodCount: 1,
      })
    } else {
      await update(ref(db, `games/${code}`), {
        state: 'quiz',
        currentQIndex: 0,
        currentQ: null,
      })
    }
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
    // Don't overwrite 'gamescreen' role — if the old host is already the TV screen, leave them as-is
    const fromSnap = await get(ref(db, `games/${code}/players/${fromId}/role`))
    const fromRole = fromSnap.val()
    const updates = {
      [`games/${code}/hostId`]: toId,
      [`games/${code}/players/${toId}/role`]: 'host',
    }
    if (fromRole !== 'gamescreen') {
      updates[`games/${code}/players/${fromId}/role`] = 'player'
    }
    await update(ref(db), updates)
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
        drawerId: null,
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
      [`games/${code}/fdPhase`]: null,
      [`games/${code}/fdTargetColor`]: null,
      [`games/${code}/fdSubmissions`]: {},
      [`games/${code}/fdScoreMap`]: {},
      [`games/${code}/fdCount`]: 0,
      [`games/${code}/mmuPhase`]: null,
      [`games/${code}/mmuRound`]: 0,
      [`games/${code}/mmuNations`]: {},
      [`games/${code}/mmuMissiles`]: {},
      [`games/${code}/mmuDefense`]: {},
      [`games/${code}/mmuAlive`]: {},
      [`games/${code}/mmuPrizePool`]: 0,
      [`games/${code}/mmuTargets`]: {},
      [`games/${code}/mmuFinalTargets`]: {},
      [`games/${code}/mmuIntel`]: {},
      [`games/${code}/mmuInvestChoices`]: {},
      [`games/${code}/mmuInvestLocked`]: {},
      [`games/${code}/mmuTargetsLocked`]: {},
      [`games/${code}/mmuNegotiateReady`]: {},
      [`games/${code}/mmuCards`]: {},
      [`games/${code}/mmuHeatseekerUsed`]: {},
      [`games/${code}/mmuResolution`]: null,
      [`games/${code}/mmuSplitSteal`]: {},
      [`games/${code}/mmuTruceVotes`]: {},
      [`games/${code}/mmuKillLog`]: [],
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
    await update(ref(db, `games/${code}`), { jokePhase: 'vote', jokePromptStartAt: Date.now() })
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
    const total = agrees + disagrees || 1
    const majority = agrees >= disagrees ? 'agree' : 'disagree'
    // Uniqueness scoring: the rarer your answer, the more points you earn.
    // Each player earns Math.round((oppositeCount / total) * 150) pts.
    // Abstainers get 0. Double if powerupRound active.
    const updates = {}
    players.forEach(p => {
      const myVote = votes[p.id]
      if (!myVote) return
      const oppositeCount = myVote === 'agree' ? disagrees : agrees
      const base = Math.round((oppositeCount / total) * 150)
      if (base <= 0) return
      const pts = base * (game?.powerupRound?.[p.id] ? 2 : 1)
      updates[`games/${code}/players/${p.id}/score`] = (p.score || 0) + pts
      updates[`games/${code}/players/${p.id}/roundScore`] = (p.roundScore || 0) + pts
    })
    // Compute per-player points for display on all devices
    const playerPts = {}
    players.forEach(p => {
      const v = votes[p.id]
      if (!v) return
      const opposite = v === 'agree' ? disagrees : agrees
      const base = Math.round((opposite / total) * 150)
      if (base > 0) playerPts[p.id] = base * (game?.powerupRound?.[p.id] ? 2 : 1)
    })
    updates[`games/${code}/htResults`] = { majority, agrees, disagrees, playerPts }
    updates[`games/${code}/htPhase`] = 'results'
    await update(ref(db), updates)
    return { majority, agrees, disagrees, playerPts }
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
    await update(ref(db, `games/${code}`), { whodPhase: 'vote', whodStartAt: Date.now() })
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
    await update(ref(db, `games/${code}`), { fgPhase: 'vote', fgVoteStartAt: Date.now() })
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

  // ── F-Art Direction ──────────────────────────────────────────────────────────
  // Phases: 'show' (colour visible ~4s) → 'pick' (colour wheel, ~20s) → 'reveal'
  // Points: closest match = 100, 2nd = 75, 3rd = 50, 4th+ = 0

  const startFartDirection = useCallback(async (code, game) => {
    const color = generateFDColor()
    await update(ref(db, `games/${code}`), {
      fdPhase: 'show',
      fdTargetColor: color,
      fdShowStartAt: Date.now(),
      fdSubmissions: {},
      fdScoreMap: {},
      fdCount: 1,
    })
  }, [])

  const advanceFDToPick = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), {
      fdPhase: 'pick',
      fdPickStartAt: Date.now(),
    })
  }, [])

  const submitFartColor = useCallback(async (code, playerId, hex) => {
    await update(ref(db, `games/${code}/fdSubmissions`), { [playerId]: hex })
  }, [])

  const revealFartResults = useCallback(async (code, game) => {
    const targetColor = game.fdTargetColor
    const submissions = game.fdSubmissions || {}
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')

    // Rank by closeness (lowest distance = best)
    const ranked = players
      .map(p => ({
        id: p.id,
        color: submissions[p.id] || null,
        distance: submissions[p.id] ? colorDistanceFD(targetColor, submissions[p.id]) : Infinity,
      }))
      .sort((a, b) => a.distance - b.distance)

    const POINTS = [100, 75, 50]
    const scoreMap = {}
    const updates = {}

    ranked.forEach((pd, i) => {
      const pts = pd.color ? (POINTS[i] || 0) : 0
      scoreMap[pd.id] = { pts, rank: i + 1, distance: Math.round(pd.distance), color: pd.color }
      if (pts > 0) {
        const p = game.players[pd.id]
        if (p) {
          updates[`games/${code}/players/${pd.id}/score`] = (p.score || 0) + pts
          updates[`games/${code}/players/${pd.id}/roundScore`] = (p.roundScore || 0) + pts
        }
      }
    })

    updates[`games/${code}/fdPhase`] = 'reveal'
    updates[`games/${code}/fdScoreMap`] = scoreMap
    await update(ref(db), updates)
  }, [])

  const nextFartColor = useCallback(async (code, game) => {
    const roundLimit = game.settings?.questionsPerRound || 7
    const count = game.fdCount || 1
    if (count >= roundLimit) {
      await update(ref(db, `games/${code}`), { state: 'round-over' })
      return
    }
    const color = generateFDColor()
    await update(ref(db, `games/${code}`), {
      fdPhase: 'show',
      fdTargetColor: color,
      fdShowStartAt: Date.now(),
      fdSubmissions: {},
      fdScoreMap: {},
      fdCount: count + 1,
    })
  }, [])

  const endFDRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Model Model UN ────────────────────────────────────────────────────────────
  const startModelModelUN = useCallback(async (code, game) => {
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const mmuNations = {}; const mmuMissiles = {}; const mmuDefense = {}; const mmuAlive = {}
    shuffled.forEach((p, i) => {
      const n = MMU_NATIONS[i % MMU_NATIONS.length]
      mmuNations[p.id] = { name: n.name, emoji: n.emoji }
      mmuMissiles[p.id] = 1
      mmuDefense[p.id] = 10
      mmuAlive[p.id] = true
    })
    await update(ref(db, `games/${code}`), {
      state: 'quiz',
      mmuPhase: 'rules',
      mmuRound: 1,
      mmuPhaseStartAt: Date.now(),
      mmuNations,
      mmuMissiles,
      mmuDefense,
      mmuAlive,
      mmuPrizePool: players.length * 100,
      mmuTargets: {},
      mmuFinalTargets: {},
      mmuIntel: {},
      mmuInvestChoices: {},
      mmuInvestLocked: {},
      mmuTargetsLocked: {},
      mmuNegotiateReady: {},
      mmuCards: {},
      mmuHeatseekerUsed: {},
      mmuResolution: null,
      mmuSplitSteal: {},
      mmuTruceVotes: {},
      mmuKillLog: [],
      mmuEliminatedOrder: [],
    })
  }, [])

  const advanceMMURules = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), {
      mmuPhase: 'invest',
      mmuPhaseStartAt: Date.now(),
      mmuInvestChoices: {},
      mmuInvestLocked: {},
    })
  }, [])

  const submitMMUInvestment = useCallback(async (code, playerId, choices, lock = false) => {
    const u = { [`games/${code}/mmuInvestChoices/${playerId}`]: choices }
    if (lock) u[`games/${code}/mmuInvestLocked/${playerId}`] = true
    await update(ref(db), u)
  }, [])

  const advanceMMUToSelect = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/mmuPhase`))
    if (snap.val() !== 'invest') return
    const updates = {}
    Object.entries(game.mmuAlive || {}).forEach(([id, alive]) => {
      if (!alive) return
      const choice = game.mmuInvestChoices?.[id] || {}
      const spent = (choice.missile ? 25 : 0) + (choice.defense ? 25 : 0)
      const saved = 50 - spent
      if (choice.missile) updates[`games/${code}/mmuMissiles/${id}`] = (game.mmuMissiles?.[id] || 0) + 1
      if (choice.defense) updates[`games/${code}/mmuDefense/${id}`] = Math.min(90, (game.mmuDefense?.[id] || 10) + 10)
      if (saved > 0) updates[`games/${code}/players/${id}/score`] = (game.players?.[id]?.score || 0) + saved
      if (saved > 0) updates[`games/${code}/players/${id}/roundScore`] = (game.players?.[id]?.roundScore || 0) + saved
    })
    updates[`games/${code}/mmuPhase`] = 'select'
    updates[`games/${code}/mmuPhaseStartAt`] = Date.now()
    updates[`games/${code}/mmuTargets`] = {}
    updates[`games/${code}/mmuTargetsLocked`] = {}
    updates[`games/${code}/mmuInvestChoices`] = {}
    updates[`games/${code}/mmuInvestLocked`] = {}
    await update(ref(db), updates)
  }, [])

  const submitMMUTargets = useCallback(async (code, playerId, targets) => {
    await update(ref(db), {
      [`games/${code}/mmuTargets/${playerId}`]: targets,
      [`games/${code}/mmuTargetsLocked/${playerId}`]: true,
    })
  }, [])

  const advanceMMUToEspionage = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/mmuPhase`))
    if (snap.val() !== 'select') return
    const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
    const mmuIntel = {}
    alivePlayers.forEach(id => { mmuIntel[id] = generateMMUIntel(id, game) })
    await update(ref(db, `games/${code}`), {
      mmuPhase: 'espionage',
      mmuPhaseStartAt: Date.now(),
      mmuIntel,
      mmuFinalTargets: game.mmuTargets || {},
    })
  }, [])

  const advanceMMUToNegotiate = useCallback(async (code) => {
    const snap = await get(ref(db, `games/${code}/mmuPhase`))
    if (snap.val() !== 'espionage') return
    await update(ref(db, `games/${code}`), {
      mmuPhase: 'negotiate',
      mmuPhaseStartAt: Date.now(),
      mmuNegotiateReady: {},
      mmuTruceVotes: {},
    })
  }, [])

  const changeMMUTargets = useCallback(async (code, playerId, targets) => {
    await update(ref(db, `games/${code}/mmuFinalTargets`), { [playerId]: targets })
  }, [])

  const submitMMUReady = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/mmuNegotiateReady`), { [playerId]: true })
  }, [])

  const proposeMMUTruce = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/mmuTruceVotes`), { [playerId]: true })
  }, [])

  const cancelMMUTruce = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/mmuTruceVotes`), { [playerId]: null })
  }, [])

  const useMMUHeatseeker = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/mmuHeatseekerUsed`), { [playerId]: true })
  }, [])

  const advanceMMUToResolve = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/mmuPhase`))
    if (snap.val() !== 'negotiate') return
    const resolution = calculateMMUResolution(game)
    const updates = {}
    // Apply score changes
    resolution.scoreChanges && Object.entries(resolution.scoreChanges).forEach(([id, pts]) => {
      updates[`games/${code}/players/${id}/score`] = (game.players?.[id]?.score || 0) + pts
      updates[`games/${code}/players/${id}/roundScore`] = (game.players?.[id]?.roundScore || 0) + pts
    })
    // Apply kills — eliminate players
    const newAlive = { ...(game.mmuAlive || {}) }
    const killLog = [...(game.mmuKillLog || [])]
    const eliminatedOrder = [...(game.mmuEliminatedOrder || [])]
    resolution.kills.forEach(id => {
      newAlive[id] = false
      eliminatedOrder.push(id)
      const attacker = resolution.events.find(e => e.type === 'hit' && e.target === id)?.attacker
      killLog.push({ victim: id, attacker: attacker || null, round: game.mmuRound || 1 })
    })
    updates[`games/${code}/mmuAlive`] = newAlive
    updates[`games/${code}/mmuKillLog`] = killLog
    updates[`games/${code}/mmuEliminatedOrder`] = eliminatedOrder
    updates[`games/${code}/mmuResolution`] = resolution
    updates[`games/${code}/mmuPhase`] = 'resolve'
    updates[`games/${code}/mmuPhaseStartAt`] = Date.now()
    await update(ref(db), updates)
  }, [])

  const checkMMUAfterResolve = useCallback(async (code, game) => {
    // Read phase + alive map from Firebase live to avoid stale closure bugs
    const [phaseSnap, aliveSnap] = await Promise.all([
      get(ref(db, `games/${code}/mmuPhase`)),
      get(ref(db, `games/${code}/mmuAlive`)),
    ])
    if (phaseSnap.val() !== 'resolve') return
    const aliveMap = aliveSnap.val() || game.mmuAlive || {}
    const alivePlayers = Object.entries(aliveMap).filter(([, v]) => v).map(([id]) => id)

    if (alivePlayers.length <= 1) {
      // 0 survivors (mutual destruction) or 1 winner
      const updates = {}
      if (alivePlayers.length === 1) {
        const winnerId = alivePlayers[0]
        updates[`games/${code}/players/${winnerId}/score`] = (game.players?.[winnerId]?.score || 0) + (game.mmuPrizePool || 0)
        updates[`games/${code}/players/${winnerId}/roundScore`] = (game.players?.[winnerId]?.roundScore || 0) + (game.mmuPrizePool || 0)
      }
      updates[`games/${code}/mmuPhase`] = 'gameover'
      updates[`games/${code}/mmuPhaseStartAt`] = Date.now()
      await update(ref(db), updates)

    } else if (alivePlayers.length === 2) {
      // Two nations remain. Auto-resolve based on whether both voted for truce in negotiate.
      // No secondary menu — truce vote IS the split/steal decision.
      const truceVotes = game.mmuTruceVotes || {}
      const bothTruced = alivePlayers.every(id => !!truceVotes[id])
      const pool = game.mmuPrizePool || 0

      if (bothTruced) {
        // Both signed truce → split pot, end game
        const share = Math.floor(pool / 2)
        const updates = {}
        alivePlayers.forEach(id => {
          updates[`games/${code}/players/${id}/score`] = (game.players?.[id]?.score || 0) + share
          updates[`games/${code}/players/${id}/roundScore`] = (game.players?.[id]?.roundScore || 0) + share
        })
        updates[`games/${code}/mmuPhase`] = 'gameover'
        updates[`games/${code}/mmuPhaseStartAt`] = Date.now()
        updates[`games/${code}/mmuSplitResult`] = { stealers: [], splitters: alivePlayers }
        await update(ref(db), updates)
      } else {
        // No truce — deal cards and fight another round
        const newCards = dealMMUCards(alivePlayers, game.mmuCards || {})
        await update(ref(db, `games/${code}`), {
          mmuPhase: 'card',
          mmuPhaseStartAt: Date.now(),
          mmuCards: newCards,
          mmuHeatseekerUsed: {},
        })
      }

    } else {
      // 3+ survivors — deal cards and go to next round
      const newCards = dealMMUCards(alivePlayers, game.mmuCards || {})
      await update(ref(db, `games/${code}`), {
        mmuPhase: 'card',
        mmuPhaseStartAt: Date.now(),
        mmuCards: newCards,
        mmuHeatseekerUsed: {},
      })
    }
  }, [])

  const advanceMMUToNextRound = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/mmuPhase`))
    if (snap.val() !== 'card') return
    await update(ref(db, `games/${code}`), {
      mmuPhase: 'invest',
      mmuPhaseStartAt: Date.now(),
      mmuRound: (game.mmuRound || 1) + 1,
      mmuTargets: {},
      mmuFinalTargets: {},
      mmuIntel: {},
      mmuInvestChoices: {},
      mmuInvestLocked: {},
      mmuTargetsLocked: {},
      mmuNegotiateReady: {},
      mmuTruceVotes: {},
      mmuResolution: null,
      mmuSplitSteal: {},
    })
  }, [])

  const submitMMUSplitSteal = useCallback(async (code, playerId, choice) => {
    await update(ref(db, `games/${code}/mmuSplitSteal`), { [playerId]: choice })
  }, [])

  const finalizeMMUSplitSteal = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/mmuPhase`))
    if (snap.val() !== 'splitsteal') return
    const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
    const votes = game.mmuSplitSteal || {}
    const updates = {}
    const stealers = alivePlayers.filter(id => votes[id] === 'steal')
    const splitters = alivePlayers.filter(id => votes[id] === 'split')
    const pool = game.mmuPrizePool || 0
    if (stealers.length === 0 && splitters.length === alivePlayers.length) {
      // All split → share pot
      const share = Math.floor(pool / alivePlayers.length)
      alivePlayers.forEach(id => {
        updates[`games/${code}/players/${id}/score`] = (game.players?.[id]?.score || 0) + share
        updates[`games/${code}/players/${id}/roundScore`] = (game.players?.[id]?.roundScore || 0) + share
      })
    } else if (stealers.length === 1) {
      // One stealer wins entire pot
      const id = stealers[0]
      updates[`games/${code}/players/${id}/score`] = (game.players?.[id]?.score || 0) + pool
      updates[`games/${code}/players/${id}/roundScore`] = (game.players?.[id]?.roundScore || 0) + pool
    }
    // Both steal → nobody wins pot; scores unchanged
    updates[`games/${code}/mmuPhase`] = 'gameover'
    updates[`games/${code}/mmuPhaseStartAt`] = Date.now()
    updates[`games/${code}/mmuSplitResult`] = { stealers, splitters }
    await update(ref(db), updates)
  }, [])

  const checkMMUTruceVotes = useCallback(async (code, game) => {
    const alivePlayers = Object.entries(game.mmuAlive || {}).filter(([, v]) => v).map(([id]) => id)
    const votes = game.mmuTruceVotes || {}
    if (alivePlayers.length < 2 || !alivePlayers.every(id => votes[id])) return
    // All alive players voted for truce → split pot equally
    const pool = game.mmuPrizePool || 0
    const share = Math.floor(pool / alivePlayers.length)
    const updates = {}
    alivePlayers.forEach(id => {
      updates[`games/${code}/players/${id}/score`] = (game.players?.[id]?.score || 0) + share
      updates[`games/${code}/players/${id}/roundScore`] = (game.players?.[id]?.roundScore || 0) + share
    })
    updates[`games/${code}/mmuPhase`] = 'gameover'
    updates[`games/${code}/mmuPhaseStartAt`] = Date.now()
    updates[`games/${code}/mmuTruceResult`] = { players: alivePlayers, share }
    await update(ref(db), updates)
  }, [])

  const endMMUGame = useCallback(async (code) => {
    const snap = await get(ref(db, `games/${code}/mmuPhase`))
    if (snap.val() !== 'gameover') return
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  // ── Pause request helpers ─────────────────────────────────────────────────────
  // ── Speed Briefs ──────────────────────────────────────────────────────────────
  const startSpeedBriefs = useCallback(async (code, game) => {
    const used = game.sbUsedBriefs || []
    const pool = SB_BRIEFS.filter(b => !used.includes(b.name))
    const brief = (pool.length > 0 ? pool : SB_BRIEFS)[Math.floor(Math.random() * (pool.length || SB_BRIEFS.length))]
    await update(ref(db, `games/${code}`), {
      state: 'quiz',
      sbPhase: 'input',
      sbStartAt: Date.now(),
      sbBrief: brief,
      sbRound: (game.sbRound || 0) + 1,
      sbSubmissions: null,
      sbVotes: null,
      sbResults: null,
      sbRevealIdx: 0,
      sbRevealIdxAt: null,
      sbVoteStartAt: null,
      sbUsedBriefs: [...used, brief.name],
    })
  }, [])

  const submitSBTagline = useCallback(async (code, playerId, tagline) => {
    await update(ref(db, `games/${code}/sbSubmissions`), { [playerId]: tagline })
  }, [])

  const advanceSBToReveal = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/sbPhase`))
    if (snap.val() !== 'input') return
    await update(ref(db, `games/${code}`), { sbPhase: 'reveal', sbRevealIdx: 0, sbRevealIdxAt: Date.now() })
  }, [])

  const advanceSBReveal = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/sbPhase`))
    if (snap.val() !== 'reveal') return
    const subIds = Object.keys(game.sbSubmissions || {}).sort()
    const nextIdx = (game.sbRevealIdx || 0) + 1
    if (nextIdx >= subIds.length) {
      await update(ref(db, `games/${code}`), { sbPhase: 'vote', sbVoteStartAt: Date.now() })
    } else {
      await update(ref(db, `games/${code}`), { sbRevealIdx: nextIdx, sbRevealIdxAt: Date.now() })
    }
  }, [])

  const submitSBVote = useCallback(async (code, voterId, targetId) => {
    await update(ref(db, `games/${code}/sbVotes`), { [voterId]: targetId })
  }, [])

  const revealSBResults = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/sbPhase`))
    if (snap.val() !== 'vote') return
    const submissions = game.sbSubmissions || {}
    const votes = game.sbVotes || {}
    const players = Object.values(game.players || {}).filter(p => p.role !== 'gamescreen')
    const playerCount = players.length
    const qmEnabled = game.settings?.questionMaster

    const voteTotals = {}
    for (const [voterId, targetId] of Object.entries(votes)) {
      if (!targetId) continue
      const voter = players.find(p => p.id === voterId)
      const weight = (qmEnabled && voter?.role === 'host') ? Math.max(1, Math.floor(playerCount / 2)) : 1
      voteTotals[targetId] = (voteTotals[targetId] || 0) + weight
    }

    const ranked = Object.keys(submissions).sort()
      .map(pid => ({ pid, votes: voteTotals[pid] || 0 }))
      .sort((a, b) => b.votes - a.votes)

    const scoreChanges = {}
    for (const pid of Object.keys(submissions)) scoreChanges[pid] = 25  // participation
    for (const { pid, votes: v } of ranked) scoreChanges[pid] = (scoreChanges[pid] || 0) + (v * 200)
    if (ranked[0]?.votes > 0) scoreChanges[ranked[0].pid] = (scoreChanges[ranked[0].pid] || 0) + 300
    if (ranked[1]?.votes > 0) scoreChanges[ranked[1].pid] = (scoreChanges[ranked[1].pid] || 0) + 150
    if (ranked[2]?.votes > 0) scoreChanges[ranked[2].pid] = (scoreChanges[ranked[2].pid] || 0) + 75

    const updates = {}
    for (const [pid, pts] of Object.entries(scoreChanges)) {
      if (pts > 0) updates[`games/${code}/players/${pid}/score`] = (game.players[pid]?.score || 0) + pts
    }
    updates[`games/${code}/sbPhase`] = 'results'
    updates[`games/${code}/sbResults`] = { ranked, voteTotals, scoreChanges }
    await update(ref(db), updates)
    return { ranked, voteTotals, scoreChanges }
  }, [])

  const nextSBRound = useCallback(async (code, game) => {
    const snap = await get(ref(db, `games/${code}/sbPhase`))
    if (snap.val() !== 'results') return
    const used = game.sbUsedBriefs || []
    const pool = SB_BRIEFS.filter(b => !used.includes(b.name))
    const brief = (pool.length > 0 ? pool : SB_BRIEFS)[Math.floor(Math.random() * (pool.length || SB_BRIEFS.length))]
    await update(ref(db, `games/${code}`), {
      sbPhase: 'input', sbStartAt: Date.now(), sbBrief: brief,
      sbRound: (game.sbRound || 0) + 1,
      sbSubmissions: null, sbVotes: null, sbResults: null,
      sbRevealIdx: 0, sbRevealIdxAt: null, sbVoteStartAt: null,
      sbUsedBriefs: [...used, brief.name],
    })
  }, [])

  const endSBRound = useCallback(async (code) => {
    await update(ref(db, `games/${code}`), { state: 'round-over' })
  }, [])

  const requestPause = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/pauseRequests`), { [playerId]: true })
  }, [])

  const cancelPauseRequest = useCallback(async (code, playerId) => {
    await update(ref(db, `games/${code}/pauseRequests`), { [playerId]: null })
  }, [])

  const unpauseGame = useCallback(async (code) => {
    const game = useStore.getState().game
    const pausedAt = game?.pausedAt
    const updates = { gamePaused: false, pauseRequests: {}, pausedAt: null }
    if (pausedAt) {
      const delta = Date.now() - pausedAt
      const TIMER_FIELDS = [
        'crocTimerEnds', 'whodStartAt', 'tfStartAt', 'ouStartAt', 'ouOrderStart',
        'jokePromptStartAt', 'htStartAt', 'fgStartAt', 'fgVoteStartAt',
        'fdShowStartAt', 'fdPickStartAt', 'mmuPhaseStartAt', 'sbStartAt',
        'sbVoteStartAt', 'sbRevealIdxAt',
      ]
      for (const field of TIMER_FIELDS) {
        if (game[field] != null) updates[field] = game[field] + delta
      }
    }
    await update(ref(db, `games/${code}`), updates)
  }, [])

  // ── INTERIOR CROCODILE ARCHITECTURE ─────────────────────────────────────────

  const submitCrocBluff = useCallback(async (code, playerId, bluff) => {
    await update(ref(db), { [`games/${code}/crocBluffs/${playerId}`]: bluff.trim() })
  }, [])

  const revealCrocOptions = useCallback(async (code, game) => {
    const bluffs = game?.crocBluffs || {}
    const currentQ = game?.crocCurrentQ
    if (!currentQ) return
    const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
    const realNorm = norm(currentQ.a)
    const options = [{ text: currentQ.a, isReal: true, authorId: null, isHouse: false }]
    Object.entries(bluffs).forEach(([authorId, bluffText]) => {
      if (norm(bluffText) !== realNorm) {
        options.push({ text: bluffText, isReal: false, authorId, isHouse: false })
      }
    })
    // Always add 2 house lies from the question's houseLies array
    const available = [...(currentQ.houseLies || [])].sort(() => Math.random() - 0.5)
    available.slice(0, 2).forEach(lie => {
      options.push({ text: lie, isReal: false, authorId: null, isHouse: true })
    })
    options.sort(() => Math.random() - 0.5)
    await update(ref(db), {
      [`games/${code}/crocPhase`]: 'vote',
      [`games/${code}/crocOptions`]: options,
      [`games/${code}/crocVotes`]: {},
    })
  }, [])

  const submitCrocVote = useCallback(async (code, playerId, optionIdx) => {
    await update(ref(db), { [`games/${code}/crocVotes/${playerId}`]: optionIdx })
  }, [])

  const revealCrocResults = useCallback(async (code, game) => {
    const players = Object.values(game?.players || {}).filter(p => p.role === 'player')
    const options = game?.crocOptions || []
    const votes = game?.crocVotes || {}
    const correctSubmitters = game?.crocCorrectSubmitters || {}
    const realIdx = options.findIndex(o => o.isReal)
    const correctVoters = Object.entries(votes)
      .filter(([, idx]) => Number(idx) === realIdx)
      .map(([pid]) => pid)
    const noneRight = correctVoters.length === 0
    const uniqueKnowledge = correctVoters.length === 1 ? correctVoters[0] : null
    const scoreDeltas = {}
    players.forEach(p => {
      let delta = 0
      // Bonus for knowing the real answer during bluff phase
      if (correctSubmitters[p.id]) delta += 100
      // Truth points: voted for the real answer (+300)
      const myVote = votes[p.id]
      if (myVote !== undefined && myVote !== null) {
        if (Number(myVote) === realIdx) delta += 300
        // House lie or wrong player bluff: no points, no penalty
      }
      // Fooling points: +200 per player who voted for your lie
      const myOptIdx = options.findIndex(o => !o.isReal && !o.isHouse && o.authorId === p.id)
      if (myOptIdx >= 0) {
        delta += Object.values(votes).filter(v => Number(v) === myOptIdx).length * 200
      }
      scoreDeltas[p.id] = delta
    })
    // Unique knowledge bonus
    if (uniqueKnowledge) {
      scoreDeltas[uniqueKnowledge] = (scoreDeltas[uniqueKnowledge] || 0) + 75
    }
    const updates = {}
    players.forEach(p => {
      const d = scoreDeltas[p.id] || 0
      updates[`games/${code}/players/${p.id}/score`] = (p.score || 0) + d
      updates[`games/${code}/players/${p.id}/roundScore`] = (p.roundScore || 0) + d
    })
    updates[`games/${code}/crocPhase`] = 'reveal'
    updates[`games/${code}/crocScoreDeltas`] = scoreDeltas
    updates[`games/${code}/crocCorrectVoters`] = correctVoters
    updates[`games/${code}/crocNoneRight`] = noneRight
    updates[`games/${code}/crocUniqueKnowledge`] = uniqueKnowledge || null
    updates[`games/${code}/crocRevealIdx`] = 0
    await update(ref(db), updates)
  }, [])

  const submitCrocCorrectAnswer = useCallback(async (code, playerId) => {
    await update(ref(db), { [`games/${code}/crocCorrectSubmitters/${playerId}`]: true })
  }, [])

  const advanceCrocReveal = useCallback(async (code, game) => {
    const current = game?.crocRevealIdx ?? 0
    await update(ref(db), { [`games/${code}/crocRevealIdx`]: current + 1 })
  }, [])

  const nextCrocQuestion = useCallback(async (code, game) => {
    const questions = game?.crocQuestions || []
    const nextIdx = (game?.crocQIndex || 0) + 1
    if (nextIdx >= questions.length) {
      await update(ref(db, `games/${code}`), { state: 'round-over' })
      return
    }
    const submitSeconds = game?.settings?.crocSubmitSeconds || 60
    await update(ref(db), {
      [`games/${code}/crocPhase`]: 'submit',
      [`games/${code}/crocQIndex`]: nextIdx,
      [`games/${code}/crocCurrentQ`]: questions[nextIdx],
      [`games/${code}/crocBluffs`]: {},
      [`games/${code}/crocOptions`]: [],
      [`games/${code}/crocVotes`]: {},
      [`games/${code}/crocScoreDeltas`]: {},
      [`games/${code}/crocCorrectVoters`]: [],
      [`games/${code}/crocNoneRight`]: false,
      [`games/${code}/crocUniqueKnowledge`]: null,
      [`games/${code}/crocRevealIdx`]: -1,
      [`games/${code}/crocCorrectSubmitters`]: {},
      [`games/${code}/crocTimerEnds`]: Date.now() + submitSeconds * 1000,
    })
  }, [])

  return {
    createGame, joinGame, subscribeToGame, updateGame, updatePlayer, kickPlayer,
    dealGenres, voteForGenre, selectGenre, beginRound,
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
    startFartDirection, advanceFDToPick, submitFartColor, revealFartResults, nextFartColor, endFDRound,
    startSpeedBriefs, submitSBTagline, advanceSBToReveal, advanceSBReveal, submitSBVote, revealSBResults, nextSBRound, endSBRound,
    startModelModelUN, advanceMMURules, submitMMUInvestment, advanceMMUToSelect,
    submitMMUTargets, advanceMMUToEspionage, advanceMMUToNegotiate,
    changeMMUTargets, submitMMUReady, proposeMMUTruce, cancelMMUTruce, useMMUHeatseeker,
    advanceMMUToResolve, checkMMUAfterResolve, advanceMMUToNextRound,
    submitMMUSplitSteal, finalizeMMUSplitSteal, checkMMUTruceVotes, endMMUGame,
    requestPause, cancelPauseRequest, unpauseGame,
    submitCrocBluff, submitCrocCorrectAnswer, revealCrocOptions, submitCrocVote,
    revealCrocResults, advanceCrocReveal, nextCrocQuestion,
  }
}
