import { birthdayData } from '../data/birthdayData'
// import { BrainrotModel } from './BrainrotModel'

type InvitationHeroProps = {
  onRsvp: () => void
}

export function InvitationHero({ onRsvp }: InvitationHeroProps) {
  return (
    <section className="hero-section section-sky" aria-labelledby="hero-title">
      <div className="pixel-cloud hero-cloud hero-cloud-1" aria-hidden="true" />
      <div className="pixel-cloud hero-cloud hero-cloud-2" aria-hidden="true" />
      <div className="pixel-cloud hero-cloud hero-cloud-3" aria-hidden="true" />
      <div className="pixel-cloud hero-cloud hero-cloud-4" aria-hidden="true" />
      <div className="pixel-cloud hero-cloud hero-cloud-5" aria-hidden="true" />
      <div className="pixel-cloud hero-cloud hero-cloud-6" aria-hidden="true" />

      {/* <div className="home-brainrot-wrapper">
        <BrainrotModel />
      </div> */}
      <div className="hero-content">
        <p className="eyebrow">You&apos;re Invited!</p>
        <h1 id="hero-title" className="hero-title-two-line">
          <span>Wiswis Birthday:</span>
          <span>Level 7</span>
        </h1>
        <p className="hero-subtitle">{birthdayData.invitationSubtitle}</p>
        <p className="hero-copy">Wiswis is turning 7 on August 7!</p>
        <p className="hero-copy muted">Join us for a blocky birthday adventure.</p>
        <button className="primary-button" type="button" onClick={onRsvp}>
          I&apos;m Going!
        </button>
      </div>
    </section>
  )
}
