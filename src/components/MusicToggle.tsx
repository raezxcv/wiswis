import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

type MusicStatus = 'playing' | 'paused' | 'blocked' | 'missing'

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const userPausedRef = useRef(false)
  const [status, setStatus] = useState<MusicStatus>('paused')

  const playMusic = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      userPausedRef.current = false
      audio.volume = 0.35
      audio.muted = false
      await audio.play()
      setStatus('playing')
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      setStatus(name === 'NotAllowedError' ? 'blocked' : 'missing')
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
      return Boolean(audio && audio.paused && !userPausedRef.current)
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

    function retryWhenVisible() {
      if (document.visibilityState === 'visible' && shouldRetryPlayback()) {
        void tryAutoplay()
      }
    }

    void tryAutoplay()
    document.addEventListener('visibilitychange', retryWhenVisible)

    return () => {
      isDisposed = true
      removeInteractionListeners()
      document.removeEventListener('visibilitychange', retryWhenVisible)
    }
  }, [playMusic])

  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (status === 'playing') {
      userPausedRef.current = true
      audio.pause()
      setStatus('paused')
      return
    }

    await playMusic()
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
