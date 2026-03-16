export interface Entry {
  name: string
  path: string
  isDir: boolean
  size?: number
  modified: string
}

export interface ListResponse {
  entries: Entry[]
}
