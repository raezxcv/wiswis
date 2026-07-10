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
        <p className="eyebrow">You're Invited!</p>
        <h1 id="hero-title" className="hero-title-two-line">
          <span>Louis</span>
          <span>7th Birthday</span>
        </h1>
        <p className="hero-subtitle">Spawn into Level 7 on Louis&apos; Roblox server quest!</p>
        <p className="hero-copy">McDo Sta. Ana • August 7 @ 5:00 PM</p>
        <p className="hero-copy muted">Claim your username and join the party lobby!</p>
        <button className="primary-button" type="button" onClick={onRsvp}>
          Join the Server!
        </button>
      </div>
    </section>
  )
}
