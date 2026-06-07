import { useRef, useCallback, useEffect } from 'react'
import { useStore } from '../store'

let audioCtx = null
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

// ─── synth helpers ────────────────────────────────────────────────────────────
function playTone(freq, type, duration, volume = 0.4, startTime = 0, ctx = null) {
  const ac = ctx || getCtx()
  const t = ac.currentTime + startTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain); gain.connect(ac.destination)
  osc.type = type; osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.start(t); osc.stop(t + duration + 0.01)
}

function playChord(freqs, type, duration, volume = 0.25) {
  freqs.forEach(f => playTone(f, type, duration, volume))
}

// ─── player colour sounds ─────────────────────────────────────────────────────
const COLOR_SOUNDS = {
  red:    () => { playTone(220, 'sawtooth', 0.1, 0.3); playTone(165, 'sawtooth', 0.15, 0.25, 0.08) },
  blue:   () => { playTone(523, 'sine', 0.15, 0.3); playTone(440, 'sine', 0.1, 0.2, 0.1) },
  green:  () => { playChord([523, 659, 784], 'triangle', 0.15, 0.2) },
  purple: () => { playTone(440, 'square', 0.2, 0.15); playTone(466, 'square', 0.2, 0.15, 0.05) },
  orange: () => { [0,0.05,0.1].forEach(d => playTone(880, 'sawtooth', 0.05, 0.3, d)) },
  pink:   () => { [659, 784, 659, 784].forEach((f, i) => playTone(f, 'sine', 0.08, 0.3, i * 0.05)) },
  yellow: () => { [523, 587, 659, 698, 784].forEach((f, i) => playTone(f, 'sine', 0.07, 0.28, i * 0.04)) },
  teal:   () => { playTone(440, 'sawtooth', 0.25, 0.2); playTone(550, 'sawtooth', 0.2, 0.2, 0.05) },
}

// ─── fart sound ───────────────────────────────────────────────────────────────
function playFart() {
  const ac = getCtx()
  const t = ac.currentTime
  const buf = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.15))
  }
  const src = ac.createBufferSource()
  const filter = ac.createBiquadFilter()
  const gain = ac.createGain()
  src.buffer = buf
  filter.type = 'bandpass'; filter.frequency.value = 150; filter.Q.value = 1
  src.connect(filter); filter.connect(gain); gain.connect(ac.destination)
  gain.gain.setValueAtTime(0.6, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  src.start(t)
}

// ─── background music engine ──────────────────────────────────────────────────
let bgGain = null
let bgPlaying = false
let bgNodes = []
let bgScheduler = null

function stopBgMusic() {
  bgPlaying = false
  if (bgScheduler) { clearInterval(bgScheduler); bgScheduler = null }
  bgNodes.forEach(n => { try { n.stop() } catch(e) {} })
  bgNodes = []
  if (bgGain) { bgGain.disconnect(); bgGain = null }
}

