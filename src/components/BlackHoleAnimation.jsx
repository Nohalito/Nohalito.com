import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createSpaceGradientBackground } from './blackHoleBackgrounds'

/*
  Halo tuning. Radii are fractions of the halo quad's half-width, not world
  units, so changing HALO_SIZE rescales the whole effect without needing these
  retuned.
*/
const BLACK_HOLE_RADIUS = 0.5
const HALO_SIZE = 1.2 // half-width of the quad; the halo reaches 2.4× the sphere
const HALO_INNER_RADIUS = 0.4 // starts just inside the silhouette, so no seam shows
const HALO_FALLOFF = 2.2 // higher = tighter to the sphere
const HALO_STRENGTH = 0.85 // peak brightness at the rim
const HALO_CORE_COLOR = 0xffffff // hottest point, hugging the event horizon
const HALO_EDGE_COLOR = 0x8b5cf6 // --purple, the site's accent

/**
 * A black hole with an accretion disc of spiralling particles.
 *
 * Fills its container, so the container must have a resolved height —
 * otherwise the canvas collapses to zero pixels and nothing appears.
 *
 * @param background Factory producing the scene background, see
 *   `blackHoleBackgrounds.js`. Pass a stable reference (a module-level
 *   function, not an inline arrow) or the scene tears down and rebuilds on
 *   every render.
 */
