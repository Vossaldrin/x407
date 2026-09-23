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

const ENERGY: Record<AgentStatus, { speed: number; amplitude: number; emissive: number; opacity: number }> = {
  active:  { speed: 1.1, amplitude: 0.16, emissive: 0.9, opacity: 1 },
  idle:    { speed: 0.4, amplitude: 0.09, emissive: 0.4, opacity: 0.85 },
  paused:  { speed: 0.12, amplitude: 0.04, emissive: 0.15, opacity: 0.55 },
  expired: { speed: 0.04, amplitude: 0.02, emissive: 0.08, opacity: 0.4 },
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pointLight = new THREE.PointLight(color, 1.5)
    pointLight.position.set(2, 2, 2)
    scene.add(pointLight)

    const geometry = new THREE.IcosahedronGeometry(1, 4)
    const basePositions = geometry.attributes.position.array.slice()
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: energy.emissive,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: energy.opacity,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    let frameId: number
    const clock = new THREE.Clock()
    const v = new THREE.Vector3()

    const animate = () => {
      const t = clock.getElapsedTime() * energy.speed
      const pos = geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const ox = basePositions[i * 3]
        const oy = basePositions[i * 3 + 1]
        const oz = basePositions[i * 3 + 2]
        v.set(ox, oy, oz)
        const wobble = 1 + energy.amplitude * (
          Math.sin(ox * 3.5 + t * 2) + Math.sin(oy * 4 + t * 2.3) + Math.sin(oz * 3 + t * 1.7)
        ) / 3
        v.multiplyScalar(wobble)
        pos.setXYZ(i, v.x, v.y, v.z)
      }
      pos.needsUpdate = true
      geometry.computeVertexNormals()

      mesh.rotation.x = t * 0.2
      mesh.rotation.y = t * 0.3

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [color, status])

  if (failed) return <StaticFallback color={color} />
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
