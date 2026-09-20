import { useCallback, useEffect, useState } from 'react'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { agentService, skillsService } from '@/services'
import type { AgentChatTurn, SkillPack } from '@ert/shared/types'
import { Btn, inputCls } from '@/shell/ui'

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
      setMessages([...nextMessages, { role: 'assistant', content: result.content || '' }])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }, [busy, input, messages, skillId, t])

  return (
    <div className="mx-auto flex h-[calc(100vh-2.5rem)] max-w-3xl flex-col">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t('agent.title')}
          </h1>
          <p className="text-[13px] text-foreground-secondary">{t('agent.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className={`${inputCls} w-40`}
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
          >
            <option value="">{t('agent.no_skill')}</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Btn onClick={() => setMessages([])}>
            <Trash2 className="h-3.5 w-3.5" />
            {t('agent.clear')}
          </Btn>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-border-default bg-surface p-4">
        {messages.length === 0 && (
          <div className="m-auto max-w-xs text-center text-[13px] text-foreground-muted">
            {t('agent.empty')}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto bg-accent text-accent-foreground'
                : 'border border-border-default bg-surface-2 text-foreground'
            }`}
          >
            <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider opacity-65">
              {m.role === 'user' ? t('agent.you') : t('agent.assistant')}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-[13px] text-foreground-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('agent.thinking')}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          className={`${inputCls} min-h-[64px] flex-1 resize-none py-2`}
          rows={2}
          value={input}
          placeholder={t('agent.input_ph')}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
        />
        <Btn
          variant="primary"
          disabled={busy || !input.trim()}
          className="h-9 w-9 !px-0"
          onClick={() => void send()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Btn>
      </div>
    </div>
  )
}
