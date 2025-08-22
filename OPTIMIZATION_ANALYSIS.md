# ProjTrack Optimization Analysis & Implementation Plan

## Executive Summary

**Current Baseline (24h):**
- Database REST: 7,041 requests
- Auth: 1,434 requests  
- Storage: 115 requests
- Realtime: 102 requests

**Optimization Targets:**
- Database REST: ≥40% reduction (target: <4,225)
- Auth: ≥50% reduction (target: <717)
- Storage: ±10% (maintain 103-127)
- Realtime: Maintain or reduce (target: <102)

## Critical Issues Identified

### 1. Database Layer Issues

#### Multiple Supabase Client Instances
```typescript
// ISSUE: 3 different Supabase clients
// File: lib/supabase.ts
// File: lib/supabase-query.ts  
// File: lib/auth.tsx
```

#### Inefficient SELECT Statements
```typescript
// CURRENT (BAD):
.select('*')

// OPTIMIZED (GOOD):
.select('id, name, status, created_at')
```

#### Missing Request Batching
```typescript
// CURRENT: Multiple separate calls
const projects = await supabase.from('projects').select('*')
const tasks = await supabase.from('tasks').select('*')
const personnel = await supabase.from('personnel').select('*')

// OPTIMIZED: Single batched call with relations
const data = await supabase.from('projects')
  .select('*, tasks(*), personnel(*)')
```

### 2. TanStack Query Issues

#### Inconsistent Query Keys
```typescript
// CURRENT: Multiple key patterns
['projects'] // in one file
['data', 'projects'] // in another
[queryKeys.projects()] // in third
```

#### Poor Cache Invalidation
```typescript
// CURRENT: Over-invalidation
queryClient.invalidateQueries() // invalidates everything

// OPTIMIZED: Precise invalidation
queryClient.invalidateQueries({ queryKey: ['projects'], exact: true })
```

#### Missing Optimistic Updates
```typescript
// CURRENT: Always refetch after mutations
queryClient.invalidateQueries(['projects'])

// OPTIMIZED: Optimistic updates
queryClient.setQueryData(['projects'], old => [...old, newProject])
```

### 3. Auth Layer Issues

#### Redundant Session Checks
```typescript
// CURRENT: Multiple components call useAuth()
// Each triggers separate session validation
const { user } = useAuth() // Component A
const { user } = useAuth() // Component B 
const { user } = useAuth() // Component C
```

#### Multiple Profile Fetches
```typescript
// CURRENT: Each component fetches user data separately
const userProfile = await supabase.auth.getUser()
```

### 4. Realtime Issues

#### Overly Broad Subscriptions
```typescript
// CURRENT: Global subscriptions always active
.on('postgres_changes', { event: '*', schema: 'public', table: 'projects' })

// OPTIMIZED: Scoped to visible components
.on('postgres_changes', { 
  event: '*', 
  schema: 'public', 
  table: 'projects',
  filter: `id=eq.${activeProjectId}` 
})
```

## Implementation Plan

### Phase 1: Database Optimization (40-50% reduction)

#### 1.1 Consolidate Supabase Clients
```typescript
// NEW: lib/supabase-unified.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'projtrack-auth'
  },
  realtime: {
    params: { eventsPerSecond: 1 } // Reduced from 2
  },
  global: {
    headers: { 'x-application-name': 'ProjTrack-Optimized' }
  }
})
```

#### 1.2 Optimize SELECT Statements
```typescript
// NEW: lib/queries/optimized-selects.ts
export const OPTIMIZED_SELECTS = {
  projects: 'id, name, status, start_date, end_date, created_at',
  tasks: 'id, title, status, priority, due_date, project_id, assigned_to',
  personnel: 'id, name, email, position, avatar_url',
  reports: 'id, file_name, status, uploaded_at, project_id, uploaded_by'
}

// Usage:
.select(OPTIMIZED_SELECTS.projects)
```

#### 1.3 Implement Request Batching
```typescript
// NEW: lib/hooks/useBatchedSupabaseQuery.ts
export function useBatchedSupabaseQuery() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const [projects, tasks, reports] = await Promise.all([
        supabase.from('projects').select(OPTIMIZED_SELECTS.projects),
        supabase.from('tasks').select(OPTIMIZED_SELECTS.tasks), 
        supabase.from('reports').select(OPTIMIZED_SELECTS.reports)
      ])
      return { projects: projects.data, tasks: tasks.data, reports: reports.data }
    },
    staleTime: 5 * 60 * 1000
  })
}
```

