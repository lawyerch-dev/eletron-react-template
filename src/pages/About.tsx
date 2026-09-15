import { useLanguage } from '@/contexts/LanguageContext'
import { Plug } from 'lucide-react'

export function About() {
  const { t } = useLanguage()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('about.title')}</h2>
        <p className="mt-1 text-sm text-foreground-muted">{t('about.desc')}</p>
      </div>

      <section className="rounded-2xl border border-border-default bg-surface p-6">
        <h3 className="text-lg font-semibold text-foreground">{t('about.name')}</h3>
        <p className="mt-2 text-sm text-foreground-secondary">{t('about.intro')}</p>

        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground-muted">
            {t('about.stack')}
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['Electron 42', 'React 19', 'TypeScript 6', 'Vite 8', 'TailwindCSS v4', 'pnpm'].map(
              (tech) => (
                <div
                  key={tech}
                  className="rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-center text-sm text-foreground-secondary"
                >
                  {tech}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a
            href="https://github.com/BluerAngala/eletron-react-template"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center rounded-xl border border-border-default bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {t('about.repo')}
          </a>
          <a
            href="https://bluerangala.github.io/eletron-react-template/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center rounded-xl border border-border-default bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {t('about.docs')}
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-border-default bg-surface p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
            <Plug className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('about.pluginMarket')}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm text-foreground-secondary">{t('about.pluginMarketDesc')}</p>
      </section>
    </div>
  )
}
