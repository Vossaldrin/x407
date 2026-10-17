'use client'
// The brand card as an actual 3D object — the logo PNG texture-mapped onto a
// plane, slowly flipping like a payment card being turned over. Used in the
// landing page's final CTA. Plain imperative Three.js, same reasoning as
// AgentOrb.tsx's header for avoiding @react-three/fiber.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function LogoCard3D({ size = 150 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      // WebGL unavailable — the static <img> fallback below stays visible.
      return
    }
    const fallback = container.querySelector('img')
    if (fallback) fallback.style.display = 'none'

    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
    camera.position.z = 3

    const texture = new THREE.TextureLoader().load('/brand/logo-card-double-arc.png')
    texture.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), material)
    scene.add(mesh)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let frameId: number
    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime()
      mesh.rotation.y = t * 0.8
      mesh.rotation.x = Math.sin(t * 0.6) * 0.12
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    if (prefersReducedMotion) {
      // One static frame once the texture is in.
      texture.onUpdate = () => renderer.render(scene, camera)
      renderer.render(scene, camera)
    } else {
      animate()
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      mesh.geometry.dispose()
      material.dispose()
      texture.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
      if (fallback) fallback.style.display = 'block'
    }
  }, [size])

  return (
    <div ref={containerRef} style={{ width: size, height: size, margin: '0 auto' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-card-double-arc.png" alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
    </div>
  )
}
