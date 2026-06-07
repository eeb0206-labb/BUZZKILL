// AI question generation using Anthropic API
// API key configured per-game in settings

const SYSTEM_PROMPT = `You are a quiz question generator for a fun party game called Buzzkill.
Generate questions that are accurate, clearly worded, and fun.
Only include facts you are 100% certain about.
Return a JSON array — nothing else, no markdown, no commentary.`

async function callAI(apiKey, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) throw new Error(`AI error ${res.status}`)
  const data = await res.json()
  const text = data.content?.[0]?.text || '[]'
  return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
}

export async function generateQuizQuestions(apiKey, genre, count = 8, insideJokes = []) {
  if (!apiKey) return null

  const jokeContext = insideJokes.length > 0
    ? `\nYou may optionally weave in references to these inside jokes submitted by players (use sparingly, 1-2 max):\n${insideJokes.map(j => `- [${j.category}] "${j.label}"${j.context ? ` (context: ${j.context})` : ''}`).join('\n')}`
    : ''

  const prompt = `Generate ${count} quiz questions about: "${genre.name}" (${genre.emoji}).
${jokeContext}

Return a JSON array of objects:
[{ "q": "Question text?", "a": "Answer", "hint": "Short hint (10 words max)" }]

Rules:
- Questions must be factually correct and clearly worded
- Answers should be concise (1-5 words ideally)
- Hints should nudge without giving it away
- Mix difficulty levels
- Make them fun and engaging for UK university students`

  try {
    return await callAI(apiKey, prompt)
  } catch (e) {
    console.warn('AI question generation failed:', e)
    return null
  }
}

export async function generateDrawPrompt(apiKey, insideJokes = []) {
  if (!apiKey) return null
  const jokeContext = insideJokes.length > 0
    ? `Inside jokes available (use one if it fits): ${insideJokes.map(j => `"${j.label}" (${j.category})`).join(', ')}`
    : ''
  const prompt = `Generate one fun drawing prompt for a party game.
${jokeContext}
Return: { "prompt": "Draw ___" }
Make it funny, specific, and drawable in under 2 minutes.`
  try {
    const result = await callAI(apiKey, prompt)
    return Array.isArray(result) ? result[0]?.prompt : result?.prompt
  } catch (e) { return null }
}

export async function generateJokePrompts(apiKey, count = 3, insideJokes = []) {
  if (!apiKey) return null
  const prompt = `Generate ${count} funny creative writing prompts for a party game (Joke Off round).
Return JSON array: [{ "prompt": "Write the worst possible ___" }]
Make them funny and creative for UK uni students aged 18-22.`
  try {
    return await callAI(apiKey, prompt)
  } catch (e) { return null }
}

export async function generateHotTake(apiKey, insideJokes = []) {
  if (!apiKey) return null
  const prompt = `Generate one controversial-but-fun "hot take" statement for a party vote game.
Return: { "statement": "The statement here" }
Examples: "Pineapple belongs on pizza", "Mornings are better than nights"
Make it debatable but not offensive.`
  try {
    const result = await callAI(apiKey, prompt)
    return Array.isArray(result) ? result[0]?.statement : result?.statement
  } catch (e) { return null }
}

export async function generateFillGap(apiKey, insideJokes = []) {
  if (!apiKey) return null
  const prompt = `Generate one funny "fill in the gap" template for a party game.
Return: { "template": "The sentence with ___ to fill in" }
Example: "The best thing about uni is ___, but the worst is ___."
Make it fun and open-ended for UK students.`
  try {
    const result = await callAI(apiKey, prompt)
    return Array.isArray(result) ? result[0]?.template : result?.template
  } catch (e) { return null }
}

export async function generateInsideJokeQuestion(apiKey, joke) {
  if (!apiKey) return null
  const prompt = `Generate a party game question based on this inside joke:
Label: "${joke.label}"
Category: ${joke.category}
${joke.context ? `Context: "${joke.context}"` : '(No extra context provided — make the question open-ended or vote-based)'}

Return: { "q": "Question?", "a": "Answer or 'VOTE'", "hint": "Hint", "isVoteBased": true/false }
If no context was provided, make it vote-based (players vote for best answer).
If context was provided, make it a factual question.`
  try {
    const result = await callAI(apiKey, prompt)
    return Array.isArray(result) ? result[0] : result
  } catch (e) { return null }
}
