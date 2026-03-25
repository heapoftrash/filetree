/** Shape of API error responses (e.g. axios/fetch) */
export interface ApiErrorResponse {
  response?: {
    status?: number
    data?: {
      error?: string
      conflict?: boolean
    }
  }
  message?: string
}

/**
 * Extract a user-facing message from an unknown error.
 * Handles API errors (response.data.error) and standard Error objects.
 */
export function getApiErrorMessage(e: unknown): string {
  const err = e as ApiErrorResponse
  return err.response?.data?.error ?? (e instanceof Error ? e.message : 'Operation failed')
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
