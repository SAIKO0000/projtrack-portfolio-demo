# TanStack Query Optimization Implementation

## Overview
Successfully implemented TanStack Query (React Query) to dramatically reduce database requests from 1,937 to an estimated 50-100 requests per hour for single user testing.

## Key Optimizations Implemented

### 1. Query Provider Configuration (`lib/query-provider.tsx`)
- **Aggressive Caching**: 10-minute stale time, 30-minute garbage collection
- **Disabled Window Focus Refetching**: Prevents unnecessary API calls
- **Request Deduplication**: Multiple components requesting same data get deduplicated
- **Optimized Retry Logic**: Reduced retries to prevent excessive failed requests

### 2. Centralized Query Hooks (`lib/hooks/useSupabaseQuery.ts`)
- **Single Query Instance**: Each data type (projects, personnel, tasks, etc.) uses one cached query
- **Intelligent Caching Strategy**: Different stale times based on data volatility:
  - Personnel: 10 minutes (rarely changes)
  - Projects: 5 minutes (moderate changes)
  - Tasks: 2 minutes (frequent changes)
  - Events: 3 minutes
  - Reports: 5 minutes (static after upload)
  - Photos: 10 minutes (completely static)

### 3. Optimized Individual Hooks
- **useProjects.ts**: Converted to TanStack Query with cache-first approach
- **useTasksOptimized.ts**: New optimized tasks hook with mutations
- **Dashboard Component**: Updated to use centralized queries

### 4. Cache Management Strategy
- **Background Updates**: Data refreshes in background without blocking UI
- **Optimistic Updates**: Mutations update cache immediately for better UX
- **Selective Invalidation**: Only invalidate related queries when needed

## Expected Performance Improvements

### Before Optimization:
- **1,937 REST requests in 60 minutes** (32+ requests per minute)
- Multiple useEffect hooks firing on each render
- Duplicated API calls across components
- No intelligent caching
- Aggressive refetching on window focus

### After Optimization:
- **Estimated 50-100 requests per hour** (85-95% reduction)
- Single cached query per data type
- Intelligent background updates
- Request deduplication
- Long-term caching with appropriate stale times

## Components Updated
1. **Dashboard**: Now uses `useSupabaseQuery()` hooks
2. **Notifications**: Already using optimized `useNotificationsQuery`
3. **Query Provider**: Enhanced with aggressive caching settings

## Next Steps for Full Implementation
To complete the optimization, update these components to use the new hooks:

1. **Projects Component** → Use `useProjects()` (updated)
2. **Reports Component** → Create `useReportsOptimized()`
3. **Team Component** → Use `useSupabaseQuery().usePersonnelQuery()`
4. **Gantt Chart** → Use `useTasksOptimized()`

## Configuration Details

### Cache Timeouts:
```typescript
Personnel: staleTime: 10min, gcTime: 60min
Projects: staleTime: 5min, gcTime: 30min  
Tasks: staleTime: 2min, gcTime: 15min
Events: staleTime: 3min, gcTime: 20min
Reports: staleTime: 5min, gcTime: 30min
Photos: staleTime: 10min, gcTime: 60min
```

### Query Options:
- `refetchOnWindowFocus: false`
- `refetchOnMount: false` 
- `refetchOnReconnect: 'always'`
- `retry: 1` (reduced from default 3)

This implementation should reduce your Supabase database requests by 85-95%, significantly decreasing costs and improving performance.
