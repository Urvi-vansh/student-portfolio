# Practical: React Lazy Loading and Code Splitting

## Objective

Reduce the JavaScript needed for the first portfolio view by loading route components only when their routes are visited. The implementation uses `React.lazy()` with a route-level `Suspense` fallback in `src/App.jsx`.

## Architecture

Before optimization, the entry bundle imported Home, Skills, Projects, Tasks, and Contact together:

```text
index.js -> [Home][Skills][Projects][Tasks][Contact]
```

After optimization, the entry bundle contains the initial shell and the other routes are separate chunks:

```text
index.js          -> loaded on first visit
Skills-*.js       -> loaded on /skills
Projects-*.js     -> loaded on /projects
TaskManager-*.js  -> loaded on /tasks
Contact-*.js      -> loaded on /contact
```

## Implementation

```jsx
const Projects = lazy(() => import("./components/Projects"));
const Contact = lazy(() => import("./components/Contact"));

<Suspense fallback={<PageLoading />}>
  <Routes>{/* route elements */}</Routes>
</Suspense>
```

`PageLoading` provides a spinner, status text, and `role="status"` so users receive feedback while a route chunk is downloading.

## Measurement Procedure

Run these commands from the `student-portfolio` directory:

```bash
npm run build
npm run dev
```

In browser DevTools:

1. Open **Network**, enable **Disable cache**, and select **Slow 3G**.
2. Reload `/` and record total JavaScript transferred and page load time.
3. Visit `/projects` and `/contact`; confirm a new chunk request appears for each route and observe the loading fallback before the route renders.
4. Repeat with the same viewport, throttle, and cache settings for a fair comparison. Save screenshots of the Network and build output panels.

## Build Evidence

The optimized build was run on 2026-09-18 with Vite 8.1.4:

| Output | Size | Gzip |
| --- | ---: | ---: |
| Initial JavaScript (`index-*.js`) | 236.63 kB | 75.83 kB |
| Skills chunk | 0.74 kB | 0.39 kB |
| Projects chunk | 1.98 kB | 0.91 kB |
| TaskManager chunk | 4.40 kB | 1.64 kB |
| Contact chunk | 1.75 kB | 0.76 kB |

Record the baseline values from the pre-optimization build and DevTools run below. They must use the same browser, viewport, throttling, and cache settings as the post-optimization run.

| Metric | Before | After |
| --- | --- | --- |
| Initial JavaScript build output | _record before optimization_ | 236.63 kB (75.83 kB gzip) |
| Total JS transferred on `/` | _record in Network_ | _record in Network_ |
| `/projects` chunk request | bundled into initial JS | `Projects-*.js` |
| `/contact` chunk request | bundled into initial JS | `Contact-*.js` |
| `/` load time | _record in Performance_ | _record in Performance_ |

## Analysis Questions

1. The initial bundle downloads during the first page load. A lazy chunk is requested only when React renders the route that needs it.
2. Lazy loading improves perceived performance because the browser parses less JavaScript before showing the first view, even though a user who visits every route eventually downloads much of the same total code.
3. Lazy loading may not be worth the complexity for a very small app, for routes users almost always visit together, or when extra network requests cost more than the parsing work saved.

## Supplementary Work

- The Tasks route is an additional route split beyond the required Projects and Contact routes. It contains the full-stack task workflow and is loaded only when `/tasks` is visited.
- For an optional heavy component experiment, place a chart or large list in a dedicated module and load it with `lazy(() => import("./components/Chart"))` from the route that needs it.
- Use the React DevTools Profiler on the Tasks route and record one component that re-renders without changed props, the interaction that triggers it, and the smallest state boundary that could prevent the render.
