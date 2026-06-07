import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync, exec } from 'child_process'

// Dev-only admin API plugin — provides /api/deploy endpoint
function adminApiPlugin() {
  return {
    name: 'admin-api',
    apply: 'serve',
    configureServer(server) {
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
