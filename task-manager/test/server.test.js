const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');

test('GET /tasks returns all tasks', async () => {
  const server = app.listen(0);

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
  const server = app.listen(0);

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
  const server = app.listen(0);

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
