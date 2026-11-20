/** True when the drag payload includes OS files (not in-app move/copy JSON). */
export function isFileDrag(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes('Files')
}

/** Prefer copy for OS file drops; move for in-app entry drags. */
export function setDropEffectForDrag(dataTransfer: DataTransfer): void {
  dataTransfer.dropEffect = isFileDrag(dataTransfer) ? 'copy' : 'move'
}
