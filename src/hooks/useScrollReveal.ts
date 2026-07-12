import { useEffect, useRef } from 'react'

/**
 * Adds the `is-revealed` class to a container element (and all its
 * `[data-reveal]` children) once the container intersects the viewport.
 *
 * Each child with `[data-reveal]` gets a staggered `--reveal-delay` CSS
 * custom property based on its index so they cascade in sequentially.
 */
export function useScrollReveal<T extends HTMLElement>(
  threshold = 0.12,
  staggerMs = 80,
  enabled = true,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return undefined
    const el = ref.current
    if (!el) return undefined

    // Stamp stagger delays on children so CSS can use them.
    const children = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    children.forEach((child, i) => {
      child.style.setProperty('--reveal-delay', `${i * staggerMs}ms`)
    })

    if (typeof IntersectionObserver === 'undefined') {
      // SSR / very old browser — just show everything immediately.
      el.classList.add('is-revealed')
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-revealed')
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, staggerMs, enabled])

  return ref
}
