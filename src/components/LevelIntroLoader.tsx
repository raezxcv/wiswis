import { useEffect, useState } from 'react'

export function LevelIntroLoader({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0) // 0: connecting, 1: level 6, 2: upgrading/transition, 3: level 7, 4: spawning, 5: exit
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Stage 1: Connecting
    const t1 = setTimeout(() => setStep(1), 700)

    // Progress bar fill during Stage 1/2
    const t2 = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(t2)
          return 100
        }
        return prev + 5
      })
    }, 80)

    // Stage 2: Upgrading level 6
    const t3 = setTimeout(() => setStep(2), 1600)

    // Stage 3: Upgrade to level 7 with a flash
    const t4 = setTimeout(() => {
      setStep(3)
      // Play retro level up trigger sound (classic hit/click/beep sound)
      const hitAudio = new Audio('./music/classic_hurt.mp3')
      hitAudio.volume = 0.35
      void hitAudio.play().catch(() => undefined)
    }, 2400)

    // Stage 4: Spawning players
    const t5 = setTimeout(() => setStep(4), 3100)

    // Stage 5: Exit and collapse loader
    const t6 = setTimeout(() => {
      setStep(5)
      setTimeout(onComplete, 800) // allow collapse animation to complete
    }, 3900)

    return () => {
      clearTimeout(t1)
      clearInterval(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(t6)
    }
  }, [onComplete])

  if (step === 5) {
    // Render nothing or fully faded out
    return (
      <div className="retro-loader-overlay is-exiting" aria-hidden="true">
        <div className="loader-split-top" />
        <div className="loader-split-bottom" />
      </div>
    )
  }

  return (
    <div className={`retro-loader-overlay step-${step}`} aria-live="assertive" role="alert">
      <div className="loader-split-top" />
      <div className="loader-split-bottom" />
      
      <div className="loader-content">
        <div className="loader-grid-bg" />
        
        <div className="loader-card">
          <div className="pixel-border-corner top-left" />
          <div className="pixel-border-corner top-right" />
          <div className="pixel-border-corner bottom-left" />
          <div className="pixel-border-corner bottom-right" />

          <div className="loader-text-status">
            {step === 0 && <span className="blink-text">▶ CONNECTING TO SERVER...</span>}
            {step === 1 && <span className="blink-text">▶ SCANNING SERVER DATA...</span>}
            {step >= 2 && <span className="success-text">▶ INITIATING SPAWN UPGRADE...</span>}
          </div>

          <div className="loader-level-display">
            <div className="level-label">SERVER STAGE</div>
            <div className="level-numbers">
              {step < 3 ? (
                <span className="level-num level-6-num">LVL 6</span>
              ) : (
                <span className="level-num level-7-num animate-pulse-glow">LVL 7</span>
              )}
            </div>
          </div>

          <div className="loader-progress-bar-container">
            <div className="loader-progress-bar" style={{ width: `${progress}%` }} />
            <span className="progress-percentage">{progress}%</span>
          </div>

          <div className="loader-subtext">
            {step === 0 && 'IP: 192.168.7.67 • PORT: 25565'}
            {step === 1 && 'RETRIEVING Neil Louis PROFILE...'}
            {step === 2 && 'MUTATING PROFILE VALUES... [6 -> 7]'}
            {step === 3 && 'SUCCESS: LEVEL 7 UNLOCKED!'}
            {step === 4 && 'SPAWNING PARTY LOBBY GUESTS...'}
          </div>
        </div>
      </div>
    </div>
  )
}
