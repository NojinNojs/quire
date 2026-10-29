import { Component, type ErrorInfo, Fragment, type ReactNode } from "react";

type State = { failed: boolean; generation: number };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, generation: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Quire could not render the app", error, {
      componentStack: info.componentStack,
    });
  }

  retry = () => {
    this.setState(({ generation }) => ({ failed: false, generation: generation + 1 }));
  };

  render() {
    if (this.state.failed) {
      return (
        <main className="shell error-fallback" role="alert">
          <h1>Quire could not open this screen</h1>
          <p>Your saved books are still in your account. Try opening the screen again.</p>
          <button type="button" className="primary" onClick={this.retry}>
            Try again
          </button>
        </main>
      );
    }
    return <Fragment key={this.state.generation}>{this.props.children}</Fragment>;
  }
}
