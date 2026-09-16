import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Copy } from 'lucide-react'
import { translations, type Language } from '@/shared/i18n'

/** ErrorBoundary 无法使用 hooks，直接读当前语言 */
function et(key: string): string {
  const lang =
    (typeof document !== 'undefined' && (document.documentElement.lang as Language)) ||
    ((typeof localStorage !== 'undefined' && localStorage.getItem('language')) as Language) ||
    'zh-CN'
  const dict = translations[lang] || translations['zh-CN']
  return dict[key] || key
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleCopy = () => {
    const text = `${this.state.error?.message}\n\n${this.state.error?.stack}`
    navigator.clipboard.writeText(text)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {et('error.boundary.title')}
                </h1>
                <p className="text-sm text-foreground-muted">{et('error.boundary.desc')}</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-surface-hover p-4">
              <p className="font-mono text-sm break-all text-red-600 dark:text-red-300">
                {this.state.error?.message}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-medium text-accent-foreground transition hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" />
                {et('error.boundary.reload')}
              </button>
              <button
                onClick={this.handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl border border-border-default px-4 py-2.5 text-foreground-secondary transition hover:bg-surface-hover"
              >
                <Copy className="h-4 w-4" />
                {et('error.boundary.copy')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
