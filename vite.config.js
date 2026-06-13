import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync, exec } from 'child_process'
import fs from 'fs'
import path from 'path'

// ── Genres.js read/write helpers ─────────────────────────────────────────────

// Parse genres.js server-side by stripping ES module syntax and evaluating
function readGenresFile(cwd) {
  const src = fs.readFileSync(path.join(cwd, 'src/data/genres.js'), 'utf-8')
  const code = src
    .replace(/^export\s+const\s+/gm, 'var ')
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+default\s+/gm, 'var _default = ')
  try {
    // new Function runs in global scope — Array/Object/Math available natively
    const fn = new Function(code + '\n; return { GENRES, ALL_GENRES }')
    const { GENRES, ALL_GENRES } = fn()
    return { GENRES: GENRES || [], ALL_GENRES: ALL_GENRES || GENRES || [] }
  } catch (e) {
    console.error('[admin-api] Failed to parse genres.js:', e.message)
    return { GENRES: [], ALL_GENRES: [] }
  }
}

// Find the end index of a JS array/object starting at startIdx (bracket matching)
function findBlockEnd(src, startIdx) {
  const openChar = src[startIdx]
  const closeChar = openChar === '[' ? ']' : openChar === '{' ? '}' : ')'
  let depth = 0
  let inStr = false
  let strChar = ''
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (c === '\\') { i++; continue }
      if (c === strChar) inStr = false
      continue
    }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strChar = c; continue }
    if (c === openChar) depth++
    else if (c === closeChar) { depth--; if (depth === 0) return i }
  }
  return -1
}

// Serialize a questions/prompts/orders array back to a JS string
function serializeContentArray(items, indent = '      ') {
  if (!items || items.length === 0) return '[]'
  const lines = items.map(item => {
    const entries = Object.entries(item).map(([k, v]) => {
      if (typeof v === 'string') {
        const escaped = v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        return `${k}: "${escaped}"`
      }
      if (Array.isArray(v)) return `${k}: ${JSON.stringify(v)}`
      return `${k}: ${JSON.stringify(v)}`
    })
    return `${indent}{ ${entries.join(', ')} }`
  })
  return `[\n${lines.join(',\n')},\n${indent.slice(2)}]`
}

// Update a single genre's content array (questions/prompts/orders/statements/pairs) in genres.js
function saveGenreContent(cwd, genreId, field, items) {
  const filePath = path.join(cwd, 'src/data/genres.js')
  let src = fs.readFileSync(filePath, 'utf-8')

  // Find the genre block — look for `id: 'genreId'`
  const idPattern = new RegExp(`id:\\s*['"]${genreId}['"]`)
  const idMatch = idPattern.exec(src)
  if (!idMatch) return { ok: false, error: `Genre '${genreId}' not found` }

  // From that point forward, find the field array
  const afterId = src.indexOf(idMatch[0])
  // Find next occurrence of `field: [` after the genre id
  const fieldPattern = new RegExp(`\\b${field}:\\s*\\[`)
  const fromId = src.slice(afterId)
  const fieldMatch = fieldPattern.exec(fromId)
  if (!fieldMatch) return { ok: false, error: `Field '${field}' not found in genre '${genreId}'` }

  const fieldStart = afterId + fieldMatch.index + fieldMatch[0].indexOf('[')
  const fieldEnd = findBlockEnd(src, fieldStart)
  if (fieldEnd === -1) return { ok: false, error: 'Could not find array end' }

  const newArray = serializeContentArray(items)
  src = src.slice(0, fieldStart) + newArray + src.slice(fieldEnd + 1)
  fs.writeFileSync(filePath, src, 'utf-8')
  return { ok: true }
}

// Read/write genre voices overlay (stored separately — genres.js only has content)
function readGenreVoices(cwd) {
  const p = path.join(cwd, 'src/data/genre-voices.json')
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return {} }
}
function saveGenreVoices(cwd, voices) {
  fs.writeFileSync(
    path.join(cwd, 'src/data/genre-voices.json'),
    JSON.stringify(voices, null, 2),
    'utf-8'
  )
}

// ─────────────────────────────────────────────────────────────────────────────

// Dev-only admin API plugin — provides /api/deploy endpoint
function adminApiPlugin() {
  return {
    name: 'admin-api',
    apply: 'serve',
    configureServer(server) {
      const cwd = process.cwd()

      // GET /api/questions — returns all genres with questions/prompts/etc + voice overrides
      server.middlewares.use('/api/questions', (req, res) => {
        if (req.method === 'GET') {
          try {
            const { ALL_GENRES } = readGenresFile(cwd)
            const voices = readGenreVoices(cwd)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ genres: ALL_GENRES, voices }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }

        // POST /api/questions — save a single genre's content + optional voice override
        if (req.method === 'POST') {
          let body = ''
          req.on('data', c => { body += c })
          req.on('end', () => {
            try {
              const { genreId, field, items, voiceId } = JSON.parse(body)
              // Save content array if provided
              if (items !== undefined) {
                const result = saveGenreContent(cwd, genreId, field, items)
                if (!result.ok) {
                  res.statusCode = 400
                  res.end(JSON.stringify(result))
                  return
                }
              }
              // Save voice override if provided
              if (voiceId !== undefined) {
                const voices = readGenreVoices(cwd)
                if (voiceId) voices[genreId] = voiceId
                else delete voices[genreId]
                saveGenreVoices(cwd, voices)
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
          })
          return
        }

        res.statusCode = 405; res.end()
      })

      // GET /api/git-status — shows current branch + uncommitted changes
      server.middlewares.use('/api/git-status', (req, res) => {
        try {
          const branch = execSync('git branch --show-current').toString().trim()
          const status = execSync('git status --short').toString().trim()
          const log = execSync('git log --oneline -3').toString().trim()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ branch, status, log }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })

      // POST /api/deploy — git add + commit + push
      server.middlewares.use('/api/deploy', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          let message = 'update'
          try { message = JSON.parse(body).message || 'update' } catch {}
          const safeMsgDoubleQuote = message.replace(/"/g, '\\"')
          const cmd = `git add -A && git commit -m "${safeMsgDoubleQuote}" && git push origin main`
          exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr) => {
            res.setHeader('Content-Type', 'application/json')
            if (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: stderr || err.message }))
            } else {
              res.end(JSON.stringify({ ok: true, output: stdout }))
            }
          })
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), adminApiPlugin()],
  server: { port: 5200, host: true },
  define: {
    // Expose whether we're in dev mode to the client
    __DEV_MODE__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
})
