import type { CSSProperties, FormEvent } from 'react'
import { useState } from 'react'
import { avatarChoices, type CharacterStyle, type Rsvp } from '../data/birthdayData'

type RsvpPayload = Omit<Rsvp, 'id' | 'attending' | 'createdAt'>

type RSVPModalProps = {
  isOpen: boolean
  onClose: () => void
  onNameChange: (name: string) => void
  onSubmit: (data: RsvpPayload) => Promise<void>
  existingNames?: string[]
}

const styleChoices: { id: CharacterStyle; label: string }[] = [
  { id: 'boy', label: 'Boy' },
  { id: 'girl', label: 'Girl' },
]

export function RSVPModal({ isOpen, onClose, onNameChange, onSubmit, existingNames }: RSVPModalProps) {
  const [name, setName] = useState('')
  const [choice, setChoice] = useState(avatarChoices[0].id)
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>('boy')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim().toUpperCase()

    if (!trimmedName) {
      setError('Name is required.')
      return
    }

    if (existingNames && existingNames.includes(trimmedName)) {
      setError('This username is already in the lobby! Choose another one.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await onSubmit({
        name: trimmedName.slice(0, 30),
        characterColor: choice,
        avatar: choice,
        characterStyle,
        message: '',
      })
      setName('')
      setChoice(avatarChoices[0].id)
      setCharacterStyle('boy')
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not join the party.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="rsvp-title">
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close join form">
          x
        </button>
        <h2 id="rsvp-title">Join the Party</h2>
        <form onSubmit={handleSubmit} className="rsvp-form">
          <label>
            Name
            <input
              value={name}
              onChange={(event) => {
                const nextName = event.target.value.toUpperCase().slice(0, 30)
                setName(nextName)
                onNameChange(nextName)
              }}
              maxLength={30}
              placeholder="PLAYER NAME"
              autoFocus
            />
          </label>

          <fieldset>
            <legend>Character style</legend>
            <div className="style-grid">
              {styleChoices.map((style) => (
                <button
                  className={characterStyle === style.id ? 'style-choice selected' : 'style-choice'}
                  key={style.id}
                  type="button"
                  onClick={() => setCharacterStyle(style.id)}
                  aria-pressed={characterStyle === style.id}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Character color</legend>
            <div className="color-grid">
              {avatarChoices.map((avatar) => (
                <button
                  className={choice === avatar.id ? 'color-choice selected' : 'color-choice'}
                  key={avatar.id}
                  style={{ '--swatch': avatar.hex } as CSSProperties}
                  type="button"
                  onClick={() => setChoice(avatar.id)}
                  aria-pressed={choice === avatar.id}
                >
                  <span />
                  {avatar.label.toUpperCase()}
                </button>
              ))}
            </div>
          </fieldset>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button full-width" type="submit" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join the Party'}
          </button>
        </form>
      </div>
    </div>
  )
}

