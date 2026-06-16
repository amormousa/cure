# Frontend-Backend Integration Guide

## Architecture Overview

This document describes the professional-grade integration layer built between the frontend and backend APIs.

### Components

1. **API Client** (`app/lib/api/client.ts`)
   - Centralized request/response handler
   - Automatic JSON parsing with error handling
   - Zod schema validation on all responses
   - Request timeout and retry logic
   - Structured error responses

2. **Response Schemas** (`app/lib/api/schemas.ts`)
   - Zod schemas for all API endpoint responses
   - Type-safe TypeScript exports derived from schemas
   - Shared error schema across all endpoints

3. **API Endpoints** (`app/lib/api/endpoints.ts`)
   - Organized endpoint functions grouped by domain (auth, dispatch, patient, user, analytics)
   - Consistent request/response patterns
   - Automatic error handling

4. **React Query Integration** (`app/lib/api/hooks.ts` + `app/lib/api/provider.tsx`)
   - Pre-configured query and mutation hooks for all endpoints
   - Automatic cache management with stale time
   - Request deduplication
   - Built-in retry logic

5. **Real-time Socket Integration** (`app/lib/api/realtime.ts`)
   - Hook for subscribing to real-time dispatch updates
   - Automatic cache invalidation on socket events
   - Optimistic updates on UI

6. **UI Components**
   - `AsyncStateWrapper`: Generic async state renderer
   - `ErrorBoundary`: React error boundary with retry
   - `LoadingStates`: Skeleton loaders and loading states

### Socket.io Integration

Enhanced Socket.io with:
- JWT authentication in handshake
- Retry logic with exponential backoff
- Event emission logging
- Graceful error handling
- Test environment skip (prevents timeouts in tests)

---

## Usage Examples

### 1. Making API Calls with Type Safety

```tsx
'use client'

import { useDispatches, useCreateDispatch } from '@/lib/api/hooks'
import { AsyncStateWrapper } from '@/components/AsyncStateWrapper'

export function DispatchList() {
  // Query hook - automatically handles loading/error/data states
  const { data, isLoading, error } = useDispatches({ limit: 10 })

  return (
    <AsyncStateWrapper data={data} isLoading={isLoading} error={error}>
      {(dispatches) => (
        <ul>
          {dispatches.map((d) => (
            <li key={d.id}>{d.id} - {d.status}</li>
          ))}
        </ul>
      )}
    </AsyncStateWrapper>
  )
}
```

### 2. Mutation (Create/Update/Delete)

```tsx
import { useCreateDispatch } from '@/lib/api/hooks'

export function CreateDispatchForm() {
  const createMutation = useCreateDispatch()

  const handleSubmit = async (formData: CreateDispatchInput) => {
    const result = await createMutation.mutateAsync(formData)
    
    if (result.ok) {
      console.log('Dispatch created:', result.data)
    } else {
      console.error('Error:', result.error)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit({ /* form data */ })
    }}>
      {createMutation.isPending && <span>Creating...</span>}
      {createMutation.isError && <span className="text-red-600">Error</span>}
      {/* form fields */}
    </form>
  )
}
```

### 3. Real-time Updates

```tsx
'use client'

import { useDispatches } from '@/lib/api/hooks'
import { useRealtimeDispatches } from '@/lib/api/realtime'

export function DispatchBoard() {
  // Setup real-time sync
  useRealtimeDispatches()

  // Use regular hook - automatically updates via real-time events
  const { data: dispatches, isLoading } = useDispatches()

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      {/* Renders automatically update when socket events arrive */}
      {dispatches?.map((d) => <DispatchCard key={d.id} dispatch={d} />)}
    </div>
  )
}
```

### 4. Handling Errors

```tsx
import { getErrorMessage, isNetworkError } from '@/lib/api/client'

const result = await api.dispatchApi.create({ /* data */ })

if (!result.ok) {
  const message = getErrorMessage(result.error)
  
  if (isNetworkError(result.error)) {
    toast.error('Network error. Check your connection.')
  } else if (result.status === 401) {
    // Redirect to login
  } else {
    toast.error(message)
  }
}
```

---

## API Response Types

All responses follow this structure:

