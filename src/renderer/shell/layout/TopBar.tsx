interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="relative flex h-14 items-center border-b border-border-default bg-surface px-6">
      <div className="w-16 shrink-0" />
      <h1 className="absolute inset-x-0 text-center text-base font-semibold text-foreground">
        {title}
      </h1>
    </header>
  )
}
