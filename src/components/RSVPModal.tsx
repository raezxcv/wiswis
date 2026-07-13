import type { FormEvent } from 'react'
import { useState } from 'react'
import { avatarChoices, type CharacterModel, type CharacterStyle, type Rsvp } from '../data/birthdayData'

type RsvpPayload = Omit<Rsvp, 'id' | 'attending' | 'createdAt'>

type RSVPModalProps = {
  isOpen: boolean
  onClose: () => void
  onNameChange: (name: string) => void
  onSubmit: (data: RsvpPayload) => Promise<void>
  existingNames?: string[]
}

const modelOptions: { id: CharacterModel; label: string }[] = [
  { id: 'minecraft-boy', label: 'Minecraft Boy' },
  { id: 'minecraft-girl', label: 'Minecraft Girl' },
  { id: 'roblox-bacon-hair', label: 'Roblox Bacon' },
  { id: 'roblox-noob', label: 'Roblox Noob' },
  { id: 'roblox-girl', label: 'Roblox Girl' },
  { id: 'ispeed', label: 'ISpeed' },
  { id: 'tung', label: 'Tung' },
  { id: 'buff-steve', label: 'Buff Steve' },
]

export function RSVPModal({ isOpen, onClose, onNameChange, onSubmit, existingNames }: RSVPModalProps) {
  const [name, setName] = useState('')
  const [selectedModel, setSelectedModel] = useState<CharacterModel | 'default'>('default')
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

    const nameUpper = trimmedName.toUpperCase()
    const hash = nameUpper.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const assignedColor = avatarChoices[hash % avatarChoices.length].id

    const finalStyle: CharacterStyle =
      selectedModel === 'minecraft-girl' || selectedModel === 'roblox-girl'
        ? 'girl'
        : selectedModel === 'default'
          ? (hash % 2 === 0 ? 'girl' : 'boy')
          : 'boy'

    try {
      await onSubmit({
        name: trimmedName.slice(0, 30),
        characterColor: assignedColor,
        avatar: assignedColor,
        characterStyle: finalStyle,
        characterModel: selectedModel === 'default' ? undefined : selectedModel,
        message: '',
      })
      setName('')
      setSelectedModel('default')
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
            <div className="model-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={selectedModel === 'default' ? 'style-choice selected' : 'style-choice'}
                style={{ gridColumn: 'span 2' }}
                onClick={() => setSelectedModel('default')}
              >
                Auto (Based on Name/Gender)
              </button>
              {modelOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={selectedModel === opt.id ? 'style-choice selected' : 'style-choice'}
                  onClick={() => setSelectedModel(opt.id)}
                >
                  {opt.label}
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

