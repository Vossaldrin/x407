'use client'
// Cheap sibling of AgentOrb.tsx, for places that render several orbs at once
// (marketplace grid, create-agent preview). No per-vertex displacement loop
// and a lower-detail geometry — just rotation + a gentle emissive pulse, so
// 6-12 simultaneous instances stay light. Same plain-Three.js approach as
// AgentOrb (see that file for why @react-three/fiber is avoided here).
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { StaticFallback } from './OrbFallback'
import { addOrbShading } from './orb-shading'

export default function OrbIcon({ color }: { color: string }) {
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

    const size = container.clientWidth || 44
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
    // Pulled back from 2.6 so the shading rig's fresnel shell and halo fit the
    // square canvas instead of clipping at the edges.
    camera.position.z = 3.1

    const rig = addOrbShading(scene, color, { shellRadius: 1.12, haloScale: 2.0 })

    // SphereGeometry, not IcosahedronGeometry: no per-vertex JS work happens
    // here (just whole-mesh rotation + a material scalar), so vertex count is
    // pure GPU cost — trivial even at high segment counts, and a UV-sphere
    // reads as reliably round under specular light where a subdivided
    // icosahedron can still show faceted highlights.
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.18, roughness: 0.3, metalness: 0.05,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    let frameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const t = clock.getElapsedTime()
      mesh.rotation.x = t * 0.25
      mesh.rotation.y = t * 0.35
      material.emissiveIntensity = 0.16 + Math.sin(t * 1.4) * 0.06
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
  }, [color])

  if (failed) return <StaticFallback color={color} />
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
