/**
 * buzzAudio.js — pre-recorded Buzz clip discovery.
 *
 * Drop MP3s into the relevant folder and redeploy. Any filename works.
 *
 * ── Folder structure ──────────────────────────────────────────────────────────
 *
 *  buzz/
 *    buzz-host/                  Buzz as game host — non-game-specific lines
 *      buzz-intro/               Who Buzz is / what we're doing tonight
 *      lobby-waiting/            While players join
 *      player-joins/             When a new player joins
 *      game-start/               Game kicks off
 *      game-end/                 Final screen / winner announced
 *      return-to-lobby/          After game, heading back to lobby
 *      idle/                     TV corner ambient cycling
 *
 *    buzz-game/                  Buzz during the game — in-game reactions + genre reveals
 *      round-start/              Start of each round
 *      round-end/                Round over screen
 *      correct/                  Player answers correctly
 *      wrong/                    Player answers incorrectly
 *      voting-open/              Genre voting opens
 *      artwork-reveal/           Revealing player artwork for voting
 *      question/                 Question read-aloud (TTS fallback)
 *      genre-reveal/             Buzz announces the chosen genre
 *        quiz/
 *        speed-briefs/
 *        model-model-un/
 *        hot-takes/
 *        fill-gap/
 *        joke-off/
 *        order-up/
 *        fart-direction/
 *        true-false/
 *        music-bangers/
 *        logo/
 *        dingbats/
 *        draw-it/
 *        outlandish-lawyers/
 *
 *    out-of-the-question/        Cassidy — Out of the Question host
 *      intro/                    Genre reveal intro for this game
 *      round-start/              Case opens, players write answers
 *      vote/                     Voting phase — most frequent
 *      caught/                   Imposter caught
 *      escaped/                  Imposter escaped
 *
 *    (add future games as sibling folders to out-of-the-question/)
 */

// Vite discovers all MP3s at build time; filenames get content-hashed in production.
const _raw = import.meta.glob(
  '../assets/audio/buzz/**/*.mp3',
  { eager: true, as: 'url' }
)

// Key = path from buzz/ root, excluding filename.
// e.g. "general/lobby-waiting", "game/correct", "out-of-the-question/vote"
export const BUZZ_CLIPS = {}

for (const [path, url] of Object.entries(_raw)) {
  const buzzIdx = path.indexOf('/buzz/') + '/buzz/'.length
  const relative = path.slice(buzzIdx)
  const parts = relative.split('/')
  parts.pop() // remove filename
  const category = parts.join('/')
  if (!BUZZ_CLIPS[category]) BUZZ_CLIPS[category] = []
  BUZZ_CLIPS[category].push(url)
}

// ── Routing maps ─────────────────────────────────────────────────────────────

// Maps genre IDs → subfolder name inside game/genre-reveal/
const GENRE_REVEAL_FOLDER = {
  musicbangers:      'music-bangers',
  speedbriefs:       'speed-briefs',
  modelmodelun:      'model-model-un',
  fartdirection:     'fart-direction',
  jokeof:            'joke-off',
  fillgap:           'fill-gap',
  trueorfalse:       'true-false',
  ordersup:          'order-up',
  hottake:           'hot-takes',
  drawit:            'draw-it',
  blitz:             'blitz',
  outlandishlawyers: 'outlandish-lawyers',
  // games with their own folders handle genreReveal via GAME_FOLDER below
}

// Maps genre IDs → their own top-level game folder.
// These games have per-phase audio (intro, round-start, vote, etc.)
const GAME_FOLDER = {
  whodunnit: 'out-of-the-question',
  // future: fillgap: 'fill-the-gap', jokeof: 'joke-off', etc.
}

// Maps game-specific event names → their audio folder path
const GAME_EVENT_MAP = {
  whodVote:    'out-of-the-question/vote',
  whodCaught:  'out-of-the-question/caught',
  whodEscaped: 'out-of-the-question/escaped',
}

// ── Resolver ─────────────────────────────────────────────────────────────────

function resolveCategory(event, genreId) {
  // 1. Game-specific named events (whodVote, whodCaught, etc.)
  if (GAME_EVENT_MAP[event]) return GAME_EVENT_MAP[event]

  // 2. Genre reveal — prefer game's own intro/ folder, fall back to game/genre-reveal/
  if (event === 'genreReveal' && genreId) {
    if (GAME_FOLDER[genreId]) {
      const key = `${GAME_FOLDER[genreId]}/intro`
      if (BUZZ_CLIPS[key]?.length) return key
    }
    const folder = GENRE_REVEAL_FOLDER[genreId] || genreId
    return `buzz-game/genre-reveal/${folder}`
  }

  // 3. Generic game events — check for a game-specific folder override first
  //    e.g. out-of-the-question/round-start beats game/round-start when playing whodunnit
  if (genreId && GAME_FOLDER[genreId]) {
    const slug = event.replace(/([A-Z])/g, m => '-' + m.toLowerCase())
    const key = `${GAME_FOLDER[genreId]}/${slug}`
    if (BUZZ_CLIPS[key]?.length) return key
  }

  // 4. Generic fallback map
  const MAP = {
    buzzIntro:     'buzz-host/buzz-intro',
    lobbyWaiting:  'buzz-host/lobby-waiting',
    playerJoins:   'buzz-host/player-joins',
    gameStart:     'buzz-host/game-start',
    gameEnd:       'buzz-host/game-end',
    returnToLobby: 'buzz-host/return-to-lobby',
    idle:          'buzz-host/idle',
    roundStart:    'buzz-game/round-start',
    roundEnd:      'buzz-game/round-end',
    correct:       'buzz-game/correct',
    wrong:         'buzz-game/wrong',
    votingOpen:    'buzz-game/voting-open',
    votingClosed:  'buzz-game/voting-open',
    artworkReveal: 'buzz-game/artwork-reveal',
    question:      'buzz-game/question',
    playerWinning: 'buzz-game/round-end',
    playerLosing:  'buzz-game/round-end',
    comebackTime:  'buzz-game/round-end',
    musicNext:     'buzz-game/genre-reveal/music-bangers',
    musicReveal:   'buzz-game/genre-reveal/music-bangers',
  }
  return MAP[event] || null
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a random pre-recorded URL for the given event, or null if no clips exist.
 *
 * @param {string} event   — event key (e.g. 'correct', 'genreReveal', 'whodVote')
 * @param {string} genreId — current genre ID (e.g. 'whodunnit', 'speedbriefs')
 */
export function getBuzzAudioUrl(event, genreId = null) {
  const category = resolveCategory(event, genreId)
  if (!category) return null

  let clips = BUZZ_CLIPS[category] || []

  // Idle pool also draws from lobby-waiting (they serve the same purpose)
  if (event === 'idle') {
    clips = [...clips, ...(BUZZ_CLIPS['buzz-host/lobby-waiting'] || [])]
  }

  if (!clips.length) return null
  return clips[Math.floor(Math.random() * clips.length)]
}

/** True when at least one folder has clips loaded. */
export const hasBuzzAudio = Object.keys(BUZZ_CLIPS).length > 0
