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

  // ── On mount: start muted, then try to unmute ────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Muted autoplay is universally allowed
    audio.muted = true
    audio.volume = 0.35
    void audio.play().catch(() => undefined)
    setIsMuted(true)

    // Attempt to unmute immediately (works if user has interacted before,
    // e.g. refresh after visiting the page)
    const tryUnmute = () => {
      if (!userMutedRef.current && document.visibilityState === 'visible') {
        applyMute(false)
      }
    }

    // Small delay lets the browser settle before we attempt unmute
    const timerId = window.setTimeout(tryUnmute, 300)

    // Also unmute on first user interaction if still muted
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

    return () => {
      window.clearTimeout(timerId)
      cleanup()
    }
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
