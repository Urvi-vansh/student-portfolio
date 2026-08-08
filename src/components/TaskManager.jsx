import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/tasks";

const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
};

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("Loading tasks...");
  const [isSaving, setIsSaving] = useState(false);

  const loadTasks = async () => {
    try {
      setStatus("Loading tasks...");
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load tasks");
      }

      setTasks(data);
      setStatus(data.length ? "Tasks loaded from backend." : "No tasks found. Add one below.");
    } catch (error) {
      setStatus(`${error.message}. Start backend with npm run dev in task-manager.`);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details?.join(", ") || data.error || "Unable to save task");
      }

      resetForm();
      await loadTasks();
      setStatus(editingId ? "Task updated successfully." : "Task created successfully.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
    });
  };

  const toggleCompleted = async (task) => {
    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update task");
      }

      await loadTasks();
      setStatus("Task status updated.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/${taskId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete task");
      }

      await loadTasks();
      setStatus("Task deleted successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section className="page-section task-page">
      <p className="section-label">CRUD Demo</p>
      <h2>MongoDB Task Manager.</h2>
      <p className="section-intro">
        Create, read, update, and delete tasks through the Express API. When MongoDB is
        connected, these records appear in Compass under task-manager &gt; tasks.
      </p>

      <div className="task-layout">
        <form className="task-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Update Task" : "Add Task"}</h3>

          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter task title"
            required
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter task description"
          />

          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <div className="task-form-actions">
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button className="secondary-action" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="task-list-panel">
          <div className="task-list-header">
            <h3>Tasks</h3>
            <button className="secondary-action" type="button" onClick={loadTasks}>
              Refresh
            </button>
          </div>

          <p className="task-status">{status}</p>

          <div className="task-list">
            {tasks.map((task) => (
              <article className="task-item" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.description || "No description added."}</p>
                  <span>
                    {task.priority || "medium"} priority |{" "}
                    {task.completed ? "Completed" : "Pending"}
                  </span>
                </div>

                <div className="task-actions">
                  <button type="button" onClick={() => toggleCompleted(task)}>
                    {task.completed ? "Undo" : "Done"}
                  </button>
                  <button type="button" onClick={() => startEdit(task)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteTask(task.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TaskManager;
