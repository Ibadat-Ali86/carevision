/**
 * CareVision — Dexie.js Offline Queue Store
 * Spec Reference: Section 5.2 (Offline Queue Management), Section 8 reference index
 *
 * WHY Dexie (IndexedDB): LocalStorage has a 5MB limit. Storing base64 image
 * strings (≤1MB each) in LocalStorage would crash quickly. IndexedDB handles
 * large blob/string data reliably across all modern browsers.
 *
 * WHY 3-retry limit: Balances auto-recovery with storage exhaustion prevention.
 * After 3 failures, item is marked 'failed' and user must manually retry or discard.
 */

import Dexie, { type Table } from 'dexie';
import type { QueueItem } from '@/types/app';
import { OFFLINE_QUEUE_MAX_RETRIES } from '@/constants/api';

// ---------------------------------------------------------------------------
// Database schema definition
// ---------------------------------------------------------------------------
class CareVisionDB extends Dexie {
  queue!: Table<QueueItem, number>;

  constructor() {
    super('carevision-offline-queue');

    // Schema version — increment when schema changes (migration required)
    this.version(1).stores({
      // ++id = auto-increment primary key
      // Other indexed fields for efficient queries
      queue: '++id, analysisType, status, timestamp',
    });
  }
}

export const db = new CareVisionDB();

// ---------------------------------------------------------------------------
// Queue Operations (pure functions — no React hooks dependency)
// ---------------------------------------------------------------------------

/** Add a new item to the offline queue */
export async function enqueue(
  item: Omit<QueueItem, 'id' | 'retryCount' | 'status' | 'timestamp'>
): Promise<number> {
  return db.queue.add({
    ...item,
    retryCount: 0,
    status: 'pending',
    timestamp: Date.now(),
  });
}

/** Get all pending/retrying items that can still be synced */
export async function getPendingItems(): Promise<QueueItem[]> {
  return db.queue
    .where('status')
    .anyOf(['pending', 'retrying'])
    .toArray();
}

/** Get all queue items for the Settings page display */
export async function getAllQueueItems(): Promise<QueueItem[]> {
  return db.queue.orderBy('timestamp').reverse().toArray();
}

/** Mark an item as successfully synced and delete it */
export async function markSynced(id: number): Promise<void> {
  await db.queue.delete(id);
}

/** Increment retry count and update status */
export async function incrementRetry(id: number, errorMessage?: string): Promise<void> {
  const item = await db.queue.get(id);
  if (!item) return;

  const newRetryCount = item.retryCount + 1;
  const newStatus = newRetryCount >= OFFLINE_QUEUE_MAX_RETRIES ? 'failed' : 'retrying';

  await db.queue.update(id, {
    retryCount: newRetryCount,
    status: newStatus,
    errorMessage,
  });
}

/** Reset a failed item back to pending (manual retry from Settings) */
export async function resetForRetry(id: number): Promise<void> {
  await db.queue.update(id, {
    retryCount: 0,
    status: 'pending',
    errorMessage: undefined,
  });
}

/** Remove a specific item from the queue */
export async function removeItem(id: number): Promise<void> {
  await db.queue.delete(id);
}

/** Clear all items from the queue (Settings > Offline Data Management) */
export async function clearQueue(): Promise<void> {
  await db.queue.clear();
}

/** Count of pending items (for badge indicators) */
export async function getPendingCount(): Promise<number> {
  return db.queue
    .where('status')
    .anyOf(['pending', 'retrying'])
    .count();
}
