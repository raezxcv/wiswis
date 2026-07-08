import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import bedrockImage from '../assets/bedrock.jpg'
import blockImage from '../assets/block.jpg'
import cakeImage from '../assets/cake.jpg'
import heroImage from '../assets/hero.png'
import mcbgImage from '../assets/mcbg.jpg'
import wiswisImage from '../assets/wiswisdp.jpg'

const galleryImages = [
  {
    src: heroImage,
    alt: 'Wiswis birthday adventure hero artwork',
    title: 'Level 7 World',
  },
  {
    src: wiswisImage,
    alt: 'Wiswis birthday portrait',
    title: 'Birthday Player',
  },
  {
    src: cakeImage,
    alt: 'Birthday cake block artwork',
    title: 'Cake Quest',
  },
  {
    src: mcbgImage,
    alt: 'Blocky party world background',
    title: 'Party World',
  },
  {
    src: blockImage,
    alt: 'Minecraft style grass block texture',
    title: 'Grass Block',
  },
  {
    src: bedrockImage,
    alt: 'Bedrock texture artwork',
    title: 'Bedrock Base',
  },
]

export function ImageGallery() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = galleryImages[activeIndex]

  const moveSlide = (direction: -1 | 1) => {
    setActiveIndex((currentIndex) => (currentIndex + direction + galleryImages.length) % galleryImages.length)
  }

  useEffect(() => {
    if (document.visibilityState === 'hidden') return undefined

    const intervalId = window.setInterval(() => moveSlide(1), 5200)
    return () => window.clearInterval(intervalId)
  }, [activeIndex])

  return (
    <section className="gallery-section" aria-labelledby="gallery-title">
      <div className="section-heading gallery-heading">
        <p className="eyebrow">Memory Gallery</p>
        <h2 id="gallery-title">Wiswis Gallery</h2>
        <span>Swipe through the party snapshots</span>
      </div>

      <div className="gallery-carousel" aria-roledescription="carousel" aria-label="Wiswis birthday image gallery">
        <button
          className="gallery-nav gallery-nav-left"
          type="button"
          onClick={() => moveSlide(-1)}
          aria-label="Previous gallery image"
        >
          <ChevronLeft aria-hidden="true" strokeWidth={3.4} />
        </button>

        <figure className="gallery-frame">
          <img src={activeImage.src} alt={activeImage.alt} />
          <figcaption>{activeImage.title}</figcaption>
        </figure>

        <button
          className="gallery-nav gallery-nav-right"
          type="button"
          onClick={() => moveSlide(1)}
          aria-label="Next gallery image"
        >
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
    </section>
  )
}
