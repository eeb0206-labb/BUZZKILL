// For draw, joke, hot take, fill-in-the-gap rounds (coming soon / future)
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useGame } from '../hooks/useGame'
import { Avatar, DrawCanvas, Toast, MuteButton } from '../components/ui'
import { db, ref, update as fbUpdate } from '../firebase'

export default function VoteScreen() {
  const store = useStore()
  const { game, myId, gameCode } = { game: store.game, myId: store.myId, gameCode: store.gameCode }
  const isController = store.isController()
  const setScreen = store.setScreen
  const { subscribeToGame, submitCreative, submitVote, updateGame } = useGame()

  const [input, setInput] = useState('')
  const [drawData, setDrawData] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const genre = game?.currentGenre
  const isDrawRound = genre?.gameType === 'draw'
  const votePhase = game?.votePhase || 'submitting'
  const players = Object.values(game?.players || {}).filter(p => p.role === 'player')
  const submissions = game?.submissions || {}
  const mySubmission = submissions[myId]
  const votes = game?.votes || {}
  const myVote = votes[myId]

  useEffect(() => {
    if (!gameCode) return
    const unsub = subscribeToGame(gameCode, (g) => {
      if (g.state === 'round-over') setScreen('round-over')
      if (g.state === 'round-pick') setScreen('round-pick')
      if (g.state === 'quiz') setScreen('quiz-host')
    })
    return unsub
  }, [gameCode])

  const prompt = game?.currentQ?.q || 'Complete the prompt...'

  async function handleSubmit() {
    const data = isDrawRound ? drawData : input.trim()
    if (!data) { store.setToast({ message: 'Add something first!', icon: '⚠️' }); return }
    await submitCreative(gameCode, myId, data)
    setSubmitted(true)
  }

  async function handleVote(targetId) {
    if (targetId === myId) { store.setToast({ message: "Can't vote for yourself!", icon: '🚫' }); return }
    await submitVote(gameCode, myId, targetId)
  }

  async function handleOpenVoting() {
    await updateGame(gameCode, { votePhase: 'voting' })
  }

  async function handleRevealResults() {
    const voteCounts = {}
    Object.values(votes).forEach(pid => { voteCounts[pid] = (voteCounts[pid] || 0) + 1 })
    const winnerId = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (winnerId) {
      const winner = game?.players?.[winnerId]
      if (winner) {
        const delta = 100 * (game?.powerupRound?.[winnerId] ? 2 : 1)
        await fbUpdate(ref(db), {
          [`games/${gameCode}/players/${winnerId}/score`]: (winner.score || 0) + delta,
          [`games/${gameCode}/players/${winnerId}/roundScore`]: (winner.roundScore || 0) + delta,
          [`games/${gameCode}/votePhase`]: 'results',
          [`games/${gameCode}/voteWinner`]: winnerId,
        })
      }
    } else {
      await updateGame(gameCode, { votePhase: 'results' })
    }
  }

  async function handleEndRound() {
    await fbUpdate(ref(db, `games/${gameCode}`), { state: 'round-over', votePhase: null })
  }

  const allSubmitted = players.every(p => submissions[p.id])
  const allVoted = players.every(p => votes[p.id])

  // Vote counts
  const voteCounts = {}
  Object.values(votes).forEach(pid => { voteCounts[pid] = (voteCounts[pid] || 0) + 1 })
  const winnerId = game?.voteWinner

  return (
    <div className="screen">
      <div className="topbar">
        <div className="round-badge">{genre?.emoji} {genre?.name}</div>
        <div className="topbar-logo">{votePhase === 'submitting' ? 'Submit' : votePhase === 'voting' ? 'Vote' : 'Results'}</div>
        <MuteButton />
      </div>

      <div className="screen-inner">
        {/* Prompt */}
        <motion.div
          className="question-card"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="question-text">{prompt}</div>
        </motion.div>

        {/* SUBMITTING PHASE */}
        {votePhase === 'submitting' && !submitted && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {isDrawRound ? (
              <DrawCanvas onDataChange={setDrawData} />
            ) : (
              <textarea
                className="input textarea"
                placeholder="Type your answer..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ minHeight: 100 }}
              />
            )}
            <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit}>
              Submit ✓
            </button>
          </motion.div>
        )}

        {votePhase === 'submitting' && submitted && (
          <div className="card center col gap-8">
            <div style={{ fontSize: '2rem' }}>✓</div>
            <div style={{ fontWeight: 700 }}>Submitted!</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>
              {Object.keys(submissions).length}/{players.length} submitted
            </div>
            {isController && allSubmitted && (
              <button className="btn btn-primary btn-block" onClick={handleOpenVoting}>
                Open Voting →
              </button>
            )}
          </div>
        )}

        {/* VOTING PHASE */}
        {votePhase === 'voting' && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text2)' }}>
              Vote for your favourite (not your own!)
            </div>
            {players.map(p => {
              const sub = submissions[p.id]
              if (!sub) return null
              const isMyOwn = p.id === myId
              const hasVoted = myVote === p.id
              return (
                <motion.div
                  key={p.id}
                  className="card"
                  style={{ cursor: isMyOwn ? 'not-allowed' : 'pointer', opacity: isMyOwn ? 0.5 : 1, borderColor: hasVoted ? 'var(--gold)' : undefined }}
                  onClick={() => !isMyOwn && !myVote && handleVote(p.id)}
                  whileTap={!isMyOwn && !myVote ? { scale: 0.98 } : {}}
                >
                  {isDrawRound ? (
                    <img src={sub} alt="drawing" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'contain', background: 'white' }} />
                  ) : (
                    <div style={{ fontSize: '1rem', lineHeight: 1.5 }}>{sub}</div>
                  )}
                  {!isMyOwn && (
                    <div className="row gap-6" style={{ marginTop: 10 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
                        Anonymous
                      </div>
                      {hasVoted && <div style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>✓ Voted</div>}
                    </div>
                  )}
                </motion.div>
              )
            })}
            {isController && (
              <button className="btn btn-primary btn-lg btn-block" onClick={handleRevealResults}>
                Reveal Results →
              </button>
            )}
          </motion.div>
        )}

        {/* RESULTS PHASE */}
        {votePhase === 'results' && (
          <motion.div className="col gap-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {players.map(p => {
              const sub = submissions[p.id]
              const votes = voteCounts[p.id] || 0
              const isWinner = p.id === winnerId
              return (
                <motion.div
                  key={p.id}
                  className="card"
                  style={{ borderColor: isWinner ? 'var(--gold)' : undefined, background: isWinner ? 'rgba(244,208,63,0.06)' : undefined }}
                >
                  <div className="row gap-8" style={{ marginBottom: 10 }}>
                    <Avatar src={p.avatar} name={p.name} colorHex={p.colorHex} size={36} />
                    <div className="flex-1" style={{ fontWeight: 700 }}>{p.name}</div>
                    {isWinner && <div style={{ color: 'var(--gold)' }}>👑 WINNER +100</div>}
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{votes} vote{votes !== 1 ? 's' : ''}</div>
                  </div>
                  {isDrawRound ? (
                    <img src={sub} alt="" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'contain', background: 'white' }} />
                  ) : (
                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5, fontStyle: 'italic' }}>"{sub}"</div>
                  )}
                </motion.div>
              )
            })}
            {isController && (
              <button className="btn btn-green btn-lg btn-block" onClick={handleEndRound}>
                End Round →
              </button>
            )}
          </motion.div>
        )}
      </div>
      <Toast />
    </div>
  )
}
