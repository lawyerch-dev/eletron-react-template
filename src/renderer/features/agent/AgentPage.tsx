import { useCallback, useEffect, useState } from 'react'
import { Bot, Loader2, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { agentService, skillsService } from '@/services'
import type { AgentChatTurn, SkillPack } from '@ert/shared/types'

export function AgentPage() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<AgentChatTurn[]>([])
  const [input, setInput] = useState('')
  const [skills, setSkills] = useState<SkillPack[]>([])
  const [skillId, setSkillId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void skillsService
      .list()
      .then((list) => setSkills(list.filter((s) => s.isActive)))
      .catch(() => setSkills([]))
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return
    const nextMessages: AgentChatTurn[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setBusy(true)
    try {
      const result = await agentService.chat({
        messages: nextMessages,
        skillId: skillId || undefined,
      })
      if (!result.ok) {
        toast.error(result.error || t('agent.fail'))
        setMessages([
          ...nextMessages,
          { role: 'assistant', content: `[error] ${result.error || t('agent.fail')}` },
        ])
        return
      }
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: result.content || '',
        },
      ])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }, [busy, input, messages, skillId, t])

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Bot className="h-6 w-6 text-accent" />
            {t('agent.title')}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('agent.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">{t('agent.no_skill')}</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMessages([])}
            className="rounded-xl border border-border-default px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
          >
            <Trash2 className="mr-1 inline h-4 w-4" />
            {t('agent.clear')}
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-auto rounded-2xl border border-border-default bg-surface p-4">
        {messages.length === 0 && (
          <p className="text-sm text-foreground-muted">{t('agent.empty')}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-accent text-accent-foreground'
                : 'bg-background text-foreground border border-border-default'
            }`}
          >
            <div className="mb-1 text-[10px] uppercase tracking-wider opacity-70">
              {m.role === 'user' ? t('agent.you') : t('agent.assistant')}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('agent.thinking')}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          rows={2}
          placeholder={t('agent.input_ph')}
          className="min-h-[72px] flex-1 resize-none rounded-xl border border-border-default bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          className="self-end rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
