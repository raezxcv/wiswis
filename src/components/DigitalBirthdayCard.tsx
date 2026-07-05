import { useState } from 'react'
import { birthdayData } from '../data/birthdayData'
import { launchConfetti } from '../utils/confetti'

export function DigitalBirthdayCard() {
  const [isOpen, setIsOpen] = useState(false)

  const openCard = () => {
    if (!isOpen) launchConfetti()
    setIsOpen((current) => !current)
  }

  return (
    <section className="card-section" aria-labelledby="card-title">
      <div className="section-heading">
        <p className="eyebrow">Digital Birthday Card</p>
        <h2 id="card-title">Open Wiswis&apos; Card</h2>
      </div>
      <button className={isOpen ? 'birthday-card open' : 'birthday-card'} type="button" onClick={openCard}>
        <span className="card-face card-front">
          <strong>To Wiswis</strong>
          <em>Happy 7th Birthday!</em>
        </span>
        <span className="card-face card-inside">
          <strong>Happy Birthday, Wiswis!</strong>
          <span>{birthdayData.cardMessage}</span>
        </span>
      </button>
    </section>
  )
}
