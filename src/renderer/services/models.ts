import type {
  ModelProviderConfig,
  ModelProviderPreset,
  ModelRole,
  ModelRoleAssignment,
  ModelRolesMap,
  ModelTestResult,
  PublicModelProvider,
} from '@ert/shared/types'
import { ipcApi } from '@/ipc'

export const modelsService = {
  listProviders: (): Promise<ModelProviderConfig[]> =>
    ipcApi.request('models.list_providers', undefined as void),
  saveProvider: (provider: ModelProviderConfig): Promise<ModelProviderConfig> =>
    ipcApi.request('models.save_provider', { provider }),
  deleteProvider: (providerId: string): Promise<void> =>
    ipcApi.request('models.delete_provider', { providerId }),
  listPresets: (): Promise<ModelProviderPreset[]> =>
    ipcApi.request('models.list_presets', undefined as void),
  addPreset: (presetId: string, options?: { name?: string; apiKey?: string; baseUrl?: string }) =>
    ipcApi.request('models.add_preset', { presetId, ...options }),
  listRoles: (): Promise<ModelRolesMap> => ipcApi.request('models.list_roles', undefined as void),
  setRole: (role: ModelRole, providerId?: string, modelId?: string): Promise<ModelRolesMap> =>
    ipcApi.request('models.set_role', { role, providerId, modelId }),
  clearRole: (role: ModelRole): Promise<ModelRolesMap> =>
    ipcApi.request('models.clear_role', { role }),
  testProvider: (providerId: string): Promise<ModelTestResult> =>
    ipcApi.request('models.test_provider', { providerId }),
  fetchModels: (providerId: string): Promise<{ models: string[] }> =>
    ipcApi.request('models.fetch_models', { providerId }),
  listPublicProviders: (): Promise<PublicModelProvider[]> =>
    ipcApi.request('models.list_public_providers', undefined as void),
}

export type { ModelRoleAssignment }
