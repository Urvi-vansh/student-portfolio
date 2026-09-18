const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120, useClones: true });
const metrics = {
  hits: 0,
  misses: 0,
  allTasksHits: 0,
  allTasksMisses: 0,
  taskHits: 0,
  taskMisses: 0,
};

const allTasksKey = 'all_tasks';
const taskKey = (taskId) => `task:${taskId}`;

const getCached = (key, type) => {
  const value = cache.get(key);

  if (value !== undefined) {
    metrics.hits += 1;
    metrics[type === 'all' ? 'allTasksHits' : 'taskHits'] += 1;
    return value;
  }

  metrics.misses += 1;
  metrics[type === 'all' ? 'allTasksMisses' : 'taskMisses'] += 1;
  return undefined;
};

const invalidateTaskCaches = () => {
  const taskKeys = cache.keys().filter((key) => key === allTasksKey || key.startsWith('task:'));
  if (taskKeys.length) cache.del(taskKeys);
};

const getMetrics = () => ({
  ...metrics,
  keys: cache.keys(),
  ttlSeconds: 60,
});

const resetCache = () => {
  cache.flushAll();
  Object.keys(metrics).forEach((key) => {
    metrics[key] = 0;
  });
};

module.exports = {
  allTasksKey,
  cache,
  getCached,
  getMetrics,
  invalidateTaskCaches,
  resetCache,
  taskKey,
};