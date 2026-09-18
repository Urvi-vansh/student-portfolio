const BASE_URL = 'http://localhost:5000';

const handleResponse = async (res) => {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error || (data?.details ? data.details.join(', ') : res.statusText);
    throw new Error(err || 'API error');
  }
  return data;
};

export const getTasks = () => fetch(`${BASE_URL}/tasks`).then(handleResponse);
export const getTask = (id) => fetch(`${BASE_URL}/tasks/${id}`).then(handleResponse);
export const createTask = (payload) =>
  fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateTask = (id, payload) =>
  fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteTask = (id) =>
  fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' }).then(handleResponse);

export default {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
