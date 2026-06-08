/**
 * AvatarSvg — layered SVG avatar renderer.
 * viewBox: "0 0 100 140" (full body) or zoomed-in crop for small icons.
 *
 * Props:
 *  config     — avatarConfig object (merged with defaults)
 *  size       — pixel size (height when showFull, width when !showFull)
 *  showFull   — true = full body, false = head crop (for lobby avatars)
 *  className  — optional className
 *  style      — optional style object
 */
import React, { useId } from 'react'
import { DEFAULT_AVATAR_CONFIG } from '../data/avatarParts'

// ── face center per body type ─────────────────────────────────────────────────
const FACE = {
  human:  { cx: 50, cy: 30 },
  chonk:  { cx: 50, cy: 30 },
  cat:    { cx: 50, cy: 33 },
  dog:    { cx: 50, cy: 33 },
  alien:  { cx: 50, cy: 28 },
  robot:  { cx: 50, cy: 30 },
  bean:   { cx: 50, cy: 52 },
  ghost:  { cx: 50, cy: 50 },
}

// ── renderers ─────────────────────────────────────────────────────────────────

function renderBodyBase(bt, bc) {
  const darker = darken(bc, 18)
  switch (bt) {

    case 'human': return (
      <>
        {/* Legs */}
        <rect x="28" y="100" width="18" height="38" rx="6" fill={bc}/>
        <rect x="54" y="100" width="18" height="38" rx="6" fill={bc}/>
        {/* Arms */}
        <rect x="12" y="58" width="14" height="40" rx="6" fill={bc}/>
        <rect x="74" y="58" width="14" height="40" rx="6" fill={bc}/>
        {/* Torso */}
        <rect x="22" y="57" width="56" height="48" rx="8" fill={bc}/>
        {/* Neck */}
        <rect x="43" y="50" width="14" height="12" fill={bc}/>
        {/* Head */}
        <circle cx="50" cy="30" r="22" fill={bc}/>
      </>
    )

    case 'chonk': return (
      <>
        <rect x="24" y="103" width="20" height="35" rx="7" fill={bc}/>
        <rect x="56" y="103" width="20" height="35" rx="7" fill={bc}/>
        <rect x="8"  y="58"  width="18" height="42" rx="7" fill={bc}/>
        <rect x="74" y="58"  width="18" height="42" rx="7" fill={bc}/>
        <rect x="16" y="56"  width="68" height="52" rx="14" fill={bc}/>
        <rect x="40" y="50"  width="20" height="12"  fill={bc}/>
        <circle cx="50" cy="30" r="24" fill={bc}/>
      </>
    )

    case 'cat': return (
      <>
        {/* Legs */}
        <rect x="28" y="103" width="17" height="35" rx="6" fill={bc}/>
        <rect x="55" y="103" width="17" height="35" rx="6" fill={bc}/>
        {/* Arms */}
        <rect x="12" y="60" width="14" height="38" rx="6" fill={bc}/>
        <rect x="74" y="60" width="14" height="38" rx="6" fill={bc}/>
        {/* Torso */}
        <rect x="22" y="58" width="56" height="50" rx="10" fill={bc}/>
        {/* Neck */}
        <rect x="43" y="50" width="14" height="12" fill={bc}/>
        {/* Head */}
        <circle cx="50" cy="33" r="21" fill={bc}/>
        {/* Ears */}
        <polygon points="26,22 31,7 40,21" fill={bc}/>
        <polygon points="74,22 69,7 60,21" fill={bc}/>
        <polygon points="28,21 31,11 38,21" fill={darken(bc, -20)} opacity="0.55"/>
        <polygon points="72,21 69,11 62,21" fill={darken(bc, -20)} opacity="0.55"/>
        {/* Tail */}
        <path d="M 70 113 Q 88 100 86 80" stroke={darker} strokeWidth="5" fill="none" strokeLinecap="round"/>
      </>
    )

    case 'dog': return (
      <>
        <rect x="28" y="103" width="17" height="35" rx="6" fill={bc}/>
        <rect x="55" y="103" width="17" height="35" rx="6" fill={bc}/>
        <rect x="12" y="60" width="14" height="38" rx="6" fill={bc}/>
        <rect x="74" y="60" width="14" height="38" rx="6" fill={bc}/>
        <rect x="22" y="58" width="56" height="50" rx="10" fill={bc}/>
        <rect x="43" y="50" width="14" height="12" fill={bc}/>
        {/* Floppy ears */}
        <ellipse cx="26" cy="38" rx="10" ry="16" fill={darker}/>
        <ellipse cx="74" cy="38" rx="10" ry="16" fill={darker}/>
        {/* Head (on top of ears) */}
        <circle cx="50" cy="33" r="21" fill={bc}/>
        {/* Snout */}
        <ellipse cx="50" cy="40" rx="8" ry="5.5" fill={darken(bc, 15)}/>
        <ellipse cx="50" cy="37.5" rx="3.5" ry="2.5" fill={darken(bc, 35)}/>
      </>
    )

    case 'alien': return (
      <>
        <rect x="30" y="97" width="16" height="41" rx="6" fill={bc}/>
        <rect x="54" y="97" width="16" height="41" rx="6" fill={bc}/>
        <rect x="14" y="62" width="14" height="32" rx="6" fill={bc}/>
        <rect x="72" y="62" width="14" height="32" rx="6" fill={bc}/>
        <rect x="26" y="60" width="48" height="42" rx="8" fill={bc}/>
        <rect x="45" y="52" width="10" height="10" fill={bc}/>
        {/* Big alien head */}
        <ellipse cx="50" cy="28" rx="26" ry="28" fill={bc}/>
        {/* Antenna */}
        <line x1="50" y1="2" x2="50" y2="12" stroke={darker} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="50" cy="1" r="3.5" fill="#4cc9f0"/>
      </>
    )

    case 'robot': return (
      <>
        {/* Legs */}
        <rect x="29" y="103" width="16" height="35" rx="3" fill={bc}/>
        <rect x="55" y="103" width="16" height="35" rx="3" fill={bc}/>
        {/* Feet */}
        <rect x="26" y="132" width="22" height="8" rx="3" fill={darker}/>
        <rect x="52" y="132" width="22" height="8" rx="3" fill={darker}/>
        {/* Arms */}
        <rect x="10" y="62" width="14" height="36" rx="3" fill={bc}/>
        <rect x="76" y="62" width="14" height="36" rx="3" fill={bc}/>
        {/* Hands */}
        <rect x="8" y="96" width="18" height="10" rx="3" fill={darker}/>
        <rect x="74" y="96" width="18" height="10" rx="3" fill={darker}/>
        {/* Torso */}
        <rect x="22" y="60" width="56" height="48" rx="4" fill={bc}/>
        {/* Panel */}
        <rect x="30" y="68" width="40" height="14" rx="2" fill="rgba(0,0,0,0.22)"/>
        <circle cx="37" cy="75" r="4" fill="#e63946" opacity="0.8"/>
        <circle cx="50" cy="75" r="4" fill="#4895ef" opacity="0.8"/>
        <circle cx="63" cy="75" r="4" fill="#57cc99" opacity="0.8"/>
        {/* Square head */}
        <rect x="28" y="10" width="44" height="44" rx="5" fill={bc}/>
        {/* Antenna */}
        <rect x="47" y="4" width="6" height="10" rx="2" fill={darker}/>
        <circle cx="50" cy="3" r="4" fill="#f4d03f"/>
        {/* Screen-like face area */}
        <rect x="33" y="18" width="34" height="28" rx="3" fill="rgba(0,0,0,0.18)"/>
      </>
    )

    case 'bean': return (
      <>
        {/* Among Us style blob */}
        <path d="M50,8 C78,8 90,28 90,55 C90,90 82,132 50,132 C18,132 10,90 10,55 C10,28 22,8 50,8 Z" fill={bc}/>
        {/* Backpack */}
        <rect x="72" y="55" width="16" height="44" rx="8" fill={darken(bc, 25)}/>
        {/* Visor */}
        <ellipse cx="50" cy="50" rx="20" ry="22" fill="rgba(135,206,235,0.75)"/>
        {/* Visor shine */}
        <ellipse cx="44" cy="42" rx="5" ry="7" fill="rgba(255,255,255,0.35)"/>
      </>
    )

    case 'ghost': return (
      <>
        {/* Ghost body */}
        <path d="M18,38 C18,10 82,10 82,38 L82,112
          C82,112 76,106 70,112 C64,118 58,112 50,112
          C42,112 36,118 30,112 C24,106 18,112 18,112 Z"
          fill={bc}/>
        {/* Inner highlight */}
        <ellipse cx="50" cy="40" rx="22" ry="20" fill="rgba(255,255,255,0.12)"/>
      </>
    )

    default: return null
  }
}

