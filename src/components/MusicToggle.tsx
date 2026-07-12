import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const controlRef = useRef<HTMLDivElement | null>(null)
  const userMutedRef = useRef(false)
  const [isMuted, setIsMuted] = useState(true)

  const playAudible = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false

    audio.volume = 0.35
    audio.muted = false

    try {
      await audio.play()
      setIsMuted(false)
      return true
    } catch {
      audio.muted = true
      setIsMuted(true)
      return false
    }
  }, [])

  const warmUpMuted = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.35
    audio.muted = true
    setIsMuted(true)

    try {
      await audio.play()
    } catch {
      // A few embedded browsers block even muted media; the next user gesture will retry.
    }
  }, [])

  useEffect(() => {
    controlRef.current?.style.setProperty('z-index', '9100', 'important')
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    void playAudible().then((started) => {
      if (!started && !userMutedRef.current) void warmUpMuted()
    })
  }, [playAudible, warmUpMuted])

  useEffect(() => {
    const unlockAudio = (event: Event) => {
      if (userMutedRef.current) return

      const target = event.target
      if (target instanceof Element && target.closest('.music-icon-button')) return

      void playAudible().then((started) => {
        if (!started) return
        document.removeEventListener('pointerdown', unlockAudio, true)
        document.removeEventListener('keydown', unlockAudio, true)
      })
    }

    document.addEventListener('pointerdown', unlockAudio, true)
    document.addEventListener('keydown', unlockAudio, true)

    return () => {
      document.removeEventListener('pointerdown', unlockAudio, true)
      document.removeEventListener('keydown', unlockAudio, true)
    }
  }, [playAudible])

  useEffect(() => {
    const onHide = () => {
      const audio = audioRef.current
      if (!audio || userMutedRef.current) return
      audio.muted = true
      setIsMuted(true)
    }

    const onShow = () => {
      if (!userMutedRef.current) void playAudible()
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
  }, [playAudible])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      userMutedRef.current = false
      void playAudible()
      return
    }

    userMutedRef.current = true
    audio.muted = true
    setIsMuted(true)
  }

  const label = isMuted ? 'Turn music on' : 'Turn music off'

  return (
    <div ref={controlRef} className="music-control">
      <audio ref={audioRef} src="./music/pixel-birthday.mp3" loop preload="auto" playsInline />
      <button className="music-icon-button" type="button" onClick={toggleMute} aria-label={label} title={label}>
        {isMuted ? <VolumeX size={22} strokeWidth={3} /> : <Volume2 size={22} strokeWidth={3} />}
      </button>
    </div>
  )
}
