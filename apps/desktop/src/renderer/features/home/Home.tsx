import { useState } from 'react'
import { toast } from 'sonner'
import UpdateElectron from '@/features/update'
import logoVite from '@/assets/logo-vite.svg'
import logoElectron from '@/assets/logo-electron.svg'
import logoTailwind from '@/assets/logo-tailwindcss.svg'
import { useLanguage } from '@/app/contexts/LanguageContext'

export function Home() {
  const [count, setCount] = useState(0)
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-4xl border border-border-default bg-surface/90 shadow-[0_24px_70px_-40px_rgba(14,116,144,0.35)] backdrop-blur">
        <div className="flex flex-col justify-between gap-8 p-6 md:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-subtle px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-accent">
              {t('home.badge')}
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {t('home.hero.title')}
              </h1>
              <p className="text-base leading-7 text-foreground-secondary sm:text-lg">
                {t('home.hero.desc')}
              </p>
            </div>
          </div>

          {/* 双按钮：仓库 + 检查更新 */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://github.com/BluerAngala/electron-react-template"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-center gap-3 rounded-2xl border border-border-default bg-surface p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
            >
              <span className="relative flex h-8 w-8 items-center justify-center">
                <img src={logoVite} className="h-6 w-6" alt="Vite logo" />
                <img
                  src={logoElectron}
                  className="absolute h-6 w-6 motion-safe:animate-spin [animation-duration:20s]"
                  alt="Electron logo"
                />
              </span>
              <span className="text-sm font-semibold text-foreground-secondary transition-colors group-hover:text-accent">
                {t('home.hero.repo')}
              </span>
            </a>
            <UpdateElectron />
          </div>
        </div>
      </section>

      {/* 计数器 — 横向 */}
      <section className="flex items-center justify-between rounded-4xl border border-border-default bg-surface/90 p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="flex items-center gap-4">
          <img src={logoTailwind} className="h-6 w-6 opacity-90" alt="Tailwind CSS logo" />
          <span className="text-sm uppercase tracking-[0.3em] text-foreground-muted">
            {t('home.counter.title')}
          </span>
          <span className="text-4xl font-semibold text-foreground">{count}</span>
        </div>
        <button
          onClick={() => {
            setCount((v) => v + 1)
            toast.success(`${t('common.success')}: ${count + 1}`)
          }}
          className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background"
        >
          {t('home.counter.btn')}
        </button>
      </section>
    </div>
  )
}
