const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./models/Task');
const User = require('./models/User');

dotenv.config();

const app = express();
const JWT_EXPIRES_IN = '1h';

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

const ensureDatabaseConnected = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected');
  }
};

const validateCredentials = (body) => {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const errors = [];

  if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address');
  if (password.length < 8) errors.push('Password must be at least 8 characters');

  return { name, email, password, errors };
};

const validateTask = (body, partial = false) => {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) errors.push('Task title is required');
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('Description must be a string');
  }
  if (body.priority !== undefined && !['low', 'medium', 'high'].includes(body.priority)) {
    errors.push('Priority must be low, medium, or high');
  }
  if (body.completed !== undefined && typeof body.completed !== 'boolean') {
    errors.push('Completed must be a boolean');
  }
  return errors;
};

const signToken = (user) => jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const authenticate = (req, res, next) => {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Authentication token required' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: error.name === 'TokenExpiredError' ? 'Authentication token expired' : 'Invalid authentication token' });
  }
};

const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
  next();
};

const listTasks = async (userId) => {
  ensureDatabaseConnected();
  const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
  return tasks.map(serializeTask);
};

const getTaskById = async (taskId, userId) => {
  ensureDatabaseConnected();
  const task = await Task.findOne({ _id: taskId, user: userId });
  return task ? serializeTask(task) : null;
};

const createTask = async (payload, userId) => {
  ensureDatabaseConnected();
  return serializeTask(await Task.create({ ...payload, user: userId }));
};

const updateTask = async (taskId, payload, userId) => {
  ensureDatabaseConnected();
  const task = await Task.findOneAndUpdate({ _id: taskId, user: userId }, payload, {
    new: true,
    runValidators: true,
  });

  return task ? serializeTask(task) : null;
};

const deleteTask = async (taskId, userId) => {
  ensureDatabaseConnected();
  const task = await Task.findOneAndDelete({ _id: taskId, user: userId });
  return task ? serializeTask(task) : null;
};

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Task Manager API is running' });
});

app.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, errors } = validateCredentials(req.body || {});
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    ensureDatabaseConnected();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: passwordHash });
    res.status(201).json({ user: { id: user._id.toString(), name: user.name, email: user.email }, token: signToken(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
    next(error);
  }
});

app.post('/auth/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    ensureDatabaseConnected();
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid email or password' });
    res.status(200).json({ user: { id: user._id.toString(), name: user.name, email: user.email }, token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

app.use('/tasks', authenticate);

app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await listTasks(req.user.sub);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

app.get('/tasks/:id', validateObjectId, async (req, res, next) => {
  try {
    const task = await getTaskById(req.params.id, req.user.sub);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

app.post('/tasks', async (req, res, next) => {
  try {
    const errors = validateTask(req.body || {});
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    const task = await createTask(req.body, req.user.sub);
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

app.put('/tasks/:id', validateObjectId, async (req, res, next) => {
  try {
    const errors = validateTask(req.body || {}, true);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    const task = await updateTask(req.params.id, req.body, req.user.sub);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

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

app.delete('/tasks/:id', validateObjectId, async (req, res, next) => {
  try {
    const task = await deleteTask(req.params.id, req.user.sub);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

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
    throw new Error('MONGO_URI is required to start the task manager');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, Task, User };
