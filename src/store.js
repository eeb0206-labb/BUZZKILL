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
  playlist: [],
  playlistMode: false,
  aiHost: true,
  hasScreen: false,
  anthropicApiKey: '',
  elevenLabsApiKey: '',
  buzzVoiceId: '',
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
// localStorage  → persists player identity (name, avatar, id) and the last
//                 in-game screen so a page REFRESH during a game drops you back
//                 in the right place.
// sessionStorage → per-tab flag that distinguishes a *refresh* (flag already set)
//                  from a *fresh navigation* (new tab, clicked link, Netlify load).
//                  sessionStorage is wiped when the tab is closed or a new tab opens,
//                  but survives F5 / Ctrl+R within the same tab.
//
// Rule: only restore the game screen when this IS a refresh of an existing tab.
//       Fresh navigations always land on the home screen.
const SESSION_KEY   = 'buzzkill_session'
const AUDIO_KEY     = 'buzzkill_audio'
const SESSION_TAB_KEY = 'bk_tab_alive' // sessionStorage key

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
function loadAudio() {
  try { return JSON.parse(localStorage.getItem(AUDIO_KEY) || 'null') } catch { return null }
}
function saveSession(state) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      myId: state.myId, myName: state.myName, myAvatar: state.myAvatar,
      myAvatarConfig: state.myAvatarConfig,
      myRole: state.myRole, gameCode: state.gameCode,
      screen: ['lobby','round-pick','powerup-select','quiz-host','draw','round-over','final','vote'].includes(state.screen)
        ? state.screen : null,
    }))
    localStorage.setItem(AUDIO_KEY, JSON.stringify({
      sfxVolume: state.sfxVolume, musicVolume: state.musicVolume,
      sfxEnabled: state.sfxEnabled, musicEnabled: state.musicEnabled,
    }))
  } catch {}
}

// Mark this tab as alive *before* we decide whether to restore the screen.
// On first load in a new tab, sessionStorage won't have this key yet.
const _isRefresh = (() => {
  try {
    const alive = sessionStorage.getItem(SESSION_TAB_KEY)
    sessionStorage.setItem(SESSION_TAB_KEY, '1')
    return alive === '1'
  } catch { return false }
})()

const _saved = loadSession()
const _audio = loadAudio()

// Only restore an in-game screen when this is a *refresh* of an existing tab.
// Fresh navigations (new tab, shared link, Netlify cold open) always go home.
const _restoredScreen = (_isRefresh && _saved?.gameCode && _saved?.screen)
  ? _saved.screen
  : 'home'

// If this is NOT a refresh, clear stale gameCode/screen from localStorage so
// the next genuine fresh open also lands on home (belt-and-braces).
if (!_isRefresh) {
  try {
    const existing = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (existing) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...existing,
        gameCode: null,
        screen: null,
      }))
    }
  } catch {}
}

export const useStore = create((set, get) => ({
  // Local identity (restored from localStorage if available)
  myId: _saved?.myId || null,
  myName: _saved?.myName || '',
  myAvatar: _saved?.myAvatar || null,
  myAvatarConfig: _saved?.myAvatarConfig || null,
  myRole: _saved?.myRole || 'player', // 'host' | 'player' | 'gamescreen'
  myColor: '#e63946',

  // Game state (mirrored from Firebase)
  // gameCode is only kept alive for refreshes; fresh navigations get null
  gameCode: _isRefresh ? (_saved?.gameCode || null) : null,
  game: null, // full Firebase game snapshot — reloaded from Firebase on mount

  // Navigation — only restore in-game screen on a page refresh
  screen: _restoredScreen,

  // UI state
  toast: null,
  muted: false,
  direction: 1, // page transition direction

  // Volume controls (persisted in localStorage via AUDIO_KEY)
  sfxVolume: _audio?.sfxVolume ?? 0.85,
  musicVolume: _audio?.musicVolume ?? 0.6,
  sfxEnabled: _audio?.sfxEnabled ?? true,
  musicEnabled: _audio?.musicEnabled ?? true,
  gamePaused: false,

  setScreen: (screen, direction = 1) => set({ screen, direction }),
  setMyId: (myId) => set({ myId }),
  setMyName: (myName) => set({ myName }),
  setMyAvatar: (myAvatar) => set({ myAvatar }),
  setMyAvatarConfig: (myAvatarConfig) => set({ myAvatarConfig }),
  setMyRole: (myRole) => set({ myRole }),
  setMyColor: (myColor) => set({ myColor }),
  setGameCode: (gameCode) => set({ gameCode }),
  setGame: (game) => set({ game }),
  setToast: (toast) => set({ toast }),
  setMuted: (muted) => set({ muted }),
  setSfxVolume: (v) => set({ sfxVolume: v }),
  setMusicVolume: (v) => set({ musicVolume: v }),
  setSfxEnabled: (v) => set({ sfxEnabled: v }),
  setMusicEnabled: (v) => set({ musicEnabled: v }),
  setGamePaused: (v) => set({ gamePaused: v }),

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
    return myRole === 'host'
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
