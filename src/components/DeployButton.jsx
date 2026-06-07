import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Only renders on localhost (dev server). Invisible in production build.
const IS_DEV = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export default function DeployButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null) // null | 'loading' | 'ok' | 'error'
  const [gitStatus, setGitStatus] = useState(null)
  const [output, setOutput] = useState('')

  if (!IS_DEV) return null

  useEffect(() => {
    if (!open) return
    fetch('/api/git-status')
      .then(r => r.json())
      .then(d => setGitStatus(d))
      .catch(() => setGitStatus({ error: 'Could not read git status' }))
  }, [open])

  async function deploy() {
    if (status === 'loading') return
    setStatus('loading')
    setOutput('')
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() || `update: ${new Date().toLocaleDateString('en-GB')}` }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('ok')
        setOutput(data.output || 'Pushed successfully')
        setMessage('')
        setTimeout(() => setGitStatus(null), 300) // refresh
        fetch('/api/git-status').then(r => r.json()).then(d => setGitStatus(d))
      } else {
        setStatus('error')
        setOutput(data.error || 'Deploy failed')
      }
    } catch (e) {
      setStatus('error')
      setOutput(e.message)
    }
  }

  const hasChanges = gitStatus?.status && gitStatus.status.length > 0

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => { setOpen(o => !o); setStatus(null); setOutput('') }}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: hasChanges ? 'linear-gradient(135deg, #d97706, #f4d03f)' : 'var(--surface2)',
          border: `2px solid ${hasChanges ? 'rgba(244,208,63,0.6)' : 'var(--border2)'}`,
          color: hasChanges ? '#1a0a2e' : 'var(--text2)',
          fontSize: '1.1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: hasChanges ? '0 4px 20px rgba(244,208,63,0.4)' : '0 2px 12px rgba(0,0,0,0.4)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        title="Deploy to Netlify"
      >
        🚀
      </motion.button>

      {/* Deploy panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 74,
              right: 16,
              zIndex: 9999,
              width: 320,
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: 'var(--gold)' }}>
              🚀 Deploy to Netlify
            </div>

            {/* Git status */}
            {gitStatus && (
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 10, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>
                <div style={{ color: 'var(--text3)', marginBottom: 4 }}>
                  Branch: <span style={{ color: 'var(--accent)' }}>{gitStatus.branch}</span>
                </div>
                {gitStatus.status ? (
                  <div style={{ color: hasChanges ? 'var(--gold)' : 'var(--green)' }}>
                    {hasChanges ? `${gitStatus.status.split('\n').length} file(s) changed` : '✓ Nothing to commit'}
                  </div>
                ) : null}
                {gitStatus.error && <div style={{ color: 'var(--red)' }}>{gitStatus.error}</div>}
              </div>
            )}

            <input
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg)',
                border: '1px solid var(--border2)',
                borderRadius: 8,
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
              placeholder={`Commit message (optional)`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && deploy()}
            />

            {output && (
              <div style={{
                background: status === 'ok' ? 'rgba(87,204,153,0.08)' : 'rgba(230,57,70,0.08)',
                border: `1px solid ${status === 'ok' ? 'rgba(87,204,153,0.3)' : 'rgba(230,57,70,0.3)'}`,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: status === 'ok' ? 'var(--green)' : 'var(--red)',
                maxHeight: 80,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {status === 'ok' ? '✓ ' : '✗ '}{output}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border2)',
                  borderRadius: 8,
                  color: 'var(--text2)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={deploy}
                disabled={status === 'loading' || !hasChanges}
                style={{
                  flex: 2,
                  padding: '10px',
                  background: (!hasChanges || status === 'loading')
                    ? 'var(--surface2)'
                    : 'linear-gradient(135deg, #d97706, #f4d03f)',
                  border: 'none',
                  borderRadius: 8,
                  color: (!hasChanges || status === 'loading') ? 'var(--text3)' : '#1a0a2e',
                  cursor: hasChanges && status !== 'loading' ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {status === 'loading' ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                    Deploying...
                  </>
                ) : status === 'ok' ? '✓ Deployed!' : !hasChanges ? 'Nothing to deploy' : '🚀 Deploy'}
              </button>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textAlign: 'center' }}>
              git add -A · commit · push → Netlify auto-builds (~1 min)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
