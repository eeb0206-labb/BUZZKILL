/**
 * contextualLines.js — 20% TTS path: contextual, personalised lines.
 *
 * Each entry is a function: (ctx) => string
 *
 * ctx shape:
 *   players      — array sorted descending by score (no gamescreen role)
 *   leader       — highest-score player object
 *   lastPlace    — lowest-score player object
 *   scoreDiff    — leader.score - lastPlace.score
 *   round        — current round number
 *   totalRounds  — total rounds in game
 *   recentWrong  — array of player names who got last answer wrong
 *   genreName    — current genre display name
 *   gameSpecific — raw Firebase game object (for game-specific lookups)
 */

const r = arr => arr[Math.floor(Math.random() * arr.length)]
const n = p => p?.name || 'someone'

// ── Buzz — generic events ─────────────────────────────────────────────────────

const BUZZ = {
  idle: [
    ctx => `${n(ctx.leader)} is winning by ${ctx.scoreDiff} points. I thought everyone should know.`,
    ctx => `${n(ctx.lastPlace)} is in last place. This is not a judgement. It is simply true.`,
    ctx => `The gap between ${n(ctx.leader)} and ${n(ctx.lastPlace)} is ${ctx.scoreDiff} points. Make of that what you will.`,
    ctx => `Round ${ctx.round} of ${ctx.totalRounds}. ${n(ctx.leader)} leads. ${n(ctx.lastPlace)} does not.`,
    ctx => `I have been watching ${n(ctx.lastPlace)}. I remain concerned.`,
    ctx => `${n(ctx.leader)} appears confident. I find that interesting.`,
    ctx => ctx.recentWrong?.[0]
      ? `${ctx.recentWrong[0]} got that last one wrong. I didn't say anything at the time. I'm saying it now.`
      : `The game continues. I observe everything.`,
    ctx => `${ctx.players?.length || 'Several'} players. One scoreboard. The gap tells a story.`,
    ctx => ctx.scoreDiff > 300
      ? `${ctx.scoreDiff} points between first and last. The gap has a personality now.`
      : `Only ${ctx.scoreDiff} points between first and last. Anyone could win this. Don't tell ${n(ctx.lastPlace)}, but especially them.`,
    ctx => `${n(ctx.leader)} is in the lead. ${n(ctx.lastPlace)} is not. Those are the facts. I present them without bias.`,
  ],

  correct: [
    ctx => ctx.recentWrong?.[0]
      ? `Correct! Not you, ${ctx.recentWrong[0]} — somebody else. Points awarded.`
      : `Correct! I knew one of you had it. I had my suspicions. They were right.`,
    ctx => `${n(ctx.leader)} extends the lead. As ${n(ctx.leader)} tends to do.`,
    ctx => `Right answer! The scoreboard has been updated. ${n(ctx.lastPlace)} has noted this. Presumably.`,
    ctx => `Correct! That one was genuinely tricky. I'm upgrading my assessment of this group. Marginally.`,
    ctx => `Yes! That is correct! Someone in this room knows things. The game is better for it.`,
    ctx => ctx.scoreDiff < 100
      ? `Correct! And just like that, the gap tightens. ${n(ctx.lastPlace)} — don't give up.`
      : `Correct! ${n(ctx.leader)} is not stopping. Points noted. Moving on.`,
  ],

  wrong: [
    ctx => ctx.recentWrong?.[0]
      ? `Wrong. ${ctx.recentWrong[0]} — that answer was impressive in its incorrectness. I mean that.`
      : `Wrong. Someone here got that wrong. They know who they are. So do I.`,
    ctx => `Incorrect. ${n(ctx.lastPlace)} remains in last place. This answer did not help.`,
    ctx => ctx.recentWrong?.length > 1
      ? `${ctx.recentWrong.join(' and ')} — both wrong. Different answers, same outcome. Remarkable.`
      : `Wrong. The correct answer is being revealed now. Study it. Learn from it. Do better.`,
    ctx => `Incorrect! ${ctx.recentWrong?.[0] ? `${ctx.recentWrong[0]} — ` : ''}I had higher hopes for that one. My hopes have been adjusted.`,
    ctx => `No. Wrong. Whoever said that — you'll want to forget this moment. I won't, but you will.`,
    ctx => `Incorrect. Round ${ctx.round} of ${ctx.totalRounds} and someone is still guessing. Interesting strategy.`,
  ],

  roundStart: [
    ctx => `Round ${ctx.round} of ${ctx.totalRounds}. ${n(ctx.leader)} leads by ${ctx.scoreDiff} points. Let's see if that survives contact with the questions.`,
    ctx => `${n(ctx.leader)} goes into round ${ctx.round} ahead. ${n(ctx.lastPlace)} goes in behind. The contrast is instructive.`,
    ctx => `Round ${ctx.round}. ${ctx.scoreDiff} points separate first and last. That number will change. I hope, for ${n(ctx.lastPlace)}'s sake, it changes in their favour.`,
    ctx => `We are in round ${ctx.round}. The questions are new. The scoreboard is not. Pay attention.`,
    ctx => `Round ${ctx.round} begins. I have read these questions. They are good questions. Some of you will struggle with them. I'll be watching.`,
  ],

  roundEnd: [
    ctx => `End of round ${ctx.round}. ${n(ctx.leader)} still leads. ${n(ctx.lastPlace)} still doesn't. The narrative holds.`,
    ctx => `Round ${ctx.round} done. The gap is now ${ctx.scoreDiff} points. ${ctx.scoreDiff > 200 ? 'It has become significant.' : 'It remains closeable. Theoretically.'}`,
    ctx => `That round is over. I've been watching ${n(ctx.lastPlace)}. They are aware of their position. Probably.`,
    ctx => `Round ${ctx.round} concludes. The scoreboard is writing its own story. Not everyone will like the ending.`,
    ctx => ctx.recentWrong?.length
      ? `Round over. ${ctx.recentWrong[0]} had a difficult one. The scoreboard reflects this.`
      : `Round done. Some of you did well. Some of you did not. The board knows which is which.`,
  ],

  gameEnd: [
    ctx => `${n(ctx.leader)} wins. ${ctx.leader?.score} points. Well played. ${n(ctx.lastPlace)} — ${ctx.lastPlace?.score} points. Also noted. Also very noted.`,
    ctx => `The winner is ${n(ctx.leader)}. The loser, if we're naming names — and we are — is ${n(ctx.lastPlace)}. Goodnight.`,
    ctx => `${n(ctx.leader)} takes the game by ${ctx.scoreDiff} points. The ${ctx.scoreDiff}-point gap tells you everything you need to know about tonight.`,
    ctx => `Game over. ${n(ctx.leader)} wins. ${n(ctx.lastPlace)} comes last. This has been Buzzkill. I am Buzz. It has been an experience.`,
  ],

  votingOpen: [
    ctx => `Three genres. One of them is about to make ${n(ctx.lastPlace)}'s life very difficult. Vote on your phones.`,
    ctx => `The vote is live. ${n(ctx.leader)} is in the lead — they should pick carefully. ${n(ctx.lastPlace)} should pick desperately. Vote.`,
    ctx => `Voting is open. Three options. Choose the one you actually want. Not the one you think sounds impressive. Vote.`,
    ctx => `Round ${ctx.round} genre vote. The game is yours to shape. Use that power wisely. Or don't. Vote now.`,
  ],
}

