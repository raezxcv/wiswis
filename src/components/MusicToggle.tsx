import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

type MusicStatus = 'playing' | 'paused' | 'blocked' | 'missing'

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const userPausedRef = useRef(false)
  const pausedBySystemRef = useRef(false)
  const idleTimeoutRef = useRef<number | undefined>(undefined)
  const [status, setStatus] = useState<MusicStatus>('paused')

  const playMusic = useCallback(async (userRequested = false) => {
    const audio = audioRef.current
    if (!audio) return

    if (document.visibilityState === 'hidden') {
      pausedBySystemRef.current = true
      setStatus('paused')
      return
    }

    try {
      if (userRequested) userPausedRef.current = false
      pausedBySystemRef.current = false
      audio.volume = 0.35
      audio.muted = false
      await audio.play()
      setStatus('playing')
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      setStatus(name === 'NotAllowedError' ? 'blocked' : 'missing')
    }
  }, [])

  const pauseForSystem = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!audio.paused) {
      audio.pause()
      pausedBySystemRef.current = true
      setStatus('paused')
    }
  }, [])

  useEffect(() => {
    let isDisposed = false

    function removeInteractionListeners() {
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('keydown', startOnInteraction)
      document.removeEventListener('pointerdown', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }

    function addInteractionListeners() {
      document.addEventListener('click', startOnInteraction)
      document.addEventListener('keydown', startOnInteraction)
      document.addEventListener('pointerdown', startOnInteraction)
      document.addEventListener('touchstart', startOnInteraction, { passive: true })
    }

    function shouldRetryPlayback() {
      const audio = audioRef.current
      return Boolean(audio && audio.paused && !userPausedRef.current && document.visibilityState === 'visible')
    }

    function startOnInteraction() {
      if (!shouldRetryPlayback()) {
        removeInteractionListeners()
        return
      }

      void playMusic().then(() => {
        if (!shouldRetryPlayback()) removeInteractionListeners()
      })
    }

    async function tryAutoplay() {
      await playMusic()
      if (!isDisposed && shouldRetryPlayback()) addInteractionListeners()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        pauseForSystem()
        return
      }

      if ((pausedBySystemRef.current || shouldRetryPlayback()) && !userPausedRef.current) {
        void tryAutoplay()
      }
    }

    void tryAutoplay()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', pauseForSystem)

    return () => {
      isDisposed = true
      removeInteractionListeners()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', pauseForSystem)
    }
  }, [pauseForSystem, playMusic])

  useEffect(() => {
    const idleDelay = 45000

    const clearIdleTimer = () => {
      if (idleTimeoutRef.current === undefined) return
      window.clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = undefined
    }

    const resetIdleTimer = () => {
      clearIdleTimer()

      if (document.visibilityState !== 'visible') return

      if (pausedBySystemRef.current && !userPausedRef.current) {
        void playMusic()
      }

      idleTimeoutRef.current = window.setTimeout(pauseForSystem, idleDelay)
    }

    const activityEvents: Array<keyof WindowEventMap> = ['focus', 'pointerdown', 'keydown', 'scroll']
    const touchActivity = () => resetIdleTimer()

    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }))
    window.addEventListener('touchstart', touchActivity, { passive: true })
    resetIdleTimer()

    return () => {
      clearIdleTimer()
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer))
      window.removeEventListener('touchstart', touchActivity)
    }
  }, [pauseForSystem, playMusic])

  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (status === 'playing') {
      userPausedRef.current = true
      pausedBySystemRef.current = false
      audio.pause()
      setStatus('paused')
      return
    }

    await playMusic(true)
  }

  const isPlaying = status === 'playing'
  const label = isPlaying ? 'Turn music off' : 'Turn music on'
  const title =
    status === 'blocked'
      ? 'Tap to start music'
      : status === 'missing'
        ? 'Music file not found'
        : label

  return (
    <div className="music-control">
      <audio ref={audioRef} src="/music/pixel-birthday.mp3" loop preload="auto" autoPlay playsInline />
      <button className="music-icon-button" type="button" onClick={toggleMusic} aria-label={label} title={title}>
        {isPlaying ? <Volume2 size={22} strokeWidth={3} /> : <VolumeX size={22} strokeWidth={3} />}
      </button>
    </div>
  )
}
