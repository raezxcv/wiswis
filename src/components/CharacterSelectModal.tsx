import React, { useState } from 'react'
import { type CharacterModel, type Rsvp } from '../data/birthdayData'

type CharacterSelectModalProps = {
  player: Rsvp
  onClose: () => void
  onSave: (updates: Partial<Rsvp>) => Promise<void>
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

export function CharacterSelectModal({ player, onClose, onSave }: CharacterSelectModalProps) {
  const [selectedModel, setSelectedModel] = useState<CharacterModel | 'default'>(player.characterModel ?? 'default')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    const updates: Partial<Rsvp> = {
      characterColor: player.characterColor,
      avatar: player.characterColor, // Sync avatar with characterColor
      characterStyle: player.characterStyle ?? 'boy',
      characterModel: selectedModel === 'default' ? undefined : selectedModel,
    }

    try {
      await onSave(updates)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Failed to update character skin. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="customizer-title">
        <button
          className="icon-button close-button"
          type="button"
          onClick={onClose}
          aria-label="Close customizer"
        >
          x
        </button>

        <h2 id="customizer-title" style={{ textAlign: 'center' }}>
          Customize Skin
        </h2>
        <p style={{ textAlign: 'center', marginTop: '-12px', marginBottom: '24px', fontWeight: 800, color: '#3d5f6a' }}>
          Player: <strong style={{ color: '#10263a' }}>{player.name}</strong>
        </p>

        <form onSubmit={handleSave} className="rsvp-form">
          {/* Avatar 3D Model list */}
          <fieldset>
            <legend>3D Character Model</legend>
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

          {error && <p className="form-error">{error}</p>}

          <button
            className="primary-button full-width"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Updating...' : 'Save Character'}
          </button>
        </form>
      </div>
    </div>
  )
}
