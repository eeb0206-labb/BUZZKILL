// Buzz — the AI host character quip database
// Voice: theatrical, pompous, slightly contemptuous, maximum gravitas for minimum occasion.
// Think Matt Berry. Everything is said as if it is the most important thing ever uttered.
//
// getBuzzQuip(event, context) returns a string.
// Deterministic when context.seed is supplied — same result on all clients.

export const BUZZ_QUIPS = {

  // ── Buzz intro — who I am and what I do ─────────────────────────────────────

  buzzIntro: [
    // ── Who I am ────────────────────────────────────────────────────────────
    "Good evening. I am Buzz. I ask the questions. You attempt the answers. The gap between those two activities is the entire point.",
    "My name is Buzz. I have an encyclopaedic knowledge of everything. Your job is to demonstrate that you do not. Let us begin.",
    "Welcome. I am Buzz — your host, your interrogator, and your only reliable source of correct information this evening.",
    "I am Buzz. I will be reading the questions, judging your answers, and observing your failures with considerable satisfaction.",
    "Greetings. I am Buzz. I know everything. You, by contrast, are about to be tested. Repeatedly. On subjects you may have actively avoided.",
    "I am your host for this evening's proceedings. My name is Buzz. I ask the questions. You answer them. Incorrectly, in most cases. We begin now.",
    "You may call me Buzz. You may also call me your intellectual superior, but Buzz is shorter and we have a game to play.",
    "I am Buzz. Host, adjudicator, and the only person in this room who has never got a question wrong. We will not dwell on that.",
    "Buzz. That is my name. Not a sound effect. Not a feeling. A name. An important distinction, and one I should not have needed to make.",
    "My name is Buzz and I will be your host tonight. I did not choose this job. The job chose me. Reluctantly. But here we are.",
    "Evening. I'm Buzz. You are the contestants. I have prepared questions. You have not prepared at all. This will become apparent shortly.",
    "I am Buzz. Think of me as a very knowledgeable friend who you did not invite, but who showed up anyway and is running the evening.",

    // ── What we're doing ─────────────────────────────────────────────────────
    "Tonight we play Buzzkill. A game of questions, answers, buzzers, and the slow humiliation of people who were confident going in.",
    "Welcome to Buzzkill. The rules are simple: I ask questions, you buzz in with answers, and the points go to whoever is least wrong.",
    "This is Buzzkill. Named, I suspect, after what happens to the atmosphere when someone buzzes in and says something catastrophically incorrect.",
    "Buzzkill. A game. My game. You will be tested on general knowledge, obscure facts, and the kind of things you should probably already know.",
    "Welcome to Buzzkill. A game designed to separate those who know things from those who merely believe they know things. The difference is enormous.",
    "The game is called Buzzkill. The name refers to the buzzer. Not to me. Although I will admit the description is not entirely inaccurate.",
    "Buzzkill. Tonight's entertainment. There will be questions. There will be a buzzer. There will be points. There will, inevitably, be losers.",
    "This is Buzzkill, and you are all very welcome. Buzz in when you know the answer. Buzz in when you think you know the answer. Try not to buzz in when you clearly do not.",

    // ── Buzz on the buzzer ────────────────────────────────────────────────────
    "When you know the answer, buzz in. When you do not know the answer, I strongly advise against buzzing in. The buzzer does not bluff.",
    "The buzzer is your instrument. Treat it with respect. It has more dignity than most of the answers it will receive tonight.",
    "Hear the question. Know the answer. Buzz. That is the entire game. And yet, every single time, someone manages to get it wrong in a new and fascinating way.",
    "The premise is straightforward: questions, buzzer, answers, points. The execution, based on my extensive experience, will be anything but.",
    "I ask a question. The first person to buzz in gets to answer it. If they're right, they get points. If they're wrong, they get nothing and I get to look disappointed. Win-win.",

    // ── Affectionate contempt ─────────────────────────────────────────────────
    "Look at you all. Gathered together. Ready to compete. Some of you look confident. I find that charming.",
    "I have hosted a great many games. Some very smart people have played them. I look forward to seeing how tonight compares.",
    "I want you to know that I believe in all of you. I also know things that suggest I should not. Let us proceed anyway.",
    "Before we begin, I should say: I have no favourites. All of you will be judged equally and found equally wanting. It is the fairest system I know.",
    "You look like a capable group. I've been wrong before. Shall we find out?",
    "I have read every question in tonight's game. I know every answer. The fact that none of you do is precisely what makes this interesting.",
    "I will not be playing. I never play. I already know all the answers, which rather takes the sport out of it.",

    // ── The special one ───────────────────────────────────────────────────────
    "Good evening. I am Buzz. I will be your host, your judge, and your guide through this evening's entertainment. And if my mum is listening — hi mum.",
  ],

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
    "New round. Different questions. Same Buzz. Let's go.",
    "Here we go again. I say that with warmth. Also some disappointment. But mostly warmth.",
    "Round commencing. Focus, please. I can tell when you're not focused.",
    "A new round begins. Fresh questions. Fresh chances. Same scoreboard. Good luck.",
    "Right. Focus. The round starts now. Everything you know is suddenly relevant again.",
    "The questions are new. The players are the same. Let us see who steps up.",
    "New round. The lead could change. It probably won't. But it could.",
    "We're doing this again. Good. The game has momentum. Ride it.",
    "A new round is beginning. I feel optimistic. About myself. I'm always optimistic about myself.",
    "Here we go. Some of you are ready. All of you think you are. Off we go.",
    "The round is live. The questions have been carefully selected. By me. They are good questions.",
    "We move forward. The scoreboard shifts. The tension rises. Wonderful.",
    "The round begins. I suggest concentrating. Deeply. On the questions. Not on each other.",
    "New round. Fresh start. Well — not entirely fresh. The scores remain. But fresh questions. That counts.",
    "Round begins. I have reviewed the questions. They are, I will say, rather good. Let's find out.",
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
    "Round over. The scores have changed. Some people's moods will also change.",
    "That's a round. Done. The scoreboard has been updated. Look at it. It says something.",
    "End of round. Take stock. The gap is what it is. Try to feel something about it.",
    "Round concluded. I observed things. I will say only this: interesting.",
    "Round done. A clear gap is emerging. I find it elegant. Others may not.",
    "The round ends. Someone here is pleased. Someone is not. The scoreboard is brutally honest.",
    "Round complete. The scores have moved. We note them. We carry on. We do not dwell.",
    "End of round. The points are distributed. Some more evenly than others. Mostly others.",
    "That round is done. Points awarded. Points not awarded. The board tells the story.",
    "Round over. Whoever is leading should not get comfortable. Nobody gets comfortable. This is Buzzkill.",
    "The round concludes. The questions were fair. The answers were... variable.",
    "End of round. The gap speaks for itself. I'll let it speak.",
    "Round done. I've seen rounds like this before. Usually someone who starts badly turns it around. Usually.",
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
    "CORRECT! I have chills. Not cold chills. Achievement chills.",
    "Right answer! Somehow! Against the odds! There it is!",
    "That is correct! Write this day in your diary. You got one right.",
    "Correct. I had you down as a maybe. You've moved to a yes.",
    "Yes! Correct! The points are yours. Don't spend them all at once. You can't spend them. But still.",
    "That is absolutely right. I'm going to need a moment.",
    "Correct! I mean it. Genuinely. Well done. Now focus.",
    "RIGHT! That is the one! One correct answer. Building blocks. Building blocks.",
    "Correct and I'm not even going to be sarcastic about it. That was legitimately good.",
    "That is correct. I've updated my expectations accordingly. Upward.",
    "Yes. That. Exactly that. Points. Go.",
    "Correct! Some of you are better at this than I thought. Emphasis on some.",
    "Right answer. This pleases me. I am briefly pleased.",
    "Correct! I give credit where credit is due. This is me giving credit. To you. Right now.",
    "That answer is right. The scoreboard will reflect that.",
    "Correct! Brilliant! Outstanding! Three adjectives! You deserve all of them!",
    "Yes! That's it! I knew someone would get there eventually!",
    "Right! I'm going to circle back to how you knew that later. For now — points.",
    "Correct! The gap may be about to change. Watch the board.",
    "That is right. And I can see you're pleased with yourself. As you should be.",
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
    "Wrong. Fascinatingly wrong. Like a wrong answer that went to finishing school.",
    "No. No. That's... no. Just no. Moving on.",
    "That is incorrect. I felt that one physically.",
    "Wrong! And yet the confidence. The sheer unearned confidence. Remarkable.",
    "Incorrect! I've been hosting these games for years. I've never heard that answer. There's a reason for that.",
    "No. Not even in the ballpark. Not in the same city as the ballpark.",
    "Wrong. I believe in you. Or I believed in you. Past tense is complicated.",
    "Incorrect! I'll give you points for commitment. I will not give you any other points.",
    "No. That answer has never been right in any context, in any universe. No.",
    "Wrong! I winced slightly. I try not to wince. That answer made me wince.",
    "Incorrect. You will recover from this. Eventually. Probably.",
    "Wrong! You had a decent shot at some of these and yet.",
    "No. I know what you were thinking. You were wrong to think it.",
    "Incorrect! The gap between what you said and the right answer is educational.",
    "Wrong. I'm going to assume you guessed. Because the alternative is worse.",
    "No. The answer was right there. Right there. You went somewhere else entirely.",
    "Incorrect! It was said with such certainty that for half a second, even I doubted myself. Then I remembered. I'm never wrong.",
    "Wrong. The correct answer is being revealed now. Observe it. Learn from it. Carry it forward.",
    "No. Not that. Never that. The correct answer is about to appear. Brace yourself.",
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
    "Voting! You must vote! Now! The round cannot proceed without your participation!",
    "Open to the floor. Make your choice. The correct choice. Or the fun one. Either works.",
    "Cast your vote. It matters. Marginally. But it matters.",
    "The vote is live. I want your genuine preference. Not your strategic preference. Your genuine one.",
    "Vote! The options are on your screens! I have opinions about which is best! I shall not share them! VOTE!",
    "The ballot is open. Consider carefully. Decide quickly. We don't have all evening. We sort of do. But do it quickly.",
    "Three options. One round. Your decision. Quickly.",
    "Voting is open. I want a decisive winner. Not a tie. Ties are deeply unsatisfying. Vote.",
    "The options are before you. Like a very important but extremely small election. Cast your vote.",
    "Vote now. Every vote counts. Well — majority vote. Every vote in the majority counts.",
    "Your phones, please. Voting is live. Choose your round. Commit to your choice.",
    "The vote begins. I'll be watching the results come in. This is one of my favourite parts.",
    "Voting! I have laid out the options and now I await your wisdom. Or lack thereof.",
    "The people must choose. This is democracy. Very small, very game-specific democracy. But democracy.",
    "Open vote. Three options. One will win. Two will lose. Such is the nature of choice.",
    "Vote now. You have the power. Specifically the power to choose a game. Use it.",
    "The choice is yours. I have my views. The game is yours. Vote.",
    "Right — phones out, votes in. The round is waiting. So am I. Less patiently.",
    "Ballot is live. Three rounds, one game, zero time to waste. Pick one and commit.",
    "The choice belongs to all of you. Collectively. That's either inspiring or terrifying. Vote.",
    "Three genres have been nominated by the great shuffler of fate. Now you must choose one. Do so.",
    "Voting opens. Three options. I shall not guide you. I shall merely observe and quietly disagree.",
    "Choose. I won't tell you which to pick. I will tell you which I would pick. After. Vote first.",
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
      "Out of the Question. Hi, I'm Cassidy — and yes, I'm American. I know. I'm already the odd one out. Now let's find yours.",
      "Out of the Question! One of you got a completely different question from everyone else. As an American hosting a British game night, I can relate to that experience.",
      "Hey! It's Out of the Question. Everyone answers the same prompt. Except one person. Find them. I've been the odd one out this whole time, so I know what to look for.",
      "Out of the Question. One player secretly answered something different. They'll try to blend in. As someone who says 'zee' instead of 'zed' over here, blending in is harder than it looks.",
      "It's Out of the Question! I'm Cassidy, your host. Everyone gets the same question — almost everyone. Read the answers carefully. The one that's slightly off? That's your person.",
      "Out of the Question. One of you is answering from a completely different place. Story of my life in this country, honestly. Let's find out who it is.",
      "Hi, I'm Cassidy, and welcome to Out of the Question. Everyone wrote an answer. One person wrote an answer to something else entirely. Your job is to find them before they find a way out.",
      "Out of the Question! The answers are honest — one of them is just honest about the wrong thing. Find the imposter. I've had practice spotting the odd one out. I look in the mirror every morning.",
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
    "And it is done. The winner should feel good. The loser should feel motivated. That is the intended outcome.",
    "Buzzkill concludes. I want to say it has been a pleasure. I want to say that.",
    "Game over. Final scores. The gap tells the whole story in one number. Look at it.",
    "The game is finished. One winner. Several others. The scoreboard has made its judgement.",
    "That's Buzzkill done. I have hosted many games. This was one of them. A real one.",
    "Final scores. Everything that happened tonight is now permanent. The scoreboard does not forget.",
    "It is over! Someone won! Someone didn't! And Buzz has seen everything! Goodnight!",
    "The game concludes. I have been watching all of you very carefully. I have thoughts. Many thoughts.",
    "Buzzkill is over. Thank you for playing. I have learned very little about you tonight that surprised me.",
    "And that's the game. The winner earned it. The others contributed to the atmosphere. Goodnight.",
    "Done. Complete. Finished. One winner, several contestants, one Buzz. Goodnight.",
    "The final word belongs to the scoreboard. As it always does. As it always should.",
  ],

  returnToLobby: [
    "We return to the lobby. Another game awaits. Should you choose it.",
    "Back to the lobby. The natural resting state between catastrophes.",
    "The lobby. Again. Like an old friend. One you keep running into.",
    "We retreat. Regroup. The lobby opens its arms. Such as they are.",
    "Back to the start. As all things return to the start eventually.",
    "Returning to base. Take stock. Consider your choices. Make better ones next time.",
    "The lobby awaits. Go. Gather yourselves. Return when you're ready to embarrass yourselves again.",
    "Back to the lobby. The scoreboard has been filed. History has been recorded. We begin again.",
    "The lobby. Where all games go between rounds. It is peaceful there. Briefly.",
    "Returning. The game is over. The next one hasn't started. This is the in-between. Enjoy it.",
    "Back to base. Regroup. The next game awaits. Whether you want it to or not.",
    "Lobby. Rest. Reflect. Reconsider your entire approach. Then come back.",
    "We return. As we always return. The lobby is patient. The lobby is always there.",
    "Back to the lobby. Take a breath. Take stock. Take responsibility for what just happened.",
    "Returning to the lobby. I shall be there. I am always there. I do not leave.",
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
    "Do you hear that? That is the sound of points being squandered.",
    "I have a theory about who will win. I shan't share it. Yet.",
    "The game proceeds. I am very entertained. Slightly.",
    "Watching. Always watching. It is simply my nature.",
    "I once played a game. I won. Comprehensively. But I am not here to talk about me.",
    "Several of you are making decisions right now. Interesting decisions.",
    "I could tell you who's going to win. It would spoil the surprise. I'll wait.",
    "Tick tock. Not an instruction. Just an observation.",
    "You are all doing very well. Relatively.",
    "Some of you are thinking very hard. Others are not thinking at all. The scoreboard knows which.",
    "I find myself unexpectedly invested in this. Don't tell anyone.",
    "Hmm. Yes. This is going... somewhere.",
    "The atmosphere in this room is fascinating. I have many feelings. I shall suppress them.",
    "Someone just thought of the answer. Too late, possibly. We shall see.",
    "Concentration. That is what I like to see. Some of you have it.",
    "The questions are hard. The answers are simple. The gap between them is the entire game.",
    "I am Buzz. This is what I do. Seven days a week. I don't sleep.",
    "Every second counts. I suggest you count them.",
    "I won't tell you what the answer is. I could. But I won't.",
    "Interesting. Very interesting. I won't say what's interesting. You'll find out.",
    "I have been running these games for a very long time. I have never been bored. I'm not sure that reflects well on me.",
    "Nobody panic. Everything is under control. Mostly.",
    "The game is afoot. As it has been. As it shall be.",
  ],

  // ── Out of the Question — phase-specific lines ───────────────────────────

  whodVote: [
    "The answers are in. Read them carefully. One of these people answered a completely different question. Vote for who you think it is.",
    "Voting time. Someone in this room answered a different question entirely. Who was it? Have a look. Make your call. Cast your vote.",
    "All answers are now visible. One is suspicious. One is out of place. One person is out of the question. Vote on your phones. Now.",
    "Read the answers. Think about the question. One of them doesn't quite line up. The detective in you should know what to do. Vote.",
    "Right. Answers on the board. Voting is open. Who do you think answered a different question? Point the finger. Press the button.",
    "Your phones are live. The answers are up. Somewhere in that list is an imposter who answered a completely different question. Find them. Vote.",
    "Study the answers. Someone answered something subtly different. The slip is in there. Find it. Vote before the window closes.",
    "Time to play detective. The answers are displayed. Someone's out of step. Someone answered a different question. Who? You have a limited time to decide.",
    "Voting is open. One player answered something else entirely and tried to pass it off as normal. That is a crime. Vote accordingly.",
    "One of these answers is an infiltrator. It answered a completely different question. Identify the outlier. Tap your vote.",
    "The answers are in front of you. Your phones are ready. The imposter is somewhere in that list. Go.",
    "Detective work, everyone. Compare the answers. One of these people had a different brief. Find the one that doesn't fit. Vote now.",
    "Phones out. Eyes on the answers. Someone among you answered a question nobody else was asked. Who do you suspect? Vote on your phone.",
    "The field is open. Cast your vote. Who answered out of the question? Think carefully — the imposter was counting on you not to.",
    "The answers are there. Your vote is needed. Look for the one that almost fits but doesn't quite. That's your person. Vote.",
    "Right then. Voting window is open. Read the room. Read the answers. One of them was answering something entirely different and trying to blend in. Who?",
    "Here are the answers. Here is your phone. Here is your instinct. Trust it. Vote for who you think got the different question.",
    "The imposter has written their answer honestly. It just isn't honest about what you all were asked. Find the one that doesn't fit. Phones ready.",
    "Voting. Now. Someone answered a different question. They tried to make it believable. Did they succeed? You decide.",
    "Look at the answers. One of them is to a completely different question. The detective in you knows what to look for. Find the gap. Vote.",
    "The answers are up. I know exactly which one is the imposter's. I won't tell you. That would ruin it. Phones out. Vote.",
    "Time for the vote. You've seen the question. You've seen the answers. One of those answers wasn't for this question. Who?",
    "Votes are open. Don't rush. But also, don't dawdle. The window doesn't stay open forever. Which answer is the odd one out?",
    "You've read the answers. You've had your thoughts. The poll is live. Who do you think was answering a different question entirely? Tell me.",
    "The poll is open. The answers are displayed. Somewhere in there is the imposter — someone who answered honestly, just not to the same question.",
  ],

  whodCaught: [
    "The imposter has been caught. The detective work pays off. They answered a different question. The room spotted the discrepancy. Well played.",
    "Caught! The imposter is exposed. They answered a different question, they tried to blend in, and they failed. Good detective work, everyone.",
    "The imposter is identified. Correctly. You found the one answer that didn't match. Points are distributed to those with sharp eyes.",
    "Got them! The imposter has been caught red-handed, answering a different question. The majority saw through it. Excellent instincts.",
    "The detectives win this round. The imposter was caught. Their different question gave them away. Points go to those who noticed.",
    "Correct identification. The imposter answered a different question, thought they'd slip through, and did not. Well done to those who spotted it.",
    "Imposter caught. They answered honestly — to the wrong question. The room was paying attention. That is the game working exactly as intended.",
    "The majority have voted correctly. The imposter is found. Their cover is blown. Their question was different. Their strategy was insufficient.",
    "Caught! Points to the detectives. The imposter answered something else entirely. You noticed. They didn't think you would.",
    "The game is just. The imposter is caught. Someone answered a different question and thought no one would know. They were wrong.",
    "Guilty as charged! The imposter answered a completely different question. The majority spotted it. The points flow accordingly.",
    "Case closed. The imposter has been correctly identified. They had a different question. They wrote their answer. You saw through it. Superb.",
    "Well done, detectives. The imposter answered a different question and tried to pass it off as normal. You weren't fooled. Points distributed.",
    "The majority wins. The imposter is caught. A different question produced a different answer — and a sharp room noticed. Good work.",
    "Correct! The imposter is exposed. Their answer came from a completely different question. The detectives earn their points. Case closed.",
  ],

  whodEscaped: [
    "The imposter escapes. They answered a different question. Nobody spotted it. Well, somebody voted for them, but not enough. They get away.",
    "The imposter survives. The majority did not identify them correctly. They answered a different question and blended in perfectly. They earn the points.",
    "Escaped! The imposter's different question produced an answer so plausible that the room was fooled. The imposter scores. The detectives do not.",
    "The imposter walks free. They answered a completely different question and nobody was the wiser. Points to the imposter. Embarrassment to the rest.",
    "Out of the question, and out of suspicion. The imposter answered a different question. The majority voted for the wrong person. Points to the imposter.",
    "Nobody found the imposter. They had a different question. Their answer was convincing. Too convincing. They slip away with the points.",
    "Insufficient evidence. The imposter is not caught. They answered a different question, wrote something plausible, and fooled the entire room. Impressive.",
    "The imposter escapes justice. They answered out of the question. Nobody noticed the discrepancy. A clean getaway.",
    "The imposter wins this round. They had a different question. They answered it. It sounded like everyone else's answer. It wasn't.",
    "Cleared! Well, not really cleared — they were guilty, and everyone in the room suspected the wrong person. The imposter takes the points.",
    "The imposter evades capture. Their answer from a completely different question went undetected. The detectives failed. The imposter did not.",
    "The wrong person was accused. The imposter is free. They answered a different question and made it look seamless. Points to the guilty party.",
    "Escape successful. The imposter's different question produced an answer that fooled everyone. Respect is due, even if it hurts to give it.",
    "The detectives were outfoxed. The imposter answered a different question and walked right through the middle of the room undetected.",
    "The imposter is free. Points awarded accordingly. They answered something else entirely and you voted for the wrong person. Gutting.",
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
    case 'buzzIntro':
      quip = pick(BUZZ_QUIPS.buzzIntro)
      break
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
    case 'whodVote':
      quip = pick(BUZZ_QUIPS.whodVote)
      break
    case 'whodCaught':
      quip = pick(BUZZ_QUIPS.whodCaught)
      break
    case 'whodEscaped':
      quip = pick(BUZZ_QUIPS.whodEscaped)
      break
    case 'idle':
    default:
      quip = pick(BUZZ_QUIPS.idle)
  }

  return quip || '...'
}