function startBgMusic(volume = 0.05) {
  if (bgPlaying) return
  const ac = getCtx()
  bgGain = ac.createGain()
  bgGain.gain.value = volume
  bgGain.connect(ac.destination)
  bgPlaying = true

  const bpm = 120
  const beat = 60 / bpm
  const bar = beat * 4

  // Kick, snare, bass, melody
  const KICK_FREQS = [80, 60]
  const BASS_NOTES = [130, 130, 98, 110]
  const MELODY = [523, 587, 659, 784, 659, 587, 523, 440]
  let barIdx = 0

  function scheduleBar(startT) {
    // Kick on 1&3
    ;[0, beat * 2].forEach(offset => {
      const t = startT + offset
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.connect(g); g.connect(bgGain)
      osc.frequency.setValueAtTime(80, t)
      osc.frequency.exponentialRampToValueAtTime(0.001, t + 0.3)
      g.gain.setValueAtTime(0.8, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.start(t); osc.stop(t + 0.35)
      bgNodes.push(osc)
    })
    // Snare on 2&4 (noise burst)
    ;[beat, beat * 3].forEach(offset => {
      const t = startT + offset
      const buf = ac.createBuffer(1, ac.sampleRate * 0.15, ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      const src = ac.createBufferSource()
      const filt = ac.createBiquadFilter()
      const g = ac.createGain()
      src.buffer = buf
      filt.type = 'highpass'; filt.frequency.value = 1500
      src.connect(filt); filt.connect(g); g.connect(bgGain)
      g.gain.setValueAtTime(0.4, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      src.start(t)
      bgNodes.push(src)
    })
    // Hi-hats (8th notes)
    for (let i = 0; i < 8; i++) {
      const t = startT + i * (beat / 2)
      const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate)
      const d = buf.getChannelData(0)
      for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1
      const src = ac.createBufferSource()
      const filt = ac.createBiquadFilter()
      const g = ac.createGain()
      src.buffer = buf
      filt.type = 'highpass'; filt.frequency.value = 8000
      src.connect(filt); filt.connect(g); g.connect(bgGain)
      g.gain.setValueAtTime(0.15, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
      src.start(t)
      bgNodes.push(src)
    }
    // Bass note
    {
      const bassNote = BASS_NOTES[barIdx % BASS_NOTES.length]
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.connect(g); g.connect(bgGain)
      osc.type = 'sawtooth'; osc.frequency.value = bassNote
      g.gain.setValueAtTime(0.3, startT)
      g.gain.setValueAtTime(0.3, startT + bar - 0.05)
      g.gain.exponentialRampToValueAtTime(0.001, startT + bar)
      osc.start(startT); osc.stop(startT + bar + 0.01)
      bgNodes.push(osc)
    }
    // Melody (every 2 bars)
    if (barIdx % 2 === 0) {
      MELODY.forEach((freq, i) => {
        const t = startT + i * (beat / 2)
        const osc = ac.createOscillator()
        const g = ac.createGain()
        osc.connect(g); g.connect(bgGain)
        osc.type = 'triangle'; osc.frequency.value = freq
        g.gain.setValueAtTime(0.12, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + beat / 2)
        osc.start(t); osc.stop(t + beat / 2 + 0.01)
        bgNodes.push(osc)
      })
    }
    barIdx++
  }

  // Schedule 2 bars ahead using interval
  let nextBarTime = ac.currentTime
  scheduleBar(nextBarTime); nextBarTime += bar
  scheduleBar(nextBarTime); nextBarTime += bar

  bgScheduler = setInterval(() => {
    if (!bgPlaying) return
    if (nextBarTime < ac.currentTime + bar * 2) {
      scheduleBar(nextBarTime)
      nextBarTime += bar
    }
  }, 200)
}

function setBgVolume(vol, rampTime = 0.3) {
  if (!bgGain) return
  const ac = getCtx()
  bgGain.gain.cancelScheduledValues(ac.currentTime)
  bgGain.gain.setValueAtTime(bgGain.gain.value, ac.currentTime)
  bgGain.gain.linearRampToValueAtTime(Math.max(0.001, vol), ac.currentTime + rampTime)
}

// ─── exported hook ────────────────────────────────────────────────────────────
export function useSound() {
  const muted      = useStore(s => s.muted)
  const sfxVol     = useStore(s => s.sfxVolume)
  const musicVol   = useStore(s => s.musicVolume)
  const sfxOn      = useStore(s => s.sfxEnabled)
  const musicOn    = useStore(s => s.musicEnabled)

  // SFX volume helper — applies user volume + mute + sfx toggle
  const vol = useCallback((v) => (muted || !sfxOn) ? 0 : v * sfxVol, [muted, sfxOn, sfxVol])

  // Music base volume (scaled down so 1.0 = comfortable background level)
  const baseMusicVol = () => (muted || !musicOn) ? 0 : musicVol * 0.08

  const playCorrect = useCallback(() => {
    if (muted || !sfxOn) return
    ;[0, 0.1, 0.2].forEach((d, i) => playTone([523, 659, 784][i], 'triangle', 0.15, 0.3 * sfxVol, d))
  }, [muted, sfxOn, sfxVol])

  const playWrong = useCallback(() => {
    if (muted || !sfxOn) return
    ;[0, 0.12, 0.24].forEach((d, i) => playTone([220, 196, 174][i], 'sawtooth', 0.1, 0.3 * sfxVol, d))
  }, [muted, sfxOn, sfxVol])

  const playBuzz = useCallback((colorId = 'blue') => {
    if (muted || !sfxOn) return
    const fn = COLOR_SOUNDS[colorId] || COLOR_SOUNDS.blue
    fn()
  }, [muted, sfxOn])

  const playFartSound = useCallback(() => {
    if (muted || !sfxOn) return
    playFart()
  }, [muted, sfxOn])

  const playTick = useCallback((urgent = false) => {
    if (muted || !sfxOn) return
    playTone(urgent ? 1200 : 800, 'square', 0.03, (urgent ? 0.15 : 0.05) * sfxVol)
  }, [muted, sfxOn, sfxVol])

  const playSecondLife = useCallback(() => {
    if (muted || !sfxOn) return
    ;[0, 0.06, 0.12, 0.18, 0.24].forEach((d, i) =>
      playTone([523, 659, 784, 880, 1047][i], 'sine', 0.12, 0.2 * sfxVol, d))
  }, [muted, sfxOn, sfxVol])

  const playPowerupActivate = useCallback(() => {
    if (muted || !sfxOn) return
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.4)
    gain.gain.setValueAtTime(0.3 * sfxVol, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4)
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.45)
    setTimeout(() => playChord([523, 659, 784, 1047], 'triangle', 0.3, 0.15 * sfxVol), 420)
  }, [muted, sfxOn, sfxVol])

  const playPowerupDeactivate = useCallback(() => {
    if (muted || !sfxOn) return
    ;[0, 0.07, 0.14].forEach((d, i) => playTone([523, 440, 392][i], 'sine', 0.08, 0.2 * sfxVol, d))
  }, [muted, sfxOn, sfxVol])

  const playRoundOver = useCallback(() => {
    if (muted || !sfxOn) return
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => playTone(f, 'sawtooth', 0.25, 0.3 * sfxVol, i * 0.12))
  }, [muted, sfxOn, sfxVol])

  const playSkip = useCallback(() => {
    if (muted || !sfxOn) return
    ;[0, 0.07, 0.14].forEach((d, i) => playTone([440, 392, 330][i], 'square', 0.06, 0.2 * sfxVol, d))
  }, [muted, sfxOn, sfxVol])

  const playVictory = useCallback(() => {
    if (muted || !sfxOn) return
    const melody = [523, 523, 523, 415, 523, 0, 784, 0, 740, 698, 659, 622, 659]
    melody.forEach((f, i) => {
      if (f > 0) playTone(f, 'sawtooth', 0.2, 0.3 * sfxVol, i * 0.15)
    })
  }, [muted, sfxOn, sfxVol])

  const startMusic = useCallback(() => {
    const v = baseMusicVol()
    if (v <= 0) return
    startBgMusic(v)
  }, [muted, musicOn, musicVol])

  const stopMusic = useCallback(() => {
    stopBgMusic()
  }, [])

  const dimMusic = useCallback(() => {
    setBgVolume(baseMusicVol() * 0.25, 0.1)
  }, [muted, musicOn, musicVol])

  const undimMusic = useCallback(() => {
    setBgVolume(baseMusicVol(), 0.3)
  }, [muted, musicOn, musicVol])

  const setMusicVolume = useCallback((v) => {
    setBgVolume((muted || !musicOn) ? 0 : v * 0.08)
  }, [muted, musicOn])

  // React to mute / music toggle / volume changes
  useEffect(() => {
    if (!bgPlaying) return
    setBgVolume(baseMusicVol(), 0.2)
  }, [muted, musicOn, musicVol])

  return {
    playCorrect, playWrong, playBuzz, playFartSound, playTick,
    playSecondLife, playPowerupActivate, playPowerupDeactivate,
    playRoundOver, playSkip, playVictory, startMusic, stopMusic, dimMusic, undimMusic, setMusicVolume,
    vol,
  }
}
