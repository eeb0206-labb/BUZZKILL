/**
 * ModelVillage — SVG model village for Model Model UN.
 * Buildings are drawn from shapes. Roofs use the player's colorHex so nations
 * are immediately identifiable on the TV screen. Anti-air launchers appear when
 * missiles > 0. Rubble is shown when destroyed.
 *
 * Also exports ModelVillageScene — the full layered component with avatar
 * standing behind the village, table surface, shield dome, and missile effects.
 */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from './ui'

// ── Pure SVG village buildings ────────────────────────────────────────────────

export function ModelVillageSVG({ roofColor = '#c2773a', missiles = 0, destroyed = false, scale = 1 }) {
  const w = Math.round(132 * scale)
  const h = Math.round(78 * scale)
  const wall  = '#c8b89a'
  const wallShadow = '#a89674'
  const glass = 'rgba(180,220,255,0.72)'
  const door  = 'rgba(90,60,35,0.75)'
  const roof  = roofColor
  // Slightly darkened roof for ridge line
  const roofDark = roofColor + 'cc'

  if (destroyed) {
    return (
      <svg width={w} height={h} viewBox="0 0 132 78" overflow="visible">
        {/* Rubble piles */}
        <ellipse cx="30" cy="68" rx="22" ry="8" fill="rgba(120,100,80,0.5)" />
        <ellipse cx="66" cy="70" rx="28" ry="9" fill="rgba(130,110,85,0.55)" />
        <ellipse cx="100" cy="68" rx="18" ry="7" fill="rgba(120,100,80,0.5)" />
        {/* Broken wall chunks */}
        <polygon points="18,64 28,44 35,64" fill={wallShadow} opacity="0.7" />
        <polygon points="52,66 60,38 72,66" fill={wallShadow} opacity="0.7" />
        <polygon points="86,64 95,46 104,64" fill={wallShadow} opacity="0.65" />
        {/* Roof fragments */}
        <polygon points="22,42 32,34 36,48" fill={roof} opacity="0.6" />
        <polygon points="58,38 68,28 74,42" fill={roof} opacity="0.6" />
        <polygon points="90,44 99,36 106,46" fill={roof} opacity="0.55" />
        {/* Smoke */}
        {[20, 64, 105].map((x, i) => (
          <motion.circle key={i} cx={x} cy={32 + i * 8} r={4 + i * 2}
            animate={{ cy: [32 + i * 8, 10 + i * 4], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
            fill="rgba(80,80,80,0.35)"
          />
        ))}
      </svg>
    )
  }

  return (
    <svg width={w} height={h} viewBox="0 0 132 78" overflow="visible" style={{ display: 'block' }}>

      {/* ── Anti-air launcher LEFT ── */}
      {missiles > 0 && (
        <g transform="translate(1, 46)">
          {/* Launch pad base */}
          <rect x="0" y="20" width="10" height="4" fill="#4a5568" rx="1" />
          {/* Tube */}
          <rect x="3.5" y="4" width="3" height="16" fill="#556" rx="1" />
          {/* Nose cone */}
          <polygon points="5,4 2,8 8,8" fill="#e63946" />
          {/* Fins */}
          <polygon points="3.5,18 0,22 3.5,22" fill="#445" />
          <polygon points="6.5,18 10,22 6.5,22" fill="#445" />
          {/* Glow tip */}
          <motion.circle cx="5" cy="3" r="2"
            animate={{ opacity: [0.8, 0.3, 0.8], r: [2, 2.8, 2] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            fill="#e63946"
          />
        </g>
      )}

      {/* ── LEFT HOUSE ── */}
      {/* Shadow */}
      <ellipse cx="27" cy="76" rx="16" ry="3" fill="rgba(0,0,0,0.12)" />
      {/* Wall */}
      <rect x="13" y="46" width="28" height="30" fill={wall} rx="1" />
      {/* Wall shadow right */}
      <rect x="38" y="46" width="3" height="30" fill={wallShadow} rx="1" />
      {/* Roof */}
      <polygon points="11,46 41,46 26,30" fill={roof} />
      {/* Roof ridge */}
      <line x1="26" y1="30" x2="26" y2="46" stroke={roofDark} strokeWidth="1.5" opacity="0.6" />
      {/* Chimney */}
      <rect x="30" y="30" width="5" height="10" fill={wallShadow} />
      <rect x="29" y="28" width="7" height="3" fill={wallShadow} />
      {/* Window */}
      <rect x="19" y="56" width="9" height="9" fill={glass} rx="1" />
      <line x1="23.5" y1="56" x2="23.5" y2="65" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />
      <line x1="19" y1="60.5" x2="28" y2="60.5" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />

      {/* ── MAIN HOUSE (centre, taller) ── */}
      {/* Shadow */}
      <ellipse cx="66" cy="77" rx="22" ry="3.5" fill="rgba(0,0,0,0.14)" />
      {/* Wall */}
      <rect x="46" y="29" width="40" height="47" fill={wall} rx="1" />
      {/* Wall shadow right */}
      <rect x="83" y="29" width="3" height="47" fill={wallShadow} rx="1" />
      {/* Roof */}
      <polygon points="43,29 89,29 66,11" fill={roof} />
      {/* Roof ridge */}
      <line x1="66" y1="11" x2="66" y2="29" stroke={roofDark} strokeWidth="1.5" opacity="0.6" />
      {/* Chimney */}
      <rect x="72" y="14" width="6" height="12" fill={wallShadow} />
      <rect x="71" y="12" width="8" height="3" fill={wallShadow} />
      {/* Window left */}
      <rect x="51" y="43" width="11" height="12" fill={glass} rx="1" />
      <line x1="56.5" y1="43" x2="56.5" y2="55" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />
      <line x1="51" y1="49" x2="62" y2="49" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />
      {/* Window right */}
      <rect x="70" y="43" width="11" height="12" fill={glass} rx="1" />
      <line x1="75.5" y1="43" x2="75.5" y2="55" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />
      <line x1="70" y1="49" x2="81" y2="49" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />
      {/* Door */}
      <rect x="60" y="60" width="12" height="16" fill={door} rx="2" />
      <circle cx="70" cy="68.5" r="1.2" fill="rgba(220,180,80,0.9)" />

      {/* ── RIGHT HOUSE ── */}
      {/* Shadow */}
      <ellipse cx="105" cy="76" rx="14" ry="2.5" fill="rgba(0,0,0,0.11)" />
      {/* Wall */}
      <rect x="93" y="50" width="24" height="26" fill={wall} rx="1" />
      {/* Wall shadow right */}
      <rect x="114" y="50" width="3" height="26" fill={wallShadow} rx="1" />
      {/* Roof */}
      <polygon points="91,50 117,50 104,36" fill={roof} />
      {/* Roof ridge */}
      <line x1="104" y1="36" x2="104" y2="50" stroke={roofDark} strokeWidth="1.2" opacity="0.6" />
      {/* Window */}
      <rect x="98" y="58" width="9" height="9" fill={glass} rx="1" />
      <line x1="102.5" y1="58" x2="102.5" y2="67" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />
      <line x1="98" y1="62.5" x2="107" y2="62.5" stroke="rgba(150,170,200,0.5)" strokeWidth="0.8" />

      {/* ── Anti-air launcher RIGHT (second missile) ── */}
      {missiles > 1 && (
        <g transform="translate(122, 46)">
          <rect x="0" y="20" width="10" height="4" fill="#4a5568" rx="1" />
          <rect x="3.5" y="4" width="3" height="16" fill="#556" rx="1" />
          <polygon points="5,4 2,8 8,8" fill="#e63946" />
          <polygon points="3.5,18 0,22 3.5,22" fill="#445" />
          <polygon points="6.5,18 10,22 6.5,22" fill="#445" />
          <motion.circle cx="5" cy="3" r="2"
            animate={{ opacity: [0.8, 0.3, 0.8], r: [2, 2.8, 2] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
            fill="#e63946"
          />
        </g>
      )}

    </svg>
  )
}

// ── Full scene: avatar behind village on table ────────────────────────────────

/**
 * ModelVillageScene — layered village component.
 *
 * Props:
 *   player       — { avatar, avatarConfig, name, colorHex }
 *   roofColor    — string hex (player's game color)
 *   nation       — { name, emoji }
 *   missiles     — number
 *   destroyed    — bool
 *   inFlight     — bool (missile incoming)
 *   shielded     — bool (show dome)
 *   interceptions — array (mid-air flash events)
 *   avatarSize   — number (default 48)
 *   scale        — number (default 1 — 1.4 for phone view, 1 for TV)
 */
export function ModelVillageScene({
  player,
  roofColor = '#c2773a',
  nation,
  missiles = 0,
  destroyed = false,
  inFlight = false,
  shielded = false,
  interceptions = [],
  avatarSize = 48,
  scale = 1,
}) {
  const villageW = Math.round(132 * scale)
  const sceneW   = villageW + Math.round(28 * scale)
  const tableH   = Math.round(36 * scale)
  const tableEdge = Math.round(14 * scale)
  const sceneH   = Math.round(165 * scale)

  return (
    <div style={{ position: 'relative', width: sceneW, height: sceneH, flexShrink: 0 }}>

      {/* Avatar — sits behind buildings. Top ~55% is visible above the table */}
      <motion.div
        animate={
          destroyed   ? { y: [0, -10, 24], opacity: [1, 1, 0] }
          : inFlight  ? { x: [-2, 2, -2, 2, 0] }
          : {}
        }
        transition={{
          duration: destroyed ? 0.7 : 0.28,
          repeat: inFlight && !destroyed ? Infinity : 0,
        }}
        style={{
          position: 'absolute',
          bottom: tableH + Math.round(avatarSize * 0.3),
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      >
        <Avatar
          src={player?.avatar}
          avatarConfig={player?.avatarConfig}
          name={player?.name}
          colorHex={player?.colorHex}
          size={avatarSize}
        />
      </motion.div>

      {/* Village buildings — in front of avatar */}
      <motion.div
        animate={
          destroyed   ? { scale: [1, 1.3, 0.1], rotate: [0, -15, 15, 0], opacity: [1, 1, 0] }
          : inFlight  ? { x: [-3, 3, -3, 3, 0] }
          : {}
        }
        transition={{
          duration: destroyed ? 0.65 : 0.28,
          repeat: inFlight && !destroyed ? Infinity : 0,
        }}
        style={{
          position: 'absolute',
          bottom: tableH,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
        }}
      >
        <ModelVillageSVG
          roofColor={roofColor}
          missiles={missiles}
          destroyed={destroyed}
          scale={scale}
        />
      </motion.div>

      {/* Table surface — sits over the lower ~40% of the avatar, creating "behind" illusion */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4 }}>
        {/* Table top surface */}
        <div style={{
          height: tableH - tableEdge,
          background: 'linear-gradient(180deg, rgba(110,80,50,0.30) 0%, rgba(80,55,32,0.45) 100%)',
          borderLeft: '1.5px solid rgba(160,120,75,0.45)',
          borderRight: '1.5px solid rgba(160,120,75,0.45)',
          borderTop: '1.5px solid rgba(180,140,90,0.5)',
        }} />
        {/* Table front edge (gives depth) */}
        <div style={{
          height: tableEdge,
          background: 'linear-gradient(180deg, rgba(90,65,38,0.92) 0%, rgba(55,38,20,0.96) 100%)',
          borderRadius: '0 0 6px 6px',
          borderTop: '2px solid rgba(195,155,95,0.6)',
          borderLeft: '1.5px solid rgba(130,90,50,0.6)',
          borderRight: '1.5px solid rgba(130,90,50,0.6)',
        }} />
      </div>

      {/* Shield dome — above table, in front of buildings */}
      <AnimatePresence>
        {shielded && (
          <motion.div
            key="shield"
            initial={{ scaleX: 0, scaleY: 0, opacity: 0 }}
            animate={{ scaleX: 1, scaleY: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
            style={{
              position: 'absolute',
              bottom: tableH - 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: Math.round(140 * scale),
              height: Math.round(72 * scale),
              borderRadius: '50% 50% 0 0',
              background: 'radial-gradient(ellipse at 40% 30%, rgba(100,220,255,0.22), rgba(50,130,255,0.06))',
              border: '2px solid rgba(100,200,255,0.72)',
              boxShadow: '0 0 20px rgba(80,180,255,0.4), inset 0 0 14px rgba(80,180,255,0.12)',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Mid-air interception flashes */}
      <AnimatePresence>
        {interceptions.map((evt, i) => (
          <motion.div
            key={`intercept-${i}`}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              top: Math.round(20 * scale),
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: Math.round(20 * scale),
              pointerEvents: 'none',
              zIndex: 8,
            }}
          >
            💥
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  )
}