export default function BlackHoleAnimation({ background = createSpaceGradientBackground }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene setup. Aspect is a placeholder — resize() sets the real one below,
    // once we can measure the container.
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    // Cap the pixel ratio: retina phones report 3+, which triples the pixels
    // shaded for no visible gain on an out-of-focus background.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const { background: sceneBackground, dispose: disposeBackground } = background()
    scene.background = sceneBackground

    // Size to the container rather than the window: the main page mounts this
    // inside a sticky background slot, not a full-screen wrapper.
    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container
      if (width === 0 || height === 0) return

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    resize()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    // Camera positioned on top, southeast, rotated 30° on z-axis
    camera.position.set(3, 4, 2)
    camera.lookAt(0, 0, 0)
    //camera.rotation.z = Math.PI / 6

    // Black hole sphere. Unlit and pure black on purpose: it is an absence of
    // light, so it should be defined by the halo's edge, never by shading.
    const blackHoleGeometry = new THREE.SphereGeometry(BLACK_HOLE_RADIUS, 32, 32)
    const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial)
    scene.add(blackHole)

    /*
      The halo.

      A camera-facing quad rather than a sphere shell. A concentric shell can
      only ever cover the sphere — its silhouette contains the sphere's from
      every angle — so the sphere would never be visible behind it. A quad with
      a radial falloff puts the light *around* the silhouette instead of on top
      of it.

      Additive blending is what makes it read as light: it adds to whatever is
      behind, the way an emissive source does, instead of averaging colours the
      way alpha blending does (which can only ever darken toward the tint).

      `depthWrite: false` keeps it from occluding particles that pass behind it,
      while `depthTest` stays on so the opaque sphere still masks the inner part
      of the quad. That masking is what carves the void out of the middle.
    */
    const haloGeometry = new THREE.PlaneGeometry(HALO_SIZE * 2, HALO_SIZE * 2)
    const haloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        coreColor: { value: new THREE.Color(HALO_CORE_COLOR) },
        edgeColor: { value: new THREE.Color(HALO_EDGE_COLOR) },
        innerRadius: { value: HALO_INNER_RADIUS },
        falloff: { value: HALO_FALLOFF },
        strength: { value: HALO_STRENGTH },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 coreColor;
        uniform vec3 edgeColor;
        uniform float innerRadius;
        uniform float falloff;
        uniform float strength;
        varying vec2 vUv;

        void main() {
          // 0 at the centre of the quad, 1 at its edge.
          float dist = length(vUv - 0.5) * 2.0;

          // Nothing inside the event horizon. Anything drawn here would be
          // hidden by the sphere anyway; discarding is simply cheaper.
          if (dist < innerRadius) discard;

          // 1 hugging the sphere, easing to 0 at the edge of the quad.
          float t = clamp(1.0 - (dist - innerRadius) / (1.0 - innerRadius), 0.0, 1.0);

          // The steep exponent confines white to a thin rim; everything beyond
          // it settles into purple before fading out.
          vec3 color = mix(edgeColor, coreColor, pow(t, 6.0));

          float alpha = pow(t, falloff) * strength;

          // Premultiplied: the renderer runs with premultipliedAlpha (the
          // default), so additive blending is set to ONE/ONE and does not scale
          // by alpha itself. Emitting straight colour here would ignore the
          // falloff entirely and blow the halo out to a flat disc.
          gl_FragColor = vec4(color * alpha, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const halo = new THREE.Mesh(haloGeometry, haloMaterial)
    scene.add(halo)

    /*
      The accretion disc is simulation state only — there is no mesh for the
      particles themselves. Each one is drawn solely as its trail (a THREE.Line
      below), whose newest vertex sits at the particle's position and draws at
      full alpha. That leading vertex *is* the visible head, so a THREE.Points
      on top of it would re-draw a point that is already lit.
    */
    const particles = []
    const particleCount = 150

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = 3 + Math.random() * 2
      const speed = 0.02 + Math.random() * 0.03

      const particle = {
        x: Math.cos(angle) * distance,
        y: (Math.random() - 0.5) * 3,
        z: Math.sin(angle) * distance,
        angle,
        distance,
        speed,
        trail: [],
        maxTrailLength: 30,
        // Stagger initial appearance so particles don't all pop in at once
        spawnDelay: Math.random() * 600,
        age: 0,
      }

      particles.push(particle)
    }

    // Trail lines with fading shader material
    const trailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(color, vAlpha);
        }
      `,
      transparent: true,
    })
    
    const trailCapacity = particles.reduce(
      (longest, particle) => Math.max(longest, particle.maxTrailLength),
      0,
    )

    const trails = particles.map(() => {
      const trailGeometry = new THREE.BufferGeometry()

      const positions = new Float32Array(trailCapacity * 3)
      const alphas = new Float32Array(trailCapacity)

      trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      trailGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))

      const trailLine = new THREE.Line(trailGeometry, trailMaterial)
      scene.add(trailLine)

      return {
        line: trailLine,
        geometry: trailGeometry,
        positions,
        alphas,
        positionAttr: trailGeometry.attributes.position,
        alphaAttr: trailGeometry.attributes.alpha,
      }
    })

    // Animation loop
    let frameId = null

    const animate = () => {
      frameId = requestAnimationFrame(animate)

      particles.forEach((particle) => {
        // Wait out the spawn delay before this particle starts moving/trailing
        particle.age++
        if (particle.age < particle.spawnDelay) return

        // Smooth spiral toward center with gradual approach
        particle.distance *= 0.9970
        particle.angle += particle.speed * 0.9

        particle.x = Math.cos(particle.angle) * particle.distance
        particle.z = Math.sin(particle.angle) * particle.distance
        particle.y *= 0.985

        // Store trail position
        particle.trail.push({ x: particle.x, y: particle.y, z: particle.z })
        if (particle.trail.length > particle.maxTrailLength) {
          particle.trail.shift()
        }

        // Reset particle when it gets too close
        if (particle.distance < 0.4) {
          particle.distance = 3 + Math.random() * 2
          particle.angle = Math.random() * Math.PI * 2
          particle.y = (Math.random() - 0.5) * 3
          particle.trail = []
        }
      })

      // Update trails with fading effect (reusing pre-allocated buffers)
      trails.forEach((trailData, idx) => {
        const particle = particles[idx]
        const { positions, alphas, positionAttr, alphaAttr, line } = trailData

        if (particle.trail.length > 0) {
          // Update pre-allocated buffers
          particle.trail.forEach((pos, i) => {
            positions[i * 3] = pos.x
            positions[i * 3 + 1] = pos.y
            positions[i * 3 + 2] = pos.z
            alphas[i] = i / particle.trail.length
          })

          // Update draw range to match trail length
          line.geometry.setDrawRange(0, particle.trail.length)

          // Mark buffers as needing update
          positionAttr.needsUpdate = true
          alphaAttr.needsUpdate = true
        }
      })

      // Slowly rotate black hole
      blackHole.rotation.x += 0.0001
      blackHole.rotation.y += 0.0002

      // Keep the halo square-on to the camera. Free, and it means the effect
      // survives the camera being moved or animated later.
      halo.quaternion.copy(camera.quaternion)

      renderer.render(scene, camera)
    }

    animate()

    // Full teardown, so a remount (StrictMode double-invokes effects in dev)
    // rebuilds from scratch instead of leaving an orphaned loop running.
    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()

      renderer.domElement.remove()
      renderer.dispose()

      disposeBackground()
      blackHoleGeometry.dispose()
      blackHoleMaterial.dispose()
      haloGeometry.dispose()
      haloMaterial.dispose()
      trailMaterial.dispose()
      trails.forEach((trail) => trail.geometry.dispose())
    }
  }, [background])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', margin: 0, padding: 0 }} />
}
