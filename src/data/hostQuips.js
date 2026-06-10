// Buzz — the AI host character quip database
// Voice: theatrical, pompous, slightly contemptuous, maximum gravitas for minimum occasion.
// Think Matt Berry. Everything is said as if it is the most important thing ever uttered.
//
// getBuzzQuip(event, context) returns a string.
// Deterministic when context.seed is supplied — same result on all clients.

export const BUZZ_QUIPS = {

  // ── Lobby ────────────────────────────────────────────────────────────────────

  lobbyWaiting: [
    "We are waiting. Some of us more patiently than others. I shall not say who.",
    "The lobby fills. Like a bath. But with people. And considerably more tension.",
    "We wait. I have been waiting my entire career. I am very good at it.",
    "The players assemble. Like a particularly disorganised army. With worse uniforms.",
    "Still waiting. I am not annoyed. I am rarely annoyed. This is one of those times.",
    "I have all the time in the world. That is a lie. But we will wait a little longer.",
    "Gathering the troops. As it were. They are not troops. But here we are.",
    "The game cannot begin until everyone has arrived. So. Here we are. Waiting.",
  ],

  playerJoins: [
    "A new player. Welcome. Sit down. We'll begin shortly.",
    "Another one arrives. The group expands. The odds shift slightly.",
    "We have a new arrival. I trust they know what they've signed up for.",
    "Someone new. I note this. Everyone note this. They are here now.",
    "Welcome. You've arrived just in time. Or possibly too late. We'll see.",
    "They join us. The team is forming. Slowly. But forming.",
    "Another contestant. Excellent. The more the merrier. Within reason.",
  ],

  // ── Game flow ────────────────────────────────────────────────────────────────

  gameStart: [
    "Welcome. I am Buzz. You are contestants. This is Buzzkill. We begin... now.",
    "Good evening. Or morning. Or whatever it is where you are. I am Buzz. This is your programme.",
    "Right. Here we are. I have been waiting. You have arrived. Let us... proceed.",
    "Another group of hopefuls. Splendid. I shall be your host. You may call me Buzz. You may not call me anything else.",
    "I am Buzz. This is the game. Those are the rules. We begin now. Yes.",
    "The game begins. I have been looking forward to this. You probably have too. We'll see how that holds up.",
    "Buzzkill commences. I trust you're ready. You're not, are you. Doesn't matter. Off we go.",
    "Ladies and gentlemen. And others. Welcome to Buzzkill. I am your host. Concentrate.",
  ],

  roundStart: [
    "The round begins. Chin up.",
    "The round commences... NOW.",
    "It is time. I suggest you concentrate. Just this once.",
    "Yes. This is happening. The round begins. Now.",
    "I have been looking forward to this. More than you know.",
    "Here we go. Again.",
    "I have prepared for this. I hope you have. You haven't. Off we go.",
    "It begins. May the best brain win. I'll be watching to make sure.",
    "Focus. The round is live. Everything counts from here.",
    "The round is now live. I expect nothing short of your absolute best. I will probably receive less.",
  ],

  roundEnd: [
    "The round is over. Look at those scores. Just look at them.",
    "That concludes the round. Some of you should be embarrassed. You know who you are.",
    "Round done. The scoreboard tells its story. A grim one for some.",
    "End of the round. I have seen better. I have seen worse. Mostly better.",
    "The round is complete. I have... feelings about how that went.",
    "Round over. The gap between first and last is becoming... personal.",
    "That's your round done. Take a moment. Reflect. Do better.",
    "The round concludes. Someone here is very pleased with themselves. Several others are not.",
    "And it ends. The scores are what they are. I shall not comment further. I note them, however.",
    "Round over. I will say this: it was certainly a round. That happened.",
  ],

  // ── Answers ─────────────────────────────────────────────────────────────────

  correct: [
    "Correct! As I suspected.",
    "Yes. THAT is an answer. Well done. Don't milk it.",
    "Correct! I knew someone would get it eventually.",
    "That is correct. Magnificent. Move along.",
    "Oh, WELL done. Genuinely. That one was harder than it looked.",
    "Yes! Correct! I am... briefly impressed.",
    "Correct! You have done the thing. Good.",
    "That is right. Don't be smug about it. Actually, be a little smug. You've earned it.",
    "Excellent! A correct answer. In THIS game. Remarkable.",
    "Right answer. The scoreboard will reflect this. As will history.",
    "Correct! I did not think you had it in you. I was wrong. Today.",
    "Yes. YES. That is it. Wonderful. Don't get used to this feeling.",
    "Correct! The points are yours. Deservedly. Briefly savor this.",
    "That is right. I have waited a long time for someone to say that. Not that long. But some time.",
  ],

  wrong: [
    "That is wrong. Quite magnificently wrong.",
    "No. No no no. That is not it. Not even close.",
    "Wrong. I am not surprised. But I am disappointed.",
    "Incorrect. Oh dear. Oh, that is... something.",
    "That is not the answer. I don't know what that is, but it is not the answer.",
    "Wrong! And yet, delivered with such confidence. Remarkable.",
    "Incorrect. I shan't dwell on it. But I will remember it.",
    "No. That is wrong. Horrifically, beautifully wrong.",
    "Incorrect! I've heard worse answers. I'm trying to think of one. Give me a moment.",
    "Wrong. The correct answer exists. That was not it.",
    "Oh. Oh no. No. That was... something else entirely.",
    "Incorrect! I once knew someone who gave that answer. They're fine now. Mostly.",
    "Wrong. I expected this. Not from you specifically. Generally.",
    "No. That answer has never been right. Not once. In the history of this game.",
    "Incorrect. The correct answer will be revealed. And you will feel things.",
    "Wrong! Bold choice. Extremely bold. Extremely wrong.",
  ],

  // ── Voting ───────────────────────────────────────────────────────────────────

  votingOpen: [
    "Voting is now open. Choose wisely. Or don't. The game will proceed either way.",
    "You must vote. Now. Do it. The genre shall be decided by the many. Or the loudest.",
    "Votes. I need them. You must give them. Proceed.",
    "The vote is open. Make your decision. I shall be watching.",
    "Three genres have been presented. You must choose one. Try to make a good decision. Just this once.",
    "Choose your round. I have opinions about which you should pick. I shan't share them. Vote.",
    "The options are before you. Like a very small, very specific menu. Order something.",
    "Vote. Now. I have been waiting for this moment. Choose.",
  ],

  votingClosed: [
    "The votes are in. The people have spoken. The people will live with this.",
    "Voting is closed. The decision has been made. For better or worse. Probably worse.",
    "The votes have been counted. Results to follow. Brace yourselves.",
    "That is that. The vote is closed. What the crowd wants, the crowd shall receive.",
    "Done. Votes counted. Destiny assigned. Let's see what you've chosen for yourselves.",
    "The democratic process has concluded. I had nothing to do with the outcome. As always.",
  ],

  // ── Genre-specific round intros ──────────────────────────────────────────────

  genreReveal: {
    default: [
      "It is {genre}. We proceed. Good luck.",
      "The genre is {genre}. Yes. This is what we're doing.",
      "{genre}! Splendid. Or not. Either way, we begin.",
      "It has been decided. {genre}. Now focus.",
      "The crowd has spoken. {genre}. I trust you're ready.",
    ],
    quiz: [
      "It is a quiz. Questions will be asked. Answers will be given. Most will be wrong.",
      "Quiz time. I shall be watching. Very, very closely.",
      "The quiz round. General knowledge. I trust you have some.",
      "A quiz! Questions await. I suggest you think before you speak. Just a suggestion.",
      "The knowledge round. This is where we separate the informed from the... others.",
      "Quiz! Speed and accuracy are required. You may have one. Probably not both.",
      "General knowledge. That's what they call it. We'll see how general it actually is.",
      "The quiz begins. I have the answers. You do not. This is the fundamental dynamic of our relationship.",
    ],
    speedBriefs: [
      "Speed Briefs. You must sell trousers. I don't make the games, I merely present them. Go.",
      "SPEED BRIEFS. Pants need selling. You have approximately no time at all. Begin.",
      "It is Speed Briefs. You will be selling legwear under pressure. This is your life now.",
      "Speed Briefs! The round where advertising meets desperation. You have seconds. Use them.",
      "Trousers. You must sell them. Quickly. I don't know why. But you must. Begin.",
      "Speed Briefs. I once sold trousers. I was magnificent. Your turn.",
      "The briefs are in. The pants await their pitch. You have very little time. Go.",
      "Speed Briefs! Every second counts when you're selling pants. Apparently. Off you go.",
    ],
    mmu: [
      "Model Model UN. Nations will fall. Villages will burn. Someone will emerge victorious. Let us find out who.",
      "It is Model Model UN. Missiles. Shields. The full catastrophe. I suggest you prepare.",
      "Model Model UN. Build your village. Defend it. Or watch it burn. I don't mind either way.",
      "MMU. The geopolitics round. Except the missiles feel real. They're not. But they feel it.",
      "Nations! Villages! Missiles! This is Model Model UN. Good luck. Only one of you needs it.",
      "The model villages stand. For now. Model Model UN begins. May your defences hold.",
      "MMU. Where diplomacy goes to die and missiles come to live. Let's begin.",
      "Your village awaits. Your enemies await. Your missiles await. Model Model UN. Begin.",
    ],
    hotTakes: [
      "Hot Takes. You will say things. I will judge them. This always ends badly. WONDERFUL.",
      "It is Hot Takes. Say something controversial. I shall be the sole arbiter of whether it is, in fact, hot.",
      "Hot Takes time. Opinions are weapons now. Choose yours carefully.",
      "The Hot Takes round. Where friendships go to be tested and sometimes broken. Splendid.",
      "Hot Takes! I want controversy. I want drama. I want you to regret what you say. Begin.",
      "Say something hot. I don't mean temperature. You know what I mean. GO.",
      "Hot Takes. Everyone has opinions. Most of them are wrong. Let's hear yours anyway.",
      "The Hot Takes round! Be bold. Be controversial. Be prepared for the consequences. Now.",
    ],
    fillGap: [
      "Fill the Gap. You must complete these sentences. Do try.",
      "It is Fill the Gap. Words will be missing. You will provide them. Hopefully.",
      "Fill the Gap! Sentences with holes in them. You are the plaster.",
      "Gaps. There are gaps. You must fill them. With words. Not literally.",
      "Fill the Gap. The English language has been deliberately broken. Fix it.",
      "Words are missing. Sentences are incomplete. That is your problem now. Fill the gap.",
      "Fill the Gap! I expect creativity. I expect wit. I expect at least one answer that makes me feel something.",
      "The gap round. Words go in gaps. You know the gaps. Fill them. Quickly.",
    ],
    jokeOff: [
      "A Joke Off. Comedy will be attempted. I shall remain impassive throughout.",
      "It is the Joke Off. May the funniest person win. I am not hopeful, but I am open.",
      "Joke Off! Make them laugh. I'll be here. Not laughing.",
      "The comedy round. I've seen professionals struggle. This should be interesting.",
      "Jokes! I want jokes! Proper jokes! Well-structured jokes! GO!",
      "Joke Off. Everything is funnier under pressure. Allegedly. Prove it.",
      "The Joke Off begins. Comedy is subjective. My opinion is objective. These are not contradictory.",
      "Make me laugh. Or make them laugh. I, personally, do not laugh easily. Consider that your challenge.",
    ],
    orderUp: [
      "Order Up. You will rank things. You will argue about the rankings. Someone will be wrong.",
      "It is Order Up. Everything must go in order. Your order. Convince the others.",
      "Order Up! Rankings. Arguments. The collapse of civility. Wonderful.",
      "Put things in order. The correct order. Or what you believe to be the correct order. I'll be the judge.",
      "Order Up. I myself am very good at ranking things. I am ranked number one at ranking things. Begin.",
      "Things need ordering. You will order them. Mine would not need ordering. But mine doesn't count.",
      "Order Up! First. Second. Third. Simple in theory. Apparently not in practice. Let's see.",
      "The ordering round. Someone will have very strong opinions. The others will too. Only one set will be correct.",
    ],
    fartDirection: [
      "Fart Direction. I am above this. And yet, here we are.",
      "It is... Fart Direction. I present what I am given. Do not look at me like that.",
      "Fart Direction. I have hosted many things. This is one of them. Proceed.",
      "The round is called Fart Direction. I want to be clear that this was not my idea. Nevertheless. Begin.",
      "Fart Direction! I have made peace with this round. It took time. Begin.",
      "We arrive at Fart Direction. I shan't comment further. You know what to do. Off you go.",
      "Fart Direction. I am a professional. I have done this before. I will do it again. GO.",
      "The Fart Direction round. I have dignity. I have grace. I apparently also have this. Begin.",
    ],
    trueFalse: [
      "True or False. Two options. You have a fifty percent chance on pure guesswork alone. Don't waste it.",
      "It is True or False. Think quickly. Very quickly. Now.",
      "True or False! It is exactly what it sounds like. Begin.",
      "Two choices. True. Or false. One is correct. Good luck determining which.",
      "True or False! The binary round. There is no maybe. There is no possibly. Choose.",
      "Is it true? Is it false? You must decide. Quickly. Under pressure. Trust your instincts.",
      "True or False. Fast answers required. Second-guessing is the enemy. Or maybe it isn't. I'll never tell.",
      "The True or False round. Half the answers are true. Half are false. Statistically this should be easier than it is.",
    ],
    whodunnit: [
      "Whodunnit. Someone has done something. You must determine who. I already know. I shan't tell you.",
      "It is Whodunnit. A mystery. Evidence everywhere. Think. THINK.",
      "Whodunnit! The culprit is among us. Well, among the clues. You'll work it out. Probably.",
      "Someone has done it. The mystery is: who. The answer exists. You must find it. I'll wait.",
      "The Whodunnit round. Think like a detective. A good one. Not one of the bad ones.",
      "Whodunnit! The guilty party is already known. Just not to you. Yet. Investigate.",
      "A crime has occurred. Metaphorically. Or literally. Figure out who did it.",
      "Whodunnit. The most important question in human civilisation. Well. In this round at least.",
    ],
    musicBangers: [
      "Music Bangers. Songs will be played. Names will be needed. I suggest you know some.",
      "It is Music Bangers. The music round. Your musical knowledge is about to be exposed.",
      "Music Bangers! What's that tune? You either know it or you don't. There is no middle ground.",
      "The music round. I have excellent taste in music. This is irrelevant. Listen. Name. Score.",
      "Music Bangers! If you know, you know. If you don't, everyone will know that too.",
      "Name that tune. Or name that artist. Or both. I want both. You can do both.",
      "Music Bangers. The notes begin. Your memory is tested. Your taste is irrelevant but noted.",
      "The music round! I once knew a man who was perfect at this. He was insufferable. Don't be that man.",
    ],
    logo: [
      "Logo round. Famous brands. Without their names. Good luck. You'll need it.",
      "It is the Logo round. You know these companies. You see them every day. Now prove it.",
      "Logos! They've had their names removed. A bit like witnesses in a trial. Figure out who they are.",
      "The Logo round. Brand recognition. The trillion-dollar industry that hoped you were paying attention. Were you?",
      "Someone spent decades perfecting these logos. You now have seconds to guess them. Marvellous.",
      "Logo round! The names are gone. The shapes remain. The game is afoot.",
      "Companies without their names. Like celebrities without makeup. Do you recognise them? Let's find out.",
      "The Logo round. You are drowning in brand identity every single day. Let's see if any of it stuck.",
    ],
    dingbats: [
      "Dingbats. Words and pictures. Together they mean something. Figure out what.",
      "It is Dingbats! Someone has hidden a phrase inside this puzzle. Find it. Quickly.",
      "Dingbats! The cryptic round. Think sideways. Think laterally. Just think, really.",
      "There is a phrase hidden in this image. A saying. A title. A word. Find it.",
      "Dingbats. They look simple. They are not. Well. Some are. The others will destroy you.",
      "The Dingbats round! Everything means something. Nothing is as it seems. Good luck.",
      "Pictograms. Word puzzles. Hidden phrases. Dingbats. Think creatively. Think NOW.",
      "Someone encoded a perfectly good phrase into this image. Your job is to decode it. Off you go.",
    ],
    outlandishLawyers: [
      "Outlandish Lawyers. You will argue the unarguable. I shall be the judge. I always am.",
      "It is Outlandish Lawyers. The courtroom is open. Logic is optional. Drama is mandatory.",
      "Outlandish Lawyers! Make your case. Any case. The more absurd the better.",
      "The courtroom opens. The law is whatever you say it is. Go.",
      "Outlandish Lawyers. I have presided over many trials. None of them like this. Begin.",
    ],
    holyTrivia: [
      "Holy Trivia. Sacred questions. Secular answers. I expect reverence.",
      "It is Holy Trivia. Eternal questions under time pressure. The universe watches.",
      "Holy Trivia! These questions have lasted millennia. You have seconds. Begin.",
      "The sacred round. Answer respectfully. Answer quickly. Answer correctly.",
      "Holy Trivia. Not all questions have answers. These ones do. Find them.",
    ],
  },

  // ── Special moments ──────────────────────────────────────────────────────────

  artworkReveal: [
    "The artwork is revealed. I use the term 'artwork' loosely.",
    "Behold. The creation. I have seen many things. I have now seen this.",
    "The artistic contributions are presented. The word 'artistic' is doing a lot of work in that sentence.",
    "We reveal the masterpieces. I use that word in a spirit of generosity.",
    "The drawings are in. Someone here has talent. Possibly. We shall see.",
    "The art is displayed. For better or worse. Mostly worse. But here we are.",
    "Presenting the works. From the school of Doing One's Best Under Pressure.",
    "The creative outputs are revealed. Some of these are... interesting choices.",
    "And here they are. The creations. Born of panic and limited time. I respect it. Somewhat.",
    "The artwork is before you. Cast your eyes. Cast your votes. Cast your judgements.",
  ],

  playerWinning: [
    "{name} is at the top. Of course {name} is at the top.",
    "Leading the field: {name}. The others are aware of this. It shows.",
    "{name} is winning. This has not gone unnoticed.",
    "{name} has pulled ahead. This is the situation. I simply report it.",
    "Currently first: {name}. Whether this persists is another matter entirely.",
  ],

  playerLosing: [
    "{name} is at the bottom of the scoreboard. This is just information. Important information.",
    "Currently last: {name}. There is time. Not much. But some.",
    "{name} is struggling. I note this without judgment. Well. Minimal judgment.",
    "{name} occupies last place. This is the current state of affairs.",
    "The bottom of the scoreboard belongs to {name}. For now. Technically for now.",
  ],

  comebackTime: [
    "The gap can be closed. In theory. I've seen it done. Once.",
    "It is not over. History is full of unlikely reversals. Full of them.",
    "Anyone can win from here. Anyone with the right answers. Which is, theoretically, anyone.",
    "There is time. Not much. But the scoreboard has surprised me before.",
    "The gap is not insurmountable. Improbable. But not insurmountable.",
  ],

  gameEnd: [
    "It is over. The winner has been crowned. The others will recover. Eventually.",
    "The game is done. Scores have been tallied. Lives have been changed. Mostly for the worse.",
    "That. Is. Buzzkill. Thank you for playing. I've seen better. You did alright.",
    "And that is Buzzkill. I have presided over this. I leave satisfied.",
    "The final whistle. Someone wins. Everyone else loses. That is the nature of games.",
    "It is finished. I have done my part. I always do my part. Goodnight.",
    "Buzzkill is over. The winner stands. The rest of you... well. There's always next time.",
    "This has been Buzzkill. I am Buzz. It has been an experience. Of some kind. Goodnight.",
  ],

  returnToLobby: [
    "We return to the lobby. Another game awaits. Should you choose it.",
    "Back to the lobby. The natural resting state between catastrophes.",
    "The lobby. Again. Like an old friend. One you keep running into.",
    "We retreat. Regroup. The lobby opens its arms. Such as they are.",
    "Back to the start. As all things return to the start eventually.",
    "Returning to base. Take stock. Consider your choices. Make better ones next time.",
    "The lobby awaits. Go. Gather yourselves. Return when you're ready to embarrass yourselves again.",
  ],

  // ── TV corner idle ───────────────────────────────────────────────────────────

  idle: [
    "I am watching.",
    "...",
    "This is fine.",
    "Take your time. I have nowhere else to be. That is a lie. But proceed.",
    "I am Buzz. I am always here.",
    "Still going. Excellent.",
    "I wait.",
    "No rush. I have all the time in the world. I do not. But proceed.",
    "The game continues. As games do.",
    "I observe. I note. I judge. Not necessarily in that order.",
    "Everything is fine. Probably.",
    "Still here. Still watching. Still judging.",
    "Hm.",
    "One of you is going to win. I already have a theory about who.",
    "I have seen things. In this game. I shall not speak of them.",
    "Carry on.",
    "I am aware of what is happening. All of it.",
  ],
}

