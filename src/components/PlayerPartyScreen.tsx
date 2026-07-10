import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { birthdayData, type Rsvp } from '../data/birthdayData'
import { BlockyPlayer } from './BlockyPlayer'

type PlayerPartyScreenProps = {
  guests: Rsvp[]
  demoMode: boolean
  onPlayerTripleTap?: (player: Rsvp) => void
}

type LobbyScrollState = {
  hasOverflow: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
}

const getGuestKey = (guest: Rsvp) => guest.id ?? `${guest.name}-${guest.createdAt ?? ''}`

const formatJoinedName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')

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

export function PlayerPartyScreen({ guests, demoMode, onPlayerTripleTap }: PlayerPartyScreenProps) {
  const { leftGuests, rightGuests } = flankGuestsByNewest(guests)
  const partyScrollRef = useRef<HTMLDivElement>(null)
  const knownGuestKeysRef = useRef<Set<string>>(new Set())
  const canShowJoinToastsRef = useRef(false)
  const [joinedName, setJoinedName] = useState('')
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

  const centerCharacter = useCallback(
    (characterElement: HTMLElement, behavior: ScrollBehavior = 'smooth') => {
      const scrollElement = partyScrollRef.current

      if (!scrollElement) return

      const scrollRect = scrollElement.getBoundingClientRect()
      const characterRect = characterElement.getBoundingClientRect()
      const maxScrollLeft = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth)
      const characterCenter =
        scrollElement.scrollLeft + characterRect.left - scrollRect.left + characterRect.width / 2
      const nextScrollLeft = characterCenter - scrollRect.width / 2

      scrollElement.scrollTo({ left: Math.max(0, Math.min(maxScrollLeft, nextScrollLeft)), behavior })
      window.setTimeout(updateScrollState, behavior === 'smooth' ? 360 : 0)
    },
    [updateScrollState],
  )

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

    centerCharacter(heroElement, 'auto')
  }, [centerCharacter, updateScrollState])

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      canShowJoinToastsRef.current = true
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const nextGuestKeys = new Set(guests.map(getGuestKey))

    if (!canShowJoinToastsRef.current) {
      knownGuestKeysRef.current = nextGuestKeys
      return undefined
    }

    const newGuests = guests.filter((guest) => !knownGuestKeysRef.current.has(getGuestKey(guest)))
    knownGuestKeysRef.current = nextGuestKeys

    if (newGuests.length === 0) return undefined

    const latestGuest = newGuests[newGuests.length - 1]
    setJoinedName(formatJoinedName(latestGuest.name))

    const timeoutId = window.setTimeout(() => setJoinedName(''), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [guests])

  const scrollLobby = (direction: -1 | 1) => {
    const scrollElement = partyScrollRef.current

    if (!scrollElement) return

    const playerElements = Array.from(scrollElement.querySelectorAll('.blocky-player')).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    )

    if (playerElements.length === 0) return

    const scrollRect = scrollElement.getBoundingClientRect()
    const viewportCenter = scrollRect.left + scrollRect.width / 2
    const currentIndex = playerElements.reduce((closestIndex, element, index) => {
      const rect = element.getBoundingClientRect()
      const closestRect = playerElements[closestIndex].getBoundingClientRect()
      const distance = Math.abs(rect.left + rect.width / 2 - viewportCenter)
      const closestDistance = Math.abs(closestRect.left + closestRect.width / 2 - viewportCenter)
      return distance < closestDistance ? index : closestIndex
    }, 0)
    const targetIndex = Math.max(0, Math.min(playerElements.length - 1, currentIndex + direction))

    centerCharacter(playerElements[targetIndex])
  }

  return (
    <section className="party-section" aria-labelledby="party-title">
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

      {joinedName ? (
        <div className="join-toast" role="status" aria-live="polite">
          {joinedName} joined the party!
        </div>
      ) : null}

      <div ref={partyScrollRef} className="party-scroll" tabIndex={0} aria-label="RSVP party lobby">
        <div className="party-row">
          <div className="guest-side left-side">
            {leftGuests.map((guest) => (
              <BlockyPlayer key={guest.id ?? guest.name} player={guest} onTripleTap={onPlayerTripleTap} />
            ))}
          </div>
          <BlockyPlayer player={wiswis} hero />
          <div className="guest-side right-side">
            {rightGuests.map((guest) => (
              <BlockyPlayer key={guest.id ?? guest.name} player={guest} onTripleTap={onPlayerTripleTap} />
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
            aria-label="Center previous party character"
          >
            <ChevronLeft aria-hidden="true" strokeWidth={3.4} />
          </button>
          <button
            type="button"
            className="lobby-scroll-button lobby-scroll-button-right"
            onClick={() => scrollLobby(1)}
            disabled={!scrollState.canScrollRight}
            aria-label="Center next party character"
          >
            <ChevronRight aria-hidden="true" strokeWidth={3.4} />
          </button>
        </div>
      )}
    </section>
  )
}