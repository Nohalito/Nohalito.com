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
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })

    // Cap the pixel ratio: retina phones report 3+, which triples the pixels
    // shaded for no visible gain on an out-of-focus background.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
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
      particles themselves. Each one is drawn solely as its trail (a run of
      segments in the shared LineSegments below), whose newest vertex sits at
      the particle's position and draws at full alpha. That leading vertex *is*
      the visible head, so a THREE.Points on top of it would re-draw a point
      that is already lit.
    */
    const particles = []
    const particleCount = 75

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

    // One shared material across every trail — and, below, one shared geometry.
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
    
    /*
      Every trail lives in a single LineSegments rather than one THREE.Line
      apiece. A trail per object cost a draw call and two buffer uploads each —
      at 75 particles, 77 draw calls and 150 uploads per frame, where the bytes
      were negligible and the per-call driver overhead was the whole expense.

      LineSegments rather than Line is what makes the merge possible at all:
      Line draws a *connected* strip, so one holding every trail would join the
      last point of each to the first point of the next with a stray segment
      flung across the scene. LineSegments reads its vertices in independent
      pairs, so segments that happen to share a buffer stay unrelated.

      Capacity is summed per particle rather than assumed uniform, so a particle
      carrying a different maxTrailLength still gets room: n points make n-1
      segments, and each segment brings its own two vertices.
    */
    const vertexCapacity = particles.reduce(
      (total, particle) => total + (particle.maxTrailLength - 1) * 2,
      0,
    )

    const trailPositions = new Float32Array(vertexCapacity * 3)
    const trailAlphas = new Float32Array(vertexCapacity)

    // DynamicDrawUsage tells the driver this buffer is rewritten every frame,
    // so it is kept somewhere cheap to update rather than parked as geometry
    // that was meant to be uploaded once.
    const trailPositionAttr = new THREE.BufferAttribute(trailPositions, 3)
      .setUsage(THREE.DynamicDrawUsage)
    const trailAlphaAttr = new THREE.BufferAttribute(trailAlphas, 1)
      .setUsage(THREE.DynamicDrawUsage)

    const trailGeometry = new THREE.BufferGeometry()
    trailGeometry.setAttribute('position', trailPositionAttr)
    trailGeometry.setAttribute('alpha', trailAlphaAttr)

    const trailLines = new THREE.LineSegments(trailGeometry, trailMaterial)

    /*
      The buffer is rewritten every frame, but its bounding sphere would be
      derived once — from whatever sat in it at first render, which is all
      zeros. Three would then cull the entire disc the moment the origin left
      the frustum. The trails span the scene and are never off screen, so the
      test can only ever be wrong here; dropping it is both correct and free.
    */
    trailLines.frustumCulled = false
    scene.add(trailLines)

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

      /*
        Repack every live segment into the front of the shared buffer.

        Trails vary in length — spawns are staggered, and a reset empties one
        outright — so a fixed slot per particle would leave holes, and
        `setDrawRange` can only draw a contiguous prefix; it has no way to skip.
        Writing compacted from zero and reporting the running count is what lets
        all of them share one draw call.

        This also retires a one-frame artefact the per-line version had: a reset
        trail kept drawing its stale vertices until it refilled, because the
        update was guarded on `length > 0` while the draw range stayed put. Here
        an empty trail simply contributes nothing to the count.
      */
      let vertexCount = 0

      for (let p = 0; p < particles.length; p++) {
        const trail = particles[p].trail

        // n points make n-1 segments, so 0 or 1 point draws nothing.
        for (let i = 0; i < trail.length - 1; i++) {
          const from = trail[i]
          const to = trail[i + 1]

          trailPositions[vertexCount * 3] = from.x
          trailPositions[vertexCount * 3 + 1] = from.y
          trailPositions[vertexCount * 3 + 2] = from.z
          /*
            The same ramp as the strip version: index over length, so the oldest
            point is transparent and the head sits just under full opacity. Each
            segment interpolates between its own two ends, which is exactly what
            the strip did across its shared vertices — so writing the ramp twice
            per point reproduces the old gradient rather than approximating it.
          */
          trailAlphas[vertexCount] = i / trail.length
          vertexCount++

          trailPositions[vertexCount * 3] = to.x
          trailPositions[vertexCount * 3 + 1] = to.y
          trailPositions[vertexCount * 3 + 2] = to.z
          trailAlphas[vertexCount] = (i + 1) / trail.length
          vertexCount++
        }
      }

      trailGeometry.setDrawRange(0, vertexCount)
      trailPositionAttr.needsUpdate = true
      trailAlphaAttr.needsUpdate = true

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
      trailGeometry.dispose()
    }
  }, [background])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', margin: 0, padding: 0 }} />
}
