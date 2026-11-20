/** Copy text to the clipboard; returns false if the Clipboard API is unavailable/denied. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Turn a possibly relative URL into an absolute one for sharing. */
export function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}
