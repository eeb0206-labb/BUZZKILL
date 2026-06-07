import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { Toast } from './components/ui'

// Screens
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
}

const PAGE_VARIANTS = {
  initial: (dir) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -30 : 30 }),
}

export default function App() {
  const screen = useStore(s => s.screen)
  const direction = useStore(s => s.direction)
  const myRole = useStore(s => s.myRole)

  // Determine which screen component to render
  // Players see player-specific screens, controllers see host screens
  function getScreenComponent() {
    if (screen === 'quiz-host') {
      // Game screen role → show TV view
      if (myRole === 'gamescreen') return GameScreen
      // Players see player screen
      if (myRole === 'player') return QuizPlayerScreen
      // Host/cohost see host screen
      return QuizHostScreen
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
      <Toast />
    </div>
  )
}
