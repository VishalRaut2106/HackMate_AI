// Advanced caching system for better performance
import { performanceMonitor } from './performance'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 1000 // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup process
    this.startCleanup()
  }

  // Get cached data
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      performanceMonitor.recordCacheHit(false)
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      performanceMonitor.recordCacheHit(false)
      return null
    }

    // Update hit count and record cache hit
    entry.hits++
    performanceMonitor.recordCacheHit(true)
    return entry.data
  }

  // Set cached data
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Cleanup if cache is too large
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    })
  }

  // Delete cached data
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0)
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  // Evict least used entries
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
    
    // Sort by hits (ascending) and timestamp (oldest first)
    entries.sort(([, a], [, b]) => {
      if (a.hits !== b.hits) return a.hits - b.hits
      return a.timestamp - b.timestamp
    })

    // Remove 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1)
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  // Estimate memory usage (rough calculation)
  private estimateMemoryUsage(): string {
    const entries = Array.from(this.cache.entries())
    let totalSize = 0

    entries.forEach(([key, value]) => {
      totalSize += key.length * 2 // UTF-16 characters
      totalSize += JSON.stringify(value.data).length * 2
      totalSize += 64 // Overhead for timestamps, hits, etc.
    })

    if (totalSize < 1024) return `${totalSize} B`
    if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`
    return `${Math.round(totalSize / (1024 * 1024))} MB`
  }

  // Start periodic cleanup
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const toDelete: string[] = []

      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          toDelete.push(key)
        }
      })

      toDelete.forEach(key => this.cache.delete(key))
      
      if (toDelete.length > 0) {
        console.log(`Cache cleanup: removed ${toDelete.length} expired entries`)
      }
    }, 60000) // Cleanup every minute
  }

  // Stop cleanup process
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Global cache instance
export const cacheManager = new CacheManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheManager.destroy()
  })
}

// Cache decorators for functions
export function cached<T extends (...args: any[]) => any>(
  ttl: number = 5 * 60 * 1000
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function(...args: Parameters<T>) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`
      
      // Try to get from cache
      const cached = cacheManager.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute original method
      const result = originalMethod.apply(this, args)
      
      // Cache the result
      if (result instanceof Promise) {
        return result.then(data => {
          cacheManager.set(cacheKey, data, ttl)
          return data
        })
      } else {
        cacheManager.set(cacheKey, result, ttl)
        return result
      }
    }

    return descriptor
  }
}

// Helper function for manual caching
export function withCache<T>(
  key: string,
  fn: () => T | Promise<T>,
  ttl: number = 5 * 60 * 1000
): T | Promise<T> {
  // Try cache first
  const cached = cacheManager.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function
  const result = fn()
  
  if (result instanceof Promise) {
    return result.then(data => {
      cacheManager.set(key, data, ttl)
      return data
    })
  } else {
    cacheManager.set(key, result, ttl)
    return result
  }
}