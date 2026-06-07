import { create } from 'zustand'

const DEFAULT_SETTINGS = {
  questionMaster: false,
  answerMode: 'host-judges',
  questionsPerRound: 8,
  totalRounds: 5,
  threeRandomGenres: true,
  maxPlayers: 10,
  excludedGenres: [],
  customGenres: [],
  anthropicApiKey: '',
  timers: {
    quizQuestion: 60,
    quizAnswer: 25,
    creative: 120,
    blitzPerQ: 8,
    voteReveal: 12,
    voteOpen: 30,
    genreVote: 200,
  },
  powerupCounts: {
    sneakPeek: 2,
    steal: 1,
    imposter: 2,
    plagiarism: 1,
    block: 1,
    doublePoints: 1,
  },
}

// ── session persistence ─────────────────────────────────────────────────────
// Saves critical identity + navigation to localStorage so page reloads
// (e.g. phone screen-off/browser tab refresh) restore the user to the right place.
const SESSION_KEY = 'buzzkill_session'
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
function saveSession(state) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      myId: state.myId, myName: state.myName, myAvatar: state.myAvatar,
      myRole: state.myRole, gameCode: state.gameCode,
      // Only restore to in-game screens — home/create/join are stateless
      screen: ['lobby','round-pick','powerup-select','quiz-host','round-over','final','vote'].includes(state.screen)
        ? state.screen : null,
    }))
  } catch {}
}
const _saved = loadSession()

export const useStore = create((set, get) => ({
  // Local identity (restored from localStorage if available)
  myId: _saved?.myId || null,
  myName: _saved?.myName || '',
  myAvatar: _saved?.myAvatar || null,
  myRole: _saved?.myRole || 'player', // 'host' | 'cohost' | 'player' | 'gamescreen'
  myColor: '#e63946',

  // Game state (mirrored from Firebase)
  gameCode: _saved?.gameCode || null,
  game: null, // full Firebase game snapshot — reloaded from Firebase on mount

  // Navigation — restore to last in-game screen if we have a gameCode
  screen: (_saved?.gameCode && _saved?.screen) ? _saved.screen : 'home',

  // UI state
  toast: null,
  muted: false,
  direction: 1, // page transition direction

  setScreen: (screen, direction = 1) => set({ screen, direction }),
  setMyId: (myId) => set({ myId }),
  setMyName: (myName) => set({ myName }),
  setMyAvatar: (myAvatar) => set({ myAvatar }),
  setMyRole: (myRole) => set({ myRole }),
  setMyColor: (myColor) => set({ myColor }),
  setGameCode: (gameCode) => set({ gameCode }),
  setGame: (game) => set({ game }),
  setToast: (toast) => set({ toast }),
  setMuted: (muted) => set({ muted }),

  // Derived helpers
  getMe: () => {
    const { game, myId } = get()
    return game?.players?.[myId] || null
  },
  getSettings: () => {
    const { game } = get()
    return { ...DEFAULT_SETTINGS, ...(game?.settings || {}) }
  },
  isHost: () => {
    const { game, myId } = get()
    return game?.hostId === myId
  },
  isController: () => {
    const { myRole } = get()
    return myRole === 'host' || myRole === 'cohost'
  },
  isGameScreen: () => {
    const { myRole } = get()
    return myRole === 'gamescreen'
  },

  defaultSettings: DEFAULT_SETTINGS,
}))

export { DEFAULT_SETTINGS }

// Persist session on every state change
useStore.subscribe(saveSession)
