'use client'
// "The Core" — the landing hero's signature visual. Same plain-Three.js
// approach as components/agents/AgentOrb.tsx (see that file for why
// @react-three/fiber is avoided here — same reasoning applies), extended
// with cursor and scroll reactivity that AgentOrb doesn't need.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { StaticFallback } from '@/components/agents/OrbFallback'
import { addOrbShading } from '@/components/agents/orb-shading'

// A true lit sphere — no vertex wobble (that read as a 2D shape-shifting
// blob), no wireframe overlay (read as borders), low emissive so the key
// light's shading defines the form, and the shared fresnel/halo rig for the
// neon glow. Rotation shows only in the drifting specular highlight.
const SPEED = 0.5
const EMISSIVE = 0.18

export default function CoreOrb({ color }: { color: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      setFailed(true)
      return
    }

    const size = container.clientWidth || 300
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
    camera.position.z = 3

    const rig = addOrbShading(scene, color, { shellRadius: 1.18, haloScale: 2.3 })

    const geometry = new THREE.SphereGeometry(1, 48, 48)
    const material = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: EMISSIVE,
      roughness: 0.3, metalness: 0.05,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Reduced motion: keep the orb visible and lit, skip the continuous
    // wobble/rotation/tilt loop entirely rather than animating anyway.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      renderer.render(scene, camera)
      return () => {
        geometry.dispose(); material.dispose()
        rig.dispose(); renderer.dispose()
        container.removeChild(renderer.domElement)
      }
    }

    // Self-contained pointer tracking — deliberately separate from the
    // --mx/--my CSS vars driving .hero-glow-follow in app/page.tsx; that
    // keeps running unchanged, this is its own independent reactive layer.
    let targetTiltX = 0, targetTiltY = 0
    let tiltX = 0, tiltY = 0
    const onPointerMove = (e: PointerEvent) => {
      targetTiltX = (e.clientY / window.innerHeight - 0.5) * 0.6
      targetTiltY = (e.clientX / window.innerWidth - 0.5) * 0.6
    }
    window.addEventListener('pointermove', onPointerMove)

    let frameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const t = clock.getElapsedTime() * SPEED

      // Scroll-driven: 0 while the hero is fully on screen, approaching 1 as
      // it scrolls past the top of the viewport — recede and spin away.
      const rect = container.getBoundingClientRect()
      const scrollProgress = THREE.MathUtils.clamp(-rect.top / Math.max(rect.height, 1), 0, 1)

      tiltX += (targetTiltX - tiltX) * 0.04
      tiltY += (targetTiltY - tiltY) * 0.04

      mesh.rotation.x = t * 0.15 + tiltX
      mesh.rotation.y = t * 0.22 + tiltY + scrollProgress * 1.4
      mesh.scale.setScalar(1 - scrollProgress * 0.35)
      mesh.position.z = -scrollProgress * 1.2
      material.opacity = 1 - scrollProgress * 0.6
      material.transparent = true
      rig.tick(t)
      rig.setGlow(1 - scrollProgress * 0.7)

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', onPointerMove)
      geometry.dispose()
      material.dispose()
      rig.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [color])

  if (failed) return <StaticFallback color={color} />
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