function renderClothes(bt, topStyle, topColor, bottomStyle, bottomColor) {
  if (bt === 'bean' || bt === 'ghost') return null // no clothes for these

  const isChonk = bt === 'chonk'
  const isAlien = bt === 'alien'
  const isDog   = bt === 'dog'
  const isCat   = bt === 'cat'

  // Bottom positions
  const lx = isChonk ? 24 : isAlien ? 30 : 28
  const lw = isChonk ? 20 : isAlien ? 16 : 18
  const rx2 = isChonk ? 56 : isAlien ? 54 : 54
  const lh = bottomStyle === 'shorts' ? 20 : bottomStyle === 'skirt' ? 24 : 38
  const ly = isChonk ? 103 : isAlien ? 97 : 100

  // Top (shirt) bounds
  const tx = isChonk ? 16 : isAlien ? 26 : 22
  const tw = isChonk ? 68 : isAlien ? 48 : 56
  const ty = isChonk ? 56 : isAlien ? 60 : 57
  const th = isChonk ? 52 : isAlien ? 42 : 48
  const tr = isChonk ? 14 : 8

  // Arm sleeve bounds
  const alx = isChonk ? 8 : isAlien ? 14 : 12
  const alw = isChonk ? 18 : isAlien ? 14 : 14
  const aly = isChonk ? 58 : isAlien ? 62 : 58
  const arx = isChonk ? 74 : isAlien ? 72 : 74
  const arh = topStyle === 'tanktop' ? 16 : topStyle === 'none' ? 0 : (isChonk ? 42 : 38)

  return (
    <>
      {/* ── Bottom clothes ─────── */}
      {bottomStyle !== 'none' && (
        <>
          {bottomStyle === 'skirt' ? (
            <path
              d={`M${lx},${ly} L${lx-4},${ly+lh} L${rx2+lw+4},${ly+lh} L${rx2+lw},${ly} Z`}
              fill={bottomColor}
            />
          ) : (
            <>
              <rect x={lx}  y={ly} width={lw} height={lh} rx="5" fill={bottomColor}/>
              <rect x={rx2} y={ly} width={lw} height={lh} rx="5" fill={bottomColor}/>
              {/* Belt area overlap */}
              <rect x={tx} y={ly} width={tw} height={8} rx="2" fill={darken(bottomColor, 15)}/>
            </>
          )}
        </>
      )}

      {/* ── Top clothes ─────────── */}
      {topStyle !== 'none' && (
        <>
          {/* Body of shirt */}
          <rect x={tx} y={ty} width={tw} height={th} rx={tr} fill={topColor}/>
          {/* Sleeves */}
          {arh > 0 && (
            <>
              <rect x={alx} y={aly} width={alw} height={arh} rx="5" fill={topColor}/>
              <rect x={arx} y={aly} width={alw} height={arh} rx="5" fill={topColor}/>
            </>
          )}

          {/* Style overlays */}
          {topStyle === 'stripes' && (
            <>
              {[ty+10, ty+20, ty+30, ty+40].map(sy => (
                <rect key={sy} x={tx} y={sy} width={tw} height={5} rx="0"
                  fill={darken(topColor, 25)} opacity="0.55"/>
              ))}
            </>
          )}
          {topStyle === 'hoodie' && (
            <>
              {/* Pocket */}
              <rect x={tx+tw/2-12} y={ty+th-18} width={24} height={16} rx="4"
                fill={darken(topColor, 18)}/>
              {/* Hood bump at top */}
              <ellipse cx="50" cy={ty-4} rx="18" ry="8" fill={topColor}/>
            </>
          )}
          {topStyle === 'suit' && (
            <>
              {/* Left lapel */}
              <polygon
                points={`${tx+4},${ty} ${tx+tw/2},${ty+20} ${tx+6},${ty+th}`}
                fill={darken(topColor, 30)}
              />
              {/* Right lapel */}
              <polygon
                points={`${tx+tw-4},${ty} ${tx+tw/2},${ty+20} ${tx+tw-6},${ty+th}`}
                fill={darken(topColor, 30)}
              />
              {/* Tie */}
              <polygon
                points={`47,${ty+8} 53,${ty+8} 52,${ty+th} 50,${ty+th+4} 48,${ty+th} `}
                fill="#e63946"
              />
            </>
          )}
          {topStyle === 'jacket' && (
            <>
              {/* Collar */}
              <polygon
                points={`40,${ty} 50,${ty+14} 60,${ty}`}
                fill={darken(topColor, 20)}
              />
              {/* Zipper */}
              <line x1="50" y1={ty+12} x2="50" y2={ty+th}
                stroke={darken(topColor, 30)} strokeWidth="2"/>
            </>
          )}
          {topStyle === 'dress' && (
            <>
              {/* Dress extension over legs */}
              <path
                d={`M${tx+4},${ty+th-6} L${tx-4},${ly+lh} L${tx+tw+4},${ly+lh} L${tx+tw-4},${ty+th-6} Z`}
                fill={topColor}
              />
            </>
          )}
        </>
      )}
    </>
  )
}

