import { useCallback, useRef } from 'react'
import { useStore } from '../store'
import { getBuzzAudioUrl } from '../data/buzzAudio'

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
  }, [])

  const _playUrl = useCallback((url, isObjectUrl = false) => {
    const audio = new Audio(url)
    audioRef.current = audio
    audio.volume = store.sfxEnabled ? store.sfxVolume : 0

    if (isObjectUrl) {
      objectUrlRef.current = url
      audio.addEventListener('ended', () => {
        if (objectUrlRef.current === url) {
          URL.revokeObjectURL(url)
          objectUrlRef.current = null
        }
        if (audioRef.current === audio) audioRef.current = null
      }, { once: true })
    } else {
      audio.addEventListener('ended', () => {
        if (audioRef.current === audio) audioRef.current = null
      }, { once: true })
    }

    audio.play().catch(() => {})
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

  return { speak, stop }
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
