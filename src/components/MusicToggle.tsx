import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

type MusicStatus = 'playing' | 'paused' | 'blocked' | 'missing'

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [status, setStatus] = useState<MusicStatus>('paused')

  const playMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      audio.volume = 0.35
      await audio.play()
      setStatus('playing')
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      setStatus(name === 'NotAllowedError' ? 'blocked' : 'missing')
    }
  }

  useEffect(() => {
    const startOnInteraction = () => {
      void playMusic()
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('keydown', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }

    // Try immediate autoplay first (works if browser allows it)
    void playMusic().catch(() => {
      // If blocked, fall back to first-interaction trigger
      document.addEventListener('click', startOnInteraction)
      document.addEventListener('keydown', startOnInteraction)
      document.addEventListener('touchstart', startOnInteraction)
    })

    return () => {
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('keydown', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }
  }, [])

  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (status === 'playing') {
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
      <audio ref={audioRef} src="/music/pixel-birthday.mp3" loop preload="auto" autoPlay />
      <button className="music-icon-button" type="button" onClick={toggleMusic} aria-label={label} title={title}>
        {isPlaying ? <Volume2 size={22} strokeWidth={3} /> : <VolumeX size={22} strokeWidth={3} />}
      </button>
    </div>
  )
}
