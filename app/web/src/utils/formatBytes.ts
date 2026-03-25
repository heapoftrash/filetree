const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
const K = 1024

/**
 * Convert bytes to human-readable string (e.g. 104857600 → "100 MB").
 */
export function bytesToHuman(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return '0 B'
  let i = 0
  let n = bytes
  while (n >= K && i < UNITS.length - 1) {
    n /= K
    i++
  }
  const rounded = i === 0 ? Math.round(n) : Math.round(n * 100) / 100
  return `${rounded} ${UNITS[i]}`
}

/**
 * Parse human-readable size to bytes (e.g. "100 MB" → 104857600).
 * Accepts: "100", "100 MB", "1.5 GB", "500KB" (no space).
 */
export function humanToBytes(input: string): number | null {
  const s = input.trim()
  if (!s) return null
  const match = s.match(/^([\d.]+)\s*([KMGT]?B?)$/i)
  if (!match) return null
  let n = parseFloat(match[1])
  if (!Number.isFinite(n) || n < 0) return null
  const unit = (match[2] || 'B').toUpperCase().replace('B', '')
  const multipliers: Record<string, number> = {
    '': 1,
    K: K,
    M: K * K,
    G: K * K * K,
    T: K * K * K * K,
  }
  const mult = multipliers[unit] ?? 1
  return Math.round(n * mult)
}
