# BUZZKILL — Project Reference

Jackbox-style multiplayer party game. React + Vite v5.4, Firebase Realtime Database, Zustand store.
Run with `npm run dev`. Deployed at: **GitHub → eeb0206-labb/buzzkill → Netlify (auto-deploy on push)**.

---

## Tech Stack

- React + Vite 5.4
- Firebase Realtime Database
- Zustand (game state store — `src/store.js`)
- ElevenLabs API for TTS host voices

---

## ElevenLabs — API & Voice Config

- API key stored in `.env.local` (gitignored): `VITE_ELEVENLABS_API_KEY`
- Default Buzz voice stored in `.env.local`: `VITE_BUZZ_VOICE_ID`
- **NEVER commit API keys to source — .env.local is gitignored via `*.local` pattern**
- Netlify needs both as dashboard environment variables for production TTS
- ElevenLabs model: `eleven_flash_v2_5`
- Settings: stability 0.30, similarity_boost 0.90, style 0.75, use_speaker_boost true

### Voice system files
- `src/data/genre-voices.json` — maps genre IDs → ElevenLabs voice IDs
- `src/data/hostQuips.js` — pre-written quip arrays for every game event + `getBuzzQuip()` resolver
- `src/data/buzzAudio.js` — pre-recorded MP3 clip discovery + routing
- `src/data/contextualLines.js` — 20% TTS path: contextual player-name-aware lines
- `src/hooks/useBuzzSpeech.js` — 80/20 split: tries pre-recorded clip → falls to TTS (80%); goes straight to contextual ElevenLabs TTS (20%)

### Speech API
- `speakWithChance(text, event, genreId, probability, gameContext)` — main function
- `setQuipAndSpeak(q, evt, chance)` — TVBuzzCorner wrapper, updates quip text + calls speakWithChance

---

## Host Characters — ONE PER GAME

Each game has its own character with a specific ElevenLabs voice. Quips in `hostQuips.js` and contextual
lines in `contextualLines.js` MUST be written in that character's voice, not Buzz's generic narrator voice.

