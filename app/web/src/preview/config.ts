/**
 * Preview configuration and type detection.
 * Extensions map to preview categories; backend serves content, frontend chooses renderer.
 */
export type PreviewCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'markdown'
  | 'json'
  | 'csv'
  | 'html'
  | 'text'

export const PREVIEW_EXTENSIONS: Record<PreviewCategory, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.tif', '.avif'],
  video: ['.mp4', '.webm', '.ogg', '.ogv', '.mov'],
  audio: ['.mp3', '.wav', '.m4a', '.flac'],
  pdf: ['.pdf'],
  markdown: ['.md', '.markdown'],
  json: ['.json'],
  csv: ['.csv'],
  html: ['.html', '.htm'],
  text: [
    '.txt', '.log', '.env', '.sh', '.bat', '.ps1',
    '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
    '.css', '.scss', '.less',
    '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  ],
}

export function getPreviewCategory(filename: string): PreviewCategory {
  const i = filename.lastIndexOf('.')
  const ext = i >= 0 ? ('.' + filename.slice(i + 1).toLowerCase()) : ''
  for (const [category, exts] of Object.entries(PREVIEW_EXTENSIONS)) {
    if (exts.includes(ext)) return category as PreviewCategory
  }
  return 'text'
}
