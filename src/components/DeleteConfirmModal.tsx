import type { Rsvp } from '../data/birthdayData'

type DeleteConfirmModalProps = {
  player: Rsvp | null
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteConfirmModal({ player, onClose, onConfirm, isDeleting = false }: DeleteConfirmModalProps) {
  if (!player) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <button
          className="icon-button close-button"
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close delete confirmation"
        >
          x
        </button>
        <h2 id="delete-title" style={{ color: '#681915', textAlign: 'center' }}>Delete Character</h2>
        
        <p style={{ marginTop: '24px', color: '#10263a', fontWeight: 850, fontSize: '1.35rem', lineHeight: '1.4', textAlign: 'center' }}>
          Are you sure you want to delete <strong>{player.name}</strong> from the lobby?
        </p>

        <div className="delete-modal-buttons">
          <button className="secondary-button" type="button" onClick={onClose} disabled={isDeleting}>
            CANCEL
          </button>
          <button className="delete-button" type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'DELETING...' : 'DELETE'}
          </button>
        </div>
      </div>
    </div>
  )
}
