import axios from 'axios'
import type { ListResponse } from '../types'

const TOKEN_KEY = 'filetree-token'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // Don't redirect for login attempts—let the caller show the error
      const url = err.config?.url ?? ''
      if (!url.includes('/auth/local') && !url.includes('/auth/login-options')) {
        localStorage.removeItem(TOKEN_KEY)
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export async function authMe(): Promise<{ email: string; name?: string; picture?: string; is_admin?: boolean }> {
  const { data } = await api.get<{ email: string; name?: string; picture?: string; is_admin?: boolean }>('/auth/me')
  return data
}

export interface LoginOptions {
  local_auth_enabled: boolean
  providers: { id: string; label: string }[]
}

export async function getLoginOptions(): Promise<LoginOptions> {
  const { data } = await api.get<LoginOptions>('/auth/login-options')
  return data
}

export interface VersionInfo {
  version: string
  commit: string
  /** false when running version is not semver (e.g. dev): !update_available does not mean up to date */
  comparable?: boolean
  update_available: boolean
  latest_version?: string
  release_url?: string
  /** "release" from GitHub Releases API; "tag" when only lightweight/annotated tags exist */
  release_url_kind?: 'release' | 'tag'
}

export async function getVersionInfo(): Promise<VersionInfo> {
  const { data } = await api.get<VersionInfo>('/version')
  return data
}

export async function loginLocal(
  username: string,
  password: string,
  redirect = '/files',
): Promise<{ token: string; redirect: string }> {
  const { data } = await api.post<{ token: string; redirect: string }>('/auth/local', { username, password }, {
    params: { redirect },
  })
  return data
}

export interface ConfigSection {
  id: string
  label: string
}

export interface ConfigFieldSchema {
  key: string
  section: string
  kind: 'string' | 'bool' | 'bytes' | 'string[]' | 'object[]'
  label: string
  editable: boolean
  secret?: boolean
  display_hint?: string
  placeholder?: string
  extra?: string
}

export interface ProviderSchemaResponse {
  id: string
  label: string
  fields: ConfigFieldSchema[]
}

export interface ProviderSectionResponse {
  id: string
  label: string
  providers: ProviderSchemaResponse[]
}

export interface ConfigSchema {
  sections: ConfigSection[]
  fields: ConfigFieldSchema[]
  provider_sections?: ProviderSectionResponse[]
}

export type ConfigValues = Record<string, unknown>

export interface ConfigAPIResponse {
  schema: ConfigSchema
  values: ConfigValues
}

export async function getConfig(): Promise<ConfigAPIResponse> {
  const { data } = await api.get<ConfigAPIResponse>('/config')
  return data
}

export async function updateConfig(updates: ConfigValues): Promise<void> {
  await api.patch('/config', updates)
}

export async function listEntries(path: string): Promise<ListResponse> {
  const { data } = await api.get<ListResponse>('/entries', { params: { path: path || '.' } })
  return data
}

export async function createFolder(path: string, name: string): Promise<void> {
  await api.post('/entries', { path: path || '.', name })
}

export async function renameEntry(
  path: string,
  newName: string,
  opts?: { overwrite?: boolean },
): Promise<void> {
  await api.patch('/entries', { path, newName, overwrite: opts?.overwrite })
}

export async function deleteEntry(path: string): Promise<{ trashPath?: string }> {
  const { data } = await api.delete('/entries', { params: { path } })
  return data as { trashPath?: string }
}

export async function restoreFromTrash(trashPath: string): Promise<void> {
  await api.post('/entries/restore', { path: trashPath })
}

/**
 * @deprecated Use getSignedDownloadUrl instead. Token-in-URL is less secure.
 */
export function downloadUrl(path: string): string {
  const base = `/api/entries/download?path=${encodeURIComponent(path)}`
  const token = getAuthToken()
  return token ? `${base}&token=${encodeURIComponent(token)}` : base
}

export async function getSignedPreviewUrl(
  path: string,
  cacheBust = false,
  signal?: AbortSignal,
): Promise<string> {
  const { data } = await api.post<{ url: string }>('/entries/signed-url', { path, action: 'preview' }, { signal })
  const url = data.url
  return cacheBust ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url
}

export async function getSignedDownloadUrl(path: string): Promise<string> {
  const { data } = await api.post<{ url: string }>('/entries/signed-url', { path, action: 'download' })
  return data.url
}

export async function uploadFiles(path: string, files: FileList | File[]): Promise<void> {
  const form = new FormData()
  form.append('path', path || '.')
  const list = Array.isArray(files) ? files : Array.from(files)
  list.forEach((f) => form.append('files', f))
  await api.post('/entries', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function moveEntry(
  from: string,
  toDir: string,
  opts?: { overwrite?: boolean; newName?: string },
): Promise<void> {
  await api.post('/entries/move', { from, to: toDir, overwrite: opts?.overwrite, newName: opts?.newName })
}

export async function copyEntry(
  from: string,
  toDir: string,
  opts?: { overwrite?: boolean; newName?: string },
): Promise<void> {
  await api.post('/entries/copy', { from, to: toDir, overwrite: opts?.overwrite, newName: opts?.newName })
}

/**
 * @deprecated Use getSignedPreviewUrl instead. Token-in-URL is less secure.
 */
export function previewUrl(path: string, cacheBust = false): string {
  let base = `/api/entries/preview?path=${encodeURIComponent(path)}`
  if (cacheBust) base += `&t=${Date.now()}`
  const token = getAuthToken()
  if (token) base += `&token=${encodeURIComponent(token)}`
  return base
}

export async function previewInfo(
  path: string,
  signal?: AbortSignal,
): Promise<{ category: string; mimeType: string; previewable: boolean }> {
  const { data } = await api.get('/entries/preview/info', { params: { path }, signal })
  return data
}

/** Fetch preview content with Authorization header (no token in URL). Use for text. */
export async function fetchPreviewText(path: string, signal?: AbortSignal): Promise<string> {
  const { data } = await api.get<string>('/entries/preview', {
    params: { path },
    responseType: 'text',
    signal,
  })
  return data
}

export async function downloadZip(paths: string[]): Promise<Blob> {
  const { data } = await api.post<Blob>(
    '/entries/zip',
    { paths },
    { responseType: 'blob' },
  )
  return data
}