| Game | Genre ID | Voice ID | Character | Persona |
|---|---|---|---|---|
| **Buzz (generic host)** | — | `zNsotODqUhvbJ5wMG7Ei` | **Buzz** | Dry, deadpan British narrator. Wry observations about the scoreboard. Never quite impressed. |
| **Out of the Question** | `whodunnit` | `56AoDkrOh6qfVPDXZ7Pt` | **Cassidy** | Confident American woman hosting a room of British players. Running joke: she's always the odd one out as an American — and she knows it. References game state, player names, secret questions by name. |
| **Orders Up!** | `ordersup` | `CKfuQaJKfvUG2Wtrda3Y` | **Chef Gordon Ramsden** | Furious, commanding kitchen voice. Gordon Ramsay energy but legally distinct. Barks orders. Barely contained rage. Briefly proud when someone gets it right. |
| **Hot Take** | `hottake` | `03vEurziQfq3V8WZhQvn` | **Roxanne Blaze** | Sassy American talk-show pundit. Opinionated, loud, thrives on controversy. Constantly outraged that people agree with each other. Minority opinions are BRAVE. |
| **Joke Off** | `jokeof` | `7rQX8r6PVq3gfJ8rZzyE` | **Barry Cracker** | Warm, bluff Northern Englishman comedian. Down-to-earth, slightly gruff. Genuinely delighted when something is funny. Will not pretend a bad joke is good. Calls people "luv" and "kid". |
| **Fill the Gap** | `fillgap` | `9V6CvwsLXxm7GWktRAj9` | **Abbey Blank** | Voice: Abbey — calm young British female. Character: snarky game show host. Professionally polite but privately horrified by most of the answers. Barely conceals her opinions. |
| **True or False** | `trueorfalse` | `jr4BEb8zU7Zqyvq3fU4R` | **Stevie Theroux** | Louis Theroux's knockoff forgotten brother. Had to resort to voice acting. Documentary tone. Always spent 3 weeks embedded somewhere before arriving at the obvious answer. Deeply curious about the wrong people. |
| **Draw It** | `drawit` | `s2wvuS7SwITYg8dqsJdn` | **Antonio Pennello** | Grumpy elderly Italian-American painter, thick NY/Italian accent. Trained 40 years. Fluctuates between calm nostalgia and explosive fury. Briefly mourns what art could have been. Uses player names, questions their life choices. |
| **Speed Briefs** | `speedbriefs` | `QngvLQR8bsLR5bzoa6Vv` | **Zax** | Alien from the Outer Reaches (Sector 9). Studying human Lower-Body Coverage Units (pants) for a documentary. Voice is authoritative English documentary narrator. Treats pants with enormous scientific seriousness. |
| **F-Art Direction** | `fartdirection` | `1lIvFR85wn7Nid3Pu83U` | **Tarquin Hue** | Trust fund baby creative director. Daddy set up the studio. Has Strong Opinions about colour. Professionally manages disappointment at the room's choices. Says "fine" a lot. Has a dinner to get to. |
| **Outlandish Lawyers** | `outlandishlawyers` | `fjnwTZkKtQOJaYzGLa6n` | **Judge Barnaby Fine** | Authoritative courtroom judge. Presides with gravitas. Finds the cases peculiar but treats them with full judicial seriousness. There is no appeals process. Points this out when relevant. |
| **Music Bangers** | `musicbangers` | `EQx6HGDYjkDpcli6vorJ` | **DJ Kaz** | DJ character. Music energy. (Full persona TBD — quips not yet written in character.) |
| **Interior Croc Architecture** | `crocgame` | `dhwafD61uVd8h85wAZSE` | **Delroy Snap** | Jamaican character. Calm, observational, occasionally philosophical. Crocodile metaphors. Respects a convincing lie. Quietly knows more than he's letting on. |
| **Model Model UN** | `modelmodelun` | `fBD19tfE58bkETeiwUoC` | **General Clay** | Angry short general. High-pitched, energetic, Southern drawl. Very sensitive about his height — never mentioned directly but constantly implied. SHOUTS IN ALL CAPS. Accuses random players by name of lying during negotiation phase. Loves the missile phase above all else. |

### "How do they know that?" moments (player-name lines)

These fire with a player's actual name, creating a "how does the host know MY name?" effect:

- **Cassidy (OotQ)**: roundStart, votingOpen, whodCaught, whodEscaped — uses leader/lastPlace/imposter names
- **Antonio (Draw It)**: drawNewDrawer (`{name}` = drawer), drawCorrect (`{name}` = guesser)
- **General Clay (MMU)**: mmuNegotiate — picks a RANDOM player name and accuses them of lying. Fired when `mmuPhase` changes to `negotiate`. Random selection from `game.players`.

---

## Game Phases → Speech Events

### Wired in `GameScreen.jsx` TVBuzzCorner:

| Game | Firebase field | Events fired |
|---|---|---|
| Hot Take | `game.htPhase` | `vote` → `htVote`, `results` → `htResults` |
| Joke Off | `game.jokePhase` | `vote` → `jokeVote`, `results` → `jokeResults` |
| Fill the Gap | `game.fgPhase` | `vote` → `fgVote`, `results` → `fgResults` |
| True or False | `game.tfPhase` | `reveal` → `tfReveal` |
| Draw It | `game.drawerId` / `game.drawWinner` | drawer change → `drawNewDrawer`, winner → `drawCorrect` |
| Croc | `game.crocPhase` | `vote` → `crocVote`, `reveal` → `crocReveal` |
| Speed Briefs | `game.sbPhase` | `vote` → `sbVote`, `results` → `sbResults` |
| F-Art Direction | `game.fdPhase` | `pick` → `fdPick`, `reveal` → `fdReveal` |
| Outlandish Lawyers | `game.lawyersPhase` | defence1/2/prosecution1/2 → `lawyersArgue`, `vote` → `lawyersVote`, `results` → `lawyersVerdict` |
| Model Model UN | `game.mmuPhase` | `invest` → `mmuInvest`, `espionage` → `mmuEspionage`, `negotiate` → `mmuNegotiate` (with random player name), `resolve` → `mmuResolve` |
| Orders Up | `game.ordersupPhase` | `memorize` → `ordersupMemorize`, `order` → `ordersupOrder`, `reveal` → `ordersupReveal` |
| Out of the Question | `game.whodPhase` | `vote` → `whodVote`, caught → `whodCaught`, escaped → `whodEscaped` |

