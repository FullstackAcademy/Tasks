import { useState } from "react";
import api from "../api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalInput(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Tasks({ tasks = [], categoryId, categories = [], onChanged }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurringDays, setRecurringDays] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDays, setEditDays] = useState([]);

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c;
  });

  const visible = categoryId
    ? tasks.filter((t) => t.categoryId === categoryId)
    : tasks;

  function toggleDay(day) {
    setRecurringDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    );
  }

  function toggleEditDay(day) {
    setEditDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    );
  }

  async function addTask() {
    if (!title.trim()) return;
    await api.post("/tasks", {
      title: title.trim(),
      dueDate: dueDate || null,
      recurringDays,
      categoryId: categoryId ?? null,
    });
    setTitle("");
    setDueDate("");
    setRecurringDays([]);
    onChanged();
  }

  async function toggleComplete(task) {
    await api.patch(`/tasks/${task.id}`, { completed: !task.completed });
    onChanged();
  }

  async function remove(id) {
    await api.delete(`/tasks/${id}`);
    onChanged();
  }

  async function pushToGoogle(id) {
    try {
      await api.post(`/google/push/${id}`);
      alert("Pushed to Google Calendar");
    } catch (err) {
      alert(err.response?.data?.error ?? "Failed to push");
    }
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditDate(task.dueDate ? toLocalInput(task.dueDate) : "");
    setEditDays(task.recurringDays ?? []);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDate("");
    setEditDays([]);
  }

  async function saveEdit(id) {
    await api.patch(`/tasks/${id}`, {
      dueDate: editDate || null,
      recurringDays: editDays,
    });
    cancelEdit();
    onChanged();
  }

  const now = new Date();
  const openCount = visible.filter((t) => !t.completed).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Tasks</h1>
        <p className="text-sm text-gray-500">
          {openCount} open · {visible.length} total
        </p>
      </div>

      <div className="mb-6 rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-base text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-1">
            {DAYS.map((label, index) => (
              <button
                key={index}
                onClick={() => toggleDay(index)}
                className={`h-9 w-10 rounded-md text-xs transition ${
                  recurringDays.includes(index)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={addTask}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add task
        </button>
      </div>

      <div className="space-y-3">
        {visible.map((task) => {
          const category = task.categoryId ? categoryMap[task.categoryId] : null;
          const due = task.dueDate ? new Date(task.dueDate) : null;
          const overdue = due && !task.completed && due < now;
          const isEditing = editingId === task.id;
          return (
            <div
              key={task.id}
              className="rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800 transition hover:ring-gray-700"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(task)}
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                    task.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                >
                  {task.completed && (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-base ${
                      task.completed ? "text-gray-500 line-through" : "text-white"
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {category && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color || "#3b82f6" }}
                        />
                        {category.name}
                      </span>
                    )}
                    {due ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                          overdue
                            ? "bg-red-500/15 text-red-400"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {overdue ? "Overdue · " : ""}
                        {due.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">No date</span>
                    )}
                    {(task.recurringDays ?? [])
                      .slice()
                      .sort((a, b) => a - b)
                      .map((d) => (
                        <span
                          key={d}
                          className="rounded-full bg-blue-500/15 px-2 py-1 text-xs text-blue-300"
                        >
                          {DAYS[d]}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => (isEditing ? cancelEdit() : startEdit(task))}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  >
                    {isEditing ? "Close" : "Edit"}
                  </button>
                  <button
                    onClick={() => pushToGoogle(task.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-blue-400"
                  >
                    → Google
                  </button>
                  <button
                    onClick={() => remove(task.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-800 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 border-t border-gray-800 pt-4">
                  <p className="mb-2 text-xs text-gray-500">Set date & repeat days</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="datetime-local"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {DAYS.map((label, index) => (
                        <button
                          key={index}
                          onClick={() => toggleEditDay(index)}
                          className={`h-9 w-10 rounded-md text-xs transition ${
                            editDays.includes(index)
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    {editDate && (
                      <button
                        onClick={() => setEditDate("")}
                        className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-800 hover:text-red-400"
                      >
                        Clear date
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-sm text-gray-500">No tasks yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}