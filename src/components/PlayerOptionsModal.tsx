import type { Rsvp } from '../data/birthdayData'

type PlayerOptionsModalProps = {
  player: Rsvp | null
  onClose: () => void
  onCustomize: () => void
  onRemove: () => void
}

export function PlayerOptionsModal({ player, onClose, onCustomize, onRemove }: PlayerOptionsModalProps) {
  if (!player) return null

  const isHost = player.id === 'wiswis'

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="options-title">
        <button
          className="icon-button close-button"
          type="button"
          onClick={onClose}
          aria-label="Close options"
        >
          x
        </button>
        <h2 id="options-title" style={{ textAlign: 'center' }}>
          Manage Character
        </h2>
        
        <p style={{ textAlign: 'center', marginTop: '-12px', marginBottom: '24px', fontWeight: 800, color: '#3d5f6a' }}>
          Player: <strong style={{ color: '#10263a' }}>{player.name}</strong>
        </p>

        <div className="rsvp-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="primary-button full-width"
            type="button"
            onClick={onCustomize}
            style={{ marginTop: 0 }}
          >
            Customize Skin
          </button>
          {!isHost && (
            <button
              className="delete-button full-width"
              type="button"
              onClick={onRemove}
              style={{ marginTop: 0 }}
            >
              Remove Character
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
