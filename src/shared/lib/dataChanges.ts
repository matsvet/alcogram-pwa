/** Decouple local writes from cloud sync (avoid circular imports). */

type Handler = () => void

const handlers = new Set<Handler>()

export function onLocalDataChange(handler: Handler): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function notifyLocalDataChange(): void {
  for (const h of handlers) {
    try {
      h()
    } catch {
      /* ignore */
    }
  }
}
