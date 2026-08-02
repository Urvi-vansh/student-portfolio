const express = require('express');
const app = express();

const tasks = [
  { id: 1, title: 'Prepare lab report', completed: false },
  { id: 2, title: 'Review Node.js concepts', completed: true },
];

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  next();
});

app.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Task ID must be a numeric value' });
  }
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Task Manager API is running' });
});

app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

app.post('/tasks', (req, res, next) => {
  try {
    const { title, completed = false } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = {
      id: tasks.length ? tasks[tasks.length - 1].id + 1 : 1,
      title: title.trim(),
      completed,
    };

    tasks.push(task);
    return res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.put('/tasks/:id', (req, res, next) => {
  try {
    const taskId = Number(req.params.id);
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, completed } = req.body || {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Task title is required' });
      }
      task.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean' });
      }
      task.completed = completed;
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

app.delete('/tasks/:id', (req, res, next) => {
  try {
    const taskId = Number(req.params.id);
    const index = tasks.findIndex((item) => item.id === taskId);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [deletedTask] = tasks.splice(index, 1);
    return res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, tasks };