function renderEyes(style, cx, cy) {
  const lex = cx - 10, ley = cy - 2
  const rex = cx + 10, rey = cy - 2
  const pupilColor = '#1a0a2e'

  switch (style) {
    case 'dots': return (
      <>
        <circle cx={lex} cy={ley} r="3" fill={pupilColor}/>
        <circle cx={rex} cy={rey} r="3" fill={pupilColor}/>
        <circle cx={lex+1} cy={ley-1} r="1" fill="rgba(255,255,255,0.7)"/>
        <circle cx={rex+1} cy={rey-1} r="1" fill="rgba(255,255,255,0.7)"/>
      </>
    )
    case 'wide': return (
      <>
        <circle cx={lex} cy={ley} r="4.5" fill="white"/>
        <circle cx={rex} cy={rey} r="4.5" fill="white"/>
        <circle cx={lex+0.5} cy={ley+0.5} r="2.5" fill={pupilColor}/>
        <circle cx={rex+0.5} cy={rey+0.5} r="2.5" fill={pupilColor}/>
        <circle cx={lex+1} cy={ley} r="1" fill="rgba(255,255,255,0.8)"/>
        <circle cx={rex+1} cy={rey} r="1" fill="rgba(255,255,255,0.8)"/>
      </>
    )
    case 'happy': return (
      <>
        <path d={`M${lex-3.5},${ley} Q${lex},${ley+4} ${lex+3.5},${ley}`} stroke={pupilColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d={`M${rex-3.5},${rey} Q${rex},${rey+4} ${rex+3.5},${rey}`} stroke={pupilColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </>
    )
    case 'tired': return (
      <>
        <path d={`M${lex-3.5},${ley-1} Q${lex},${ley+2.5} ${lex+3.5},${ley-1}`} stroke={pupilColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d={`M${rex-3.5},${rey-1} Q${rex},${rey+2.5} ${rex+3.5},${rey-1}`} stroke={pupilColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Heavy lids */}
        <path d={`M${lex-4},${ley-1} Q${lex},${ley-4} ${lex+4},${ley-1}`} stroke={pupilColor} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d={`M${rex-4},${rey-1} Q${rex},${rey-4} ${rex+4},${rey-1}`} stroke={pupilColor} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      </>
    )
    case 'angry': return (
      <>
        <circle cx={lex} cy={ley} r="3" fill={pupilColor}/>
        <circle cx={rex} cy={rey} r="3" fill={pupilColor}/>
        <circle cx={lex+1} cy={ley-1} r="1" fill="rgba(255,255,255,0.7)"/>
        <circle cx={rex+1} cy={rey-1} r="1" fill="rgba(255,255,255,0.7)"/>
      </>
    )
    case 'wink': return (
      <>
        <circle cx={lex} cy={ley} r="3" fill={pupilColor}/>
        <circle cx={lex+1} cy={ley-1} r="1" fill="rgba(255,255,255,0.7)"/>
        {/* Wink (closed arc) */}
        <path d={`M${rex-4},${rey} Q${rex},${rey-4} ${rex+4},${rey}`} stroke={pupilColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </>
    )
    case 'hearts': return (
      <>
        <path d={`M${lex},${ley+1} C${lex-1},${ley-3} ${lex-5},${ley-3} ${lex-4},${ley+1} L${lex},${ley+5} L${lex+4},${ley+1} C${lex+5},${ley-3} ${lex+1},${ley-3} ${lex},${ley+1}`} fill="#f72585"/>
        <path d={`M${rex},${rey+1} C${rex-1},${rey-3} ${rex-5},${rey-3} ${rex-4},${rey+1} L${rex},${rey+5} L${rex+4},${rey+1} C${rex+5},${rey-3} ${rex+1},${rey-3} ${rex},${rey+1}`} fill="#f72585"/>
      </>
    )
    case 'xeyes': return (
      <>
        <line x1={lex-3} y1={ley-3} x2={lex+3} y2={ley+3} stroke={pupilColor} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1={lex+3} y1={ley-3} x2={lex-3} y2={ley+3} stroke={pupilColor} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1={rex-3} y1={rey-3} x2={rex+3} y2={rey+3} stroke={pupilColor} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1={rex+3} y1={rey-3} x2={rex-3} y2={rey+3} stroke={pupilColor} strokeWidth="2.5" strokeLinecap="round"/>
      </>
    )
    case 'three': return (
      <>
        <circle cx={cx-11} cy={cy-2} r="2.8" fill={pupilColor}/>
        <circle cx={cx}     cy={cy-2} r="2.8" fill={pupilColor}/>
        <circle cx={cx+11} cy={cy-2} r="2.8" fill={pupilColor}/>
      </>
    )
    case 'cyclops': return (
      <>
        <circle cx={cx} cy={cy-1} r="6" fill="white"/>
        <circle cx={cx+0.5} cy={cy} r="3.5" fill={pupilColor}/>
        <circle cx={cx+1.5} cy={cy-1.5} r="1.2" fill="rgba(255,255,255,0.8)"/>
      </>
    )
    default: return null
  }
}

function renderEyebrows(style, cx, cy) {
  const lebx = cx - 10, leby = cy - 10
  const rebx = cx + 10, reby = cy - 10
  const col = '#1a0a2e'

  if (style === 'none') return null

  const sw = style === 'thick' ? 3.5 : 2.5
  const op = 1

  switch (style) {
    case 'normal': return (
      <>
        <line x1={lebx-4} y1={leby} x2={lebx+4} y2={leby} stroke={col} strokeWidth={sw} strokeLinecap="round" opacity={op}/>
        <line x1={rebx-4} y1={reby} x2={rebx+4} y2={reby} stroke={col} strokeWidth={sw} strokeLinecap="round" opacity={op}/>
      </>
    )
    case 'raised': return (
      <>
        <line x1={lebx-4} y1={leby-2} x2={lebx+4} y2={leby-2} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
        <line x1={rebx-4} y1={reby-2} x2={rebx+4} y2={reby-2} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      </>
    )
    case 'angry': return (
      <>
        <line x1={lebx-4} y1={leby-2} x2={lebx+4} y2={leby+2} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
        <line x1={rebx-4} y1={reby+2} x2={rebx+4} y2={reby-2} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      </>
    )
    case 'sad': return (
      <>
        <line x1={lebx-4} y1={leby+2} x2={lebx+4} y2={leby-2} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
        <line x1={rebx-4} y1={reby-2} x2={rebx+4} y2={reby+2} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      </>
    )
    case 'thick': return (
      <>
        <line x1={lebx-5} y1={leby} x2={lebx+5} y2={leby} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
        <line x1={rebx-5} y1={reby} x2={rebx+5} y2={reby} stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      </>
    )
    case 'arched': return (
      <>
        <path d={`M${lebx-4},${leby+1} Q${lebx},${leby-4} ${lebx+4},${leby+1}`} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        <path d={`M${rebx-4},${reby+1} Q${rebx},${reby-4} ${rebx+4},${reby+1}`} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round"/>
      </>
    )
    default: return null
  }
}

function renderMouth(style, cx, cy) {
  const mx = cx, my = cy + 7
  const mc = '#1a0a2e'

  switch (style) {
    case 'smile': return (
      <path d={`M${mx-7},${my} Q${mx},${my+6} ${mx+7},${my}`} stroke={mc} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    )
    case 'grin': return (
      <>
        <path d={`M${mx-8},${my} Q${mx},${my+7} ${mx+8},${my}`} stroke={mc} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <line x1={mx-8} y1={my} x2={mx+8} y2={my} stroke={mc} strokeWidth="2" strokeLinecap="round"/>
        <path d={`M${mx-8},${my} Q${mx},${my+7} ${mx+8},${my}`} fill="rgba(255,255,255,0.6)"/>
      </>
    )
    case 'flat': return (
      <line x1={mx-7} y1={my} x2={mx+7} y2={my} stroke={mc} strokeWidth="2.5" strokeLinecap="round"/>
    )
    case 'frown': return (
      <path d={`M${mx-7},${my+4} Q${mx},${my-2} ${mx+7},${my+4}`} stroke={mc} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    )
    case 'open': return (
      <>
        <ellipse cx={mx} cy={my+1} rx="7" ry="5" fill="#1a0a2e"/>
        <path d={`M${mx-7},${my+1} Q${mx},${my+6} ${mx+7},${my+1}`} fill="rgba(255,255,255,0.15)"/>
      </>
    )
    case 'tongue': return (
      <>
        <ellipse cx={mx} cy={my+1} rx="7" ry="5" fill="#1a0a2e"/>
        <ellipse cx={mx} cy={my+5} rx="4" ry="3.5" fill="#f72585"/>
      </>
    )
    case 'smirk': return (
      <path d={`M${mx-4},${my+2} Q${mx+2},${my+1} ${mx+7},${my-1}`} stroke={mc} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    )
    case 'owo': return (
      <>
        <circle cx={mx-3} cy={my} r="2.2" fill={mc}/>
        <circle cx={mx+3} cy={my} r="2.2" fill={mc}/>
        <path d={`M${mx-7},${my+5} Q${mx},${my+8} ${mx+7},${my+5}`} stroke={mc} strokeWidth="2" fill="none" strokeLinecap="round"/>
      </>
    )
    default: return null
  }
}

function renderHair(style, color, bt) {
  if (style === 'none') return null
  if (bt === 'bean' || bt === 'ghost') return null // no hair for these body types

  const hcy = bt === 'cat' || bt === 'dog' ? 33 : bt === 'alien' ? 28 : bt === 'robot' ? 30 : 30
  const hr  = bt === 'chonk' ? 24 : bt === 'alien' ? 26 : 22
  const top = hcy - hr
  const left = 50 - hr
  const right = 50 + hr

  switch (style) {
    case 'short': return (
      <path d={`M${left-1},${hcy-4} Q${left},${top-3} 50,${top-4} Q${right},${top-3} ${right+1},${hcy-4}`}
        fill={color} stroke={darken(color,20)} strokeWidth="1"/>
    )
    case 'long': return (
      <>
        <path d={`M${left-1},${hcy-2} Q${left-2},${top-4} 50,${top-5} Q${right+2},${top-4} ${right+1},${hcy-2}`}
          fill={color} stroke={darken(color,20)} strokeWidth="1"/>
        {/* Side curtains */}
        <rect x={left-6} y={hcy-5} width="9" height="52" rx="4" fill={color}/>
        <rect x={right-3} y={hcy-5} width="9" height="52" rx="4" fill={color}/>
      </>
    )
    case 'curly': return (
      <>
        <path d={`M${left-1},${hcy-4} Q${left-2},${top-4} 50,${top-5} Q${right+2},${top-4} ${right+1},${hcy-4}`}
          fill={color}/>
        {/* Curl bumps */}
        {[-12,-4,4,12].map(ox => (
          <circle key={ox} cx={50+ox} cy={top-3} r="5" fill={color} stroke={darken(color,15)} strokeWidth="1"/>
        ))}
        <circle cx={left+4} cy={hcy-8} r="4" fill={color}/>
        <circle cx={right-4} cy={hcy-8} r="4" fill={color}/>
      </>
    )
    case 'spiky': return (
      <>
        {[-12,-6,0,6,12].map((ox,i) => (
          <polygon key={i}
            points={`${50+ox-5},${top+2} ${50+ox},${top-14} ${50+ox+5},${top+2}`}
            fill={color}
          />
        ))}
        <path d={`M${left},${hcy-2} Q${left},${top+4} 50,${top} Q${right},${top+4} ${right},${hcy-2}`}
          fill={color}/>
      </>
    )
    case 'bun': return (
      <>
        {/* Base */}
        <path d={`M${left-1},${hcy-4} Q${left},${top-3} 50,${top-4} Q${right},${top-3} ${right+1},${hcy-4}`}
          fill={color}/>
        {/* Bun on top */}
        <circle cx="50" cy={top-6} r="9" fill={color} stroke={darken(color,15)} strokeWidth="1"/>
        {/* Hair band */}
        <ellipse cx="50" cy={top} rx="9" ry="3" fill={darken(color,22)}/>
      </>
    )
    case 'mohawk': return (
      <>
        {/* Base */}
        <path d={`M${left-1},${hcy-4} Q${left},${top-3} 50,${top-4} Q${right},${top-3} ${right+1},${hcy-4}`}
          fill={darken(color,10)}/>
        {/* Mohawk strip */}
        <path d={`M44,${top+2} L44,${top-22} Q50,${top-26} 56,${top-22} L56,${top+2}`} fill={color}/>
      </>
    )
    case 'braids': return (
      <>
        <path d={`M${left-1},${hcy-4} Q${left},${top-3} 50,${top-4} Q${right},${top-3} ${right+1},${hcy-4}`}
          fill={color}/>
        {/* Two braids */}
        {[[-8,0],[-4,10],[-8,20],[-4,28],[-8,36]].map(([bx,by],i) => (
          <circle key={`l${i}`} cx={left-6+bx*0.3} cy={hcy+by} r="4" fill={color} opacity={1-i*0.12}/>
        ))}
        {[[8,0],[4,10],[8,20],[4,28],[8,36]].map(([bx,by],i) => (
          <circle key={`r${i}`} cx={right+6-bx*0.3} cy={hcy+by} r="4" fill={color} opacity={1-i*0.12}/>
        ))}
      </>
    )
    case 'beanie': return (
      <>
        <path d={`M${left-2},${hcy-5} Q${left-2},${top-6} 50,${top-8} Q${right+2},${top-6} ${right+2},${hcy-5}`}
          fill={color}/>
        {/* Beanie rim */}
        <rect x={left-3} y={hcy-10} width={(hr+3)*2} height="8" rx="2" fill={darken(color,20)}/>
        {/* Pom-pom */}
        <circle cx="50" cy={top-10} r="6" fill={darken(color,-10)}/>
      </>
    )
    case 'cap': return (
      <>
        <path d={`M${left-1},${hcy-4} Q${left},${top-2} 50,${top-4} Q${right},${top-2} ${right+1},${hcy-4}`}
          fill={color}/>
        {/* Cap dome */}
        <path d={`M${left-4},${hcy-5} Q${left-3},${top-8} 50,${top-10} Q${right+3},${top-8} ${right+4},${hcy-5}`}
          fill={color} stroke={darken(color,20)} strokeWidth="1"/>
        {/* Brim */}
        <path d={`M${left-6},${hcy-2} Q${left-2},${hcy+2} ${left+4},${hcy}`} stroke={darken(color,25)} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <rect x={left-8} y={hcy-3} width="18" height="6" rx="3" fill={darken(color,20)}/>
      </>
    )
    case 'afro': return (
      <>
        <circle cx="50" cy={hcy-4} r={hr+6} fill={color}/>
        {/* Texture bumps */}
        {[[-15,-8],[-8,-14],[0,-16],[8,-14],[15,-8],[18,0],[14,6],[-14,6],[-18,0]].map(([ox,oy],i) => (
          <circle key={i} cx={50+ox} cy={hcy+oy-4} r="4" fill={darken(color,10)} opacity="0.4"/>
        ))}
      </>
    )
    case 'fringe': return (
      <>
        <path d={`M${left-1},${hcy-4} Q${left},${top-3} 50,${top-4} Q${right},${top-3} ${right+1},${hcy-4}`}
          fill={color}/>
        {/* Fringe across forehead */}
        <path d={`M${left+1},${hcy-5} Q${left+4},${hcy+7} ${left+10},${hcy+10} Q50,${hcy+12} ${right-10},${hcy+10} Q${right-4},${hcy+7} ${right-1},${hcy-5}`}
          fill={color}/>
      </>
    )
    default: return null
  }
}

function renderAccessory(acc, bt, cx, cy) {
  if (acc === 'none') return null
  if (bt === 'bean') return null // skip accessories on bean for cleanliness

  const hcy = FACE[bt]?.cy || cy
  const hr  = bt === 'chonk' ? 24 : bt === 'alien' ? 26 : 22
  const top = hcy - hr

  // Eye line y (for glasses)
  const eyeY = hcy - 2

  switch (acc) {
    case 'glasses': return (
      <>
        <circle cx={cx-10} cy={eyeY} r="6" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
        <circle cx={cx+10} cy={eyeY} r="6" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
        <line x1={cx-4}  y1={eyeY} x2={cx+4}  y2={eyeY} stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
        <line x1={cx-20} y1={eyeY} x2={cx-16} y2={eyeY} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
        <line x1={cx+20} y1={eyeY} x2={cx+16} y2={eyeY} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      </>
    )
    case 'sunglasses': return (
      <>
        <rect x={cx-18} y={eyeY-5} width="14" height="10" rx="3" fill="#1a1a1a" opacity="0.88"/>
        <rect x={cx+4}  y={eyeY-5} width="14" height="10" rx="3" fill="#1a1a1a" opacity="0.88"/>
        <line x1={cx-4}  y1={eyeY} x2={cx+4}  y2={eyeY} stroke="#333" strokeWidth="2"/>
        <line x1={cx-22} y1={eyeY} x2={cx-18} y2={eyeY+2} stroke="#333" strokeWidth="1.5"/>
        <line x1={cx+22} y1={eyeY} x2={cx+18} y2={eyeY+2} stroke="#333" strokeWidth="1.5"/>
      </>
    )
    case 'headphones': return (
      <>
        {/* Band */}
        <path d={`M${cx-20},${hcy-2} Q${cx-20},${top-8} ${cx},${top-10} Q${cx+20},${top-8} ${cx+20},${hcy-2}`}
          stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* Ear cups */}
        <circle cx={cx-20} cy={hcy-2} r="6" fill="#f4d03f"/>
        <circle cx={cx+20} cy={hcy-2} r="6" fill="#f4d03f"/>
        <circle cx={cx-20} cy={hcy-2} r="3.5" fill="#1a1a1a"/>
        <circle cx={cx+20} cy={hcy-2} r="3.5" fill="#1a1a1a"/>
      </>
    )
    case 'crown': return (
      <>
        <path d={`M${cx-16},${top+2} L${cx-16},${top-8} L${cx-6},${top-2} L${cx},${top-12} L${cx+6},${top-2} L${cx+16},${top-8} L${cx+16},${top+2} Z`}
          fill="#f4d03f" stroke="#c9a227" strokeWidth="1.5"/>
        <circle cx={cx-8} cy={top-6} r="2" fill="#e63946"/>
        <circle cx={cx}   cy={top-9} r="2.5" fill="#e63946"/>
        <circle cx={cx+8} cy={top-6} r="2" fill="#e63946"/>
      </>
    )
    case 'monocle': return (
      <>
        <circle cx={cx+10} cy={eyeY} r="6.5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
        <line x1={cx+16} y1={eyeY+4} x2={cx+20} y2={eyeY+14} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      </>
    )
    case 'bowtie': return (
      <>
        {/* Bowtie below head */}
        <polygon points={`${cx-12},${hcy+23} ${cx},${hcy+27} ${cx-12},${hcy+31}`} fill="#e63946"/>
        <polygon points={`${cx+12},${hcy+23} ${cx},${hcy+27} ${cx+12},${hcy+31}`} fill="#e63946"/>
        <circle cx={cx} cy={hcy+27} r="3" fill="#c42a2a"/>
      </>
    )
    case 'earrings': return (
      <>
        <circle cx={cx-22} cy={hcy+4} r="3.5" fill="#f4d03f"/>
        <circle cx={cx+22} cy={hcy+4} r="3.5" fill="#f4d03f"/>
        <line x1={cx-22} y1={hcy} x2={cx-22} y2={hcy+3} stroke="#f4d03f" strokeWidth="1.5"/>
        <line x1={cx+22} y1={hcy} x2={cx+22} y2={hcy+3} stroke="#f4d03f" strokeWidth="1.5"/>
      </>
    )
    case 'scarf': return (
      <>
        <path d={`M${cx-18},${hcy+22} Q${cx-10},${hcy+18} ${cx+10},${hcy+22} Q${cx+16},${hcy+26} ${cx+18},${hcy+24}`}
          fill="#e63946" stroke="#c42a2a" strokeWidth="1"/>
        <rect x={cx-15} y={hcy+20} width="30" height="10" rx="5" fill="#e63946"/>
        <rect x={cx-22} y={hcy+23} width="10" height="8" rx="4" fill="#c42a2a"/>
      </>
    )
    case 'plaster': return (
      <>
        <rect x={cx+4} y={hcy-14} width="16" height="8" rx="3" fill="#f5c6a0" transform={`rotate(-15 ${cx+4} ${hcy-14})`}/>
        <rect x={cx+7} y={hcy-13} width="7" height="6" rx="1" fill="rgba(255,255,255,0.4)" transform={`rotate(-15 ${cx+7} ${hcy-13})`}/>
      </>
    )
    case 'halo': return (
      <>
        <ellipse cx={cx} cy={top-8} rx="14" ry="4" fill="none" stroke="#f4d03f" strokeWidth="3" opacity="0.9"/>
        <line x1={cx} y1={top-8} x2={cx} y2={top-3} stroke="rgba(244,208,63,0.5)" strokeWidth="2"/>
      </>
    )
    case 'horns': return (
      <>
        <polygon points={`${cx-14},${top+2} ${cx-10},${top-14} ${cx-4},${top+2}`} fill="#e63946"/>
        <polygon points={`${cx+14},${top+2} ${cx+10},${top-14} ${cx+4},${top+2}`} fill="#e63946"/>
      </>
    )
    default: return null
  }
}

// ── head clip shape per body type (for photo overlay) ────────────────────────
// Comically oversized so the face photo is a huge bobblehead on a tiny body.
// All coords in the 0-100×140 coordinate space.
const HEAD_CLIP = {
  human:  { shape: 'circle',  cx: 50, cy: 27, r: 37 },
  chonk:  { shape: 'circle',  cx: 50, cy: 27, r: 39 },
  cat:    { shape: 'circle',  cx: 50, cy: 27, r: 35 },
  dog:    { shape: 'circle',  cx: 50, cy: 27, r: 35 },
  alien:  { shape: 'ellipse', cx: 50, cy: 23, rx: 38, ry: 38 },
  robot:  { shape: 'rect',    x: 13, y: 1,   w: 74, h: 64, rx: 10 },
  bean:   { shape: 'ellipse', cx: 50, cy: 47, rx: 28, ry: 30 },
  ghost:  { shape: 'circle',  cx: 50, cy: 42, r: 32 },
}

// Returns defs + image elements for overlaying a photo on the head.
// Rendered BEFORE hair so hair/accessories sit naturally on top (bobblehead effect).
// A soft radial gradient mask fades the photo edges so it blends into the body color
// rather than having a hard clip line — approximates background removal visually.
function renderHeadPhoto(photoSrc, bt, clipId) {
  if (!photoSrc) return null
  const hc = HEAD_CLIP[bt] || HEAD_CLIP.human
  const gradId = `${clipId}g`
  const maskId = `${clipId}m`

  let clipShape
  let ix, iy, iw, ih

  if (hc.shape === 'circle') {
    clipShape = <circle cx={hc.cx} cy={hc.cy} r={hc.r}/>
    ix = hc.cx - hc.r; iy = hc.cy - hc.r; iw = hc.r * 2; ih = hc.r * 2
  } else if (hc.shape === 'ellipse') {
    clipShape = <ellipse cx={hc.cx} cy={hc.cy} rx={hc.rx} ry={hc.ry}/>
    ix = hc.cx - hc.rx; iy = hc.cy - hc.ry; iw = hc.rx * 2; ih = hc.ry * 2
  } else {
    clipShape = <rect x={hc.x} y={hc.y} width={hc.w} height={hc.h} rx={hc.rx || 0}/>
    ix = hc.x; iy = hc.y; iw = hc.w; ih = hc.h
  }

  return (
    <>
      <defs>
        {/* Hard clip — keeps the image within the head silhouette */}
        <clipPath id={clipId}>{clipShape}</clipPath>
        {/* Radial gradient that fades out at the edge — softens the background */}
        <radialGradient id={gradId} cx="50%" cy="42%" r="50%" gradientUnits="objectBoundingBox">
          <stop offset="50%" stopColor="white" stopOpacity="1"/>
          <stop offset="80%" stopColor="white" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        {/* Mask built from the gradient — applied on top of the clip */}
        <mask id={maskId}>
          <rect x={ix} y={iy} width={iw} height={ih} fill={`url(#${gradId})`}/>
        </mask>
      </defs>
      <image
        href={photoSrc}
        x={ix} y={iy} width={iw} height={ih}
        clipPath={`url(#${clipId})`}
        mask={`url(#${maskId})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </>
  )
}

// ── color utility ─────────────────────────────────────────────────────────────

function darken(hex, amount) {
  try {
    const n = parseInt(hex.replace('#',''), 16)
    const r = Math.max(0, Math.min(255, (n>>16) - amount))
    const g = Math.max(0, Math.min(255, ((n>>8)&0xff) - amount))
    const b = Math.max(0, Math.min(255, (n&0xff) - amount))
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  } catch { return hex }
}

// ── main component ────────────────────────────────────────────────────────────

/**
 * AvatarSvg
 *
 * Extra props:
 *  photoSrc — if provided, the player's profile photo is clipped to the head
 *             shape and rendered on top of the drawn face (replaces the SVG face
 *             with the real photo while keeping hair + accessories + body intact)
 */
export default function AvatarSvg({ config, size = 80, showFull = false, photoSrc, className, style }) {
  const uid = useId().replace(/:/g, '') // safe for SVG id attribute
  const c = { ...DEFAULT_AVATAR_CONFIG, ...(config || {}) }
  const bt = c.bodyType || 'human'

  // viewBox: full body vs head crop
  const vb = showFull ? '0 0 100 140' : '14 4 72 72'

  const fc = FACE[bt] || FACE.human
  const faceX = fc.cx
  const faceY = fc.cy

  const svgProps = showFull
    ? { viewBox: vb, width: size * 100 / 140, height: size }
    : { viewBox: vb, width: size, height: size }

  return (
    <svg
      {...svgProps}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', ...style }}
      aria-hidden="true"
    >
      {/* ── Body base (skin / main color) ─────────────────────────────────── */}
      {renderBodyBase(bt, c.bodyColor)}

      {/* ── Clothes ───────────────────────────────────────────────────────── */}
      {renderClothes(bt, c.topStyle, c.topColor, c.bottomStyle, c.bottomColor)}

      {/* ── Face — only rendered when there is no photo overlay ───────────── */}
      {!photoSrc && bt !== 'robot' && (
        <>
          {renderEyebrows(c.eyebrowStyle, faceX, faceY)}
          {renderEyes(c.eyeStyle, faceX, faceY)}
          {renderMouth(c.mouthStyle, faceX, faceY)}
        </>
      )}
      {!photoSrc && bt === 'robot' && (
        <>
          {renderEyes(c.eyeStyle, faceX, faceY)}
          {renderMouth(c.mouthStyle, faceX, faceY + 2)}
        </>
      )}

      {/* ── Hair ─────────────────────────────────────────────────────────── */}
      {renderHair(c.hairStyle, c.hairColor, bt)}

      {/* ── Accessories ──────────────────────────────────────────────────── */}
      {renderAccessory(c.accessory, bt, faceX, faceY)}

      {/* ── Photo overlay — on top of everything for a full-face bobblehead ─ */}
      {photoSrc && renderHeadPhoto(photoSrc, bt, `hc-${uid}`)}
    </svg>
  )
}
