import { useState } from 'react'
import { birthdayData } from '../data/birthdayData'
import { launchConfetti } from '../utils/confetti'
import chestIcon from '../assets/chest.png'
import secretVideo from '../assets/67wis.mp4'

export function Secret67Chest() {
  const [isOpen, setIsOpen] = useState(false)

  const openChest = () => {
    setIsOpen(true)
    launchConfetti()
  }

  return (
    <>
      <button className="secret-chest" type="button" onClick={openChest} aria-label="Open secret chest">
        <img src={chestIcon} alt="Secret Chest" className="secret-chest-icon" />
      </button>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal secret-modal" role="dialog" aria-modal="true" aria-labelledby="secret-title">
            <button className="icon-button close-button" type="button" onClick={() => setIsOpen(false)} aria-label="Close secret chest">
              x
            </button>
            <h2 id="secret-title">You found the Secret 67 Chest!</h2>
            <video
              src={secretVideo}
              autoPlay
              loop
              muted
              playsInline
              className="secret-video"
            />
            <p style={{ marginTop: '16px' }}>{birthdayData.hidden67Message}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}

