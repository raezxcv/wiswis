import confetti from 'canvas-confetti'

const colors = ['#2fb344', '#24a7d8', '#f4b63f', '#ec5b4e', '#8d63da', '#ffffff']

export function launchConfetti() {
  void confetti({
    particleCount: 120,
    spread: 78,
    startVelocity: 42,
    scalar: 1.05,
    origin: { y: 0.32 },
    colors,
  })

  window.setTimeout(() => {
    void confetti({
      particleCount: 60,
      spread: 110,
      startVelocity: 28,
      scalar: 0.85,
      origin: { y: 0.52 },
      colors,
    })
  }, 160)
}
