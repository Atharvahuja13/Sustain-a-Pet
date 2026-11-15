import { Component } from 'react'

/** A missing texture or unavailable WebGL must never hide the journal and saved game. */
export default class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <div className="scene-fallback" role="status"><strong>Your garden is resting.</strong><p>The 3D view could not load. Your progress is safe. Use the journal to keep playing.</p><button onClick={() => this.setState({ failed: false })}>Retry 3D view</button></div>
      : this.props.children
  }
}
