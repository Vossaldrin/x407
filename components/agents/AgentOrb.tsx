'use client'
// Plain imperative Three.js — deliberately NOT @react-three/fiber. R3F's
// react-reconciler reaches into React's legacy internals
// (__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED), which Next.js's own
// vendored React copy (next/dist/compiled/react) no longer exposes, crashing
// on `ReactSharedInternals.ReactCurrentOwner` the moment the client chunk
// evaluates. A raw Three.js scene never touches React internals, so it
// sidesteps that incompatibility entirely.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { AgentStatus } from '@/lib/store'
import { StaticFallback } from './OrbFallback'
import { addOrbShading } from './orb-shading'

// Status maps to rotation speed and glow strength on a properly lit sphere —
// the old per-vertex wobble made the orb read as a 2D shape-shifting blob, so
// it's gone; `glow` drives the shared fresnel/halo rig instead.
const ENERGY: Record<AgentStatus, { speed: number; emissive: number; glow: number; opacity: number }> = {
  active:  { speed: 1.1,  emissive: 0.25, glow: 1,    opacity: 1 },
  idle:    { speed: 0.4,  emissive: 0.15, glow: 0.6,  opacity: 0.85 },
  paused:  { speed: 0.12, emissive: 0.08, glow: 0.3,  opacity: 0.55 },
  expired: { speed: 0.04, emissive: 0.05, glow: 0.15, opacity: 0.4 },
}

export default function AgentOrb({ color, status }: { color: string; status: AgentStatus }) {
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

    const energy = ENERGY[status] ?? ENERGY.idle
    const size = container.clientWidth || 150
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
    camera.position.z = 3

    const rig = addOrbShading(scene, color, { shellRadius: 1.16, haloScale: 2.2, glow: energy.glow })

    // SphereGeometry, not IcosahedronGeometry: a UV-sphere reads as reliably
    // round under moving specular light, where even a heavily-subdivided
    // icosahedron can still show faceted highlights.
    const geometry = new THREE.SphereGeometry(1, 48, 48)
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: energy.emissive,
      roughness: 0.3,
      metalness: 0.05,
      transparent: true,
      opacity: energy.opacity,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    let frameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const t = clock.getElapsedTime() * energy.speed

      mesh.rotation.x = t * 0.2
      mesh.rotation.y = t * 0.3
      rig.tick(t)

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      geometry.dispose()
      material.dispose()
      rig.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [color, status])

  if (failed) return <StaticFallback color={color} />
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
