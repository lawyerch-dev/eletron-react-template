import type { ReactNode } from 'react'

/** 统一主按钮 */
export function Btn({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  className = '',
  type = 'button',
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  title?: string
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-accent text-accent-foreground hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40',
    secondary:
      'bg-surface text-foreground-secondary border border-border-default hover:bg-surface-hover active:scale-[0.98] disabled:opacity-40',
    ghost:
      'text-foreground-secondary hover:bg-surface-hover active:scale-[0.98] disabled:opacity-40',
    danger:
      'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15 active:scale-[0.98] disabled:opacity-40',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

/** 页面壳：标题 + 描述 + 操作，内容区统一宽度与节奏 */
export function PageShell({
  title,
  description,
  hint,
  actions,
  children,
  width = 'max-w-3xl',
}: {
  title: string
  description?: string
  hint?: string
  actions?: ReactNode
  children: ReactNode
  width?: string
}) {
  return (
    <div className={`mx-auto ${width} space-y-5 pb-8`}>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-[13px] leading-relaxed text-foreground-secondary">{description}</p>
          )}
          {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  )
}

/** 分区卡片：设置页/列表页统一容器 */
export function SectionCard({
  title,
  description,
  actions,
  children,
  padded = true,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  padded?: boolean
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-default bg-surface">
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-border-default px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            {title && <h2 className="text-[13px] font-medium text-foreground">{title}</h2>}
            {description && (
              <p className="text-xs leading-relaxed text-foreground-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  )
}

/** 空态 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-default bg-surface-2/50 px-6 py-10 text-center">
      <div className="text-[13px] font-medium text-foreground">{title}</div>
      {description && (
        <p className="max-w-sm text-xs leading-relaxed text-foreground-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** 列表行 */
export function ListRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-border-default px-4 py-3 last:border-b-0 ${className}`}
    >
      {children}
    </div>
  )
}

/** 徽章 */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-surface-2 text-foreground-muted',
    accent: 'bg-accent-subtle text-accent',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/12 text-warning',
    danger: 'bg-danger/12 text-danger',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/** 表单字段 */
export function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-medium text-foreground-secondary">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg border border-border-default bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-foreground-muted'

export const textareaCls =
  'w-full rounded-lg border border-border-default bg-background px-2.5 py-2 font-mono text-[13px] leading-relaxed text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-foreground-muted'
