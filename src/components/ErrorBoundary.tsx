import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-background">
          <div className="max-w-lg space-y-3">
            <h1 className="text-base font-semibold text-destructive">Something went wrong</h1>
            <pre className="rounded-md bg-muted p-4 text-xs overflow-auto text-muted-foreground">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
            <button
              className="text-sm underline text-muted-foreground"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
