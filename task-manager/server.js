const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Task = require('./models/Task');
const {
  allTasksKey,
  cache,
  getCached,
  getMetrics,
  invalidateTaskCaches,
  taskKey,
} = require('./cache');

dotenv.config();

const app = express();
const memoryTasks = [
  { id: 1, title: 'Prepare lab report', description: '', completed: false, priority: 'medium', createdAt: new Date() },
  { id: 2, title: 'Review Node.js concepts', description: '', completed: true, priority: 'high', createdAt: new Date() },
];
let nextMemoryId = 3;

// Enable CORS for local frontend during development
app.use(cors());

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

const serializeTask = (task) => {
  if (task && typeof task.toObject === 'function') {
    const plainTask = task.toObject();
    const serializedTask = { ...plainTask };
    serializedTask.id = plainTask._id ? plainTask._id.toString() : serializedTask.id;
    delete serializedTask._id;
    delete serializedTask.__v;
    return serializedTask;
  }

  return task;
};

const listTasks = async () => {
  if (mongoose.connection.readyState === 1) {
    const tasks = await Task.find().sort({ createdAt: -1 });
    return tasks.map(serializeTask);
  }

  return memoryTasks.map((task) => ({ ...task }));
};

const getTaskById = async (taskId) => {
  if (mongoose.connection.readyState === 1) {
    const task = await Task.findById(taskId);
    return task ? serializeTask(task) : null;
  }

  return memoryTasks.find((task) => task.id === Number(taskId)) || null;
};

const createTask = async (payload) => {
  if (mongoose.connection.readyState === 1) {
    return serializeTask(await Task.create(payload));
  }

  const task = {
    id: nextMemoryId++,
    title: payload.title?.trim() || '',
    description: payload.description || '',
    completed: Boolean(payload.completed),
    priority: payload.priority || 'medium',
    createdAt: new Date(),
  };

  memoryTasks.push(task);
  return task;
};

const updateTask = async (taskId, payload) => {
  if (mongoose.connection.readyState === 1) {
    const task = await Task.findByIdAndUpdate(taskId, payload, {
      new: true,
      runValidators: true,
    });

    return task ? serializeTask(task) : null;
  }

  const task = memoryTasks.find((item) => item.id === Number(taskId));
  if (!task) return null;

  Object.assign(task, payload);
  return { ...task };
};

const deleteTask = async (taskId) => {
  if (mongoose.connection.readyState === 1) {
    const task = await Task.findByIdAndDelete(taskId);
    return task ? serializeTask(task) : null;
  }

  const index = memoryTasks.findIndex((item) => item.id === Number(taskId));
  if (index === -1) return null;

  const [deletedTask] = memoryTasks.splice(index, 1);
  return deletedTask;
};

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Task Manager API is running' });
});

app.get('/debug/cache', (req, res) => {
  res.status(200).json(getMetrics());
});

app.get('/tasks', async (req, res, next) => {
  try {
    const bypassCache = req.query.cache === 'false';

    if (!bypassCache) {
      const cachedTasks = getCached(allTasksKey, 'all');
      if (cachedTasks !== undefined) {
        return res.status(200).json(cachedTasks);
      }
    }

    const tasks = await listTasks();
    if (!bypassCache) cache.set(allTasksKey, tasks);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

app.get('/tasks/:id', async (req, res, next) => {
  try {
    const key = taskKey(req.params.id);
    const cachedTask = getCached(key, 'task');
    if (cachedTask !== undefined) {
      return res.status(200).json(cachedTask);
    }

    const task = await getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    cache.set(key, task);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

app.post('/tasks', async (req, res, next) => {
  try {
    const task = await createTask(req.body);
    invalidateTaskCaches();
    res.status(201).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((item) => item.message),
      });
    }

    next(error);
  }
});

app.put('/tasks/:id', async (req, res, next) => {
  try {
    const task = await updateTask(req.params.id, req.body);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    invalidateTaskCaches();
    res.status(200).json(task);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map((item) => item.message),
      });
    }

    next(error);
  }
});

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const task = await deleteTask(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    invalidateTaskCaches();
    res.status(200).json({ message: 'Task deleted successfully', task });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, _next) => {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

const connectToDatabase = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set. Running with in-memory fallback storage.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = { app, Task };
