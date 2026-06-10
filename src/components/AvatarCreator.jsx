/**
 * AvatarCreator — tabbed avatar customisation panel.
 * Renders a live preview + 5 tabs (Body, Face, Hair, Clothes, Extras).
 *
 * Props:
 *  config     — current avatarConfig object
 *  onChange   — (newConfig) => void  — called on every change
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AvatarSvg from './AvatarSvg'
import { CameraCapture } from './ui'
import {
  DEFAULT_AVATAR_CONFIG, randomAvatarConfig,
  BODY_TYPES, BODY_COLORS, EYE_STYLES, MOUTH_STYLES, EYEBROW_STYLES,
  HAIR_STYLES, HAIR_COLORS, TOP_STYLES, TOP_COLORS, BOTTOM_STYLES, BOTTOM_COLORS,
  ACCESSORIES,
} from '../data/avatarParts'

const TABS = [
  { id: 'body',    icon: '🧑', label: 'Body'    },
  { id: 'face',    icon: '😊', label: 'Face'    },
  { id: 'hair',    icon: '💇', label: 'Hair'    },
  { id: 'clothes', icon: '👕', label: 'Clothes' },
  { id: 'extras',  icon: '✨', label: 'Extras'  },
]

// ── sub-components ────────────────────────────────────────────────────────────

function OptionGrid({ options, selected, onSelect, size = 60 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const isSelected = selected === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            style={{
              width: size, height: size,
              borderRadius: 10,
              border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
              background: isSelected ? 'rgba(72,149,239,0.15)' : 'var(--surface)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              transition: 'all 0.12s',
              boxShadow: isSelected ? '0 0 0 2px var(--accent)' : 'none',
              padding: 4,
            }}
          >
            {opt.emoji && <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{opt.emoji}</span>}
            <span style={{ fontSize: '0.6rem', color: isSelected ? 'var(--accent)' : 'var(--text2)', fontWeight: isSelected ? 700 : 400, lineHeight: 1, textAlign: 'center' }}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ColorPalette({ colors, selected, onSelect, onCustom, label }) {
  return (
    <div>
      {label && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {colors.map(col => {
          const isSelected = selected === col.hex
          return (
            <button
              key={col.id}
              title={col.label}
              onClick={() => onSelect(col.hex)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: col.hex,
                border: isSelected ? '3px solid var(--accent)' : '2px solid var(--border)',
                cursor: 'pointer', padding: 0,
                boxShadow: isSelected ? '0 0 0 2px var(--bg)' : 'none',
                outline: 'none',
                transition: 'transform 0.1s',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          )
        })}
        {onCustom && (
          <label title="Custom color" style={{ cursor: 'pointer', position: 'relative' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
              border: '2px solid var(--border)', cursor: 'pointer',
            }}/>
            <input
              type="color"
              value={selected || '#ffffff'}
              onChange={e => onSelect(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
          </label>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 4,
    }}>
      {children}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function AvatarCreator({ config, onChange, photoSrc, onPhotoChange }) {
  const [tab, setTab] = useState('body')
  const [showCapture, setShowCapture] = useState(false)
  const c = { ...DEFAULT_AVATAR_CONFIG, ...(config || {}) }

  function update(key, value) {
    onChange({ ...c, [key]: value })
  }

  function handleRandom() {
    onChange(randomAvatarConfig())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, margin: '0 auto' }}>

      {/* ── Live preview ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 20 }}>
        <div style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(72,149,239,0.12) 0%, transparent 70%), var(--surface)',
          borderRadius: 20, border: '1px solid var(--border)',
          padding: '24px 32px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          minWidth: 130,
        }}>
          <AvatarSvg config={c} size={120} showFull photoSrc={photoSrc || null} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleRandom}
            style={{
              padding: '10px 16px', borderRadius: 12,
              border: '1.5px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text2)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🎲 Random
          </button>
          {/* Mini preview (circular) */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            overflow: 'hidden', border: '2px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AvatarSvg config={c} size={56} showFull={false} photoSrc={photoSrc || null}/>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text3)', textAlign: 'center' }}>As shown<br/>in lobby</div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 4px',
              border: 'none', borderRadius: 0,
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text2)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'background 0.15s',
              borderRight: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >

          {/* ── BODY ────────────────────────────────────────────────────── */}
          {tab === 'body' && (
            <>
              <div>
                <SectionLabel>Body Type</SectionLabel>
                <OptionGrid
                  options={BODY_TYPES}
                  selected={c.bodyType}
                  onSelect={v => update('bodyType', v)}
                  size={62}
                />
              </div>
              <ColorPalette
                label="Skin / Body Colour"
                colors={BODY_COLORS}
                selected={c.bodyColor}
                onSelect={v => update('bodyColor', v)}
                onCustom
              />
            </>
          )}

          {/* ── FACE ────────────────────────────────────────────────────── */}
          {tab === 'face' && (
            <>
              {/* ── Your Face Photo ─────────────────────────────────────── */}
              <div>
                <SectionLabel>📷 Your Face</SectionLabel>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 10 }}>
                  Add a selfie — it appears as a comically large bobblehead on your avatar.
                </div>

                {/* Has photo */}
                {photoSrc && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                      src={photoSrc}
                      alt="Your face"
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                        border: '3px solid var(--accent)', flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowCapture(true)}
                      >📷 Change photo</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red)' }}
                        onClick={() => { onPhotoChange?.(null) }}
                      >✕ Remove</button>
                    </div>
                  </div>
                )}

                {/* No photo — big camera button */}
                {!photoSrc && (
                  <motion.button
                    className="btn btn-primary"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowCapture(true)}
                    style={{ width: '100%', padding: '14px 20px', fontSize: '1rem', gap: 10 }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>📷</span> Take a Selfie
                  </motion.button>
                )}

                {/* Full-screen camera overlay */}
                {showCapture && (
                  <CameraCapture
                    onCapture={photo => {
                      onPhotoChange?.(photo)
                      setShowCapture(false)
                    }}
                    onSkip={() => setShowCapture(false)}
                  />
                )}
              </div>

              {photoSrc ? (
                /* When a photo is set — encourage using the other tabs */
                <div style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(72,149,239,0.07)', border: '1.5px solid rgba(72,149,239,0.2)',
                  fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.55,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>✨ Looking good!</div>
                  Your photo is the face layer — hair, accessories, clothes and body type all still apply on top.
                  Head to the other tabs to style the rest of your avatar!
                </div>
              ) : (
                /* No photo — show the cartoon face options */
                <>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 10 }}>
                      Or customise the cartoon face below
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Eyes</SectionLabel>
                    <OptionGrid
                      options={EYE_STYLES}
                      selected={c.eyeStyle}
                      onSelect={v => update('eyeStyle', v)}
                      size={62}
                    />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <SectionLabel>Mouth</SectionLabel>
                    <OptionGrid
                      options={MOUTH_STYLES}
                      selected={c.mouthStyle}
                      onSelect={v => update('mouthStyle', v)}
                      size={62}
                    />
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <SectionLabel>Eyebrows</SectionLabel>
                    <OptionGrid
                      options={EYEBROW_STYLES}
                      selected={c.eyebrowStyle}
                      onSelect={v => update('eyebrowStyle', v)}
                      size={62}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* ── HAIR ────────────────────────────────────────────────────── */}
          {tab === 'hair' && (
            <>
              <div>
                <SectionLabel>Hair Style</SectionLabel>
                <OptionGrid
                  options={HAIR_STYLES}
                  selected={c.hairStyle}
                  onSelect={v => update('hairStyle', v)}
                  size={62}
                />
              </div>
              {c.hairStyle !== 'none' && c.hairStyle !== 'beanie' && c.hairStyle !== 'cap' && (
                <ColorPalette
                  label="Hair Colour"
                  colors={HAIR_COLORS}
                  selected={c.hairColor}
                  onSelect={v => update('hairColor', v)}
                  onCustom
                />
              )}
              {(c.hairStyle === 'beanie' || c.hairStyle === 'cap') && (
                <ColorPalette
                  label="Hat Colour"
                  colors={[...TOP_COLORS, ...HAIR_COLORS]}
                  selected={c.hairColor}
                  onSelect={v => update('hairColor', v)}
                  onCustom
                />
              )}
            </>
          )}

          {/* ── CLOTHES ─────────────────────────────────────────────────── */}
          {tab === 'clothes' && (
            <>
              <div>
                <SectionLabel>Top</SectionLabel>
                <OptionGrid
                  options={TOP_STYLES}
                  selected={c.topStyle}
                  onSelect={v => update('topStyle', v)}
                  size={62}
                />
              </div>
              {c.topStyle !== 'none' && (
                <ColorPalette
                  label="Top Colour"
                  colors={TOP_COLORS}
                  selected={c.topColor}
                  onSelect={v => update('topColor', v)}
                  onCustom
                />
              )}
              <div>
                <SectionLabel>Bottom</SectionLabel>
                <OptionGrid
                  options={BOTTOM_STYLES}
                  selected={c.bottomStyle}
                  onSelect={v => update('bottomStyle', v)}
                  size={62}
                />
              </div>
              {c.bottomStyle !== 'none' && (
                <ColorPalette
                  label="Bottom Colour"
                  colors={BOTTOM_COLORS}
                  selected={c.bottomColor}
                  onSelect={v => update('bottomColor', v)}
                  onCustom
                />
              )}
            </>
          )}

          {/* ── EXTRAS / ACCESSORIES ────────────────────────────────────── */}
          {tab === 'extras' && (
            <div>
              <SectionLabel>Accessories</SectionLabel>
              <OptionGrid
                options={ACCESSORIES}
                selected={c.accessory}
                onSelect={v => update('accessory', v)}
                size={62}
              />
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