#### 1.4 Implement Database-Level Optimizations
```sql
-- NEW: sql/performance-indexes.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_status 
ON tasks(project_id, status) WHERE status != 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_project_recent
ON reports(project_id, uploaded_at DESC) WHERE uploaded_at > NOW() - INTERVAL '30 days';

-- RPC for batched reads
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'projects', (SELECT json_agg(row_to_json(p)) FROM (
      SELECT id, name, status, start_date, end_date 
      FROM projects 
      ORDER BY created_at DESC LIMIT 10
    ) p),
    'tasks', (SELECT json_agg(row_to_json(t)) FROM (
      SELECT id, title, status, priority, due_date 
      FROM tasks 
      WHERE assigned_to = p_user_id OR project_id IN (
        SELECT project_id FROM project_personnel WHERE personnel_id = p_user_id
      )
      ORDER BY due_date ASC LIMIT 20
    ) t),
    'notifications', (SELECT count(*) FROM notifications WHERE user_id = p_user_id AND read = false)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: Auth Optimization (50% reduction)

#### 2.1 Centralized Auth State
```typescript
// NEW: lib/auth-optimized.tsx
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  
  // Single session source of truth
  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false
        })
      }
    }
    
    initAuth()
    
    // Single auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            user: session?.user ?? null,
            session,
            loading: false
          }))
        }
      }
    )
    
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])
  
  // Memoized context value to prevent re-renders
  const contextValue = useMemo(() => authState, [authState])
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### 2.2 Profile Data Caching
```typescript
// NEW: lib/hooks/useUserProfile.ts
export function useUserProfile() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data } = await supabase
        .from('personnel')
        .select('id, name, email, position, avatar_url')
        .eq('email', user.email)
        .single()
      
      return data
    },
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000
  })
}
```

### Phase 3: TanStack Query Optimization

#### 3.1 Unified Query Client Configuration
```typescript
// NEW: lib/query-client-optimized.ts
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes default
        gcTime: 30 * 60 * 1000, // 30 minutes cache
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        refetchOnMount: false,
        retry: (failureCount, error) => {
          if (error?.status === 401) return false
          return failureCount < 2
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
      },
      mutations: {
        retry: 0,
        onSuccess: () => {
          // Only invalidate specific related queries
        }
      }
    }
  })
}
```

#### 3.2 Optimized Query Keys Factory
```typescript
// NEW: lib/query-keys.ts
export const queryKeys = {
  all: ['projtrack'] as const,
  projects: () => [...queryKeys.all, 'projects'] as const,
  project: (id: string) => [...queryKeys.projects(), id] as const,
  projectTasks: (id: string) => [...queryKeys.project(id), 'tasks'] as const,
  
  tasks: () => [...queryKeys.all, 'tasks'] as const,
  task: (id: string) => [...queryKeys.tasks(), id] as const,
  
  auth: () => [...queryKeys.all, 'auth'] as const,
  userProfile: (userId: string) => [...queryKeys.auth(), 'profile', userId] as const,
  
  // Environment-based cache keys
  dashboard: (env = NODE_ENV) => [...queryKeys.all, 'dashboard', env] as const
} as const
```

#### 3.3 Smart Query Hooks
```typescript
// NEW: lib/hooks/useSmartQuery.ts
export function useProjectsOptimized() {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: queryKeys.projects(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(OPTIMIZED_SELECTS.projects)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000,
    select: useCallback((data) => {
      // Only re-render if actual data changes
      return data?.filter(project => project.status !== 'archived') ?? []
    }, []),
    placeholderData: keepPreviousData
  })
}
```

### Phase 4: Realtime Optimization

#### 4.1 Scoped Subscriptions
```typescript
// NEW: lib/hooks/useOptimizedRealtime.ts
export function useOptimizedRealtime(table: string, filter?: string) {
  const queryClient = useQueryClient()
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
  
  useEffect(() => {
    if (!isVisible) return
    
    const channel = supabase
      .channel(`${table}_changes_${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter
      }, (payload) => {
        // Smart invalidation - only invalidate affected queries
        const affectedKeys = getAffectedQueryKeys(table, payload)
        affectedKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key, exact: true })
        })
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, isVisible, queryClient])
}
```

### Phase 5: Storage Optimization

#### 5.1 URL Caching and Reuse
```typescript
// NEW: lib/storage-optimized.ts
const urlCache = new Map<string, { url: string; expiry: number }>()

export function getCachedSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const now = Date.now()
  const cached = urlCache.get(path)
  
  if (cached && cached.expiry > now) {
    return Promise.resolve(cached.url)
  }
  
  return supabase.storage
    .from('reports')
    .createSignedUrl(path, expiresIn)
    .then(({ data, error }) => {
      if (error) throw error
      if (data?.signedUrl) {
        urlCache.set(path, {
          url: data.signedUrl,
          expiry: now + (expiresIn * 1000 * 0.9) // Refresh at 90% of expiry
        })
        return data.signedUrl
      }
      throw new Error('No signed URL returned')
    })
}
```

## Feature Flags Configuration

### Environment Variables
```bash
# .env.local
OPT_QUERY_STALE_TIME_MS=300000
OPT_QUERY_GC_TIME_MS=1800000
OPT_DISABLE_WINDOW_FOCUS_REFETCH=true
OPT_REDUCE_AUTH_CALLS=true
OPT_REALTIME_SCOPED=true
OPT_USE_BUNDLED_EDGE_READS=true
OPT_DISABLE_COUNT_EXACT=true

