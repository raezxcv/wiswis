import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { birthdayData, type Rsvp } from '../data/birthdayData'
import { BlockyPlayer } from './BlockyPlayer'

type PlayerPartyScreenProps = {
  guests: Rsvp[]
  demoMode: boolean
}

type LobbyScrollState = {
  hasOverflow: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
}

const wiswis: Rsvp = {
  id: 'wiswis',
  name: birthdayData.childName,
  characterColor: 'blue',
  avatar: 'blue',
  characterStyle: 'boy',
  attending: true,
}

const flankGuestsByNewest = (guests: Rsvp[]) => {
  const leftGuests: Rsvp[] = []
  const rightGuests: Rsvp[] = []

  guests
    .slice()
    .reverse()
    .forEach((guest, index) => {
      if (index % 2 === 0) {
        rightGuests.push(guest)
      } else {
        leftGuests.unshift(guest)
      }
    })

  return { leftGuests, rightGuests }
}

export function PlayerPartyScreen({ guests, demoMode }: PlayerPartyScreenProps) {
  const { leftGuests, rightGuests } = flankGuestsByNewest(guests)
  const partyScrollRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState<LobbyScrollState>({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  })

  const updateScrollState = useCallback(() => {
    const scrollElement = partyScrollRef.current

    if (!scrollElement) {
      setScrollState({ hasOverflow: false, canScrollLeft: false, canScrollRight: false })
      return
    }

    const maxScrollLeft = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth)
    const currentScrollLeft = scrollElement.scrollLeft
    const nextScrollState = {
      hasOverflow: maxScrollLeft > 2,
      canScrollLeft: currentScrollLeft > 2,
      canScrollRight: currentScrollLeft < maxScrollLeft - 2,
    }

    setScrollState((previousState) =>
      previousState.hasOverflow === nextScrollState.hasOverflow &&
      previousState.canScrollLeft === nextScrollState.canScrollLeft &&
      previousState.canScrollRight === nextScrollState.canScrollRight
        ? previousState
        : nextScrollState,
    )
  }, [])

  const centerWiswisOnMobile = useCallback(() => {
    const scrollElement = partyScrollRef.current

    if (!scrollElement || !window.matchMedia('(max-width: 760px)').matches) {
      updateScrollState()
      return
    }

    const heroElement = scrollElement.querySelector('.hero-player')

    if (!(heroElement instanceof HTMLElement)) {
      updateScrollState()
      return
    }

    const scrollRect = scrollElement.getBoundingClientRect()
    const heroRect = heroElement.getBoundingClientRect()
    const maxScrollLeft = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth)
    const centeredScrollLeft =
      scrollElement.scrollLeft + heroRect.left - scrollRect.left + heroRect.width / 2 - scrollRect.width / 2

    scrollElement.scrollLeft = Math.max(0, Math.min(maxScrollLeft, centeredScrollLeft))
    window.setTimeout(updateScrollState, 0)
  }, [updateScrollState])

  useEffect(() => {
    const scrollElement = partyScrollRef.current

    if (!scrollElement) return undefined

    const rowElement = scrollElement.querySelector('.party-row')
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateScrollState)
    const centerTimeoutId = window.setTimeout(centerWiswisOnMobile, 0)
    const settleTimeoutId = window.setTimeout(centerWiswisOnMobile, 220)

    updateScrollState()
    scrollElement.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    resizeObserver?.observe(scrollElement)

    if (rowElement instanceof Element) {
      resizeObserver?.observe(rowElement)
    }

    return () => {
      window.clearTimeout(centerTimeoutId)
      window.clearTimeout(settleTimeoutId)
      scrollElement.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      resizeObserver?.disconnect()
    }
  }, [centerWiswisOnMobile, guests.length, updateScrollState])

  const scrollLobby = (direction: -1 | 1) => {
    const scrollElement = partyScrollRef.current

    if (!scrollElement) return

    const scrollDistance = Math.max(220, scrollElement.clientWidth * 0.72)
    scrollElement.scrollBy({ left: scrollDistance * direction, behavior: 'smooth' })
    window.setTimeout(updateScrollState, 260)
  }

  return (
    <section className="party-section" aria-labelledby="party-title">
      {/* Floating pixel clouds */}
      <div className="pixel-cloud lobby-cloud lobby-cloud-1" aria-hidden="true" />
      <div className="pixel-cloud lobby-cloud lobby-cloud-2" aria-hidden="true" />
      <div className="pixel-cloud lobby-cloud lobby-cloud-3" aria-hidden="true" />
      <div className="pixel-cloud lobby-cloud lobby-cloud-4" aria-hidden="true" />

      <div className="section-heading lobby-heading">
        <p className="eyebrow">Wiswis Party Screen</p>
        <h2 id="party-title">
          Birthday <br className="mobile-party-title-break" aria-hidden="true" />Lobby
        </h2>
        <span>{demoMode ? 'Demo guests showing until Firebase env is added' : `${guests.length} players joined`}</span>
      </div>

      <div ref={partyScrollRef} className="party-scroll" tabIndex={0} aria-label="RSVP party lobby">
        <div className="party-row">
          <div className="guest-side left-side">
            {leftGuests.map((guest) => (
              <BlockyPlayer key={guest.id ?? guest.name} player={guest} />
            ))}
          </div>
          <BlockyPlayer player={wiswis} hero />
          <div className="guest-side right-side">
            {rightGuests.map((guest) => (
              <BlockyPlayer key={guest.id ?? guest.name} player={guest} />
            ))}
          </div>
        </div>
      </div>

      {scrollState.hasOverflow && (
        <div className="lobby-scroll-controls" aria-label="Character row controls">
          <button
            type="button"
            className="lobby-scroll-button lobby-scroll-button-left"
            onClick={() => scrollLobby(-1)}
            disabled={!scrollState.canScrollLeft}
            aria-label="Show previous party characters"
          >
            <ChevronLeft aria-hidden="true" strokeWidth={3.4} />
          </button>
          <button
            type="button"
            className="lobby-scroll-button lobby-scroll-button-right"
            onClick={() => scrollLobby(1)}
            disabled={!scrollState.canScrollRight}
            aria-label="Show next party characters"
          >
            <ChevronRight aria-hidden="true" strokeWidth={3.4} />
          </button>
        </div>
      )}
    </section>
  )
}