// utils/reloadOnChunkError.ts
export function reloadOnChunkError() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (e: any) => {
    const isChunkError =
      e?.message?.includes('ChunkLoadError') ||
      e?.message?.includes('Loading chunk')

    if (isChunkError) {
      console.warn('Chunk load failed → reloading...')
      window.location.reload()
    }
  })
}