// Simple in-memory cache for performance optimization
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 30000; // 30 seconds

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const maxAge = ttl || this.defaultTTL;
    const age = Date.now() - entry.timestamp;
    
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  // Invalidate all keys that start with a prefix
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// Cache keys
export const CACHE_KEYS = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  GANTT_TASKS: 'gantt_tasks',
  EVENTS: 'events',
  REPORTS: 'reports',
  PHOTOS: 'photos',
  PERSONNEL: 'personnel'
} as const;
