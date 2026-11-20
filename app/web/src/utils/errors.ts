import { bytesToHuman } from './formatBytes'

/** Shape of API error responses (e.g. axios/fetch) */
export interface ApiErrorResponse {
  response?: {
    status?: number
    data?: {
      error?: string
      conflict?: boolean
      max_upload_bytes?: number
    }
  }
  message?: string
  code?: string
}

/**
 * Extract a user-facing message from an unknown error.
 * Handles API errors (response.data.error) and standard Error objects.
 */
export function getApiErrorMessage(e: unknown): string {
  const err = e as ApiErrorResponse
  return err.response?.data?.error ?? (e instanceof Error ? e.message : 'Operation failed')
}

/** Axios/network failure with no HTTP response body. */
export function isNetworkError(e: unknown): boolean {
  const err = e as ApiErrorResponse
  if (err.response) return false
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true
  const msg = (err.message ?? '').toLowerCase()
  return msg === 'network error' || msg.includes('timeout')
}

/**
 * User-facing message for upload failures (size limit / opaque network cutoffs).
 */
export function getUploadErrorMessage(
  e: unknown,
  opts?: { maxUploadBytes?: number },
): string {
  const err = e as ApiErrorResponse
  const max = err.response?.data?.max_upload_bytes ?? opts?.maxUploadBytes
  const human = max != null && max > 0 ? bytesToHuman(max) : null

  if (
    err.response?.status === 413 ||
    err.response?.data?.error === 'upload exceeds size limit'
  ) {
    return human
      ? `File exceeds max upload size (${human}).`
      : 'File exceeds max upload size.'
  }

  if (isNetworkError(e)) {
    return human
      ? `Upload failed. Check your connection, or that the file is under the size limit (${human}).`
      : 'Upload failed. Check your connection, or that the file is under the size limit.'
  }

  return getApiErrorMessage(e)
}

/** Check if the error is a 409 conflict (e.g. rename/copy destination exists) */
export function isConflictError(e: unknown): boolean {
  const err = e as ApiErrorResponse
  return err.response?.status === 409 || err.response?.data?.conflict === true
}

/** List/stat 404 — e.g. current folder was removed after trash restore */
export function isNotFoundError(e: unknown): boolean {
  const err = e as ApiErrorResponse
  return err.response?.status === 404
}
