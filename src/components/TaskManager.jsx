import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  generateTaskDescription,
} from "../api";

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
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const loadTasks = async () => {
    try {
      setStatus("Loading tasks...");
      const data = await getTasks();
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

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    setAiMessage("");
    try {
      const result = await generateTaskDescription(form.title);
      if (result.fallback) {
        setAiMessage(result.message);
      } else {
        setForm((currentForm) => ({ ...currentForm, description: result.description }));
        setAiMessage("AI suggestion added. Review and edit it before saving.");
      }
    } catch (error) {
      setAiMessage(error.message);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setAiMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        const saved = await apiUpdateTask(editingId, form);
        setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
        setStatus("Task updated successfully.");
      } else {
        // optimistic UI: add a temporary task immediately
        const tempId = `temp-${Date.now()}`;
        const tempTask = { id: tempId, ...form, completed: false, createdAt: new Date() };
        setTasks((prev) => [tempTask, ...prev]);

        try {
          const saved = await createTask(form);
          // replace temp with saved from server
          setTasks((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
          setStatus("Task created successfully.");
        } catch (err) {
          // remove temp on failure
          setTasks((prev) => prev.filter((t) => t.id !== tempId));
          throw err;
        }
      }

      resetForm();
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
      const updated = await apiUpdateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setStatus("Task status updated.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await apiDeleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
            disabled={isGeneratingDescription}
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter task description"
            aria-describedby="ai-description-disclaimer"
            disabled={isGeneratingDescription}
          />
          <div className="ai-description-controls">
            <button
              className="secondary-action"
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription || !form.title.trim()}
            >
              {isGeneratingDescription ? "Generating..." : "Generate description"}
            </button>
            <p id="ai-description-disclaimer" className="ai-disclaimer">
              AI-generated suggestions may be inaccurate. Review and edit before saving;
              only the task title is sent to the AI service.
            </p>
            {aiMessage && <p className="ai-message" role="status">{aiMessage}</p>}
          </div>

          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            disabled={isGeneratingDescription}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <div className="task-form-actions">
            <button
              className="primary-action"
              type="submit"
              disabled={isSaving || isGeneratingDescription}
            >
              {isSaving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                className="secondary-action"
                type="button"
                onClick={resetForm}
                disabled={isGeneratingDescription}
              >
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
