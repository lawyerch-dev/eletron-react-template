import log from 'electron-log/main'
import type { AgentChatInput, AgentChatResult, ChatMessage } from '@ert/shared/types'
import { modelService } from '../models'
import { skillService } from '../skills'

/**
 * 薄版 Agent：技能 system 注入 + 多轮 complete。
 * 工具循环（MCP ReAct）预留，业务可在此扩展。
 */
class AgentService {
  async chat(input: AgentChatInput): Promise<AgentChatResult> {
    const started = Date.now()
    try {
      if (!input.messages?.length) throw new Error('messages 不能为空')

      let systemParts: string[] = []
      let skillName: string | undefined
      if (input.skillId) {
        const skill = skillService.get(input.skillId)
        if (!skill) throw new Error('技能不存在: ' + input.skillId)
        if (!skill.isActive) throw new Error('技能已停用: ' + skill.name)
        if (skill.systemPrompt?.trim()) systemParts.push(skill.systemPrompt.trim())
        skillName = skill.name
        if (skill.mcpTools?.length) {
          systemParts.push(`可用 MCP 工具（业务层可调用）: ${skill.mcpTools.join(', ')}`)
        }
      }

      const messages: ChatMessage[] = []
      if (systemParts.length) {
        messages.push({ role: 'system', content: systemParts.join('\n\n') })
      }
      // 过滤调用方自带 system，避免重复
      for (const m of input.messages) {
        if (m.role === 'system') continue
        messages.push({ role: m.role, content: m.content })
      }

      const result = await modelService.completeChat({
        role: input.role || 'default-assistant',
        messages,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      })

      return {
        ok: result.ok,
        content: result.content,
        error: result.error,
        providerId: result.providerId,
        modelId: result.modelId,
        latencyMs: result.latencyMs ?? Date.now() - started,
        skillName,
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      log.warn('[agent] chat failed', message)
      return { ok: false, error: message, latencyMs: Date.now() - started }
    }
  }
}

export const agentService = new AgentService()
