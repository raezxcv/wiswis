// import { BrainrotModel } from './BrainrotModel'
import { useScrollReveal } from '../hooks/useScrollReveal'

type InvitationHeroProps = {
  onRsvp: () => void
  active?: boolean
}

export function InvitationHero({ onRsvp, active = true }: InvitationHeroProps) {
  const contentRef = useScrollReveal<HTMLDivElement>(0, 90, active)

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
      <div className="hero-content hero-entrance" ref={contentRef}>
        <p className="eyebrow" data-reveal>You're Invited to</p>
        <h1 id="hero-title" className="hero-title-two-line" data-reveal>
          <span>Neil Louis</span>
          <span>7th Birthday</span>
        </h1>
        <p className="hero-subtitle" data-reveal>Spawn into Level 7 on Louis&apos; Roblox server quest!</p>
        <p className="hero-copy" data-reveal><strong>McDo Sta. Ana • August 7 @ 5:00 PM</strong></p>
        <p className="hero-copy muted" data-reveal>Claim your username and join the party lobby!</p>
        <button className="primary-button" type="button" onClick={onRsvp} data-reveal>
          Join the Server!
        </button>
      </div>
    </section>
  )
}
