'use client'
import { useEffect, useState } from 'react'

/** Animates a purely-numeric string up from 0 once `start` flips true. Non-numeric values (e.g. "Base") pass through unchanged. */
export function useCountUp(target: string, start: boolean, duration = 900): string {
  const numeric = /^\d+$/.test(target)
  const [value, setValue] = useState(numeric ? '0' : target)

  useEffect(() => {
    if (!numeric) { setValue(target); return }
    if (!start) return
    const end = parseInt(target, 10)
    const startTime = performance.now()
    let raf: number
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(String(Math.round(eased * end)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, numeric, target, duration])

  return value
}
