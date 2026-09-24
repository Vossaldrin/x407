'use client'
// Cheap sibling of AgentOrb.tsx, for places that render several orbs at once
// (marketplace grid, create-agent preview). No per-vertex displacement loop
// and a lower-detail geometry — just rotation + a gentle emissive pulse, so
// 6-12 simultaneous instances stay light. Same plain-Three.js approach as
// AgentOrb (see that file for why @react-three/fiber is avoided here).
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { StaticFallback } from './OrbFallback'

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
    camera.position.z = 2.6

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const pointLight = new THREE.PointLight(color, 1.4)
    pointLight.position.set(2, 2, 2)
    scene.add(pointLight)

    const geometry = new THREE.IcosahedronGeometry(1, 1)
    const material = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    let frameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const t = clock.getElapsedTime()
      mesh.rotation.x = t * 0.25
      mesh.rotation.y = t * 0.35
      material.emissiveIntensity = 0.5 + Math.sin(t * 1.4) * 0.25
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
  }, [color])

  if (failed) return <StaticFallback color={color} />
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
