import { create } from 'zustand'

const DEFAULT_SETTINGS = {
  questionMaster: true,
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

export const useStore = create((set, get) => ({
  // Local identity
  myId: null,
  myName: '',
  myAvatar: null,
  myRole: 'player', // 'host' | 'cohost' | 'player' | 'gamescreen'
  myColor: '#e63946',

  // Game state (mirrored from Firebase)
  gameCode: null,
  game: null, // full Firebase game snapshot

  // Navigation
  screen: 'home', // matches screen names

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
