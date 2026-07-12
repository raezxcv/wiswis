import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * Music always plays (muted autoplay is universally supported).
 * - On first load: audio starts muted, then unmutes automatically when the
 *   browser allows it and the tab is visible.
 * - Tab hidden / window blur: mutes the audio (does NOT pause it) so it
 *   resumes the instant the user switches back — no interaction needed.
 * - User can toggle mute on/off manually; their preference is remembered.
 */
export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // true = user explicitly muted via the button
  const userMutedRef = useRef(false)
  const [isMuted, setIsMuted] = useState(true)

  // ── Core helpers ────────────────────────────────────────────────
  const ensurePlaying = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    // Always try to play — muted autoplay works in every browser
    if (audio.paused) {
      void audio.play().catch(() => undefined)
    }
  }, [])

  const applyMute = useCallback((muted: boolean) => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = muted
    setIsMuted(muted)
  }, [])

  // ── On mount: try unmuted first, mute only if browser blocks it ─
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.35
    audio.muted = false  // try unmuted — works if browser allows autoplay

    const tryPlay = async () => {
      try {
        await audio.play()
        // Unmuted autoplay succeeded — music is on during loading!
        setIsMuted(false)
      } catch {
        // Browser blocked unmuted autoplay — fall back to muted
        audio.muted = true
        setIsMuted(true)
        try {
          await audio.play()  // muted autoplay always succeeds
        } catch {
          // nothing more we can do
        }

        // Unmute on first interaction
        const onInteraction = () => {
          if (!userMutedRef.current) applyMute(false)
          cleanup()
        }
        const cleanup = () => {
          document.removeEventListener('pointerdown', onInteraction)
          document.removeEventListener('keydown', onInteraction)
        }
        document.addEventListener('pointerdown', onInteraction)
        document.addEventListener('keydown', onInteraction)
      }
    }

    void tryPlay()
  }, [applyMute])

  // ── Visibility / focus handling — mute not pause ─────────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Mute when tab is hidden but keep audio running
        applyMute(true)
      } else {
        // Restore based on user's choice when tab comes back
        ensurePlaying()
        if (!userMutedRef.current) applyMute(false)
      }
    }

    const onBlur = () => {
      // Mute when window loses focus (e.g. alt-tab to another app)
      applyMute(true)
    }

    const onFocus = () => {
      ensurePlaying()
      if (!userMutedRef.current) applyMute(false)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [applyMute, ensurePlaying])

  // ── User toggle ──────────────────────────────────────────────────
  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    const nextMuted = !audio.muted
    userMutedRef.current = nextMuted
    applyMute(nextMuted)
    ensurePlaying()
  }

  const label = isMuted ? 'Turn music on' : 'Turn music off'

  return (
    <div className="music-control">
      <audio ref={audioRef} src="./music/pixel-birthday.mp3" loop preload="auto" playsInline />
      <button className="music-icon-button" type="button" onClick={toggleMute} aria-label={label} title={label}>
        {isMuted ? <VolumeX size={22} strokeWidth={3} /> : <Volume2 size={22} strokeWidth={3} />}
      </button>
    </div>
  )
}
