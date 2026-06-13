import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { Toast } from './components/ui'
import DeployButton from './components/DeployButton'
import SettingsOverlay from './components/SettingsOverlay'

// Screens
import { useGame } from './hooks/useGame'
import HomeScreen from './screens/HomeScreen'
import CreateScreen from './screens/CreateScreen'
import JoinScreen from './screens/JoinScreen'
import LobbyScreen from './screens/LobbyScreen'
import RoundPickScreen from './screens/RoundPickScreen'
import PowerupSelectScreen from './screens/PowerupSelectScreen'
import QuizHostScreen from './screens/QuizHostScreen'
import QuizPlayerScreen from './screens/QuizPlayerScreen'
import RoundOverScreen from './screens/RoundOverScreen'
import FinalScreen from './screens/FinalScreen'
import GameScreen from './screens/GameScreen'
import VoteScreen from './screens/VoteScreen'
import DrawScreen from './screens/DrawScreen'
import DevAdminScreen from './screens/DevAdminScreen'
import JokeOffScreen from './screens/JokeOffScreen'
import HotTakeScreen from './screens/HotTakeScreen'
import WhodunnitScreen from './screens/WhodunnitScreen'
import MusicBangersScreen from './screens/MusicBangersScreen'
import RedemptionArcScreen from './screens/RedemptionArcScreen'
import OutlandishLawyersScreen from './screens/OutlandishLawyersScreen'
import FillGapScreen from './screens/FillGapScreen'
import TrueFalseScreen from './screens/TrueFalseScreen'
import OrdersUpScreen from './screens/OrdersUpScreen'
import FartDirectionScreen from './screens/FartDirectionScreen'
import SpeedBriefsScreen from './screens/SpeedBriefsScreen'
import ModelModelUNScreen from './screens/ModelModelUNScreen'
import CrocScreen from './screens/CrocScreen'

const SCREENS = {
  home: HomeScreen,
  create: CreateScreen,
  join: JoinScreen,
  lobby: LobbyScreen,
  'round-pick': RoundPickScreen,
  'powerup-select': PowerupSelectScreen,
  'quiz-host': QuizHostScreen,
  final: FinalScreen,
  'round-over': RoundOverScreen,
  'game-screen': GameScreen,
  vote: VoteScreen,
  draw: DrawScreen,
  'dev-admin': DevAdminScreen,
}

const PAGE_VARIANTS = {
  initial: (dir) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -30 : 30 }),
}

/**
 * Route to the correct game screen based on:
 *  - myRole: 'gamescreen' always → GameScreen (TV display)
 *  - currentGenre.gameType:
 *      draw       → DrawScreen (host + player same)
 *      music      → MusicBangersScreen
 *      joke       → JokeOffScreen (everyone same screen)
 *      hottake    → HotTakeScreen (everyone same screen)
 *      whod       → WhodunnitScreen (everyone same screen)
 *      redemption → RedemptionArcScreen
 *  - myRole 'player' (quiz/blitz/fill) → QuizPlayerScreen
 *  - fallback → QuizHostScreen
 */
function getGameScreen(myRole, gameType) {
  if (myRole === 'gamescreen') return GameScreen
  switch (gameType) {
    case 'draw':       return DrawScreen
    case 'music':      return MusicBangersScreen
    case 'joke':       return JokeOffScreen
    case 'hottake':    return HotTakeScreen
    case 'whod':       return WhodunnitScreen
    case 'redemption': return RedemptionArcScreen
    case 'lawyers':    return OutlandishLawyersScreen
    case 'fill':       return FillGapScreen
    case 'truefalse':      return TrueFalseScreen
    case 'ordersup':       return OrdersUpScreen
    case 'fartdirection':  return FartDirectionScreen
    case 'speedbriefs':    return SpeedBriefsScreen
    case 'modelmodelun':   return ModelModelUNScreen
    case 'croc':           return CrocScreen
    default:
      // Standard quiz/blitz/fill — players and host get different screens
      return myRole === 'player' ? QuizPlayerScreen : QuizHostScreen
  }
}

// Always-visible settings/exit button — shown on every in-game screen
// so players can always leave, pause, or adjust volume even when stuck
const PRE_GAME_SCREENS = new Set(['home', 'create', 'join', 'dev-admin'])

function GlobalSettingsButton() {
  const screen    = useStore(s => s.screen)
  const gameCode  = useStore(s => s.gameCode)
  const [open, setOpen] = useState(false)

  // Only show when there's an active game and we're past the pre-game screens
  if (!gameCode || PRE_GAME_SCREENS.has(screen)) return null

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.55, scale: 1 }}
        whileHover={{ opacity: 1, scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 2000,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--surface2)',
          border: '1.5px solid var(--border2)',
          color: 'var(--text2)',
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
        title="Settings / Leave Game"
      >
        ⚙️
      </motion.button>

      <SettingsOverlay show={open} onClose={() => setOpen(false)} />
    </>
  )
}

// Game-paused resume button (extracted so hook is called unconditionally)
function PauseResumeButton({ gameCode }) {
  const { unpauseGame } = useGame()
  return (
    <motion.button
      className="btn btn-green btn-lg"
      whileTap={{ scale: 0.96 }}
      onClick={() => unpauseGame(gameCode)}
      style={{ marginTop: 8 }}
    >
      ▶ Resume Game
    </motion.button>
  )
}

export default function App() {
  const screen = useStore(s => s.screen)
  const direction = useStore(s => s.direction)
  const myRole = useStore(s => s.myRole)
  const gamePaused = useStore(s => s.game?.gamePaused)
  const isController = useStore(s => s.isController())
  const gameCode = useStore(s => s.gameCode)

  function getScreenComponent() {
    // gamescreen role (the big TV) always shows GameScreen once the game is in progress.
    // We only let it through the normal routing for pre-game / lobby screens.
    const GAMESCREEN_PASSTHROUGH = new Set(['home', 'create', 'join', 'dev-admin', 'lobby'])
    if (myRole === 'gamescreen' && !GAMESCREEN_PASSTHROUGH.has(screen)) {
      return GameScreen
    }

    if (screen === 'quiz-host') {
      const game = useStore.getState().game
      const gameType = game?.currentGenre?.gameType
      return getGameScreen(myRole, gameType)
    }
    return SCREENS[screen] || HomeScreen
  }

  const ScreenComponent = getScreenComponent()

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={screen}
          custom={direction}
          variants={PAGE_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}
        >
          <ScreenComponent />
        </motion.div>
      </AnimatePresence>

      {/* Global game-paused overlay */}
      <AnimatePresence>
        {gamePaused && (
          <motion.div
            key="paused-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9990,
              background: 'rgba(8,5,20,0.9)', backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
            }}
          >
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: '4rem' }}>⏸</motion.div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--gold)' }}>Game Paused</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.9rem', textAlign: 'center', maxWidth: 280 }}>
              {isController ? 'Your players need a moment. Ready when you are.' : 'Waiting for the host to resume...'}
            </div>
            {isController && <PauseResumeButton gameCode={gameCode} />}
          </motion.div>
        )}
      </AnimatePresence>

      <Toast />
      <GlobalSettingsButton />
      <DeployButton />
    </div>
  )
}

