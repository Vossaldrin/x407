// Shared shading rig for the orb components (CoreOrb, AgentOrb, OrbIcon):
// a white key light that actually carves the sphere, a brand-colored fill, a
// fresnel atmosphere shell, and a soft halo sprite. This is what makes the orbs
// read as lit 3D spheres — the first pass leaned on a high emissive instead,
// which flattened the shading into a 2D glowing disc. Plain Three.js, same
// no-@react-three/fiber reasoning as AgentOrb's header comment.
import * as THREE from 'three'

function makeHaloTexture(color: string): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  const c = new THREE.Color(color)
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`
  g.addColorStop(0, `rgba(${rgb},0.55)`)
  g.addColorStop(0.4, `rgba(${rgb},0.18)`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

export interface OrbRig {
  /** Call each frame with elapsed seconds — pulses the halo. */
  tick: (t: number) => void
  /** Scales halo + rim brightness together (status energy, scroll fade…). */
  setGlow: (glow: number) => void
  dispose: () => void
}

export function addOrbShading(
  scene: THREE.Scene,
  color: string,
  opts: { shellRadius?: number; haloScale?: number; glow?: number } = {},
): OrbRig {
  const { shellRadius = 1.16, haloScale = 2.2, glow = 1 } = opts

  // Three-point rig: the white key is what gives the sphere its light/shadow
  // gradient; the colored fill keeps the shadow side on-brand instead of black.
  const key = new THREE.DirectionalLight(0xffffff, 1.3)
  key.position.set(2.2, 2.6, 3)
  const fill = new THREE.PointLight(color, 0.8)
  fill.position.set(-2.5, -1.2, 2)
  const ambient = new THREE.AmbientLight(0xffffff, 0.35)
  scene.add(key, fill, ambient)

  // Fresnel atmosphere — transparent face, bright rim. BackSide on a slightly
  // larger sphere so the glow hugs the silhouette.
  const shellMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: 0.6 * glow },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float f = 1.0 - abs(dot(vNormal, vView));
        // Band, not ramp: (1 - f^10) pulls the glow back to zero at the
        // geometric silhouette, so the shell fades out instead of ending in a
        // hard visible ring at its own edge.
        float band = pow(f, 2.5) * (1.0 - pow(f, 10.0)) * 1.8;
        gl_FragColor = vec4(uColor, band * uStrength);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  })
  const shellGeometry = new THREE.SphereGeometry(shellRadius, 48, 48)
  const shell = new THREE.Mesh(shellGeometry, shellMaterial)
  scene.add(shell)

  const haloTexture = makeHaloTexture(color)
  const haloMaterial = new THREE.SpriteMaterial({
    map: haloTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.35 * glow,
  })
  const halo = new THREE.Sprite(haloMaterial)
  halo.scale.setScalar(haloScale)
  halo.position.z = -0.5
  scene.add(halo)

  let currentGlow = glow
  return {
    tick: (t: number) => {
      haloMaterial.opacity = (0.3 + Math.sin(t * 1.3) * 0.07) * currentGlow
    },
    setGlow: (g: number) => {
      currentGlow = g
      shellMaterial.uniforms.uStrength.value = 0.6 * g
      haloMaterial.opacity = 0.35 * g
    },
    dispose: () => {
      shellGeometry.dispose()
      shellMaterial.dispose()
      haloMaterial.dispose()
      haloTexture.dispose()
    },
  }
}
