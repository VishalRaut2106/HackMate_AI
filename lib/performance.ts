// Performance monitoring and optimization utilities
import { useCallback } from 'react'

interface PerformanceMetrics {
  renderTime: number
  apiResponseTime: number
  dbQueryTime: number
  cacheHitRate: number
}

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private cacheStats = { hits: 0, misses: 0 }

  // Measure render performance
  measureRender<T>(componentName: string, renderFn: () => T): T {
    const start = performance.now()
    const result = renderFn()
    const end = performance.now()
    
    this.recordMetric(`render_${componentName}`, end - start)
    return result
  }

  // Measure API call performance
  async measureApiCall<T>(endpoint: string, apiCall: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await apiCall()
      const end = performance.now()
      this.recordMetric(`api_${endpoint}`, end - start)
      return result
    } catch (error) {
      const end = performance.now()
      this.recordMetric(`api_${endpoint}_error`, end - start)
      throw error
    }
  }

  // Measure database query performance
  async measureDbQuery<T>(queryName: string, query: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await query()
      const end = performance.now()
      this.recordMetric(`db_${queryName}`, end - start)
      return result
    } catch (error) {
      const end = performance.now()
      this.recordMetric(`db_${queryName}_error`, end - start)
      throw error
    }
  }

  // Record cache hit/miss
  recordCacheHit(hit: boolean) {
    if (hit) {
      this.cacheStats.hits++
    } else {
      this.cacheStats.misses++
    }
  }

  // Get cache hit rate
  getCacheHitRate(): number {
    const total = this.cacheStats.hits + this.cacheStats.misses
    return total > 0 ? this.cacheStats.hits / total : 0
  }

  // Record a metric
  private recordMetric(key: string, value: number) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    const values = this.metrics.get(key)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  // Get average for a metric
  getAverage(key: string): number {
    const values = this.metrics.get(key)
    if (!values || values.length === 0) return 0
    
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  // Get performance report
  getReport(): PerformanceMetrics {
    return {
      renderTime: this.getAverage('render_ProjectPage') || 0,
      apiResponseTime: this.getAverage('api_gemini') || 0,
      dbQueryTime: this.getAverage('db_tasks') || 0,
      cacheHitRate: this.getCacheHitRate(),
    }
  }

  // Log performance warnings
  checkPerformance() {
    const report = this.getReport()
    
    if (report.renderTime > 100) {
      console.warn(`Slow render detected: ${report.renderTime.toFixed(2)}ms`)
    }
    
    if (report.apiResponseTime > 5000) {
      console.warn(`Slow API response: ${report.apiResponseTime.toFixed(2)}ms`)
    }
    
    if (report.dbQueryTime > 2000) {
      console.warn(`Slow database query: ${report.dbQueryTime.toFixed(2)}ms`)
    }
    
    if (report.cacheHitRate < 0.7) {
      console.warn(`Low cache hit rate: ${(report.cacheHitRate * 100).toFixed(1)}%`)
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const measureRender = useCallback((componentName: string, renderFn: () => any) => {
    return performanceMonitor.measureRender(componentName, renderFn)
  }, [])

  const measureApiCall = useCallback(async (endpoint: string, apiCall: () => Promise<any>) => {
    return performanceMonitor.measureApiCall(endpoint, apiCall)
  }, [])

  const measureDbQuery = useCallback(async (queryName: string, query: () => Promise<any>) => {
    return performanceMonitor.measureDbQuery(queryName, query)
  }, [])

  const recordCacheHit = useCallback((hit: boolean) => {
    performanceMonitor.recordCacheHit(hit)
  }, [])

  const getReport = useCallback(() => {
    return performanceMonitor.getReport()
  }, [])

  const checkPerformance = useCallback(() => {
    performanceMonitor.checkPerformance()
  }, [])

  return {
    measureRender,
    measureApiCall,
    measureDbQuery,
    recordCacheHit,
    getReport,
    checkPerformance,
  }
}

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memoization utility with TTL
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  func: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      performanceMonitor.recordCacheHit(true)
      return cached.value
    }
    
    performanceMonitor.recordCacheHit(false)
    const result = func(...args)
    cache.set(key, { value: result, timestamp: Date.now() })
    
    return result
  }) as T
}

// Web Vitals monitoring (if available)
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Monitor Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime)
          }
        }
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // Ignore if not supported
    }
  }

  // Monitor First Input Delay
  if ('addEventListener' in window) {
    let firstInputDelay: number | null = null
    
    const handleFirstInput = (event: Event) => {
      if (firstInputDelay === null) {
        firstInputDelay = performance.now() - (event as any).timeStamp
        console.log('FID:', firstInputDelay)
        window.removeEventListener('click', handleFirstInput)
        window.removeEventListener('keydown', handleFirstInput)
      }
    }
    
    window.addEventListener('click', handleFirstInput)
    window.addEventListener('keydown', handleFirstInput)
  }
}

// Initialize performance monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  initWebVitals()
  
  // Log performance report every 30 seconds
  setInterval(() => {
    performanceMonitor.checkPerformance()
  }, 30000)
}