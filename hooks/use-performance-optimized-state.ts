import { useState, useCallback, useRef, useEffect } from 'react'
import { debounce, throttle } from '@/lib/performance'

// Optimized state hook with debouncing and batching
export function useOptimizedState<T>(
  initialValue: T,
  options: {
    debounceMs?: number
    throttleMs?: number
    batchUpdates?: boolean
  } = {}
) {
  const { debounceMs = 0, throttleMs = 0, batchUpdates = false } = options
  
  const [state, setState] = useState<T>(initialValue)
  const pendingUpdatesRef = useRef<((prev: T) => T)[]>([])
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced setter
  const debouncedSetState = useCallback(
    debounce((newState: T | ((prev: T) => T)) => {
      setState(newState)
    }, debounceMs),
    [debounceMs]
  )

  // Throttled setter
  const throttledSetState = useCallback(
    throttle((newState: T | ((prev: T) => T)) => {
      setState(newState)
    }, throttleMs),
    [throttleMs]
  )

  // Batched setter
  const batchedSetState = useCallback((updater: (prev: T) => T) => {
    pendingUpdatesRef.current.push(updater)
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }

    batchTimeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = prevState
        pendingUpdatesRef.current.forEach(update => {
          newState = update(newState)
        })
        pendingUpdatesRef.current = []
        return newState
      })
    }, 16) // Next frame
  }, [])

  // Choose the appropriate setter based on options
  const optimizedSetState = useCallback((newState: T | ((prev: T) => T)) => {
    if (batchUpdates && typeof newState === 'function') {
      batchedSetState(newState as (prev: T) => T)
    } else if (debounceMs > 0) {
      debouncedSetState(newState)
    } else if (throttleMs > 0) {
      throttledSetState(newState)
    } else {
      setState(newState)
    }
  }, [batchUpdates, debounceMs, throttleMs, batchedSetState, debouncedSetState, throttledSetState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
    }
  }, [])

  return [state, optimizedSetState] as const
}

// Hook for managing arrays with optimized operations
export function useOptimizedArray<T>(
  initialArray: T[] = [],
  keyExtractor: (item: T, index?: number) => string | number = (_: T, index?: number) => index ?? Math.random()
) {
  const [items, setItems] = useOptimizedState(initialArray, { batchUpdates: true })
  const itemsMapRef = useRef<Map<string | number, T>>(new Map<string | number, T>())

  // Update items map when items change
  useEffect(() => {
    const newMap = new Map<string | number, T>()
    items.forEach((item, index) => {
      const key = keyExtractor(item, index)
      newMap.set(key, item)
    })
    itemsMapRef.current = newMap
  }, [items, keyExtractor])

  // Optimized operations
  const operations = {
    // Add item (optimistic)
    add: useCallback((item: T) => {
      const key = keyExtractor(item)
      setItems(prev => {
        // Avoid duplicates
        if (itemsMapRef.current.has(key)) {
          return prev
        }
        return [...prev, item]
      })
    }, [keyExtractor, setItems]),

    // Update item (optimistic)
    update: useCallback((key: string | number, updater: (item: T) => T) => {
      setItems(prev => prev.map((item, index) => {
        const itemKey = keyExtractor(item, index)
        return itemKey === key ? updater(item) : item
      }))
    }, [keyExtractor, setItems]),

    // Remove item (optimistic)
    remove: useCallback((key: string | number) => {
      setItems(prev => prev.filter(item => keyExtractor(item) !== key))
    }, [keyExtractor, setItems]),

    // Bulk update
    bulkUpdate: useCallback((updates: { key: string | number; updater: (item: T) => T }[]) => {
      const updateMap = new Map(updates.map(u => [u.key, u.updater]))
      
      setItems(prev => prev.map((item, index) => {
        const key = keyExtractor(item, index)
        const updater = updateMap.get(key)
        return updater ? updater(item) : item
      }))
    }, [keyExtractor, setItems]),

    // Replace all items
    replace: useCallback((newItems: T[]) => {
      setItems(newItems)
    }, [setItems]),

    // Find item by key
    find: useCallback((key: string | number): T | undefined => {
      return itemsMapRef.current.get(key)
    }, []),

    // Check if item exists
    has: useCallback((key: string | number): boolean => {
      return itemsMapRef.current.has(key)
    }, []),
  }

  return {
    items,
    setItems,
    ...operations,
    size: items.length,
    isEmpty: items.length === 0,
  }
}

// Hook for managing loading states with automatic cleanup
export function useOptimizedLoading(initialStates: Record<string, boolean> = {}) {
  const [loadingStates, setLoadingStates] = useOptimizedState(initialStates)
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const setLoading = useCallback((key: string, loading: boolean, autoReset?: number) => {
    // Clear existing timeout
    const existingTimeout = timeoutsRef.current.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      timeoutsRef.current.delete(key)
    }

    setLoadingStates(prev => ({ ...prev, [key]: loading }))

    // Auto-reset after specified time
    if (loading && autoReset) {
      const timeout = setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [key]: false }))
        timeoutsRef.current.delete(key)
      }, autoReset)
      
      timeoutsRef.current.set(key, timeout)
    }
  }, [setLoadingStates])

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(Boolean)
  }, [loadingStates])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [])

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearAll: useCallback(() => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
      setLoadingStates({})
    }, [setLoadingStates])
  }
}