# Practical 9: In-Memory Caching and Query Optimization

## Objective

The Task Manager API uses `node-cache` to cache task reads for 60 seconds. Repeated reads can return from process memory instead of querying MongoDB, while every successful write clears the related cached values.

## Architecture

```text
GET /tasks
    |
    v
cache.get("all_tasks")
    |                  \
  HIT                  MISS
    |                    |
return JSON        query MongoDB or memory store
                         |
                    cache.set("all_tasks", tasks)

POST / PUT / DELETE /tasks
    |
    v
write data -> invalidate all_tasks and task:<id> keys
```

## Implemented Features

- `node-cache` is configured with a 60-second default TTL in `task-manager/cache.js`.
- `GET /tasks` uses the stable `all_tasks` cache key.
- `GET /tasks/:id` uses a separate `task:<id>` cache key.
- Successful POST, PUT, and DELETE operations invalidate all task cache keys.
- `GET /debug/cache` exposes hit/miss counters and active cache keys.
- `GET /tasks?cache=false` bypasses caching for controlled response-time comparisons.

## Run and Test

From the repository root:

```powershell
cd task-manager
npm install
npm test
npm run dev
```

The API runs on `http://localhost:5000`.

Example debug response:

```json
{
  "hits": 1,
  "misses": 1,
  "allTasksHits": 1,
  "allTasksMisses": 1,
  "taskHits": 0,
  "taskMisses": 0,
  "keys": ["all_tasks"],
  "ttlSeconds": 60
}
```

## Response-Time Measurement

The following readings were captured on 2026-09-18 with the local API and MongoDB connection running. PowerShell `Measure-Command` measured the complete local HTTP request. The uncached readings used the explicit bypass query parameter; the cached readings followed one warm-up request.

| Condition | Reading 1 | Reading 2 | Reading 3 | Average |
| --- | ---: | ---: | ---: | ---: |
| Uncached (`GET /tasks?cache=false`) | 40.47 ms | 3.94 ms | 4.74 ms | 16.38 ms |
| Cached (`GET /tasks`) | 16.86 ms | 1.05 ms | 0.71 ms | 6.21 ms |

For a reproducible browser/API-client check:

1. Send `GET /tasks?cache=false` three times and record the response `Time` value.
2. Clear the cache by restarting the server, send `GET /tasks` once to warm it, then send it three more times and record each `Time` value.
3. Open `GET /debug/cache` and confirm the all-task hit counter increased.
4. Create or update a task, request `GET /tasks` again, and confirm the response contains the new value. This proves write invalidation prevents stale data.

A small MongoDB dataset may show only a modest difference because the uncached query is already fast. The important evidence is the repeated cache hit counter and the fact that the cached path avoids the database read.

## Analysis

### Why invalidate on every write?

A cached list or task object becomes stale when a task is created, updated, or deleted. Invalidating after every successful write ensures the next read queries the current data and repopulates the cache. Without invalidation, users could receive incorrect data until the 60-second TTL expires.

### Why use a 60-second TTL?

A one-minute TTL is a reasonable lab default for a task list: it reduces repeated reads while limiting the maximum age of data if an invalidation path is missed. A longer TTL improves hit rate but increases possible staleness; a shorter TTL improves freshness but causes more database queries.

### Why is node-cache limited to one server?

`node-cache` stores values in the memory of one Node.js process. With multiple API instances, each process has a different cache, so one instance may serve stale data after another instance performs a write. A shared store such as Redis is more appropriate for a multi-instance deployment.

## Supplementary Results

The single-task endpoint is cached independently from the all-task endpoint. The debug endpoint reports separate `taskHits` and `taskMisses` counters. The test suite verifies that POST and PUT invalidation causes fresh reads for both cache families; DELETE uses the same shared invalidation helper.

## Practical Deliverable Checklist

- [x] Added `node-cache` dependency.
- [x] Added 60-second caching for `GET /tasks`.
- [x] Added separate caching for `GET /tasks/:id`.
- [x] Invalidated caches after POST, PUT, and DELETE.
- [x] Added cache hit/miss debug endpoint.
- [x] Added automated cache and invalidation tests.
- [ ] Record three Postman or Thunder Client timings for each condition and replace the measurement placeholders above.
