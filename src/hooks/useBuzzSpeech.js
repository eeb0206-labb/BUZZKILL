import { useCallback, useRef, useState, useEffect } from 'react'
import { useStore } from '../store'
import { getBuzzAudioUrl } from '../data/buzzAudio'
import GENRE_VOICES from '../data/genre-voices.json'
import { generateContextualLine } from '../data/contextualLines'

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

// Shared ElevenLabs fetch — uses /stream endpoint with latency optimisation.
// optimize_streaming_latency=3 reduces server-side generation time by ~300–500ms
// at a very minor quality cost. Level 4 halves some phoneme processing but can
// cause occasional artefacts; 3 is the sweet spot for game use.
async function _tts(apiKey, voiceId, text, _playUrl) {
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3`,
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
          voice_settings: { stability: 0.30, similarity_boost: 0.90, style: 0.75, use_speaker_boost: true },
        }),
      }
    )
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    _playUrl(url, true)
  } catch {
    // Silent — caption always shows
  }
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
  /**
   * speak(text, event, genreId, gameContext)
   *
   * 80% of the time: plays a pre-recorded clip from the matching folder.
   *         If no clip exists, falls through to TTS with `text`.
   * 20% of the time: skips the clip intentionally and calls ElevenLabs TTS
   *         with a contextual line generated from `gameContext` (player names,
   *         scores, recent events). Falls back to a clip if TTS unavailable.
   *
   * This means audio plays 100% of the time (clip or TTS), and the game
   * feels personal 20% of the time.
   */
  const speak = useCallback(async (text, event = 'idle', genreId = null, gameContext = null) => {
    if (!text?.trim() && !gameContext) return
    stop()

    const settings = store.getSettings()
    const apiKey = settings.elevenLabsApiKey?.trim() || import.meta.env.VITE_ELEVENLABS_API_KEY
    const voiceId = (genreId && GENRE_VOICES[genreId]) || settings.buzzVoiceId?.trim() || import.meta.env.VITE_BUZZ_VOICE_ID
    const canTTS = !!(apiKey && voiceId)

    // Dice roll: 20% chance of contextual TTS (only if TTS is available)
    const goContextual = canTTS && Math.random() < 0.20

    // ── 80% path: pre-recorded clip ──────────────────────────────────────────
    if (!goContextual) {
      const clipUrl = getBuzzAudioUrl(event, genreId)
      if (clipUrl) { _playUrl(clipUrl); return }
      // No clip recorded yet — fall through to TTS with the passed text
      if (!canTTS || !text?.trim()) return
      // TTS with the standard quip text (not contextual)
      await _tts(apiKey, voiceId, text, _playUrl)
      return
    }

    // ── 20% path: contextual TTS ─────────────────────────────────────────────
    const ttsText = gameContext
      ? (generateContextualLine(event, genreId, gameContext) || text)
      : text
    if (!ttsText?.trim()) {
      // Generation failed — fall back to a clip
      const clipUrl = getBuzzAudioUrl(event, genreId)
      if (clipUrl) { _playUrl(clipUrl) }
      return
    }
    await _tts(apiKey, voiceId, ttsText, _playUrl)
  }, [stop, _playUrl])

  /**
   * speakWithChance(text, event, genreId, probability, gameContext)
   * Only calls speak() if Math.random() < probability.
   * Returns true if speech was triggered, false if skipped.
   */
  const speakWithChance = useCallback((text, event = 'idle', genreId = null, probability = 1.0, gameContext = null) => {
    if (Math.random() >= probability) return false
    speak(text, event, genreId, gameContext)
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
