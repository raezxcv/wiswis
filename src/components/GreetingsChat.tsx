import React, { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import type { Greeting } from '../data/birthdayData'
import wiswisDP from '../assets/wiswisdp.jpg'
import { useScrollReveal } from '../hooks/useScrollReveal'

type GreetingsChatProps = {
  greetings: Greeting[]
  demoMode: boolean
  senderName: string
  onSend: (data: Omit<Greeting, 'id' | 'createdAt'>) => Promise<void>
}

const getInitials = (name: string) => name.trim().charAt(0).toUpperCase()

const getFriendlyGreetingError = (error: unknown) => {
  const message = error instanceof Error ? error.message : ''

  if (message.includes('Firebase') || message.includes('Firestore') || message.includes('PERMISSION_DENIED')) {
    return 'The birthday chat is warming up. Please try again in a moment.'
  }

  return 'Your greeting did not send yet. Please try again.'
}

const formatTime = (createdAt?: string) => {
  if (!createdAt) return ''

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

export function GreetingsChat({ greetings, demoMode, senderName, onSend }: GreetingsChatProps) {
  const normalizedSenderName = useMemo(() => senderName.trim().toUpperCase().slice(0, 30), [senderName])
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const sectionRef = useScrollReveal<HTMLElement>(0.08, 80)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const chatWindow = chatWindowRef.current
    if (!chatWindow) return

    chatWindow.scrollTop = chatWindow.scrollHeight
  }, [greetings.length])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedMessage = message.trim()

    if (!normalizedSenderName) {
      setError('Join the party first, then your greeting will send with your player name.')
      return
    }

    if (!trimmedMessage) {
      setError('Please type a birthday greeting before sending.')
      return
    }

    setError('')
    setIsSending(true)

    try {
      await onSend({ name: normalizedSenderName, message: trimmedMessage.slice(0, 140) })
      setMessage('')
    } catch (submitError) {
      setError(getFriendlyGreetingError(submitError))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="greetings-section" aria-labelledby="greetings-title" data-chat-mode={demoMode ? 'local' : 'live'} ref={sectionRef}>
      <div className="section-heading lobby-heading chat-heading">
        <p className="eyebrow" data-reveal>Group Chat</p>
        <h2 id="greetings-title" data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
          Birthday <br className="mobile-greetings-title-break" aria-hidden="true" />Greetings
        </h2>
        <span data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>Leave Wiswis a birthday wish</span>
      </div>

      <div className="chat-panel" data-reveal style={{ '--reveal-delay': '180ms' } as React.CSSProperties}>
        <div className="chat-celebrant-card" aria-label="Birthday celebrant profile">
          <img src={wiswisDP} alt="Wiswis" className="chat-celebrant-dp" />
          <div className="chat-celebrant-info">
            <strong className="chat-celebrant-name">Neil Louis R. Maglaqui</strong>
            <span className="chat-celebrant-badge">Birthday Celebrant</span>
          </div>
        </div>

        <div className="chat-window" ref={chatWindowRef} aria-live="polite">
          {greetings.map((greeting) => (
            <article className="chat-message" key={greeting.id ?? `${greeting.name}-${greeting.createdAt}`}>
              <span className="chat-avatar" aria-hidden="true">
                {getInitials(greeting.name)}
              </span>
              <div className="chat-bubble">
                <header>
                  <strong>{greeting.name}</strong>
                  <time>{formatTime(greeting.createdAt)}</time>
                </header>
                <p>{greeting.message}</p>
              </div>
            </article>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 140))}
            maxLength={140}
            placeholder="TYPE A GREETING"
            aria-label="Greeting message"
          />
          <button
            className="secondary-button chat-send-button"
            type="submit"
            disabled={isSending}
            aria-label={isSending ? 'Sending greeting' : 'Send greeting'}
            title={isSending ? 'Sending greeting' : 'Send greeting'}
          >
            <Send aria-hidden="true" size={24} strokeWidth={3.5} />
          </button>
        </form>
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </section>
  )
}
