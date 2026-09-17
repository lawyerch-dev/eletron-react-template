import { registerIpcHandler } from '../IpcApiService'
import { modelService } from '../../features/capabilities/models'

/** models 能力：供应商 CRUD + 角色映射 + 连通测试 */
export function registerModelsIpcHandlers(): void {
  registerIpcHandler('models.list_providers', () => modelService.listProviders())
  registerIpcHandler('models.save_provider', (_e, input) =>
    modelService.saveProvider(input.provider),
  )
  registerIpcHandler('models.delete_provider', (_e, input) => {
    modelService.deleteProvider(input.providerId)
  })
  registerIpcHandler('models.list_presets', () => modelService.listPresets())
  registerIpcHandler('models.add_preset', (_e, input) =>
    modelService.addPreset(input.presetId, {
      name: input.name,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
    }),
  )
  registerIpcHandler('models.list_roles', () => modelService.getRoles())
  registerIpcHandler('models.set_role', (_e, input) =>
    modelService.setRole(input.role, input.providerId, input.modelId),
  )
  registerIpcHandler('models.clear_role', (_e, input) => modelService.clearRole(input.role))
  registerIpcHandler('models.test_provider', (_e, input) =>
    modelService.testProvider(input.providerId),
  )
  registerIpcHandler('models.fetch_models', (_e, input) =>
    modelService.fetchModels(input.providerId),
  )
  registerIpcHandler('models.list_public_providers', () => modelService.listPublicProviders())
}