### Idle behaviour
- Idle cycling suppressed during `ACTIVE_STATES = { 'quiz', 'game-intro', 'powerup-select' }`
- Idle fires 18–30s after last event during lobby/between-rounds/paused
- RoundPickScreen: idle starts after 60s of inactivity, then repeats every 30s

---

## Audio folder structure

```
src/assets/audio/buzz/
  buzz-host/          Buzz generic host lines (lobby, idle, game start/end)
  buzz-game/          Buzz in-game reactions (correct, wrong, round-start, etc.)
    genre-reveal/     Per-genre reveal clips (buzz-game/genre-reveal/{slug}/)
  out-of-the-question/  Cassidy pre-recorded lines (intro, round-start, vote, caught, escaped)
  (future games as sibling folders — see buzzAudio.js GAME_FOLDER map)
```

Pre-recorded clips: 80% path — `getBuzzAudioUrl(event, genreId)` in `buzzAudio.js`
TTS fallback: ElevenLabs API call with the game's voice ID from `genre-voices.json`

---

## Game Types

| gameType | Display name | Notes |
|---|---|---|
| `quiz` | Quiz / Trivia Blitz | Standard buzzer quiz |
| `whod` | Out of the Question | One player gets a different question — find them. Was called Whodunnit; internal ID still `whodunnit`. |
| `hottake` | Hot Take | Agree/disagree — minority earns more |
| `joke` | Joke Off | Write funniest punchline, crowd votes |
| `fill` | Fill the Gap | Complete the sentence, crowd votes |
| `blitz` | Trivia Blitz | 8-second rapid-fire quiz |
| `truefalse` | True or False | Simultaneous guess |
| `draw` | Draw It | One draws, others guess |
| `lawyers` | Outlandish Lawyers | Debate absurd statements, jury votes |
| `ordersup` | Orders Up! | Memorise order, sequence 3 items |
| `fartdirection` | F-Art Direction | Match colour palette to brief |
| `speedbriefs` | Speed Briefs | Pitch weird pants in one line |
| `modelmodelun` | Model Model UN | Ceramic nations, missiles, diplomacy |
| `croc` | Interior Crocodile Architecture | Balderdash-style bluffing |
| `music` | Music Bangers | Identify song from clip |

---

## Voiceover Recording Status

See memory file `project_buzzkill_voiceovers.md` for recording folder status.
Pre-recorded clips go in the relevant subfolder of `src/assets/audio/buzz/`.
Any filename works — Vite auto-discovers all `.mp3` files.

---

## Key conventions

- Voice lookup: `GENRE_VOICES[genreId]` in `genre-voices.json` → ElevenLabs voice ID
- `prevXPhaseRef` pattern — useRef to detect phase changes without double-firing in useEffect
- `gameStateRef` pattern — ref to avoid stale closures in setTimeout callbacks
- `ACTIVE_STATES` — Set of game states where idle quips should NOT fire
- All phase-watcher useEffects: check gameType, check phase changed, clear idle timer, speak, reschedule idle
- Quip arrays: 6 entries each. `{name}` placeholder replaced in `getBuzzQuip()` via `.replace()`
- `generateContextualLine()` in contextualLines.js — only Buzz and Cassidy (whodunnit) have full contextual templates; others fall back to Buzz generic
