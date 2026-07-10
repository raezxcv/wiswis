import { useEffect, useState } from 'react'
import cakeUrl from '../assets/cake.jpg'
import { birthdayData } from '../data/birthdayData'
import { launchConfetti } from '../utils/confetti'

type CountdownState =
  | { mode: 'before'; days: number; hours: number; minutes: number; seconds: number }
  | { mode: 'today' }
  | { mode: 'after' }

const getCountdown = (): CountdownState => {
  const now = new Date()
  const birthday = new Date(birthdayData.birthdayDate)
  const birthdayEnd = new Date(birthday)
  birthdayEnd.setDate(birthdayEnd.getDate() + 1)

  if (now >= birthdayEnd) return { mode: 'after' }
  if (now >= birthday) return { mode: 'today' }

  const totalSeconds = Math.max(0, Math.floor((birthday.getTime() - now.getTime()) / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { mode: 'before', days, hours, minutes, seconds }
}

const CountdownHeading = ({ title }: { title: string }) => (
  <div className="section-heading lobby-heading countdown-heading">
    <p className="eyebrow">Birthday Quest</p>
    <h2 id="countdown-title">{title}</h2>
    <span>Level 7 unlocks in:</span>
  </div>
)

const celebrateWithCake = () => {
  launchConfetti()
  const audio = new Audio('./music/classic_hurt.mp3')
  audio.currentTime = 0
  void audio.play().catch(() => undefined)
}

const BirthdayCakeButton = () => (
  <button className="countdown-cake-button" type="button" onClick={celebrateWithCake} aria-label="Celebrate with cake">
    <img src={cakeUrl} alt="Birthday cake" />
  </button>
)

export function Countdown() {
  const [countdown, setCountdown] = useState(getCountdown)

  useEffect(() => {
    const timerId = window.setInterval(() => setCountdown(getCountdown()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  if (countdown.mode === 'today') {
    return (
      <section className="countdown-section" aria-labelledby="countdown-title">
        <CountdownHeading title="Level 7 Unlocked!" />
        <BirthdayCakeButton />
      </section>
    )
  }

  if (countdown.mode === 'after') {
    return (
      <section className="countdown-section" aria-labelledby="countdown-title">
        <CountdownHeading title="Birthday Quest Completed!" />
        <BirthdayCakeButton />
      </section>
    )
  }

  const units = [
    ['Days', countdown.days],
    ['Hours', countdown.hours],
    ['Minutes', countdown.minutes],
    ['Seconds', countdown.seconds],
  ] as const

  return (
    <section className="countdown-section" aria-labelledby="countdown-title">
      <CountdownHeading title="Countdown" />
      <div className="countdown-panel level-countdown">
        <div className="countdown-grid">
          {units.map(([label, value]) => (
            <span className="countdown-tile" key={label}>
              <strong>{String(value).padStart(2, '0')}</strong>
              <small>{label}</small>
            </span>
          ))}
        </div>
      </div>
      <BirthdayCakeButton />
    </section>
  )
}