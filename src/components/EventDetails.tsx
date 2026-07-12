import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import wis1 from '../assets/wisgallery/wis1.jpg'
import wis2 from '../assets/wisgallery/wis2.jpg'
import wis3 from '../assets/wisgallery/wis3.jpg'
import wis4 from '../assets/wisgallery/wis4.jpg'
import wis5 from '../assets/wisgallery/wis5.jpg'
import wis6 from '../assets/wisgallery/wis6.jpg'
import wis7 from '../assets/wisgallery/wis7.jpg'
import wis8 from '../assets/wisgallery/wis8.jpg'
import wis9 from '../assets/wisgallery/wis9.jpg'
import wis10 from '../assets/wisgallery/wis10.jpg'
import { birthdayData } from '../data/birthdayData'
import { useScrollReveal } from '../hooks/useScrollReveal'

const galleryImages = [
  { src: wis1, alt: 'Wiswis party memory 1', title: 'Wiswis Snapshot 1' },
  { src: wis2, alt: 'Wiswis party memory 2', title: 'Wiswis Snapshot 2' },
  { src: wis3, alt: 'Wiswis party memory 3', title: 'Wiswis Snapshot 3' },
  { src: wis4, alt: 'Wiswis party memory 4', title: 'Wiswis Snapshot 4' },
  { src: wis5, alt: 'Wiswis party memory 5', title: 'Wiswis Snapshot 5' },
  { src: wis6, alt: 'Wiswis party memory 6', title: 'Wiswis Snapshot 6' },
  { src: wis7, alt: 'Wiswis party memory 7', title: 'Wiswis Snapshot 7' },
  { src: wis8, alt: 'Wiswis party memory 8', title: 'Wiswis Snapshot 8' },
  { src: wis9, alt: 'Wiswis party memory 9', title: 'Wiswis Snapshot 9' },
  { src: wis10, alt: 'Wiswis party memory 10', title: 'Wiswis Snapshot 10' },
]

type DetailPopup = {
  label: string
  emoji: string
  value: string
  popupContent: React.ReactNode
}

const details: DetailPopup[] = [
  {
    label: 'Date',
    emoji: '📅',
    value: birthdayData.eventDate,
    popupContent: (
      <div className="detail-popup-body">
        <p className="detail-popup-label">📅 Date</p>
        <p className="detail-popup-value">{birthdayData.eventDate}</p>
        <p className="detail-popup-note">Mark your calendar — Wiswis turns Level 7!</p>
      </div>
    ),
  },
  {
    label: 'Time',
    emoji: '⏰',
    value: birthdayData.eventTime,
    popupContent: (
      <div className="detail-popup-body">
        <p className="detail-popup-label">⏰ Time</p>
        <p className="detail-popup-value">{birthdayData.eventTime}</p>
        <p className="detail-popup-note">Be there on time for the party quest!</p>
      </div>
    ),
  },
  {
    label: 'Venue',
    emoji: '📍',
    value: birthdayData.venue,
    popupContent: (
      <div className="detail-popup-body">
        <p className="detail-popup-label">📍 Venue</p>
        <p className="detail-popup-value">{birthdayData.venue}</p>
        <div className="detail-popup-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!4v1783666216485!6m8!1m7!1s1zwzlDEFdu8Dk-_u8bVzZQ!2m2!1d15.09335692225416!2d120.7661341744783!3f310.4918!4f0!5f0.7820865974627469"
            width="100%"
            height="340"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="McDonald's Sta. Ana map"
          />
        </div>
      </div>
    ),
  },
]

export function EventDetails() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [openPopup, setOpenPopup] = useState<string | null>(null)
  const activeImage = galleryImages[activeIndex]
  const sectionRef = useScrollReveal<HTMLElement>(0.08, 100)

  const moveSlide = (direction: -1 | 1) => {
    setActiveIndex((i) => (i + direction + galleryImages.length) % galleryImages.length)
  }

  // Auto-swipe functionality
  useEffect(() => {
    if (document.hidden) return undefined

    const intervalId = window.setInterval(() => {
      moveSlide(1)
    }, 2500)

    const handleVisibility = () => {
      if (document.hidden) {
        window.clearInterval(intervalId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [activeIndex])

  // Close popup on Escape
  useEffect(() => {
    if (!openPopup) return undefined
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenPopup(null) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [openPopup])

  const activeDetail = details.find((d) => d.label === openPopup)

  return (
    <section className="details-section" aria-labelledby="details-title" ref={sectionRef}>
      <div className="section-heading lobby-heading details-heading" data-reveal>
        <p className="eyebrow" data-reveal>Party Quest</p>
        <h2 id="details-title" data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
          Event <br className="mobile-details-title-break" aria-hidden="true" />Details
        </h2>
        <span data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>Join the quest at the specified coordinates</span>
      </div>

      <dl className="event-grid" aria-label="Event details">
        {details.map(({ label, emoji, value }, index) => (
          <div
            className="event-detail event-detail-clickable"
            key={label}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-label={`${label}: ${value}. Tap to see details.`}
            data-reveal
            style={{ '--reveal-delay': `${index * 100 + 80}ms` } as React.CSSProperties}
            onClick={() => setOpenPopup(label)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenPopup(label) } }}
          >
            <dt>
              <span className="detail-emoji" aria-hidden="true">{emoji}</span>
              {label}
            </dt>
            <dd>{value}</dd>
            <span className="detail-tap-hint" aria-hidden="true">tap for info</span>
          </div>
        ))}
      </dl>

      {/* Popup modal */}
      {openPopup && activeDetail && (
        <div
          className="detail-popup-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${openPopup} details`}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenPopup(null) }}
        >
          <div className="detail-popup-card">
            <button
              className="detail-popup-close"
              type="button"
              onClick={() => setOpenPopup(null)}
              aria-label="Close"
            >
              <X size={22} strokeWidth={3.5} />
            </button>
            {activeDetail.popupContent}
          </div>
        </div>
      )}

      {/* Gallery */}
      <div className="gallery-section" aria-label="Wiswis birthday image gallery" data-reveal style={{ '--reveal-delay': '180ms' } as React.CSSProperties}>
        <div className="gallery-carousel" aria-roledescription="carousel">
          <button className="gallery-nav gallery-nav-left" type="button" onClick={() => moveSlide(-1)} aria-label="Previous gallery image">
            <ChevronLeft aria-hidden="true" strokeWidth={3.4} />
          </button>
          <figure className="gallery-frame">
            <img src={activeImage.src} alt={activeImage.alt} />
          </figure>
          <button className="gallery-nav gallery-nav-right" type="button" onClick={() => moveSlide(1)} aria-label="Next gallery image">
            <ChevronRight aria-hidden="true" strokeWidth={3.4} />
          </button>
        </div>
        <div className="gallery-dots" aria-label="Choose gallery image">
          {galleryImages.map((image, index) => (
            <button
              key={image.title}
              className={index === activeIndex ? 'gallery-dot is-active' : 'gallery-dot'}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${image.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
