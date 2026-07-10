import { useEffect, useState } from 'react'
import { Countdown } from './components/Countdown'
import { EventDetails } from './components/EventDetails'
import { GreetingsChat } from './components/GreetingsChat'
import { InvitationHero } from './components/InvitationHero'
import { MusicToggle } from './components/MusicToggle'
import { PlayerPartyScreen } from './components/PlayerPartyScreen'
import { RSVPModal } from './components/RSVPModal'
import { Secret67Chest } from './components/Secret67Chest'
import { type Greeting, type Rsvp } from './data/birthdayData'
import clickSoundUrl from './assets/minecraft_click.mp3?url'
import { addGreeting, listenToGreetings } from './firebase/greetingService'
import { addRsvp, isFirebaseConfigured, listenToRsvps, deleteRsvp } from './firebase/rsvpService'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'

const playerNameKey = 'wiswis-player-name'

const normalizePlayerName = (name: string) => name.trim().toUpperCase().slice(0, 30)

const getSavedPlayerName = () => {
  try {
    return normalizePlayerName(window.localStorage.getItem(playerNameKey) ?? '')
  } catch {
    return ''
  }
}

function App() {
  const [isRsvpOpen, setIsRsvpOpen] = useState(false)
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [greetings, setGreetings] = useState<Greeting[]>([])
  const [playerName, setPlayerName] = useState(getSavedPlayerName)
  const [playerToDelete, setPlayerToDelete] = useState<Rsvp | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => listenToRsvps(setRsvps), [])
  useEffect(() => listenToGreetings(setGreetings), [])

  useEffect(() => {
    const playClickSound = (event: MouseEvent) => {
      const target = event.target
      const clickedButton = target instanceof Element ? target.closest('button') : null

      if (!(clickedButton instanceof HTMLButtonElement) || clickedButton.disabled) return

      const clickAudio = new Audio(clickSoundUrl)
      clickAudio.volume = 0.42
      clickAudio.currentTime = 0
      void clickAudio.play().catch(() => undefined)
    }

    document.addEventListener('click', playClickSound, true)
    return () => document.removeEventListener('click', playClickSound, true)
  }, [])

  const rememberPlayerName = (name: string) => {
    const normalizedName = normalizePlayerName(name)
    setPlayerName(normalizedName)

    try {
      if (normalizedName) {
        window.localStorage.setItem(playerNameKey, normalizedName)
      } else {
        window.localStorage.removeItem(playerNameKey)
      }
    } catch {
      // localStorage can be unavailable in private browsing; state still covers this session.
    }
  }

  const handleRsvp = async (data: Omit<Rsvp, 'id' | 'attending' | 'createdAt'>) => {
    rememberPlayerName(data.name)
    const saved = await addRsvp(data)
    setRsvps((current) => {
      if (current.some((item) => item.id === saved.id)) return current
      return [...current, saved]
    })
  }

  const handleGreeting = async (data: Omit<Greeting, 'id' | 'createdAt'>) => {
    const saved = await addGreeting(data)
    setGreetings((current) => {
      if (current.some((item) => item.id === saved.id)) return current
      return [...current, saved]
    })
  }

  const confirmDelete = async () => {
    if (!playerToDelete) return
    const idToDelete = playerToDelete.id
    setIsDeleting(true)
    if (!idToDelete) {
      setRsvps((current) => current.filter((item) => item.name !== playerToDelete.name))
      setIsDeleting(false)
      setPlayerToDelete(null)
      return
    }

    try {
      if (isFirebaseConfigured) {
        await deleteRsvp(idToDelete)
      } else {
        setRsvps((current) => current.filter((item) => item.id !== idToDelete))
      }
    } catch (error) {
      console.error('Failed to delete RSVP:', error)
    } finally {
      setIsDeleting(false)
      setPlayerToDelete(null)
    }
  }

  return (
    <main className="app-shell">
      <MusicToggle />
      <InvitationHero onRsvp={() => setIsRsvpOpen(true)} />
      <PlayerPartyScreen guests={rsvps} demoMode={!isFirebaseConfigured} onPlayerTripleTap={setPlayerToDelete} />
      <EventDetails />
      <Countdown />
      <GreetingsChat
        greetings={greetings}
        demoMode={!isFirebaseConfigured}
        senderName={playerName}
        onSend={handleGreeting}
      />
      <Secret67Chest />
      <RSVPModal
        isOpen={isRsvpOpen}
        onClose={() => setIsRsvpOpen(false)}
        onNameChange={rememberPlayerName}
        onSubmit={handleRsvp}
        existingNames={rsvps.map((r) => r.name.toUpperCase())}
      />
      <DeleteConfirmModal
        player={playerToDelete}
        onClose={() => setPlayerToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </main>
  )
}

export default App

