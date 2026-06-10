import { useCallback, useRef, useState, useEffect } from 'react'
import { useStore } from '../store'
import { getBuzzAudioUrl } from '../data/buzzAudio'

// Module-level flag — shared across all hook instances on this device.
// Lets useSound suppress SFX when Buzz is already speaking.
let _buzzPlaying = false
const _speakListeners = new Set()

function _setPlaying(val) {
  _buzzPlaying = val
  _speakListeners.forEach(fn => fn(val))
}

export function isBuzzAudioPlaying() { return _buzzPlaying }

/** Reactive hook — returns true while Buzz audio is playing. */
export function useBuzzSpeaking() {
  const [speaking, setSpeaking] = useState(_buzzPlaying)
  useEffect(() => {
    _speakListeners.add(setSpeaking)
    return () => _speakListeners.delete(setSpeaking)
  }, [])
  return speaking
}

/**
 * useBuzzSpeech — plays Buzz's voice.
 *
 * Priority order:
 *   1. Pre-recorded clip from src/assets/audio/buzz/{category}/
 *      (zero latency, no API call — preferred for production)
 *   2. ElevenLabs TTS (if elevenLabsApiKey + buzzVoiceId set in settings)
 *   3. Silent — text caption always shows regardless
 *
 * Interrupts any currently-playing speech before starting new audio.
 * Respects the app's sfxEnabled / sfxVolume.
 */
export function useBuzzSpeech() {
  const store = useStore()
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    _setPlaying(false)
  }, [])

  const _playUrl = useCallback((url, isObjectUrl = false) => {
    const audio = new Audio(url)
    audioRef.current = audio
    audio.volume = store.sfxEnabled ? store.sfxVolume : 0
    _setPlaying(true)

    const onEnd = () => {
      if (audioRef.current === audio) { audioRef.current = null }
      _setPlaying(false)
      if (isObjectUrl && objectUrlRef.current === url) {
        URL.revokeObjectURL(url)
        objectUrlRef.current = null
      }
    }

    if (isObjectUrl) objectUrlRef.current = url
    audio.addEventListener('ended', onEnd, { once: true })
    audio.addEventListener('error', onEnd, { once: true })
    audio.play().catch(() => { _setPlaying(false) })
  }, [])

  /**
   * speak(text, event, genreId)
   *
   * text    — the quip string (used for ElevenLabs TTS fallback)
   * event   — event key (e.g. 'correct', 'genreReveal') — used to pick the right clip folder
   * genreId — genre ID string (for genreReveal events)
   */
  const speak = useCallback(async (text, event = 'idle', genreId = null) => {
    if (!text?.trim()) return
    stop()

    // ── 1. Pre-recorded clip ────────────────────────────────────────────────
    const clipUrl = getBuzzAudioUrl(event, genreId)
    if (clipUrl) {
      _playUrl(clipUrl)
      return
    }

    // ── 2. ElevenLabs TTS fallback ──────────────────────────────────────────
    const settings = store.getSettings()
    const apiKey = settings.elevenLabsApiKey?.trim()
    const voiceId = settings.buzzVoiceId?.trim()
    if (!apiKey || !voiceId) return

    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_flash_v2_5',
            voice_settings: {
              stability: 0.30,
              similarity_boost: 0.90,
              style: 0.75,
              use_speaker_boost: true,
            },
          }),
        }
      )
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      _playUrl(url, true)
    } catch {
      // Silent fallback — caption always shows
    }
  }, [stop, _playUrl])

  /**
   * speakWithChance(text, event, genreId, probability)
   * Only calls speak() if Math.random() < probability.
   * Returns true if speech was triggered, false if skipped.
   */
  const speakWithChance = useCallback((text, event = 'idle', genreId = null, probability = 1.0) => {
    if (Math.random() >= probability) return false
    speak(text, event, genreId)
    return true
  }, [speak])

  return { speak, speakWithChance, stop }
}

/**
 * Returns true when this device should be the one to speak Buzz's lines.
 * TV screen always speaks. If no TV is connected, the controller speaks.
 * Everyone else stays silent — avoids a chorus of Buzz voices.
 */
export function useShouldBuzzSpeak(game) {
  const store = useStore()
  const isTV = store.myRole === 'gamescreen'
  const isController = store.isController()
  const hasTV = !!(game?.screens?.tv)
  return isTV || (!hasTV && isController)
}