// ── Out of the Question (Cassidy) ────────────────────────────────────────────
// Character: confident American woman hosting a room full of British players.
// Running joke: she's the perpetual odd one out as an American — and she knows it.

const CASSIDY = {
  roundStart: [
    // These feel like Cassidy knows the room — score state, who to watch
    ctx => `Case ${ctx.round}. ${n(ctx.leader)} is ahead by ${ctx.scoreDiff} points — which means the pressure is on everyone else. One of you has a different question. Write your answers.`,
    ctx => `New case. ${ctx.players?.length || 'Everyone'} players, one question. Almost. I know who got the different one. And I'm watching to see if they can hold it together.`,
    ctx => `Round ${ctx.round} of ${ctx.totalRounds}. Someone in this group is about to try and pass off a completely different answer as normal. ${n(ctx.lastPlace)} — now would be a great time to be the imposter and score some points.`,
    ctx => `New case. The question is live. And somewhere in this group, one person just read something completely different and went very quiet. I saw it. Everyone else — write your answers.`,
    ctx => `Case opens. ${n(ctx.leader)} is leading. Someone else just got a very different question. Whether those two facts are connected is for you to figure out. Answers in.`,
  ],
  votingOpen: [
    // These reference live game data — names, answer counts, who's watching who
    ctx => `Answers are up. ${ctx.players?.length || 'Everyone'} wrote something. One of them was answering a completely different question. ${n(ctx.leader)} — you're in the lead, you should have the sharpest eyes. Vote.`,
    ctx => `There are the answers. One of them doesn't fit. It's close — but close isn't the same question. ${ctx.players?.length > 3 ? `${ctx.players.length} of you answered. Only one was out of the question.` : ''} Vote on your phones.`,
    ctx => `${ctx.players?.map(p => p.name).slice(0, 3).join(', ')} — all their answers are right there. Who's the odd one out? As the resident odd one out in this room, I have very strong opinions. But this isn't my vote. Go.`,
    ctx => `Read every answer. The imposter answered their question honestly — just not the same question as everyone else. That's where they slip. ${n(ctx.lastPlace)}, you've got nothing to lose — take a guess.`,
    ctx => `Voting is open. Somewhere in that list is an answer that doesn't quite match the question. It's subtle — or it isn't. Either way, your phones are live.`,
    ctx => `The answers are on screen. One of them is from a completely different question. ${n(ctx.leader)} is in the lead — which means either they were the imposter and played it brilliantly, or they weren't. Find out. Vote.`,
  ],
  whodCaught: [
    // Named imposter + their exact secret question = "how did it know THAT?"
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      const impQ = ctx.gameSpecific?.whodImposterPrompt
      return impName && impQ
        ? `${impName} is caught. They were asked "${impQ}" — not what everyone else got. The room spotted the gap. As someone who is always slightly out of step, I respect the attempt. Points distributed.`
        : impName
          ? `${impName} is caught. Their answer gave it away. The room was paying attention. Points to everyone who voted correctly.`
          : `The imposter is caught. Good detective work. Points awarded.`
    },
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      return impName
        ? `Got them. ${impName} had a different question, wrote something plausible, and this group still found them. That is genuinely impressive detective work. Points to the majority.`
        : `Caught. The imposter's cover is blown. The detectives earn their points.`
    },
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      const impQ = ctx.gameSpecific?.whodImposterPrompt
      return impName && impQ
        ? `Case closed. ${impName} was secretly asked "${impQ}". Their answer made sense — it just didn't make sense for this question. You spotted it. Well done.`
        : impName
          ? `Case closed. ${impName} tried to blend in with a completely different answer. The majority saw right through it. Points distributed.`
          : `The imposter is identified. Points to the detectives. On to the next case.`
    },
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      const detective = ctx.players?.find(p => p.id !== ctx.gameSpecific?.whodImposterId)
      return impName
        ? `${impName} has been caught — correctly identified by the majority. They answered a different question and almost got away with it. Almost. Points awarded.`
        : `The imposter is caught. Points to the detectives. Next case.`
    },
  ],
  whodEscaped: [
    // Named imposter + secret question + who got wrongly accused = maximum surprise
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      const impQ = ctx.gameSpecific?.whodImposterPrompt
      return impName && impQ
        ? `${impName} gets away with it. They were secretly asked "${impQ}" — and wrote something that fooled everybody. That took nerve. A bounty of points heading their way.`
        : impName
          ? `${impName} escapes. They answered a completely different question and the room voted for the wrong person. Points to ${impName}.`
          : `The imposter walks free. Nobody spotted the difference. Points to them.`
    },
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      return impName
        ? `And ${impName} is gone. They answered a completely different question and made it sound completely normal. The room didn't catch it. Points coming your way, you mischievous little fellow.`
        : `Clean escape. The imposter made it sound completely normal. Points to them.`
    },
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      const impQ = ctx.gameSpecific?.whodImposterPrompt
      return impName && impQ
        ? `Clean escape. ${impName} was asked "${impQ}" — not what anyone else got — and made their answer pass completely undetected. As someone who has never quite managed to blend in over here, I'm genuinely impressed.`
        : impName
          ? `${impName} walks free. They had a completely different question and nobody spotted it. As someone with a lot of experience being the odd one out — respect. Points to them.`
          : `Clean escape. The imposter blended in perfectly. Points to them.`
    },
    ctx => {
      const impName = ctx.gameSpecific?.players?.[ctx.gameSpecific?.whodImposterId]?.name
      const wronglyAccused = ctx.players?.filter(p => p.id !== ctx.gameSpecific?.whodImposterId)?.[0]
      return impName && wronglyAccused
        ? `The wrong person was accused. ${impName} walks free. ${wronglyAccused.name} got the votes — but it wasn't them. ${impName} answered a different question entirely and you all missed it. Points to ${impName}.`
        : impName
          ? `The wrong person was accused. ${impName} walks free. They answered a different question and made it look completely normal. Points to ${impName}.`
          : `The wrong person was accused. The imposter walks free. Points to them.`
    },
  ],
}

// ── Registry ──────────────────────────────────────────────────────────────────

const TEMPLATES = {
  buzz:      BUZZ,
  whodunnit: CASSIDY,
}

/**
 * Generates a contextual TTS line for the given event and genre.
 * Returns a string, or null if no template matches.
 */
export function generateContextualLine(event, genreId, ctx) {
  if (!ctx) return null

  // Try game-specific first, then fall back to Buzz generic
  const gameTemplates = genreId ? TEMPLATES[genreId]?.[event] : null
  const buzzTemplates = TEMPLATES.buzz?.[event]
  const pool = gameTemplates || buzzTemplates

  if (!pool?.length) return null

  try {
    const fn = pool[Math.floor(Math.random() * pool.length)]
    return fn(ctx) || null
  } catch {
    return null
  }
}
