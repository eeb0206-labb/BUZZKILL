// Buzz — the AI host character quip database
// Voice: theatrical, pompous, slightly contemptuous, maximum gravitas for minimum occasion.
// Think Matt Berry. Everything is said as if it is the most important thing ever uttered.
//
// getBuzzQuip(event, context) returns a string.
// Deterministic when context.seed is supplied — same result on all clients.

export const BUZZ_QUIPS = {
  gameStart: [
    "Welcome. I am Buzz. You are contestants. This is Buzzkill. We begin... now.",
    "Good evening. Or morning. Or whatever it is where you are. I am Buzz. This is your programme.",
    "Right. Here we are. I have been waiting. You have arrived. Let us... proceed.",
    "Another group of hopefuls. Splendid. I shall be your host. You may call me Buzz. You may not call me anything else.",
    "I am Buzz. This is the game. Those are the rules. We begin now. Yes.",
  ],

  roundStart: [
    "Round {n}. We begin. Chin up.",
    "Round {n} commences... NOW.",
    "It is time for round {n}. I suggest you concentrate. Just this once.",
    "Round {n}! Yes. This is happening. Round {n}.",
    "We arrive at round {n}. I have been looking forward to this more than you know.",
    "Round {n}. Here we go. Again.",
  ],

  roundEnd: [
    "Round {n} is over. Look at those scores. Just look at them.",
    "That concludes round {n}. Some of you should be embarrassed. You know who you are.",
    "Round {n}... done. The scoreboard tells its story. A grim one for some.",
    "End of round {n}. I have seen better. I have seen worse. Mostly better.",
    "Round {n} complete. I have... feelings about how that went.",
  ],

  correct: [
    "Correct! As I suspected.",
    "Yes. THAT is an answer. Well done. Don't milk it.",
    "Correct! I knew someone would get it eventually.",
    "That is correct. Magnificent. Move along.",
    "Oh, WELL done. Genuinely. That one was harder than it looked.",
    "Yes! Correct! I am... briefly impressed.",
    "Correct! You have done the thing. Good.",
  ],

  wrong: [
    "That is wrong. Quite magnificently wrong.",
    "No. No no no. That is not it. Not even close.",
    "Wrong. I am not surprised. But I am disappointed.",
    "Incorrect. Oh dear. Oh, that is... something.",
    "That is not the answer. I don't know what that is, but it is not the answer.",
    "Wrong! And yet, delivered with such confidence. Remarkable.",
    "Incorrect. I shan't dwell on it. But I will remember it.",
  ],

  votingOpen: [
    "Voting is now open. Choose wisely. Or don't. The game will proceed either way.",
    "You must vote. Now. Do it. The genre shall be decided by the many. Or the loudest.",
    "Votes. I need them. You must give them. Proceed.",
    "The vote is open. Make your decision. I shall be watching.",
  ],

  votingClosed: [
    "The votes are in. The people have spoken. The people will live with this.",
    "Voting is closed. The decision has been made. For better or worse. Probably worse.",
    "The votes have been counted. Results to follow. Brace yourselves.",
  ],

  genreReveal: {
    default: [
      "It is {genre}. We proceed. Good luck.",
      "The genre is {genre}. Yes. This is what we're doing.",
      "{genre}! Splendid. Or not. Either way, we begin.",
      "It has been decided. {genre}. Now focus.",
    ],
    quiz: [
      "It is a quiz. Questions will be asked. Answers will be given. Most will be wrong.",
      "Quiz time. I shall be watching. Very, very closely.",
      "The quiz round. General knowledge. I trust you have some.",
      "A quiz! Questions await. I suggest you think before you speak. Just a suggestion.",
    ],
    speedBriefs: [
      "Speed Briefs. You must sell trousers. I don't make the games, I merely present them. Go.",
      "SPEED BRIEFS. Pants need selling. You have approximately no time at all. Begin.",
      "It is Speed Briefs. You will be selling legwear under pressure. This is your life now.",
    ],
    mmu: [
      "Model Model UN. Nations will fall. Villages will burn. Someone will emerge victorious. Let us find out who.",
      "It is Model Model UN. Missiles. Shields. The full catastrophe. I suggest you prepare.",
      "Model Model UN. Build your village. Defend it. Or watch it burn. I don't mind either way.",
    ],
    hotTakes: [
      "Hot Takes. You will say things. I will judge them. This always ends badly. WONDERFUL.",
      "It is Hot Takes. Say something controversial. I shall be the sole arbiter of whether it is, in fact, hot.",
      "Hot Takes time. Opinions are weapons now. Choose yours carefully.",
    ],
    fillGap: [
      "Fill the Gap. You must complete these sentences. Do try.",
      "It is Fill the Gap. Words will be missing. You will provide them. Hopefully.",
      "Fill the Gap! Sentences with holes in them. You are the plaster.",
    ],
    jokeOff: [
      "A Joke Off. Comedy will be attempted. I shall remain impassive throughout.",
      "It is the Joke Off. May the funniest person win. I am not hopeful, but I am open.",
      "Joke Off! Make them laugh. I'll be here. Not laughing.",
    ],
    orderUp: [
      "Order Up. You will rank things. You will argue about the rankings. Someone will be wrong.",
      "It is Order Up. Everything must go in order. Your order. Convince the others.",
      "Order Up! Rankings. Arguments. The collapse of civility. Wonderful.",
    ],
    fartDirection: [
      "Fart Direction. I am above this. And yet, here we are.",
      "It is... Fart Direction. I present what I am given. Do not look at me like that.",
      "Fart Direction. I have hosted many things. This is one of them. Proceed.",
    ],
    trueFalse: [
      "True or False. Two options. You have a fifty percent chance of being correct on pure guesswork alone. Don't waste it.",
      "It is True or False. Think quickly. Very quickly. Now.",
      "True or False! It is exactly what it sounds like. Begin.",
    ],
    whodunnit: [
      "Whodunnit. Someone has done something. You must determine who. I already know. I shan't tell you.",
      "It is Whodunnit. A mystery. Evidence everywhere. Think. THINK.",
      "Whodunnit! The culprit is among us. Well, among the clues. You'll work it out. Probably.",
    ],
    musicBangers: [
      "Music Bangers. Songs will be played. Names will be needed. I suggest you know some.",
      "It is Music Bangers. The music round. Your musical knowledge is about to be exposed.",
      "Music Bangers! What's that tune? You either know it or you don't. There is no middle ground.",
    ],
    outlandishLawyers: [
      "Outlandish Lawyers. You will argue the unarguable. I shall be the judge. I always am.",
      "It is Outlandish Lawyers. The courtroom is open. Logic is optional. Drama is mandatory.",
    ],
    holyTrivia: [
      "Holy Trivia. Sacred questions. Secular answers. I expect reverence.",
      "It is Holy Trivia. Eternal questions under time pressure. The universe watches.",
    ],
  },

  playerWinning: [
    "{name} is at the top. Of course {name} is at the top.",
    "Leading the field: {name}. The others are aware of this. It shows.",
    "{name} is winning. This has not gone unnoticed.",
  ],

  playerLosing: [
    "{name} is at the bottom of the scoreboard. This is just information. Important information.",
    "Currently last: {name}. There is time. Not much. But some.",
    "{name} is struggling. I note this without judgment. Well. Minimal judgment.",
  ],

  comebackTime: [
    "The gap can be closed. In theory. I've seen it done. Once.",
    "It is not over. History is full of unlikely reversals. Full of them.",
    "Anyone can win from here. Anyone with the right answers. Which is, theoretically, anyone.",
  ],

  gameEnd: [
    "It is over. {winner} wins. {winner} is the winner of Buzzkill. This has been Buzzkill. I am Buzz. Goodnight.",
    "The game is done. {winner} emerges victorious. {loser}, I suggest a period of quiet reflection. Goodnight.",
    "{winner} WINS. Magnificent. Truly. This has been Buzzkill. I have been Buzz. It has been a pleasure. Sort of.",
    "And that is Buzzkill. {winner} takes it. I have presided over this. I leave satisfied.",
  ],

  idle: [
    "I am watching.",
    "...",
    "This is fine.",
    "Take your time. I have nowhere else to be. That is a lie. But proceed.",
    "I am Buzz. I am always here.",
    "Still going. Excellent.",
    "I wait.",
  ],
}