const GENRE_KEY_MAP = {
  'quiz':               'quiz',
  'speed-briefs':       'speedBriefs',
  'model-model-un':     'mmu',
  'hot-takes':          'hotTakes',
  'fill-gap':           'fillGap',
  'joke-off':           'jokeOff',
  'order-up':           'orderUp',
  'fart-direction':     'fartDirection',
  'true-false':         'trueFalse',
  'whodunnit':          'whodunnit',
  'music-bangers':      'musicBangers',
  'logo':               'logo',
  'dingbats':           'dingbats',
  'outlandish-lawyers': 'outlandishLawyers',
  'holy-trivia':        'holyTrivia',
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
    case 'lobbyWaiting':
      quip = pick(BUZZ_QUIPS.lobbyWaiting)
      break
    case 'playerJoins':
      quip = pick(BUZZ_QUIPS.playerJoins)
      break
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
    case 'artworkReveal':
      quip = pick(BUZZ_QUIPS.artworkReveal)
      break
    case 'playerWinning':
      quip = pick(BUZZ_QUIPS.playerWinning, seed)?.replace(/{name}/g, name || 'Someone')
      break
    case 'playerLosing':
      quip = pick(BUZZ_QUIPS.playerLosing, seed)?.replace(/{name}/g, name || 'Someone')
      break
    case 'gameEnd':
      quip = pick(BUZZ_QUIPS.gameEnd, seed)
        ?.replace(/{winner}/g, winner || 'someone')
        ?.replace(/{loser}/g, loser || 'everyone else')
      break
    case 'returnToLobby':
      quip = pick(BUZZ_QUIPS.returnToLobby)
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
