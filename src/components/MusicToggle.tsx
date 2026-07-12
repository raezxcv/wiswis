import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * Autoplay strategy that works in every browser:
 *
 * 1. Call play() while muted  →  always allowed, no gesture needed
 * 2. Immediately after play() resolves, set muted = false  →  also allowed
 *    because the element is already "playing"; changing muted doesn't require
 *    a gesture.
 *
 * Result: music is audible from the very first frame, including during the
 * loading screen, without ever needing a user click.
 *
 * Tab hidden / blur  →  mute (not pause) so it resumes instantly.
 * User toggle button →  explicit mute/unmute; preference remembered across
 *                       tab switches.
 */
export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const userMutedRef = useRef(false)   // true = user manually muted
  const [isMuted, setIsMuted] = useState(false)

  const applyMute = useCallback((muted: boolean) => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = muted
    setIsMuted(muted)
  }, [])

  const ensurePlaying = useCallback(() => {
    const audio = audioRef.current
    if (audio?.paused) void audio.play().catch(() => undefined)
  }, [])

  // ── Mount: muted play() → immediate unmute ────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.35
    audio.muted = true  // must start muted so play() is never blocked

    void audio.play().then(() => {
      // play() succeeded → we are now "playing while muted"
      // Setting muted = false here does NOT require a user gesture
      if (!userMutedRef.current) {
        audio.muted = false
        setIsMuted(false)
      }
    }).catch(() => {
      // Extremely rare: even muted autoplay failed (sandboxed iframe, etc.)
      // Just leave it muted and rely on user interaction
      setIsMuted(true)
    })
  }, []) // run once on mount

  // ── Tab / window visibility: mute not pause ───────────────────────
  useEffect(() => {
    const onHide = () => applyMute(true)

    const onShow = () => {
      ensurePlaying()
      if (!userMutedRef.current) applyMute(false)
    }

    const onVisibility = () =>
      document.visibilityState === 'hidden' ? onHide() : onShow()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onHide)
    window.addEventListener('focus', onShow)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onHide)
      window.removeEventListener('focus', onShow)
    }
  }, [applyMute, ensurePlaying])

  // ── User toggle ───────────────────────────────────────────────────
  const toggleMute = () => {
    const nextMuted = !audioRef.current?.muted
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
