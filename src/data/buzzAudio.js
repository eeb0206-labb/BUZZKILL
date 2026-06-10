/**
 * buzzAudio.js — pre-recorded Buzz clip discovery.
 *
 * Drop MP3s into src/assets/audio/buzz/{category}/ and redeploy.
 * Naming convention: 01.mp3, 02.mp3, 03.mp3 … (any filename works)
 *
 * Folder → game event mapping:
 *
 *   lobby-waiting/       → while players are joining in the lobby
 *   player-joins/        → when a new player joins
 *   game-start/          → when the game first kicks off
 *   round-start/         → start of each round (quiz/game begins)
 *   round-end/           → round over screen
 *   game-end/            → final screen / winner announced
 *   return-to-lobby/     → after game ends, returning to lobby
 *   correct/             → player answers correctly
 *   wrong/               → player answers incorrectly
 *   voting-open/         → genre voting opens
 *   artwork-reveal/      → when revealing player artwork for voting
 *   idle/                → TV corner idle cycling lines
 *
 *   genre-quiz/                → quiz round intro
 *   genre-speed-briefs/        → Speed Briefs intro
 *   genre-model-model-un/      → Model Model UN intro
 *   genre-hot-takes/           → Hot Takes intro
 *   genre-fill-gap/            → Fill the Gap intro
 *   genre-joke-off/            → Joke Off intro
 *   genre-order-up/            → Order Up intro
 *   genre-fart-direction/      → Fart Direction intro
 *   genre-true-false/          → True or False intro
 *   genre-whodunnit/           → Whodunnit intro
 *   genre-music-bangers/       → Music Bangers intro
 *   genre-logo/                → Logo round intro
 *   genre-dingbats/            → Dingbats round intro
 */

// Vite discovers all MP3s at build time; filenames get content-hashed in production.
const _raw = import.meta.glob(
  '../assets/audio/buzz/**/*.mp3',
  { eager: true, as: 'url' }
)

// Group by folder name: { 'correct': [url, url], 'wrong': [url], ... }
export const BUZZ_CLIPS = {}

for (const [path, url] of Object.entries(_raw)) {
  // path like: ../assets/audio/buzz/correct/01.mp3
  const parts = path.split('/')
  const category = parts[parts.length - 2]
  if (!BUZZ_CLIPS[category]) BUZZ_CLIPS[category] = []
  BUZZ_CLIPS[category].push(url)
}

// Maps a getBuzzQuip event (+ optional genreId) → folder name
function resolveCategory(event, genreId) {
  if (event === 'genreReveal' && genreId) return `genre-${genreId}`
  const MAP = {
    lobbyWaiting:  'lobby-waiting',
    playerJoins:   'player-joins',
    gameStart:     'game-start',
    roundStart:    'round-start',
    roundEnd:      'round-end',
    gameEnd:       'game-end',
    returnToLobby: 'return-to-lobby',
    correct:       'correct',
    wrong:         'wrong',
    votingOpen:    'voting-open',
    votingClosed:  'voting-open',
    artworkReveal: 'artwork-reveal',
    idle:          'idle',
    playerWinning: 'round-end',
    playerLosing:  'round-end',
    comebackTime:  'round-end',
  }
  return MAP[event] || null
}

/**
 * Returns a random pre-recorded URL for the given event, or null if
 * no clips exist for that category yet.
 *
 * @param {string} event   — same event keys as getBuzzQuip
 * @param {string} genreId — e.g. 'quiz', 'speed-briefs' (for genreReveal events)
 */
export function getBuzzAudioUrl(event, genreId = null) {
  const category = resolveCategory(event, genreId)
  if (!category) return null
  const clips = BUZZ_CLIPS[category]
  if (!clips || clips.length === 0) return null
  return clips[Math.floor(Math.random() * clips.length)]
}

/** True when at least one folder has clips loaded. */
export const hasBuzzAudio = Object.keys(BUZZ_CLIPS).length > 0