# Feature flags for gradual rollout
OPTIMIZATION_LEVEL=1 # 0=off, 1=basic, 2=aggressive
```

### Implementation Switches
```typescript
// NEW: lib/optimization-config.ts
export const optimizationConfig = {
  queryStaleTime: Number(process.env.OPT_QUERY_STALE_TIME_MS) || 300000,
  queryGcTime: Number(process.env.OPT_QUERY_GC_TIME_MS) || 1800000,
  disableWindowFocusRefetch: process.env.OPT_DISABLE_WINDOW_FOCUS_REFETCH === 'true',
  reduceAuthCalls: process.env.OPT_REDUCE_AUTH_CALLS === 'true',
  realtimeScoped: process.env.OPT_REALTIME_SCOPED === 'true',
  useBundledEdgeReads: process.env.OPT_USE_BUNDLED_EDGE_READS === 'true',
  disableCountExact: process.env.OPT_DISABLE_COUNT_EXACT === 'true',
  optimizationLevel: Number(process.env.OPTIMIZATION_LEVEL) || 0
}
```

## Verification & Monitoring

### 1. Request Tracking
```typescript
// NEW: lib/monitoring/request-tracker.ts
class RequestTracker {
  private requests: Map<string, number> = new Map()
  
  track(type: 'db' | 'auth' | 'storage' | 'realtime') {
    const count = this.requests.get(type) || 0
    this.requests.set(type, count + 1)
  }
  
  getStats() {
    return Object.fromEntries(this.requests)
  }
  
  reset() {
    this.requests.clear()
  }
}

export const requestTracker = new RequestTracker()
```

### 2. Performance Metrics
```typescript
// NEW: lib/monitoring/performance.ts
export function trackQueryPerformance() {
  if (process.env.NODE_ENV === 'development') {
    const originalQuery = supabase.from
    supabase.from = function(table: string) {
      const start = performance.now()
      const result = originalQuery.call(this, table)
      
      // Wrap the query execution
      const originalThen = result.then
      result.then = function(onResolve: any, onReject?: any) {
        return originalThen.call(this, 
          (data: any) => {
            const duration = performance.now() - start
            console.log(`Query ${table}: ${duration.toFixed(2)}ms`)
            return onResolve(data)
          },
          onReject
        )
      }
      
      return result
    }
  }
}
```

### 3. UI Diff Validation
```typescript
// NEW: lib/testing/ui-validation.ts
export function validateUIConsistency() {
  return {
    checkComponentRenders: () => {
      // Snapshot testing for critical components
    },
    checkDataFlow: () => {
      // Validate data consistency across optimized queries
    },
    checkPerformance: () => {
      // Core Web Vitals monitoring
    }
  }
}
```

## Rollback Plan

### Instant Rollback
```typescript
// Set OPTIMIZATION_LEVEL=0 in environment
// All optimizations disabled, falls back to current behavior

// Or emergency rollback:
export const EMERGENCY_FALLBACK = true

if (EMERGENCY_FALLBACK) {
  // Use original implementations
  return useOriginalQueries()
}
```

### Gradual Rollback
```typescript
// Reduce optimization level gradually
OPTIMIZATION_LEVEL=2 -> 1 -> 0
```

## Expected Results

### Database REST Reduction (40-50%)
- **Current**: 7,041 requests
- **Target**: <4,225 requests
- **Methods**: Column selection, batching, RPC functions, better caching

### Auth Reduction (50%+)
- **Current**: 1,434 requests
- **Target**: <717 requests  
- **Methods**: Single session source, profile caching, reduced validation calls

### Storage Optimization (±10%)
- **Current**: 115 requests
- **Target**: 103-127 requests
- **Methods**: URL caching, reduced list operations

### Realtime Optimization
- **Current**: 102 requests
- **Target**: <102 requests
- **Methods**: Scoped subscriptions, visibility-based connections

## Implementation Timeline

**Week 1**: Database optimizations (Phases 1-2)
**Week 2**: Auth and Query optimizations (Phase 3-4)  
**Week 3**: Storage and Realtime optimizations (Phase 5)
**Week 4**: Testing, monitoring, and fine-tuning

## Risk Mitigation

1. **Feature flags** for gradual rollout
2. **Comprehensive testing** at each phase
3. **Performance monitoring** throughout
4. **Instant rollback** capability
5. **User acceptance testing** before full deployment

This optimization plan will significantly reduce Supabase usage while maintaining identical UI behavior and improving overall application performance.