```typescript
interface ApiResponse<T> {
  ok: boolean               // Success/failure indicator
  data: T | null           // Response data (validated with Zod)
  error: {                  // Error object if ok === false
    code: string           // Error code (e.g., "VALIDATION_FAILED")
    message: string        // User-friendly message
    details?: unknown      // Additional error details
  } | null
  status: number           // HTTP status code
}
```

### Error Codes

- `VALIDATION_FAILED` - Input data didn't pass validation
- `INVALID_CREDENTIALS` - Login failed (wrong email/password)
- `UNAUTHORIZED` - Missing/invalid token (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource already exists
- `PARSE_ERROR` - Failed to parse server response
- `NETWORK_ERROR` - Network request failed
- `TIMEOUT` - Request timed out (408)
- `UNKNOWN_ERROR` - Unexpected error

---

## Advanced Usage

### Custom Query Configuration

```tsx
import { queryClient } from '@/lib/api/provider'

// Manually invalidate cache
queryClient.invalidateQueries({ queryKey: queryKeys.dispatches.all })

// Remove specific query from cache
queryClient.removeQueries({ queryKey: queryKeys.dispatches.detail('id-123') })

// Prefetch data
queryClient.prefetchQuery({
  queryKey: queryKeys.dispatches.list(),
  queryFn: () => api.dispatchApi.list(),
})
```

### Retry Logic

The query client has built-in retry logic:
- Network errors: 3 retries with exponential backoff
- Client errors (4xx except 408): No retry
- Server errors (5xx): 1 retry

### Socket Connection

```tsx
import { connectSocket, emitSocketEvent, isSocketConnected } from '@/lib/socket'

// Get socket instance
const socket = connectSocket()

// Check connection status
if (isSocketConnected()) {
  // Connected
}

// Listen to events
socket.on('dispatch:updated', (data) => {
  console.log('Dispatch updated:', data)
})

// Emit events with acknowledgment
const ack = await emitSocketEvent('dispatch:status_changed', {
  dispatchId: 'id-123',
  status: 'COMPLETED'
})
```

---

## Testing

All API calls are type-safe and can be tested:

```tsx
// In tests, socket emitter skips sending (prevents timeouts)
// All API calls go through apiCall() with proper error handling

import { apiCall } from '@/lib/api/client'
import { DispatchSchema } from '@/lib/api/schemas'

const result = await apiCall('/api/dispatches/123', DispatchSchema)
expect(result.ok).toBe(true)
```

---

## Debugging

Enable debug logging by:

```bash
# In browser console
localStorage.debug = 'ApiClient*'

# Or set env var
NEXT_PUBLIC_DEBUG=true
```

All API calls are logged with:
- HTTP method and endpoint
- Request duration
- Response status
- Validation errors (if any)

---

## Migration from Old Pattern

### Before (Raw fetch)

```tsx
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  fetch('/api/dispatches')
    .then(r => r.json())
    .then(d => setData(d))
    .catch(e => setError(e))
    .finally(() => setLoading(false))
}, [])
```

### After (React Query)

```tsx
const { data, isLoading, error } = useDispatches()
```

---

## Performance Optimization

1. **Caching**: GET requests cached for 30 seconds by default
2. **Request Deduplication**: Identical in-flight requests deduplicated
3. **Stale-while-revalidate**: Uses cached data while fetching fresh data
4. **Selective Updates**: Socket events only invalidate affected queries
5. **Pagination**: Supports limit/offset for large datasets

---

## Production Checklist

- [ ] All API calls use centralized client (0 raw fetch())
- [ ] All responses validated with Zod
- [ ] Error handling implemented for all mutations
- [ ] Real-time sync enabled for dashboards
- [ ] Socket authentication configured
- [ ] Error boundaries added to pages
- [ ] Loading states implemented
- [ ] Network error messages user-friendly
- [ ] Tests passing (20+ unit, 5+ integration)
- [ ] No console errors on happy path

---

## Support

For issues or questions:
1. Check the examples in this guide
2. Review the hook signatures in `app/lib/api/hooks.ts`
3. Check the Zod schema validation errors
4. Enable debug logging to see API calls
