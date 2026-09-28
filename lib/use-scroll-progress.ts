'use client'
import { useEffect, useRef, useState } from 'react'

/** Tracks how far an element has scrolled through the viewport, as 0-1: 0
 * when its top just reaches the bottom of the viewport, 1 once its bottom
 * has reached the top. Event-driven + rAF-throttled, not a busy loop. */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let ticking = false

    const compute = () => {
      const rect = el.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      const scrolled = window.innerHeight - rect.top
      setProgress(Math.min(Math.max(scrolled / total, 0), 1))
      ticking = false
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return { ref, progress }
}