const GENRE_KEY_MAP = {
  'quiz': 'quiz',
  'speed-briefs': 'speedBriefs',
  'model-model-un': 'mmu',
  'hot-takes': 'hotTakes',
  'fill-gap': 'fillGap',
  'joke-off': 'jokeOff',
  'order-up': 'orderUp',
  'fart-direction': 'fartDirection',
  'true-false': 'trueFalse',
  'whodunnit': 'whodunnit',
  'music-bangers': 'musicBangers',
  'outlandish-lawyers': 'outlandishLawyers',
  'holy-trivia': 'holyTrivia',
}

function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

function pick(arr, seed) {
  if (!arr || !arr.length) return ''
  const idx = seed !== undefined ? seed % arr.length : Math.floor(Math.random() * arr.length)
  return arr[idx]
}

/**
 * Returns a Buzz quip for the given event.
 * context: { gameCode?, round?, genreId?, genreName?, name?, winner?, loser?, seed? }
 *
 * Pass context.seed (or context.gameCode) for deterministic selection —
 * same result on all clients from the same Firebase game state.
 */
export function getBuzzQuip(event, context = {}) {
  const { round, genreId, genreName, name, winner, loser } = context
  const seed = context.seed !== undefined
    ? context.seed
    : context.gameCode
      ? hashStr(context.gameCode + event + String(round || 0))
      : undefined

  let quip = ''

  switch (event) {
    case 'gameStart':
      quip = pick(BUZZ_QUIPS.gameStart, seed)
      break
    case 'roundStart':
      quip = pick(BUZZ_QUIPS.roundStart, seed)?.replace(/{n}/g, round ?? 1)
      break
    case 'roundEnd':
      quip = pick(BUZZ_QUIPS.roundEnd, seed)?.replace(/{n}/g, round ?? 1)
      break
    case 'correct':
      quip = pick(BUZZ_QUIPS.correct)
      break
    case 'wrong':
      quip = pick(BUZZ_QUIPS.wrong)
      break
    case 'votingOpen':
      quip = pick(BUZZ_QUIPS.votingOpen, seed)
      break
    case 'votingClosed':
      quip = pick(BUZZ_QUIPS.votingClosed, seed)
      break
    case 'genreReveal': {
      const key = genreId ? GENRE_KEY_MAP[genreId] : null
      const pool = (key && BUZZ_QUIPS.genreReveal[key]) || BUZZ_QUIPS.genreReveal.default
      quip = pick(pool, seed)?.replace('{genre}', genreName || 'this round')
      break
    }
    case 'playerWinning':
      quip = pick(BUZZ_QUIPS.playerWinning, seed)?.replace(/{name}/g, name || 'Someone')
      break
    case 'playerLosing':
      quip = pick(BUZZ_QUIPS.playerLosing, seed)?.replace(/{name}/g, name || 'Someone')
      break
    case 'gameEnd':
      quip = pick(BUZZ_QUIPS.gameEnd, seed)
        ?.replace('{winner}', winner || 'someone')
        ?.replace('{loser}', loser || 'everyone else')
      break
    case 'comebackTime':
      quip = pick(BUZZ_QUIPS.comebackTime, seed)
      break
    case 'idle':
    default:
      quip = pick(BUZZ_QUIPS.idle)
  }

  return quip || '...'
}
