export type SyncEntity = 'drink' | 'soberDay'

export interface SyncQueueItem {
  key: string
  entity: SyncEntity
  id: string
  updatedAt: number
}

export function syncQueueKey(entity: SyncEntity, id: string): string {
  return `${entity}:${id}`
}

export function makeSyncQueueItem(
  entity: SyncEntity,
  id: string,
  updatedAt: number,
): SyncQueueItem {
  return { key: syncQueueKey(entity, id), entity, id, updatedAt }
}

export function chooseSyncWinner(
  localUpdatedAt: number | undefined,
  remoteUpdatedAt: number | undefined,
  queued: boolean,
): { winner: 'local' | 'remote'; upload: boolean; clearQueue: boolean } {
  if (localUpdatedAt === undefined) {
    return { winner: 'remote', upload: false, clearQueue: false }
  }
  if (remoteUpdatedAt === undefined) {
    return { winner: 'local', upload: true, clearQueue: false }
  }
  if (queued && localUpdatedAt >= remoteUpdatedAt) {
    return { winner: 'local', upload: true, clearQueue: false }
  }
  return { winner: 'remote', upload: false, clearQueue: queued }
}

export function shouldApplyRemoteChange(
  localUpdatedAt: number | undefined,
  remoteUpdatedAt: number,
): boolean {
  return localUpdatedAt === undefined || localUpdatedAt <= remoteUpdatedAt
}
