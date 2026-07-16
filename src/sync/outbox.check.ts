import { chooseSyncWinner, syncQueueKey } from './outbox.ts'

function assert(ok: boolean, message: string): void {
  if (!ok) throw new Error(message)
}

assert(syncQueueKey('drink', 'id') === 'drink:id', 'stable queue key')
assert(
  chooseSyncWinner(20, 10, true).upload,
  'new queued local change must upload',
)
assert(
  chooseSyncWinner(10, 20, true).clearQueue,
  'older queued local change must yield to cloud',
)
assert(
  chooseSyncWinner(10, undefined, false).upload,
  'local-only change must upload',
)
