import { Component } from 'react'

/**
 * Contains a crash to one subtree instead of letting it unmount the page.
 *
 * Used around the WebGL background: creating a WebGL context is allowed to
 * fail (blocklisted drivers, locked-down machines, too many live contexts), and
 * an error thrown inside an effect propagates upward. Without a boundary, a
 * decorative background can blank out the content it decorates.
 *
 * Error boundaries have no hook equivalent — `getDerivedStateFromError` and
 * `componentDidCatch` only exist on class components. This is the one place a
 * class is still the correct tool in a modern React codebase.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // Logged once, at the moment of failure — not per frame.
    console.warn('[ErrorBoundary] Subtree failed, showing fallback instead.', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
