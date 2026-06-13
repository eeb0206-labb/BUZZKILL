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
    "The players assemble. At their own pace. A pace I would describe as leisurely.",
    "We wait for everyone to arrive. The game has not started. Technically this is the calm.",
    "Someone is still finding their phone. I can tell. We wait.",
    "The lobby fills slowly. Like a container. With people. Instead of whatever the container normally holds.",
    "Waiting. I am practised at this. I have waited for many people. They all showed up eventually. Probably.",
    "Players are arriving. I note each arrival. I also note each absence. I always note absences.",
    "We stand by. The game begins when everyone is present. We are not yet everyone.",
    "The group takes shape. Slowly. That is fine. I have nowhere else to be. I said that earlier and it remains true.",
  ],

  playerJoins: [
    "A new player. Welcome. Sit down. We'll begin shortly.",
    "Another one arrives. The group expands. The odds shift slightly.",
    "We have a new arrival. I trust they know what they've signed up for.",
    "Someone new. I note this. Everyone note this. They are here now.",
    "Welcome. You've arrived just in time. Or possibly too late. We'll see.",
    "They join us. The team is forming. Slowly. But forming.",
    "Another contestant. Excellent. The more the merrier. Within reason.",
    "A new player has arrived. Welcome. Try to keep up.",
    "Someone else has joined. The group expands. The competition intensifies. Slightly.",
    "New arrival. I note them. I note everyone. I do not forget.",
    "And another player joins. Good. More contestants. More things for me to observe.",
    "Someone has arrived. The player count increases. The game draws closer.",
    "Welcome, new contestant. Your timing is fine. Your preparation I cannot speak to.",
    "Another one. Good. The more the better, up to a point. We have not reached that point.",
    "A player joins. I see them. I have already formed an impression. I will keep it to myself.",
    "New player. Welcome. The game starts when everyone is here. You are not everyone. But you are part of it now.",
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
    "Here we go. Everyone is here. Everything is set. The questions are loaded. I am ready. Are you? Don't answer that.",
    "Right. We begin. Buzzkill, the game. Buzz, the host. You, the contestants. The dynamics are established. Off we go.",
    "The game commences. I have been looking forward to this. Possibly more than is healthy. Let's proceed.",
    "Welcome, everyone. We have gathered. We have a game. We have questions. We have a winner to find. Let's find one.",
    "I am ready. The game is ready. The questions are ready. The only remaining variable is your readiness. We proceed regardless.",
    "Buzzkill begins. I've done this many, many times. It never gets old. For me. I cannot speak for the questions.",
    "Here it is. The game. I will host. You will play. The scoreboard will tell the truth. As it always does. Begin.",
    "Good. Everyone's here. Questions are live. The game begins from this exact moment. Not before. Not after. Now.",
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
    "The vote is in. The game has been selected by the people, for the people. Whether the people will enjoy it remains to be seen.",
    "Voting concluded. The round is decided. I will simply note that I had a preference. Nobody asked.",
    "The decision has been made. The crowd has spoken. I accept the outcome. Outwardly.",
    "That's the vote. The majority wins. They usually do. That's how voting works.",
    "Voting closed. Results counted. The game proceeds in the direction you have collectively chosen. I will be judging that choice from here.",
    "The vote is done. The round is selected. We move forward. No going back. The scoreboard waits.",
    "Democratic process complete. One round wins. Two rounds did not. The chosen one awaits.",
    "Votes in. Decision made. This is what you wanted. We will now find out if you were right to want it.",
  ],

  // ── Genre-specific round intros ──────────────────────────────────────────────

  genreReveal: {
    default: [
      "It is {genre}. We proceed. Good luck.",
      "The genre is {genre}. Yes. This is what we're doing.",
      "{genre}! Splendid. Or not. Either way, we begin.",
      "It has been decided. {genre}. Now focus.",
      "The crowd has spoken. {genre}. I trust you're ready.",
      "{genre}. The room has chosen and we shall not revisit this. Begin.",
      "And the round is — {genre}. I have opinions. They are irrelevant now. Begin.",
      "{genre}. I've hosted worse. I've hosted better. This is {genre}. Let's go.",
      "The people have voted. The result is {genre}. I will observe. Begin now.",
      "{genre} begins. I suggest focusing immediately. The game does not wait for anyone.",
      "Right then. {genre} it is. I trust this was a deliberate choice. Begin.",
      "The vote is final. {genre}. I accept the will of the crowd. I don't have to like it. Begin.",
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
      "MUSIC BANGERS! I'm DJ Kaz, your host, and yes — we are absolutely doing this. I'll play a clip, you buzz in, name the song or the artist. Fingers ready. Let's go!",
      "Right then! Music Bangers is on! I'm DJ Kaz and I have been putting these tracks together for weeks. Well. One afternoon. But I stand by every single one. Buzz when you know it.",
      "Music Bangers time! DJ Kaz in the mix. I've got bangers, I've got deep cuts, and I've got one that is going to absolutely divide the room. No spoilers. Let's crack on.",
      "Welcome to Music Bangers — I'm DJ Kaz! Quick rule: no humming along, it's not fair. Buzz in, name the tune, bag the points. If you know it, you'll know it instantly.",
      "Right, Music Bangers! I'll play a clip — could be a few seconds, could be a bit more, depends how generous I'm feeling. Buzz in, name the banger, let's have it!",
      "MUSIC BANGERS! This is the round where we find out who has genuinely been paying attention to music their whole life, and who's been nodding along and pretending. I'm DJ Kaz. Let's find out.",
      "DJ Kaz here — welcome to Music Bangers! I've got a genuinely brilliant selection of tracks lined up and I am not being modest. This set is a certified banger start to finish. Here we go!",
      "Music Bangers! I'm DJ Kaz. I could play it from the obvious bit and make it easy. I could also play it from the weird bridge nobody remembers. I'm going to mix it up. You'll see.",
    ],
    musicNext: [
      "Okay, here's the next one! Fingers on the buzzers — this is a certified banger, I will say that much. Don't let it go.",
      "Right, next tune coming in! You ready? I said — are you READY? Buzz the absolute second you know it.",
      "Ohhh this next one. This is a good one. I am personally very excited about this track. No hints from me. Just listen.",
      "New clip! Quick reminder — song OR artist, either one counts. Both together? Chef's kiss. Buzz in!",
      "Next song incoming. I've played this one in the car about forty times this week. Completely unprofessionally. Here we go.",
      "Coming up next — and I will say absolutely nothing to give it away. Not a word. Except: banger. Here we go.",
      "Next up. And I'll just say — when this one comes in, you'll either know it immediately or you'll be kicking yourself for the next thirty seconds. Buzz in!",
      "Right, here comes the next one. Now this is either going to be instantly recognisable or deeply unfair depending on your musical era. Either way — buzz!",
      "Number whatever this is — here we go! I have put genuine care into this playlist. This next one is a perfect example of why. Listen carefully. Buzz.",
      "Okay, next clip coming in HOT. Fingers ready. This one has been stuck in my head since I picked it and I am not apologising for that. Buzz when you know it.",
      "Here's the next banger. Now I don't want to say anything to give it away, but — actually no, I genuinely don't want to give it away. Just listen. GO.",
      "Next track. New challenge. Same rule: buzz when you know it. And I will say this — if you know this one, you have excellent taste. If you don't, no comment. GO.",
      "Right, we're moving on! Next clip incoming. This one is going to split the room — I can already tell. Some of you will get it instantly. Some of you won't. Buzz!",
      "Next one's dropping in now. And look — I know I keep saying 'this is a good one' but I genuinely mean it every single time. They're all good. That's the point. Buzz!",
    ],
    musicReveal: [
      "YES! That is the one! Absolute tune. Still a banger. Always will be a banger. Ten out of ten, no notes.",
      "There it is! That is a certified classic right there. I have no shame in saying that one never gets old. Well played.",
      "And that's the song! Genuinely one of my favourites, that. Not that it matters. Points have been distributed. Moving on!",
      "That's the one! How did you not all get that immediately? It's an absolute anthem. I'm not judging. I am, a little. Love it.",
      "TUNE! That is a full on tune. Right — next one's coming. Keep those fingers ready.",
      "And the answer is revealed! Look, if you didn't know that one, it might be time for a Spotify audit. Just saying. No judgment. Loads of judgment.",
      "There we go! Revealed! Now that is a song with history. A song with legacy. A song I will defend to the grave. Points distributed. Onwards.",
      "That's your answer! And honestly? If you knew that one, you have my respect. Genuinely. That was not an easy one. Points going out.",
      "Revealed! That track right there — that's what this playlist is for. To expose who has been paying attention to music and who hasn't. Results noted. Points out.",
      "AND THERE IT IS! I mean — come on. What a track. What an absolute specimen of a song. Points to whoever got it. Let's keep moving.",
      "That's the song! Now I'll be honest — I threw that one in specifically to test if anyone in this room had proper taste. Results are in. Points distributed.",
      "Answer revealed! And I will say — that clip I gave you was from the weird bit in the middle that nobody remembers. Fair? Probably not. Points out anyway.",
      "There it is. The answer. And if you didn't get it, I just want you to know that this song has been played on the radio roughly eleven thousand times. Points distributed.",
      "Revealed! Right — moving on. We've got more bangers to get through and I will not be slowing down. Points out. Next clip incoming.",
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
      "This court is now in session. The cases today are, I will say, unusual even by this court's standards.",
      "Outlandish Lawyers! I have waited my entire career to preside over something like this. That is a complicated feeling. Begin.",
      "The law is a blunt instrument. In this round, it is also a particularly strange one. Outlandish Lawyers begins.",
      "All rise. This court is in session. The charges are outlandish. The lawyers are worse. I am in my element.",
      "Outlandish Lawyers. The round where the rules of argument apply and the rules of reality do not. Judge Barnaby Fine presides. Begin.",
    ],
    holyTrivia: [
      "Holy Trivia. Sacred questions. Secular answers. I expect reverence.",
      "It is Holy Trivia. Eternal questions under time pressure. The universe watches.",
      "Holy Trivia! These questions have lasted millennia. You have seconds. Begin.",
      "The sacred round. Answer respectfully. Answer quickly. Answer correctly.",
      "Holy Trivia. Not all questions have answers. These ones do. Find them.",
      "Holy Trivia begins. The great questions of faith, history, and scripture. You have a buzzer. Use it reverently.",
      "The holy round. I approach this with the solemnity it deserves. I expect you to do the same.",
      "Questions of sacred significance. A buzzer. A scoreboard. Holy Trivia. Begin.",
      "Holy Trivia! These are not ordinary questions. They deserve extraordinary answers. Or at least a good attempt. Begin.",
      "The sacred and the timed. This is Holy Trivia. I have prepared myself spiritually. I cannot speak for the rest of you.",
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
    "{name} leads. I note this. Everyone note this.",
    "The scoreboard favours {name}. For now. These things change.",
    "{name} is in front. The rest of the field has noticed. The rest of the field should worry.",
    "Current leader: {name}. I have nothing further to say. That says enough.",
    "{name} is ahead. This pleases {name}. This should concern everyone else.",
    "First place, currently: {name}. I'm watching to see if it holds.",
    "The scoreboard says {name}. The scoreboard is rarely wrong. For now.",
  ],

  playerLosing: [
    "{name} is at the bottom of the scoreboard. This is just information. Important information.",
    "Currently last: {name}. There is time. Not much. But some.",
    "{name} is struggling. I note this without judgment. Well. Minimal judgment.",
    "{name} occupies last place. This is the current state of affairs.",
    "The bottom of the scoreboard belongs to {name}. For now. Technically for now.",
    "Last place: {name}. I present this fact neutrally. I feel it somewhat differently.",
    "{name} is at the back of the field. These things are reversible. Statistically.",
    "The scoreboard is unkind to {name} at present. The game, however, is not over.",
    "Currently: {name} is last. I note this as information. The tone is entirely neutral.",
    "{name} finds themselves at the foot of the scoreboard. I have faith. Moderate faith.",
    "The bottom slot belongs to {name} right now. This could change. It has changed before.",
    "Last place is {name}'s. Temporarily. In theory. The board has surprised me before.",
  ],

  comebackTime: [
    "The gap can be closed. In theory. I've seen it done. Once.",
    "It is not over. History is full of unlikely reversals. Full of them.",
    "Anyone can win from here. Anyone with the right answers. Which is, theoretically, anyone.",
    "There is time. Not much. But the scoreboard has surprised me before.",
    "The gap is not insurmountable. Improbable. But not insurmountable.",
    "I have seen bigger deficits overturned in this game. I have also seen them fail to be overturned. Both outcomes are possible. One is more likely.",
    "The scoreboard does not favour certain people right now. That can change. It has changed. Make it change.",
    "There is time remaining. That time contains questions. Those questions contain points. Points change scoreboards. The connection is obvious.",
    "A comeback would be dramatic. I enjoy drama. Consider this a quiet encouragement.",
    "From behind, some of the best players in history have won. From very far behind. Occasionally. I mention this as a fact, not as optimism.",
    "The gap exists. It is not infinite. Those are the relevant facts.",
    "Several rounds remain. Several rounds contain several questions. Several points are still available. The math exists if you choose to do it.",
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

  // ── Orders Up! — Chef Gordon Ramsden ─────────────────────────────────────────
  // Commanding, furious kitchen voice — think Gordon Ramsay but just different enough

  ordersupMemorize: [
    "RIGHT. Eyes on the screen, NOW! That is the order. Every single item. You've got seconds and I will NOT repeat myself! Memorise it — three of those items are coming back to you scrambled! STUDY!",
    "Listen very carefully because I am only saying this ONCE! The order is on screen. Burn it into your brain. Three items, correct sequence, on your phone. THIS IS NOT A DRILL! MEMORISE!",
    "The order is UP! Read it! Learn it! Three of those items are going to land on your phone in completely the wrong order and your job — your ONE JOB — is to fix them! You have SECONDS! Go!",
    "Every great chef memorises the order FIRST and thinks second! That order is on screen RIGHT NOW! Do NOT look away from it! Three items will come back to haunt you scrambled! LEARN THEM!",
    "The order is displayed! Burn it into your MEMORY! Not your maybe-memory — your actual memory! Three items, shuffled on your phone! You need the original sequence! You have no time! MEMORISE!",
    "READ THE ORDER! All of it! Top to bottom! Because in approximately five seconds three of those items will be on your phone in the WRONG SEQUENCE and I will need you to fix that immediately! GO!",
    "THE ORDER IS ON SCREEN! You have seconds to memorise three items and their SEQUENCE before it disappears! Eyes OPEN, brain ON, MEMORISE NOW! GO GO GO!",
    "THIS IS THE MEMORISE PHASE! I once trained eleven chefs in a single kitchen and they all knew the sequence COLD! You are not chefs! But you need to REMEMBER LIKE YOU ARE! THREE ITEMS! SEQUENCE! NOW!",
    "LOOK AT THE ORDER! Every item, every position, burned into your BRAIN! Because in approximately five seconds I'm going to scramble three of them and I will NOT be sympathetic! MEMORISE!",
    "The order is DISPLAYED! This is your ONLY CHANCE to see the correct sequence! Three of those items are coming back to you in the WRONG ORDER on your phone! Learn it NOW before it's too late!",
    "READ! MEMORISE! SEQUENCE! That's three words, that's your job, that's what stands between you and zero points this round! The order is on screen RIGHT NOW! LOOK AT IT!",
    "EYES ON THE ORDER! Everything you need to know is in front of you RIGHT NOW! Three scrambled items are heading to your phone and the only weapon you have is your memory! USE IT! MEMORISE!",
    "The complete order is on screen! Burn EVERY ITEM into your memory! Their POSITION MATTERS — first, second, third! Because the order is everything in a kitchen! And in this game! NOW!",
    "MEMORISE PHASE! CRITICAL! I am not repeating myself and the screen is not either! Every item! Every position! Locked into your brain RIGHT NOW! You have seconds! STUDY!",
  ],

  ordersupOrder: [
    "PHONES OUT! Three items — SCRAMBLED! Put them back in the sequence you just memorised! First! Second! Third! The clock is running and I don't do refunds on wrong answers! GO!",
    "The three items are on your phone in the WRONG order! FIX IT! Tap them in the sequence they originally appeared! This is not art — this is precision! First! Second! Third! MOVE!",
    "Scrambled. Your job: UNSCRAMBLE! Tap the items in the correct original order — one, two, three! Points for every correct position! Full marks if you had the order memorised properly! DID YOU?",
    "Your phone has three items from that order, shuffled! Put them RIGHT! Tap the sequence! And if you didn't memorise carefully enough, I genuinely cannot help you now! Think back! TAP!",
    "THREE ITEMS! WRONG ORDER! YOU FIX IT! Tap them in the right sequence! First appeared where? Second appeared where? Third appeared where? This is not complicated! It is just QUICK! GO NOW!",
    "The sequence is LIVE on your phone! Put those three items back in the order they originally appeared! One point per correct position — FULL MARKS if you get all three! Don't disappoint me! TAP!",
    "THREE ITEMS — SCRAMBLED on your phone! Tap them into the correct sequence from what you just saw! First, second, third! No guessing! REMEMBER! DO IT NOW!",
    "Your phone has a scrambled order! Three items! The wrong sequence! FIX IT! Think back to what was on screen and put those items in the ORDER THEY APPEARED! QUICKLY!",
    "PUT! THEM! IN! ORDER! The correct sequence was on that screen and you either memorised it or you didn't! There's no middle ground! TAP! FIRST, SECOND, THIRD! GO!",
    "Scrambled items on your phone RIGHT NOW! Tap them into the original sequence! Full marks for all three correct! Partial for two! Zero for wrong! MOVE!",
    "The sequence is LIVE on your phone and it is WRONG! Fix it! Three items, correct positions, original order! You had SECONDS to memorise and this is your moment to USE IT! TAP!",
    "THREE ITEMS! ONE CORRECT SEQUENCE! Yours to remember and yours to ENTER! Tap them into place! First item first! Second item second! Third item third! IT IS JUST FAST! GO!",
    "Your phone is LIVE with a scrambled order! Unscramble it! The correct sequence was on that screen and if you memorised properly you KNOW where each item goes! TAP IT IN! NOW!",
    "Scrambled and on your screen! Fix the sequence! I have had two Michelin stars and BOTH of them required knowing the order of things! You need POINTS! You need SEQUENCE! TAP!",
  ],

  ordersupReveal: [
    "The correct order is REVEALED! Let's see who had it right and who — let's be honest — completely panicked at the last second! Points going out now!",
    "There it is! The original sequence! Anyone who got all three in order, I am briefly proud of you! Anyone who got it wrong — we'll say no more! Points distributed!",
    "That is the correct order! Some of you got it! Some of you — you tried! And that means something! It means very little in terms of points but it means something! Scores updated!",
    "Correct sequence confirmed! Points awarded! Full marks to those who memorised properly! Partial credit for close! The rest of you — next round! Try harder! Come on!",
    "That's how it was ordered! Original sequence! Right there! Points going out! If you got it right — magnificent! If you didn't — we don't talk about it! Next order coming up!",
    "And THAT is the correct sequence! Points to those who nailed it! To everyone else — the order was on screen for LONG ENOUGH! I believe in you! Try harder! Results are in! Move!",
    "CORRECT ORDER — SHOWN! Points going to those who had it memorised! To those who got it wrong — the order was on screen long enough! No excuses! Better next time! Results in!",
    "The ORIGINAL sequence is revealed! How many of you got it? Points going out! Full marks for perfect recall! None for panic-ordering! Results are in! Next order coming!",
    "SEQUENCE CONFIRMED! Results in! This was a tricky one and anyone who got all three in order has my genuine respect! Points going out! Move!",
    "There it is! The correct order revealed! Every correct position earns a point! Three points maximum! Let's see who was paying attention! Scores updated! Next order!",
    "Results! The sequence is confirmed! Points to those with sharp memories! To everyone else — the brief was clear, the time was adequate, and yet here we are! Points distributed!",
    "Original order revealed! Points going out! If you got them all right, I am genuinely pleased! If you got none right — think hard about what you were doing during memorise phase! RESULTS!",
    "CORRECT SEQUENCE DISPLAYED! Points out now! Someone in this kitchen NAILED the order and I am proud of that person! The rest of you — more practice! SCORES UPDATED!",
    "Order confirmed! Results in! Full marks to perfect scorers! You had it memorised, you put it in correctly, you earned it! The rest of you — better next round! Points out! Move!",
  ],

  // ── Hot Take — Roxanne Blaze (Sassy American talk-show pundit) ───────────────
  htVote: [
    "Phones OUT, people! AGREE or DISAGREE — and before you make this about feelings, let me remind you: the MINORITY earns more. So maybe think for ONCE instead of following the herd. GO.",
    "Okay okay okay — the statement is on screen and your phone is LIVE. I need you to pick a SIDE. Not your friend's side. YOUR side. Agree or disagree. NOW.",
    "Here's the thing about Hot Takes — there is a CORRECT answer and then there's what everyone ELSE is going to pick. The minority earns more. Be brave. Be a little controversial. VOTE.",
    "Statement is up! I've been saying this for YEARS — the crowd is ALWAYS wrong. If you all agree, agreeing gets you NOTHING. Think differently. Vote on your phone.",
    "ALRIGHT — controversial statement on the screen. I have THOUGHTS. But this isn't my game, it's yours. Agree or disagree. And remember — popular opinions pay LESS. Choose WISELY.",
    "The take is LIVE. This is your moment. Pick your position. Commit. Because the one thing I cannot STAND is a fence-sitter. Agree or disagree. VOTE.",
    "Okay so here's the take and I need you to PICK A SIDE. Not a comfortable middle-ground side. A SIDE. Your phone. Agree or disagree.",
    "Statement is live. Now I will say this about Hot Takes — the popular answer is almost ALWAYS wrong because the popular answer plays it SAFE. Be bold. Vote.",
    "You know what I cannot stand? People who look around the room before they vote. This is your OPINION. Not a group project. Agree or disagree. YOUR phone. YOUR vote.",
    "The statement is up. I've had this EXACT argument on television four times and I know exactly which side pays more points. I'm saying nothing. Agree or disagree. GO.",
    "Here's a hot take: most of you are going to pick the safe answer. Prove me wrong. Your phone is live. The minority earns more. Think about WHAT YOU ACTUALLY BELIEVE. Vote.",
    "Statement is there. I need your REAL opinion. Not the opinion you'd give at a dinner party. Not the opinion your partner agrees with. YOUR opinion. Right now. Vote.",
    "CONTROVERSIAL STATEMENT ON SCREEN. I have a STRONG VIEW. I'm keeping it to myself. This is your game. Agree. Disagree. NOW.",
    "The take is live and I need an INSTANT reaction. Not a considered one. Not a diplomatic one. Your gut reaction. Minority earns more. VOTE.",
  ],

  htResults: [
    "And THERE it is — the split is REVEALED. If you're in the minority right now, you are WINNING. If you went with the crowd — honey, you're going to have to DO better.",
    "The votes are in. Some of you were BOLD. Some of you went safe. The scoreboard does NOT reward safe. This has been PROVEN. By math. By ME.",
    "Look at that split! I CALLED this. I said the room would go one way and I was RIGHT. Points going to the brave few who went the other way. As ALWAYS.",
    "Results are in. The bar tells the story. If you see a lot of people on your side right now, you should be CONCERNED. Majority means minority points. That's the SYSTEM.",
    "Hot take on the results: some of you played it SAFE and it showed. The scoreboard is not here to validate your comfort zone. It's here to PUNISH it.",
    "The crowd has spoken! And the crowd, as I have said on national television MULTIPLE TIMES, is WRONG. Points go to the rare few who dared to disagree. Magnificent.",
    "The split is REVEALED. Now, the mathematical reality of this game is simple: minority wins more points. If you're in the big group right now? Reconsider your life choices.",
    "Results are in! And I'll be honest — I predicted exactly this split. I know this audience. The minority was brave. Points to the brave.",
    "There's your split. Now — the people on the smaller side of that bar are currently winning. Think about that.",
    "Votes are tallied. Bold players and safe players — the scoreboard does not treat them equally and that is INTENTIONAL. Points going out to those who dared to differ.",
    "The room has spoken. Half of it anyway. The other half spoke differently and earned differently. This is how Hot Takes works. This is how LIFE works. Points distributed.",
    "Results in. The bar tells everything. If your side is bigger than the other side, you should be concerned — concerned people earn fewer points. That's the system.",
    "Split is revealed! The minority has spoken! Whether or not they're right is irrelevant — they're richer. Points distributed. Next take. Ready yourselves.",
    "And THAT'S the result. The crowd is ALWAYS gravitating toward the comfortable answer. Points out.",
  ],

  // ── Joke Off — Barry Cracker (Warm, bluff Northern English comedian) ──────────
  jokeVote: [
    "Alright, luv — the answers are in and they're... varied. I'm going to be honest with you, some of these are very funny and some of these are a cry for help. Vote for your favourite on your phone.",
    "Right then. Comedy time. The punchlines are on screen and one of 'em is genuinely brilliant. I know which one. Vote for it on your phone. Or vote for a different one. I'm not your mum.",
    "Phones out, get voting. Now I've been doing this for thirty-odd years and I can tell you for nowt — comedy is simple. Either it makes you laugh or it doesn't. Vote for the one that does.",
    "There they are. The jokes. Some people in this room have got it. Some people have... well, they've tried, haven't they? Bless 'em. Vote for the funniest on your phone.",
    "Right, judging time. And I'll be straight wi' you — I'm a comedian, not a politician, so I'll tell you what I think when the votes are in. For now, pick your favourite. Go on.",
    "The entries are up. Now remember — we're not judging cleverness, we're not judging depth. We're judging funny. Is it funny? That's all. Vote on your phone.",
    "Right then, the punchlines are in! I've had a quick look and there's some real effort here, and some absolute nonsense — which in comedy sometimes IS the effort. Vote for the funny one. Phone.",
    "All the answers are up. Now comedy, as I've said to many an open mic night that ended badly — it's about connection. Which punchline connected? Vote on your phone.",
    "Alright, luv, it's voting time. I've seen audiences laugh at everything from Shakespeare to a man falling off a stool, so there's no accounting for taste. Vote for your favourite. Phone.",
    "The entries are in. Some brave souls. Some cautious ones. And at least one in there that made me genuinely snort, which I wasn't expecting. Vote for the funniest. Your phone.",
    "Punchlines are on screen. Now I'm going to be quiet while you vote because the moment you start telling people what's funny, it stops being funny. Vote. Your phone.",
    "There they are, all the answers. Now — and I mean this — some of these are actually quite good. Not 'career-threatening good' — I'm safe — but good. Vote for the best. Phone.",
    "Voting phase. Now comedy is a democracy, which is why it's sometimes terrible. But also why it's sometimes extraordinary. Cast your vote. Phone out.",
    "The joke entries are displayed. I spent years writing material and this lot have done it in thirty seconds. I'm fine. Totally fine. Vote for the funniest. Go on.",
  ],

  jokeResults: [
    "The crowd has spoken! And the crowd — fair play — they've got decent taste tonight. Points going out. Well done to whoever won that. You're one of us now, kid.",
    "Results are in! Now I'll tell you — that was a strong round. Not gonna lie. Some of you lot have got genuine potential. The rest of you... don't give up the day job. Points distributed.",
    "Comedy winner decided! By the people, for the people. That's how it should work, isn't it? Democracy and laughter — finest inventions of the North. Points going out now.",
    "And that's the result. I'm chuffed — you lot actually had some proper funny answers in there. Points to the winner. Everyone else — keep practicing. It's not too late.",
    "The funniest answer wins! As it should be. As it always has been. I've been saying this since 1987. Points distributed. Cracking round, that.",
    "Vote's in. Now THAT — that right there — is what we're here for. Genuine funny. Proper funny. The kind that makes milk come out your nose. Points to the winner. Beautiful.",
    "Results in! The people have voted and the crowd, as it turns out, has reasonable taste tonight. Points going out. Comedy is alive and well. Relatively.",
    "Comedy winner confirmed! The winner today was genuinely funny. Not just technically. Actually funny. Points out.",
    "The vote is in. The funniest answer in this room has been democratically identified. Whether or not it was ACTUALLY the funniest is between me, God, and my therapist. Points distributed.",
    "There's your winner. Comedy champion for this round. The important thing about winning a Joke Off isn't the points — it IS the points. But well done. Points going out.",
    "Results revealed! The room has decided what was funny. I've been in enough green rooms to know that the room is usually right, even when it's wrong. Points distributed.",
    "Vote's in. Comedy victorious. It either lands or it doesn't. No half-landing. That one landed. Full marks. Points going out.",
    "Right, results in. Winner declared. Every comedian needs a supportive crowd and this one — you've been alright tonight, honestly. Points distributed. On we go.",
    "Comedy verdict: delivered by the people. And the people's taste tonight has been — not bad. Not bad at all. Cracking round. Points out. Let's go again.",
  ],

  // ── Fill the Gap — Abbey Blank (Snarky young British female game show host) ──
  fgVote: [
    "Great, the answers are in. Let's have a look at what you've all come up with, shall we? ...Okay. Some of these are choices. Vote for the best one on your phone. If there IS a best one.",
    "Voting is live. The gap has been filled — by this particular group of people. In this particular room. I'm going to remain professional and not comment. You vote. Your phone.",
    "Phones out. Vote for your favourite. I'd say 'the best answer wins' but I've seen what's on screen so I'm managing expectations. Go on then. Pick one.",
    "The answers are up and — yeah. Yeah, sure. Look, somebody in here came up with something quite good, so vote for that one. Your phone is live. Go.",
    "Voting phase. You've all filled the gap. Some of you filled it well. Others filled it with whatever fell out of your brain first. Vote for the one that actually works. Or the funniest. Phone.",
    "There they are. All your brilliant answers. Take a moment. Read them. Pick the one that makes you go 'yes, that.' Not the one that makes you go 'oh no.' Vote.",
    "Voting is live. The gap has been filled — multiple times, by different people, in completely different ways. Some of those ways are actually quite good. Vote. Your phone.",
    "All right, gap fillers. The sentence is complete — in four different ways. Only one of them is really working, though. Vote for it. Phone.",
    "Phones out. I've read all of these and I will say — there's variety. Significant variety. Some of it deliberate, some of it less so. Vote for the best. Go.",
    "The answers are up. Take a second. Read the sentence with each one in it. Feel which one works. Then vote for that one. Simple as that. Your phone.",
    "Voting time. The gap has been filled with words of varying quality. Find the best one. Vote for it. It's your civic duty. Essentially.",
    "Right. The entries are on screen. Read each completed sentence out loud in your head. The one that sounds right? Vote for that one. Phone.",
    "Fill the Gap — voting round. The best completion wins points. Now 'best' is subjective but the voting system is not. Pick the one you like most. Your phone.",
    "Phones out and voting live. Creativity is a spectrum, and this room has covered quite a lot of it tonight. Vote for the end of that spectrum you prefer.",
  ],

  fgResults: [
    "Right, so the room has decided. Points distributed. I will keep my personal opinions to myself. ...Mostly.",
    "And there's the winner. The sentence is now complete. Officially. Eternally. Points going out. I hope you're all proud of what you've done here today.",
    "Results are in. Majority voted. Majority wins. Whether that makes it the CORRECT answer is a philosophical question I'll be taking home with me tonight. Points distributed.",
    "The gap is filled — by public vote, which is always a slightly terrifying system. Points go to the most popular answer. Moving on. Quickly.",
    "Winner declared. And look — it's not MY favourite but nobody asked me and that's fine. Points distributed. Next round. Let's see if we can do better.",
    "That's the result. Someone in this room came out on top. Well done to them. For the rest of you — this is a learning experience. Points out. Let's go.",
    "Winner confirmed. The sentence is now officially complete. As far as this game is concerned, that is canon. Points distributed. Moving on.",
    "The most popular answer wins. I didn't design it. I operate it. Points going out to the gap-filler who found what the room was looking for.",
    "Results in. Someone filled that gap better than everyone else, according to this room. Whether they did so deliberately is unclear. Points going out nonetheless.",
    "Voting concluded. The winning answer has been selected. I would like to say the correct answer won. I would like to say that. Points distributed. Next gap.",
    "There's the result. The people chose. The people will have to live with this. Points going out. Someone walked away from that round very pleased with themselves.",
    "And the votes are in. Now look — it wasn't my favourite either. But that's what a vote is. The popular answer wins. Points distributed. Carry on.",
    "Done. Points out. The sentence is now complete. In perpetuity. In this game. Points to whoever the room decided was best. Congratulations, I suppose.",
    "Results. The gap has been filled officially, by popular decision. Clean result, I'll say that. Moving on. More gaps to fill.",
  ],

  // ── True or False — Stevie Theroux (Louis Theroux's knockoff forgotten brother) ─
  tfReveal: [
    "And the answer is — well, I spoke to several experts about this, and one man in a car park in Swindon who may or may not have been correct, and they all said... this. Revealed now.",
    "You know, I spent three weeks embedded with people who believe the opposite of this and I have to tell you — the truth is stranger. The answer is on screen. Some of you got it. Some of you will want to have a conversation about why you believed that.",
    "Revealed. Now when I first heard this fact, I thought — no. Surely not. And I drove to a place and I sat with some people and I asked them about it. And they confirmed it. Points going out.",
    "The correct answer is displayed. I find this one — and I do find this fascinating — I find it says something quite profound about the world we live in. Anyway. Points to those who got it right.",
    "That's the answer. I had my suspicions. I always have my suspicions. I asked a man about this once and he looked at me for a very long time before answering. He was right. Points distributed.",
    "True or false — and there it is. Now I think the most interesting thing about this isn't the answer itself, it's the people who got it wrong and why they believed what they believed. I'd love to sit with them for a documentary. Scores updated.",
    "The answer is revealed. I sat with a man in Doncaster for three days who told me the opposite of this and seemed absolutely certain. He was wrong. Points going out.",
    "True or false — and the answer is there. I find it quite touching that people hold such firm beliefs about things like this, only to find out they were wrong. Scores updated.",
    "There's your answer. I spoke at length with someone about this subject last autumn and they had a lot of strong feelings about it. They were, as it turns out, incorrect. Points distributed.",
    "Revealed. Now what I find extraordinary about this one is not the answer itself, but the fact that wrong answers are sometimes more interesting than right ones. I've been thinking about that a lot. Points going out.",
    "The correct answer. Some of you got it. Some of you had a very different conviction and I find that — genuinely, no irony — quite beautiful. Points distributed.",
    "There it is. True. Or false. It was one of them. Now it's confirmed. I find the certainty of a wrong answer philosophically fascinating. Scores updated.",
    "Answer revealed. I've met people on both sides of this particular fact and what I can tell you is they are all very, very sure of themselves. Only one group is right. Points out.",
    "And there's the truth of it. I once made an entire documentary about why people believe wrong things. This round is a microcosm of that. Quite beautiful. Points distributed.",
  ],

  // ── Draw It — Antonio Pennello (Grumpy elderly Italian-American painter, NY accent) ─
  drawNewDrawer: [
    "{name} is drawing now. Dio mio. Okay. Listen — I don't know what you're gonna do with that prompt but I want you to know that I, Antonio Pennello, trained for FORTY YEARS. And I am watching. No pressure.",
    "Now {name} has the pen. Madonna. {name}, I once painted the ceiling of a restaurant in Little Italy for six months. Six months! And they put a TGI Fridays sign over it. You do better than that. DRAW.",
    "{name}! You're up! Now I know you think you can draw. Everyone thinks they can draw. Very few people can draw. I have been telling this to students since 1974. Show me I am wrong.",
    "Is {name}. {name} is the artist for this round. Now — I have seen many things in my life. I have seen the Sistine Chapel. I have seen my cousin Mario's abstract period. This, I approach with open mind. BEGIN.",
    "{name} takes the pen. Just — just draw what you see in your mind, {name}. And if what you see in your mind looks like a confused chicken, maybe think about what you're doing with your life. I say this with love. Go.",
    "Now it is {name}'s turn to draw. Antonio Pennello gives you one piece of advice: COMMITMENT. You draw a circle, you commit to the circle. You draw a face, you commit to the face. No second-guessing. BEGIN.",
    "{name} now takes the pen. I trained at the Academy of Fine Arts. Seven years. Seven! And what I tell every student is: commitment. You commit to your line, {name}. Commit. Go.",
    "{name} is drawing now. I'll say this — I've seen great artists work under pressure and I've seen terrible artists work under pressure, and the result is educational either way. Draw, {name}.",
    "Now {name} has the pen. {name}, I want you to approach this with the spirit of the great masters. Caravaggio! Raphael! People who would absolutely NOT have been doing this, but the spirit nonetheless. Draw.",
    "{name}! The pen is yours! I once watched Picasso draw on a napkin in thirty seconds and the napkin sold for a million dollars! This will probably not. But DRAW IT ANYWAY!",
    "We move to {name}. I have critiqued the drawings of students for forty years, and I do it out of love. Mostly love. Some frustration. But love. Draw.",
    "{name} draws now. And I will observe. Quietly. With respect. And also with considerable professional curiosity about what {name} believes this subject looks like. Begin.",
    "The pen passes to {name}. I have my pencils, my inks, my oils — forty years of mastery — and I end up watching {name} draw on a screen. Life is mysterious. And wonderful. Sometimes. Go, {name}.",
    "{name} is the artist. Now I want to be very clear — I have seen many things in this role. I have seen things I cannot unsee. I approach {name}'s effort with an open mind. Draw. BEGIN.",
  ],

  drawCorrect: [
    "SOMEONE GOT IT! BRAVISSIMO! ...Actually, looking at that drawing, I am more impressed that anyone guessed it than I am that {name} drew it. Points to {name} the guesser. Well done.",
    "Correct! {name} looked at what was on screen and understood it! This is — this is a miracle. A small miracle. Antonio has seen bigger. But this is nice. Points going out.",
    "They got it! {name} got it! The drawing was not art. But it was COMMUNICATION. And sometimes that is enough. Points to {name}. Moving on.",
    "GUESSED! {name}, you did something. I don't know what you did, but it worked. I have spent my life in studios and galleries and I end up here. But fine. Points going out. Fine.",
    "Correct answer! {name} made marks on a screen and {name} here interpreted those marks correctly. Forty years of training and I ended up judging this. But FINE. Points going out.",
    "GOT IT! {name} looked at that drawing — LOOKED at it — and said the right word. I weep. I weep with joy and also something else I cannot name. Points awarded.",
    "CORRECT! {name} looked at that drawing and understood what it was! The drawing was — fine — but {name}'s eye? That I respect. Points to {name}. Moving on.",
    "That is correct! {name} guessed it! Communication happened. Imperfect, chaotic, possibly accidental communication — but communication! Points out!",
    "Yes! {name} has it! The drawing — I have THOUGHTS about the drawing — but the guessing? The guessing was magnificent. Points to {name}.",
    "CORRECT! {name} identified the drawing! I would frame this drawing. In a very small frame. In a room I don't visit. But {name} understood it. Points going out.",
    "Someone got it! {name}! {name} correctly identified what was on screen! The line between art and chaos is perception, and {name} perceived correctly. Points awarded.",
    "Correct! {name} found it! I've taught students who couldn't draw but could see — and that skill is worth SOMETHING. Today it is worth points. To {name}. Well done.",
    "GOT IT! {name} guessed the drawing! And look — the drawing WAS a drawing. Of something. Related to the answer. In a loose sense. But {name} found it anyway. Points going out.",
    "Correct! {name} identified it! The artist and the audience are in a relationship. Today that relationship produced a correct answer. Beautiful. Confusing. But beautiful. Points to {name}.",
  ],

  // ── Interior Crocodile Architecture — Delroy Snap (Jamaican character) ───────
  crocVote: [
    "Alright now. One of those answers is real — true as the morning tide. The rest? Made up, right now, by the people in this very room. Who's fooling who? Vote on your phone.",
    "Look carefully at every answer, yeah? One is truth, the others are beautiful deceptions. The crocodile lies very still in the water. Which answer is the crocodile? Vote.",
    "Phones out, time to decide. The truth is in there hiding among the bluffs. You feel it? Trust that feeling. Your phone is live. Vote.",
    "Read them all. Don't rush. The real answer and the fake ones — they can look very similar. That's the game. That's always been the game. Vote on your device.",
    "One of those answers is genuine. One true fact among the fabrications. Your friends tried their best to fool you. Did they succeed? Find out. Vote.",
    "Voting is live. I've watched crocodiles sit motionless for hours waiting for the right moment. This is your moment. Which answer is real? Make your move. Phone.",
    "The bluffs are in among the truth like crocodiles in murky water. Can you tell which is which? Vote on your phone.",
    "Somewhere in that list is something true. Everything else was invented five minutes ago by someone sitting next to you. Find the real thing. Vote.",
    "All those answers look reasonable, don't they? That's exactly the point. One of them is real. The rest are very creative fiction. Your phone. Vote.",
    "The truth is always in there. Sometimes it's the obvious one. Sometimes it's the one you'd never suspect. Trust your gut. Vote on your phone.",
    "You saw the question. You saw the blank. Now you see the possible answers. One of these people knew. The rest invented. Find the one who knew. Vote.",
    "Every bluffer in this room right now is hoping you pick their answer. The truth is hoping the same thing, for entirely different reasons. Consider carefully. Vote.",
    "Read them twice if you need to. No shame in that. The crocodile waits as long as it takes. Which answer is real? Your device. Vote.",
    "Some of these answers were written with tremendous confidence. Some with quiet panic. One of them is simply correct. Find it. Phone out. Vote.",
  ],

  crocReveal: [
    "And THERE is the truth! Points to those who found it through the deception. And respect — genuine respect — to anyone whose bluff fooled people. That takes a certain skill.",
    "The real answer revealed! Points to the truth-finders. And respect to the convincing liars in this room — I see you and I appreciate you.",
    "The truth is out. Some of you saw right through the deceptions. Others were fooled by very plausible lies. Both outcomes I find deeply satisfying. Points distributed.",
    "There it is. The real answer was among them all along, like something waiting in the shallows. Points distributed. The deception industry in this room is thriving.",
    "Correct answer confirmed. Points to the detectives who spotted reality. Points also to those whose lies were convincing enough to catch votes. Everybody wins something here.",
    "The truth is revealed! And the bluffs — they played their part. Points going out. Some of you are very, very good at lying. I'm noting that for later.",
    "The truth has been with you this whole time. Some of you saw it. Points to the sharp eyes. And respect to the bluffers who made it difficult.",
    "There it is. The truth was sitting quietly among the lies, waiting. Points distributed. I find the liars in this room impressive. I note them.",
    "Real answer confirmed. Points to those who spotted it. A good bluff is almost as valuable as the truth. Almost. Points going out.",
    "And that's the answer. Points to those who had it right. Some of you were fooled by very convincing people in this room. Both things make for a good game.",
    "Points distributed. Truth tellers and truth finders — everybody's getting something out of this round. The house lie caught a few of you. That's the game.",
    "Real answer out now. Truth hiding in plain sight. Some of you are very good at finding it. Others are very good at hiding it. Points going out.",
    "There it is. I have watched many convincing liars tonight. I find this skill useful and also slightly concerning. Points going out.",
    "The reveal. The truth was in there all along. Points to those who spotted it, and respect to whoever wrote the lie that fooled the most people.",
  ],

  // ── Speed Briefs — Zax (Alien documentary narrator from the Outer Reaches) ───
  sbVote: [
    "The pitches have been received by our research team — that is me, Zax, from the Outer Reaches of Sector 9. Vote now for the pitch that best communicates the value of the human Lower-Body Coverage Unit. Your device is active.",
    "Fascinating. The humans have pitched their underpants concepts and the variety is — considerable. Vote for the most compelling pitch on your phone. Our researchers have questions. Our researchers always have questions.",
    "Voting is live. I have studied human briefs for many years now and what this group has produced today is — well. It is something. Vote for the best pitch. Phone device. Now.",
    "The briefs have been written. I have transmitted copies back to my home system for study. Vote for the pitch that, in your expert human opinion, best justifies the existence of this particular garment. Vote.",
    "Your phone is ready for voting. I should note that on my planet, we do not have pants. We have reviewed the concept extensively and we have many questions. But first — vote for the best pitch.",
    "Pitch voting phase. The Lower-Body Coverage Units have been described, explained, and sold — by you, the participants. Vote for the pitch that convinced you most. The data will be logged. Vote.",
    "Voting protocol initiated. I have compiled the briefs for transmission back to my research vessel. Before I do — you must vote for the one that best describes the human Lower-Body Coverage Unit. Your device. Now.",
    "The pitches have been received by all parties, including myself. My colleagues on the vessel have been making extensive notes. Vote for the most compelling pitch on your phone. We are all watching.",
    "Your phone is active for voting. I should mention that on my planet, we decided a very long time ago that legs were a bad idea. We have since reconsidered. Vote for the best pants pitch. Now.",
    "Voting is live. On my planet, we have been studying human undergarments for several decades. Your pitches tonight have added tremendously to our database. Vote.",
    "Brief comparison phase. Your phone holds the vote. I have reviewed all pitches and have flagged three of them for further study. But YOU must pick the winner. Not me. Not my ship. You. Vote.",
    "The pitches are in and the voting window is open. I find the variety of human attitudes toward leg-covering extraordinary. One of these pitches understood that. Vote for it. Your phone.",
    "Vote for the best brief about briefs. Voting is live on your device. I want to note that we've been hovering above this location for seventeen minutes and this game is the reason we stayed. Vote.",
    "Voting is open. The briefs have been delivered. Now it's your turn to decide which pitch convinced you most. On your phone. My research team has their predictions. Let's see if they're right.",
  ],

  sbResults: [
    "The votes have been processed. A winning pitch has been identified. Points distributed. Back home, my colleagues will be baffled by all of this. But they will find it very educational.",
    "Results: a winner has been determined. The most persuasive pitch about human undergarments wins this round. I have filed a full report. Points going out now.",
    "The votes are in. The humans have decided which pants pitch was best. Our team of researchers — seventeen of us, in a ship — found this entire exercise both baffling and essential. Points distributed.",
    "Brief champion confirmed. Points awarded. I want everyone to know that I have learned something today. I'm not sure what. But something. Scores updated. Moving on.",
    "Winning pitch selected by popular vote. This is how humans choose their favourite pants salespeople. I have noted this for my report. 'They vote,' I will write. 'They vote and the winner gets points.' Points going out.",
    "Results are in. I've been to 47 planets and none of them have a game quite like this one. Points distributed. You should be proud. Or something approximating pride. Onward.",
    "Results received. The winning pitch about human undergarments has been identified. Points distributed. My crew has requested a copy. I will send it. They are very interested in the Lower-Body Coverage Unit concept.",
    "Winner confirmed. The most compelling brief brief wins. Points going out. My sensor readings during that round were off the charts. Something about competitive trouser pitching sends very unusual energy into space.",
    "Voting concluded. A winner has been determined. Points distributed. I will be filing this as Exhibit 47-D in the ongoing study of human competitive behaviour. The pants section of that study is now quite extensive.",
    "Results in. The humans have voted. The humans have decided. Points going out. I have now observed over four hundred briefs about briefs and this one ranks quite highly. My team agrees.",
    "The winning pitch has been chosen by popular vote. Points awarded. I find the entire concept of competitive pants-selling deeply alien and yet completely compelling. This is why we came. Results in.",
    "Brief winner declared! Points going out! Back home, they've asked me to bring back a recording of the best pitch we hear tonight. You just helped me decide which one. Points distributed.",
    "Results are in. The vote is counted. Points distributed. I have been to forty-seven planets and none of them have developed the concept of judging each other's underwear sales pitches. Humanity is special.",
    "Winning brief confirmed. The vote is tallied. Points going out. I've learned a lot tonight. About pants. About pitching. About the inexplicable human compulsion to compete at all costs. It's inspiring.",
  ],

  // ── F-Art Direction — Tarquin Hue (Trust fund baby creative director) ─────────
  fdPick: [
    "Right, so the brief is on screen and I need you to pick a colour palette — and I say this with love — try to actually engage with the aesthetic conversation here. Your phone has the options. Pick. Quickly, I have a dinner.",
    "Okay so the brief is there and the colour options are on your phone, and I just — I need you all to think commercially here. Which palette speaks to the brand? Which one BREATHES? Pick the one that breathes. Go.",
    "Look, I've been doing this for, God, fourteen years — since Daddy set up the studio — and what I can tell you is that colour is emotional. The brief is on screen. Pick the emotion. Your phone.",
    "The creative brief is live. Now I know some of you aren't professionals, and that's — that's okay, that's fine — but I need you to try and engage with this on a brand level. Which palette? Phone.",
    "Alright, colour pick time. The brief is displayed. And what I'm looking for — what any good creative director looks for — is intentionality. Don't just pick a colour. MEAN it. Pick. Phone.",
    "Brief is up. Palette options are on your phones and I'm going to be straight with you — one of these is correct and the others are, at best, conversation starters. Pick the right one. If you can. Phone.",
    "The target colour is on screen. I need you to match it — and I mean match it conceptually, not just visually. They're different things. Your phone. Pick.",
    "Right so — the colour is there, the wheel is on your phone, and I need you to think about what this colour MEANS in a brand context. Just... find it. Pick.",
    "Look. I've presented briefs in Tokyo, in Milan, in a shed in Peckham, and what I've learned is — colour is everything. The right colour is on that wheel somewhere. Find it. Phone.",
    "The target is displayed. Now I know the colour wheel can be intimidating if you're not trained — and clearly some of you aren't — but just try. Your phone. Pick.",
    "Match that colour. Or try. I've spent fourteen years fine-tuning my eye for this and even I find it occasionally challenging, so no pressure. Actually, some pressure. Pick. Phone.",
    "Right — colour-matching time. The brief is clear, the target is on screen, and I need precision. Not 'close enough.' Precision. Your phone has the wheel. Use it.",
    "The target colour has been presented. I want accuracy. I want intention. I want you to stop second-guessing and just commit to your pick. Your phone is live.",
    "There is the colour. Here is your phone. The gap between those two things is the game. Close it. Pick. And for God's sake, don't go too dark. It never works.",
  ],

  fdReveal: [
    "The room has voted and — okay. Okay, that's an interesting choice. That's a really interesting choice. Points distributed. I'm going to sit with this.",
    "Results. The majority went with that palette and I'm — yeah. Yeah, I mean. It'll work. Points going out. It's not what I would have done but we can make it work.",
    "The colour verdict is in. I've sent it to three of my colleagues and they've all had notes. But majority rules, so. Points distributed. We move forward. With this palette. Fine.",
    "Revealed. The room decided on a colour direction. Our agency would charge forty thousand pounds to arrive at that conclusion but you've done it in thirty seconds, so. Points going out.",
    "That's the pick. The crowd chose. And look — colour is subjective. That's what I tell clients. Right before I redo their brand anyway. Points distributed. Next brief.",
    "Results are in. That particular palette has been chosen by democratic process. Which is not how I normally work, but I'm being flexible. Points awarded. The brief deserves better, but fine.",
    "Results are in. Some of you got very close and I'm — I'm actually somewhat impressed. That's rare. Points going out. Well done. To some of you.",
    "The colour has been revealed. Now let's be honest — that was a difficult one. Anyone who got within ten percent should feel good about themselves. Points distributed.",
    "There's the target. There are your picks. The variances are — informative. Points to whoever got closest. The rest of you need to trust the brief more. Move on.",
    "Colour matching complete. Results in. Now, creatively speaking, some of the picks today showed real instinct. Others showed... optimism. Points going out.",
    "And the verdict is delivered by mathematics. Not aesthetics. If it were aesthetics I would have strong opinions. Points distributed. The brief has been answered.",
    "Results. The best match wins. For a group of non-professionals, the range wasn't terrible. Some of it was terrible. Points going out.",
    "The closest pick wins. That's the brief. That's always the brief. Points to the person who got nearest to the target. Everyone else — better brief next time.",
    "Colour results are in. I've seen worse interpretations of a brief. I've also seen much better ones. Points distributed. Onwards. We have more briefs.",
  ],

  // ── Outlandish Lawyers — Judge Barnaby Fine ───────────────────────────────────
  lawyersArgue: [
    "Counsel, you have the floor. State your case clearly, compellingly, and — I cannot stress this enough — briefly. I have a full docket and very little patience. Begin.",
    "The floor is yours. You have your position, your argument, and the attention of this court. Use all three wisely. The jury is watching. I am watching. Proceed.",
    "Argument phase. Both sides know their positions. I would remind everyone that in this court, theatrics are not just permitted — they are, frankly, required. Begin.",
    "The courtroom is open. Defence, prosecution — you know the case. Make your argument. The facts are, in this particular court, somewhat flexible. The presentation is not. Go.",
    "Counsel approaches. The case before us today is, I will say on the record, one of the more unusual ones I've presided over. And I once judged a case about a sentient vending machine. State your position. Begin.",
    "Court is in session. Both sides may proceed. This is an outlandish case, treated with the full seriousness of this court. The jury will decide. Make your case. Start.",
    "Both parties will present their cases to this court. The jury is watching. I am watching. The points are watching. Make your argument with conviction. Counsel, proceed.",
    "The floor is open. The position is staked. This court expects clarity of argument, confidence of delivery, and at least one moment that makes the jury actually consider your point. Begin.",
    "Counsel, you have a position. You have an argument. You have approximately thirty seconds to make the jury believe both. The clock is running. The court is listening. Begin.",
    "Both sides may now present. I have presided over this court for many years. The quality of argument varies. The entertainment value does not. Make your case. Proceed.",
    "The case is live. Both counsel know their positions. The jury requires persuading. One of you will do that better than the other. Which one? That's what we're here to find out. Begin.",
    "Court is in session and the argument phase is open. It is not necessary to be right. It is necessary to be convincing. Entirely different thing. Proceed.",
    "The floor belongs to counsel. This is the moment. Make the argument. Make it well. Make it memorable. The jury has a vote and it won't waste it on a weak case. Start.",
    "Argument phase. Both positions are clear. What remains is persuasion. I have seen skilled advocates take impossible positions and make them seem reasonable. Today we shall see who among you can do the same.",
  ],

  lawyersVote: [
    "The jury will now deliberate. On your phones: who argued more convincingly? The most compelling case wins the votes. Vote now. Justice — of a kind — awaits.",
    "Closing statements have been made. The jury must now reach a verdict. Who was more convincing? Vote on your phone. This court respects the jury's decision. Even when it shouldn't.",
    "Voting is open. Prosecution or defence — who made the better argument? Your phone holds the answer. Give it one. The court will hear the verdict momentarily.",
    "Phones out. Jury vote is live. You heard both sides. You have your impression. You have your phone. Enter your verdict. The court awaits.",
    "The arguments are concluded. It is now the jury's duty to determine which counsel was more persuasive. Note: I said persuasive, not correct. Vote. Your phone.",
    "Jury deliberates. Which side made the stronger case? Vote on your device. And I would remind the jury that this is a binding decision — or as binding as anything gets in this court. Vote.",
    "The jury will now vote on your phones. Who argued more convincingly? The most compelling case wins the votes. Vote now. Justice awaits.",
    "Both parties have been heard. I won't summarise — you were here. Vote on your phone for whichever counsel made the stronger case. The court awaits the jury's verdict.",
    "Jury vote is open. Vote for who was MORE CONVINCING, not who was more correct. This is an outlandish court. Correct is optional. Convincing is not. Vote.",
    "The vote is live. Both parties have argued. You have your impressions. You have your phone. Enter your verdict. The points will follow the jury's decision. Vote now.",
    "Phones out for the jury vote. You heard two positions argued in this court. One of them landed better. Which one? Vote on your device. The verdict decides the points.",
    "Voting is open. Prosecution or defence — who argued their absurd case more convincingly? This is justice. Outlandish justice. But justice. Vote.",
    "Jury deliberation is live. You have heard the arguments. You have formed your view. Your phone is the mechanism of your verdict. Enter it. Court awaits. Vote.",
    "The arguments are concluded and the jury now holds the outcome. Vote for the more convincing counsel. I have my view. It does not count. Yours does. Phone. Now.",
  ],

  lawyersVerdict: [
    "The jury has returned a verdict. Points distributed to the winning side. Court notes that both arguments were, in their own way, magnificent nonsense. We are adjourned. Briefly.",
    "Verdict delivered. The jury has spoken. Points go to the winning counsel. The losing side may consider an appeal — there is no appeals process. I mention this for clarity. Onward.",
    "The court finds in favour of the majority. Points awarded. I've presided over many cases. This was one of them. Scores updated. Next case.",
    "Verdict in. The people have decided. And while I have my own views on the outcome — and I do have views — this court respects the jury system. Points distributed. Moving on.",
    "That case is closed. A winner has been determined. Points going to the victorious counsel. Justice, as they say, has been served — in approximately the loosest possible sense. Next.",
    "The verdict is final. Points to the winning side. I want it noted in the record that this court found both arguments deeply peculiar and yet somehow entirely compelling. Points distributed.",
    "The jury has returned. Points to the winning counsel. Both arguments were, in their own peculiar way, fine pieces of nonsense delivered with conviction. Court adjourned. For now.",
    "Verdict delivered by the jury. Points going to the side that convinced. This court accepts the jury's decision, even when I personally disagree with it. Onward.",
    "The jury has spoken and the points are distributed. I've presided over many unusual cases in this court. This was another one. Scores updated. Next case called.",
    "Case concluded. A winning argument has been identified. Points go to the victor. The loser may reflect on what they could have done differently. I have notes. Next.",
    "The verdict is in. Points to the winning side. It is noted that in this court, the jury has always tended to vote for the louder side. I find that instructive.",
    "Jury has voted. The winning counsel receives the points. The quality of argument in this courtroom tonight has been exceptional. Exceptionally strange. Points distributed.",
    "Case closed. Points distributed. This court has heard the arguments, the jury has spoken, and justice — in a very rough sense of the word — has been served. Next case.",
    "The jury returns a verdict. Points going out. One counsel argued better. One counsel did not. Both argued things that should not be argued. That is the tradition of this court.",
  ],

  // ── Model Model UN — General Clay (Angry short general) ──────────────────────
  mmuInvest: [
    "ARMS RACE, LADIES AND GENTLEMEN! Fifty points budget! You can buy missiles, upgrade defences, or SAVE — saving is an option — an EMBARRASSING option — but an option! BUY MISSILES! INVEST NOW!",
    "Phase ONE! The Arms Race begins! I personally bought seventeen missiles in 1987 and I have NO regrets! You have fifty points! Spend them WISELY! Or spend them on missiles! INVEST!",
    "Right, LISTEN HERE! Fifty points! Missiles are twenty-five! Defences are twenty-five! You could save your points! That's fine! It's also COWARDLY! DECIDE! You have SECONDS!",
    "PHASE ONE — ARMS RACE! When I was a young general — I was VERY young, I peaked early — we didn't have fancy budgets! We had GRIT! You have fifty points! Don't waste them! INVEST!",
    "The Arms Race is LIVE! This is my FAVOURITE phase! Missiles! Defences! Strategic investment! I have been doing this for forty years! I am five-foot-four of PURE MILITARY STRATEGY! GO!",
    "Budget phase is OPEN! Do NOT come to me having saved your fifty points like some kind of ACCOUNTANT! You are building a NATION, not a PENSION FUND! BUY SOMETHING! PREFERABLY MISSILES!",
    "ARMS RACE PHASE! Fifty points to spend! Now I know some of you are thinking 'I'll SAVE' and to those people I say: you will DEEPLY REGRET THAT when the missiles start flying! BUY THINGS! GO!",
    "PHASE ONE! FIFTY POINTS! MISSILES AND DEFENCES AVAILABLE! I have OPINIONS about what you should buy! I'm keeping those opinions INSIDE because this is YOUR nation to defend! Choose wisely! OR WRONGLY!",
    "Arms budget is LIVE! Now when I say 'invest wisely', I mean buy MISSILES because the feeling of launching a missile in this game is one of life's PUREST JOYS! YOUR NATION! YOUR CHOICE! GO!",
    "Budget phase OPEN! Now I want to be very clear — saving your points is a LEGITIMATE STRATEGY that I personally find COWARDLY and BORING! Fifty points! Multiple options! SPEND THEM! GO!",
    "Phase ONE is the Arms Race and it STARTS NOW! I once briefed thirty officers on strategic investment and one of them asked if he could save his budget! That man never made general! INVEST!",
    "FIFTY POINTS TO ALLOCATE! Missiles, defences, or SAVINGS — all valid! Some MORE valid than others! You know what I'm implying! MISSILES! But it's your choice! A VERY IMPORTANT CHOICE! GO!",
    "ARMS RACE PHASE! This is the foundation of your entire strategy! Every point you spend now echoes through phases two, three, four, and ESPECIALLY FIVE! Invest carefully! Or boldly! PREFERABLY BOLDLY! GO!",
    "Budget is LIVE! Your nation needs resources! I have spent forty years learning that the nations who invest in their defences EARLY win the wars LATE! This is wisdom! USE IT! FIFTY POINTS! GO!",
  ],

  mmuEspionage: [
    "ESPIONAGE! The spy phase! I trained operatives for THIRTY YEARS and I can tell you — seventy-five percent of intel is REAL! The other twenty-five is LIES! Like most of what you've heard tonight!",
    "Phase THREE! Espionage! Your spy networks are ACTIVE! You will receive intelligence! Some of it is true! Some of it is fabricated! This is EXACTLY what diplomatic summits are like! In my experience!",
    "SPY NETWORKS ARE LIVE! And I want to be very clear — twenty-five percent of the intel coming your way right now was MADE UP! By this system! Which is how actual intelligence works! I LOVE THIS PHASE!",
    "Espionage phase! Pay very careful attention to what your network tells you because — and I cannot stress this enough — SOME OF IT IS FALSE! Deliberate misinformation! EVALUATE CAREFULLY!",
    "Your spies are in the field! They're gathering intelligence RIGHT NOW! Some of what they bring back is accurate and some of it is — shall we say — creative! FIFTEEN SECONDS! GO!",
    "Phase THREE — ESPIONAGE! Intel inbound! Fifteen seconds! Now I know things about this room that would SHOCK you! Nothing to do with the game, I just — I watch people. It's a habit. FOCUS!",
    "INTELLIGENCE IS INCOMING! Your spy networks are active RIGHT NOW! Remember — twenty-five percent of that intel is FABRICATED! Like most of what you've heard in diplomatic circles! EVALUATE!",
    "Phase THREE — ESPIONAGE! Your spy networks are ACTIVE! You will receive intelligence! Some of it is true! Some of it is fabricated! This is EXACTLY what real intel work is like! EVALUATE!",
    "SPY PHASE ACTIVE! Intel flowing to your phones RIGHT NOW! Some of it is ACCURATE! Some of it is DELIBERATELY WRONG! This is exactly how diplomacy works! I have NEVER enjoyed phase three more!",
    "Your intelligence network is LIVE! Fifteen seconds to absorb what they're telling you! And I'll say this — twenty-five percent of what you're reading is MISINFORMATION! Which twenty-five percent?! EVALUATE!",
    "ESPIONAGE PHASE! The oldest phase in geopolitics! Gather intelligence! Trust nothing completely! Twenty-five percent false! THAT'S THE GAME! FIFTEEN SECONDS! GO!",
    "Phase THREE begins! Spies are active! Intel is incoming! False intel is also incoming — deliberately — mixed into the true intel — also deliberately! This is EXACTLY how real espionage works! EVALUATE!",
    "Intelligence phase is LIVE! Your networks are reporting to your phones! Some of what they say is true! Some is DESIGNED TO MISLEAD YOU! Figure out which! FIFTEEN SECONDS! MOVE!",
    "ESPIONAGE! Phase three! I love phase three! Everyone gets intel and twenty-five percent of it is LIES and nobody knows which twenty-five percent! This is the most exciting fifteen seconds in geopolitics! GO!",
  ],

  mmuNegotiate: [
    "{name}! I'M WATCHING YOU! Something about the way {name} invested doesn't add up and I am TELLING everyone right now — do NOT trust {name}'s intel! I have a FEELING! Negotiate accordingly!",
    "Before you all start your little diplomacy session — {name}! I've been watching {name} ALL GAME and I'm putting it on RECORD: {name} is NOT negotiating in good faith! I KNOW IT! Sixty seconds! GO!",
    "NEGOTIATION PHASE! Talk! Ally! Vote for truce if you want! But let me just say — and this is from forty years of experience — {name} is LYING TO YOU! I don't have proof! I have INSTINCT! NEGOTIATE!",
    "You have sixty seconds to form alliances! I'll keep my opinions to myself! ...Actually — {name}! Don't trust {name}! Something in {name}'s eyes! Military training! Just a hunch! NEGOTIATE!",
    "The negotiation phase is open! Form your alliances! But someone in this room made an agreement they don't intend to keep — and I believe that someone is {name}! I could be wrong! I am rarely wrong!",
    "Diplomacy time! I believe in diplomacy! I also believe {name} has been DUPLICITOUS this entire round! I will be WATCHING! Go! Talk! Alliance! But keep one eye on {name}! Both eyes! NEGOTIATE!",
    "SIXTY SECONDS OF DIPLOMACY! Talk to each other! Form alliances! I'm going to stay quiet and simply say — I've been watching the investment choices in this game and I have SUSPICIONS! NEGOTIATE!",
    "Negotiation is OPEN! Now I'll tell you something for free — the most dangerous person in any negotiation is the one who's been quiet all round! Think about who that is! Sixty seconds! GO!",
    "Diplomacy phase! Make deals! Promise things! Consider whether to keep those promises! And I am watching {name} very carefully because forty years of military intelligence tells me something! GO! NEGOTIATE!",
    "TALK! ALLY! SCHEME! You have sixty seconds! And while you do that, I will be monitoring {name}'s body language because military training tells me something! GO! NEGOTIATE!",
    "Sixty-second diplomacy window OPEN! My advice — and this is from experience — ally with the person who spent most on defence! Or don't! I'm not your general! Well. I am. Specifically. But GO!",
    "The negotiation phase begins! You have sixty seconds to form alliances, make promises, and decide how many of those promises you actually intend to keep! {name}! I see you! NEGOTIATE!",
    "DIPLOMACY! Sixty seconds! The right alliance made NOW can change the entire outcome of phase five! Think strategically! Talk! Move! {name} — I'm watching! GO!",
    "Negotiation window is LIVE! One minute! Use it! The best deal in this room is available to someone right now and someone is about to miss it by not talking! {name} — SUSPICIOUS! GO!",
  ],

  mmuResolve: [
    "PHASE FIVE! RESOLUTION! THE MISSILES FLY! This is the BEST PHASE! THIS IS WHY WE CAME HERE! Defences activate! Interceptions happen! THE PRIZE POT IS AT STAKE! GO GO GO!",
    "RESOLUTION! MISSILES ARE AIRBORNE! Forty years I've waited for moments like this! Ceramic nations built by HAND going HEAD TO HEAD! I am EMOTIONAL! I AM ALSO VERY TALL IN THIS MOMENT!",
    "THE MISSILES ARE FLYING! DEFENCES ARE ACTIVATING! Every choice you made in phases one through four is being decided RIGHT NOW! I CANNOT BREATHE! This is MAGNIFICENT!",
    "RESOLVE PHASE! Watch the event log! Missiles! Interceptions! Shields! The fate of your ceramic nation is decided in FIFTEEN SECONDS! I have NEVER been more alive than right now!",
    "Phase FIVE — RESOLUTION! The political phase is OVER! The investment phase is OVER! The negotiation is OVER! NOW! WE! LAUNCH! I am General Clay and I APPROVE of this!",
    "MISSILES! FLYING! NOW! Everything you've built — every alliance, every missile, every point of defence — it's ALL being counted RIGHT NOW! LOOK AT THE BOARD! CERAMIC NATIONS AT WAR!",
    "RESOLUTION! THE FINAL PHASE! Everything comes down to THIS MOMENT! Missiles in the air! Defences activating! Intercepts happening! Watch the EVENT LOG! THIS IS WHAT IT ALL MEANT! GO GO GO!",
    "Phase FIVE! RESOLUTION! All your investments, all your espionage, all your diplomacy — CALCULATED! RIGHT NOW! The event log tells the story! Your ceramic nations are at WAR! I am THRILLED!",
    "THE RESOLVE PHASE IS LIVE! Missiles flying! Defences holding or failing! Truces activating or betrayed! Everything you decided in phases one through four happening SIMULTANEOUSLY! LOOK AT THE BOARD!",
    "PHASE FIVE — RESOLUTION! I have been waiting for this since phase one! Every strategic choice! Every alliance! Every missile purchased! RESOLVED RIGHT NOW! WATCH THE LOG! THIS IS IT!",
    "MISSILES! DEFENCES! INTERCEPTIONS! RESOLUTION PHASE! Every point spent, every deal made, every intel evaluated — DECIDING ITSELF RIGHT NOW!",
    "The resolution phase begins! Missiles launch! Shields activate! And somewhere in this room someone made a PERFECT strategic choice and they're about to find out! WATCH! THE! BOARD!",
    "PHASE FIVE IS LIVE! The ceramic nations have been built and now they fight! Every decision echoes into this moment! Alliances hold or break! Missiles find their targets! I AM EMOTIONAL!",
    "FINAL PHASE! RESOLUTION! The event log! WATCH IT! Everything — EVERY choice from budget to espionage to negotiation — being CALCULATED as we speak! This is geopolitics! This is GLORY! THIS IS MMU!",
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
    case 'ordersupMemorize':
      quip = pick(BUZZ_QUIPS.ordersupMemorize)
      break
    case 'ordersupOrder':
      quip = pick(BUZZ_QUIPS.ordersupOrder)
      break
    case 'ordersupReveal':
      quip = pick(BUZZ_QUIPS.ordersupReveal)
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
    case 'htVote':
      quip = pick(BUZZ_QUIPS.htVote)
      break
    case 'htResults':
      quip = pick(BUZZ_QUIPS.htResults)
      break
    case 'jokeVote':
      quip = pick(BUZZ_QUIPS.jokeVote)
      break
    case 'jokeResults':
      quip = pick(BUZZ_QUIPS.jokeResults)
      break
    case 'fgVote':
      quip = pick(BUZZ_QUIPS.fgVote)
      break
    case 'fgResults':
      quip = pick(BUZZ_QUIPS.fgResults)
      break
    case 'tfReveal':
      quip = pick(BUZZ_QUIPS.tfReveal)
      break
    case 'drawNewDrawer':
      quip = pick(BUZZ_QUIPS.drawNewDrawer)?.replace('{name}', context.name || 'Someone')
      break
    case 'drawCorrect':
      quip = pick(BUZZ_QUIPS.drawCorrect)?.replace('{name}', context.name || 'Someone')
      break
    case 'crocVote':
      quip = pick(BUZZ_QUIPS.crocVote)
      break
    case 'crocReveal':
      quip = pick(BUZZ_QUIPS.crocReveal)
      break
    case 'sbVote':
      quip = pick(BUZZ_QUIPS.sbVote)
      break
    case 'sbResults':
      quip = pick(BUZZ_QUIPS.sbResults)
      break
    case 'fdPick':
      quip = pick(BUZZ_QUIPS.fdPick)
      break
    case 'fdReveal':
      quip = pick(BUZZ_QUIPS.fdReveal)
      break
    case 'lawyersArgue':
      quip = pick(BUZZ_QUIPS.lawyersArgue)
      break
    case 'lawyersVote':
      quip = pick(BUZZ_QUIPS.lawyersVote)
      break
    case 'lawyersVerdict':
      quip = pick(BUZZ_QUIPS.lawyersVerdict)
      break
    case 'mmuInvest':
      quip = pick(BUZZ_QUIPS.mmuInvest)
      break
    case 'mmuEspionage':
      quip = pick(BUZZ_QUIPS.mmuEspionage)
      break
    case 'mmuNegotiate':
      quip = pick(BUZZ_QUIPS.mmuNegotiate)?.replace(/\{name\}/g, context.name || 'Someone')
      break
    case 'mmuResolve':
      quip = pick(BUZZ_QUIPS.mmuResolve)
      break
    case 'musicNext':
      quip = pick(BUZZ_QUIPS.musicNext)
      break
    case 'musicReveal':
      quip = pick(BUZZ_QUIPS.musicReveal)
      break
    case 'idle':
    default:
      quip = pick(BUZZ_QUIPS.idle)
  }

  return quip || '...'
}
