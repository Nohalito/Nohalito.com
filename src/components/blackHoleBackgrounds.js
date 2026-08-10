import * as THREE from 'three'

/**
 * Background factories for <BlackHoleAnimation />.
 *
 * Each factory returns:
 *   - `background`: the value assigned to `scene.background`. `null` leaves the
 *     scene transparent, so whatever sits behind the canvas shows through.
 *   - `dispose()`: releases any GPU resource the factory allocated. The
 *     animation calls this on unmount.
 *
 * These are plain functions rather than React components on purpose:
 * `scene.background` is a Three.js resource, not a DOM node, so there is
 * nothing for React to render or reconcile. Keeping them as factories also
 * makes the ownership obvious — whoever creates the texture disposes it.
 */

/**
 * The original test-page look: a vertical purple-to-near-black gradient baked
 * into a small canvas texture. Self-contained, so the animation reads as a
 * finished scene even on a bare page.
 */
export function createSpaceGradientBackground() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#2a1a4a')
  gradient.addColorStop(0.5, '#1a1a3e')
  gradient.addColorStop(1, '#0a0a1a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)

  return {
    background: texture,
    dispose: () => texture.dispose(),
  }
}

/**
 * No background at all. Combined with the renderer's `alpha: true`, the canvas
 * composites over whatever is beneath it in the DOM — which is what the main
 * page needs, so the page's own base colour shows through instead of the
 * gradient above.
 */
export function createTransparentBackground() {
  return {
    background: null,
    dispose: () => {},
  }
}
