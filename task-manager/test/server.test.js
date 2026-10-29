const test = require('node:test');
const assert = require('node:assert/strict');
const { app, aiRequests } = require('../server');
const { resetCache } = require('../cache');

const startServer = () => new Promise((resolve) => {
  const server = app.listen(0, () => resolve(server));
});

test('GET /tasks returns all tasks', async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/tasks`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 1);
  } finally {
    server.close();
  }
});

test('POST /tasks creates a new task', async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write practical notes' }),
    });
    const data = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.title, 'Write practical notes');
    assert.ok(typeof data.id === 'number');
  } finally {
    server.close();
  }
});

test('POST /tasks rejects requests without application/json content type', async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Missing header' }),
    });

    assert.equal(response.status, 415);
  } finally {
    server.close();
  }
});

test('GET /tasks/:id returns the created task', async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const createResponse = await fetch(`http://127.0.0.1:${port}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Read task by id' }),
    });
    const createdTask = await createResponse.json();

    const response = await fetch(`http://127.0.0.1:${port}/tasks/${createdTask.id}`);
    const data = await response.json();
    await fetch(`http://127.0.0.1:${port}/tasks/${createdTask.id}`);
    const metricsResponse = await fetch(`http://127.0.0.1:${port}/debug/cache`);
    const metrics = await metricsResponse.json();

    assert.equal(response.status, 200);
    assert.equal(data.title, 'Read task by id');
    assert.equal(metrics.taskMisses, 1);
    assert.equal(metrics.taskHits, 1);
  } finally {
    server.close();
  }
});

test('GET /tasks caches repeated reads and reports cache metrics', async () => {
  resetCache();
  const server = await startServer();

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;

    await fetch(`${url}/tasks`);
    await fetch(`${url}/tasks`);
    const metricsResponse = await fetch(`${url}/debug/cache`);
    const metrics = await metricsResponse.json();

    assert.equal(metricsResponse.status, 200);
    assert.equal(metrics.allTasksMisses, 1);
    assert.equal(metrics.allTasksHits, 1);
    assert.equal(metrics.ttlSeconds, 60);
  } finally {
    server.close();
  }
});

test('writes invalidate all-task and single-task caches', async () => {
  resetCache();
  const server = await startServer();

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;
    const createResponse = await fetch(`${url}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Verify invalidation' }),
    });
    const createdTask = await createResponse.json();

    await fetch(`${url}/tasks`);
    await fetch(`${url}/tasks/${createdTask.id}`);

    const updateResponse = await fetch(`${url}/tasks/${createdTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated invalidation' }),
    });
    assert.equal(updateResponse.status, 200);

    const tasksResponse = await fetch(`${url}/tasks`);
    const tasks = await tasksResponse.json();
    const taskResponse = await fetch(`${url}/tasks/${createdTask.id}`);
    const task = await taskResponse.json();

    assert.equal(tasksResponse.status, 200);
    assert.equal(taskResponse.status, 200);
    assert.equal(tasks.find((item) => item.id === createdTask.id).title, 'Updated invalidation');
    assert.equal(task.title, 'Updated invalidation');
  } finally {
    server.close();
  }
});

test('DELETE invalidates cached task and all-task responses', async () => {
  resetCache();
  const server = await startServer();

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;
    const createResponse = await fetch(`${url}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Delete cache test' }),
    });
    const createdTask = await createResponse.json();

    await fetch(`${url}/tasks`);
    await fetch(`${url}/tasks/${createdTask.id}`);

    const deleteResponse = await fetch(`${url}/tasks/${createdTask.id}`, {
      method: 'DELETE',
    });
    assert.equal(deleteResponse.status, 200);

    const tasksResponse = await fetch(`${url}/tasks`);
    const tasks = await tasksResponse.json();
    const taskResponse = await fetch(`${url}/tasks/${createdTask.id}`);

    assert.ok(!tasks.some((task) => task.id === createdTask.id));
    assert.equal(taskResponse.status, 404);
  } finally {
    server.close();
  }
});

test('AI description endpoint returns a fallback when no API key is configured', async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  aiRequests.clear();
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Prepare lab report' }),
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.description, '');
    assert.equal(data.fallback, true);
    assert.match(data.message, /write the description yourself/i);
  } finally {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
    if (originalGeminiApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiApiKey;
    server.close();
  }
});

test('AI description endpoint uses Gemini with its key kept in the backend request header', async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;
  const originalGeminiModel = process.env.GEMINI_MODEL;
  const originalFetch = global.fetch;
  delete process.env.OPENAI_API_KEY;
  process.env.GEMINI_API_KEY = 'gemini-test-key';
  process.env.GEMINI_MODEL = 'gemini-3.6-flash';
  aiRequests.clear();
  global.fetch = async (url, options) => {
    assert.equal(
      url,
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    );
    assert.equal(options.headers['x-goog-api-key'], 'gemini-test-key');
    assert.deepEqual(JSON.parse(options.body), {
      contents: [{
        parts: [{
          text: 'Write a concise, practical task description based only on this task title: Prepare lab report',
        }],
      }],
      generationConfig: { maxOutputTokens: 120 },
    });
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: 'Gather the results and summarize them.' }],
          },
        }],
      }),
    };
  };
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await originalFetch(`http://127.0.0.1:${port}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Prepare lab report' }),
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.description, 'Gather the results and summarize them.');
    assert.equal(data.fallback, false);
  } finally {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
    if (originalGeminiApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiApiKey;
    if (originalGeminiModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalGeminiModel;
    global.fetch = originalFetch;
    aiRequests.clear();
    server.close();
  }
});

test('AI description endpoint returns an editable suggestion and rate limits the same task', async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;
  delete process.env.GEMINI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  aiRequests.clear();
  let requestCount = 0;
  global.fetch = async (url, options) => {
    requestCount += 1;
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Gather the results and summarize them.' } }],
      }),
    };
  };
  const server = await startServer();

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/ai/generate-description`;
    const request = () => originalFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Prepare lab report' }),
    });
    const response = await request();
    const data = await response.json();
    const limitedResponse = await request();

    assert.equal(response.status, 200);
    assert.equal(data.description, 'Gather the results and summarize them.');
    assert.equal(data.fallback, false);
    assert.equal(limitedResponse.status, 429);
    assert.equal(requestCount, 1);
  } finally {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
    if (originalGeminiApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiApiKey;
    global.fetch = originalFetch;
    aiRequests.clear();
    server.close();
  }
});

test('AI description endpoint degrades gracefully when the provider fails', async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalGeminiApiKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;
  delete process.env.GEMINI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  aiRequests.clear();
  global.fetch = async () => ({ ok: false, status: 503 });
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await originalFetch(`http://127.0.0.1:${port}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Prepare lab report' }),
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.description, '');
    assert.equal(data.fallback, true);
    assert.match(data.message, /unavailable right now/i);
  } finally {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
    if (originalGeminiApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiApiKey;
    global.fetch = originalFetch;
    aiRequests.clear();
    server.close();
  }
});
