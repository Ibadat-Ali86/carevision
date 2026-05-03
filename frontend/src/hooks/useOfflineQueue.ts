/**
 * CareVision — Offline Queue React Hook
 * Spec Reference: Section 5.2 (Offline Queue Management Flow)
 *
 * Wraps the Dexie store operations with React state for live UI updates.
 * The Settings page uses this hook to display and manage the queue.
 */

import { useState, useEffect, useCallback } from 'react';
import type { QueueItem } from '@/types/app';
import {
  getAllQueueItems,
  getPendingCount,
  resetForRetry,
  removeItem,
  clearQueue,
  enqueue,
} from '@/store/offlineQueue';

interface UseOfflineQueueReturn {
  items: QueueItem[];
  pendingCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  retryItem: (id: number) => Promise<void>;
  discardItem: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  addToQueue: (item: Omit<QueueItem, 'id' | 'retryCount' | 'status' | 'timestamp'>) => Promise<number>;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allItems, count] = await Promise.all([
        getAllQueueItems(),
        getPendingCount(),
      ]);
      setItems(allItems);
      setPendingCount(count);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount and refresh when online event fires
  useEffect(() => {
    void refresh();

    const handleOnline = () => void refresh();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refresh]);

  const retryItem = useCallback(async (id: number) => {
    await resetForRetry(id);
    await refresh();
  }, [refresh]);

  const discardItem = useCallback(async (id: number) => {
    await removeItem(id);
    await refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    await clearQueue();
    await refresh();
  }, [refresh]);

  const addToQueue = useCallback(
    async (item: Omit<QueueItem, 'id' | 'retryCount' | 'status' | 'timestamp'>) => {
      const id = await enqueue(item);
      await refresh();
      return id;
    },
    [refresh]
  );

  return {
    items,
    pendingCount,
    isLoading,
    refresh,
    retryItem,
    discardItem,
    clearAll,
    addToQueue,
  };
}
