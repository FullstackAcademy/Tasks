import { useState } from "react";
import api from "../api";

const pad = (n) => String(n).padStart(2, "0");

// date + time -> UTC ISO (or null). time defaults to 00:00, never any seconds.
function combine(day, time) {
  if (!day) return null;
  const d = new Date(`${day}T${time || "00:00"}`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// stored ISO -> local { day, time } to prefill the inputs
function splitLocal(value) {
  const d = new Date(value);
  return {
    day: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function Tasks({ tasks = [], categoryId, categories = [], onChanged }) {
  const [title, setTitle] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [dueTime, setDueTime] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c;
  });

  const visible = categoryId ? tasks.filter((t) => t.categoryId === categoryId) : tasks;

  async function addTask() {
    if (!title.trim()) return;
    await api.post("/tasks", {
      title: title.trim(),
      dueDate: combine(dueDay, dueTime), // date alone = midnight; always saves a due date
      categoryId: categoryId ?? null,
    });
    setTitle("");
    setDueDay("");
    setDueTime("");
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
    if (task.dueDate) {
      const { day, time } = splitLocal(task.dueDate);
      setEditDay(day);
      setEditTime(time);
    } else {
      setEditDay("");
      setEditTime("");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDay("");
    setEditTime("");
  }

  async function saveEdit(id) {
    await api.patch(`/tasks/${id}`, { dueDate: combine(editDay, editTime) });
    cancelEdit();
    onChanged();
  }

  const now = new Date();

  // ordering: open tasks with a due date first (soonest first), then open with no date
  const active = visible.filter((t) => !t.completed);
  const completed = visible.filter((t) => t.completed);
  const withDate = active
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const noDate = active.filter((t) => !t.dueDate);
  const ordered = [...withDate, ...noDate];

  function card(task) {
    const category = task.categoryId ? categoryMap[task.categoryId] : null;
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const overdue = due && !task.completed && due < now;
    const isEditing = editingId === task.id;
    return (
      <div
        key={task.id}
        className={`rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700 ${task.completed ? "opacity-70" : ""}`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleComplete(task)}
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
              task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-600 hover:border-gray-400"
            }`}
          >
            {task.completed && (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className={`text-base ${task.completed ? "text-gray-500 line-through" : "text-white"}`}>
              {task.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-300">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color || "#3b82f6" }} />
                  {category.name}
                </span>
              )}
              {due ? (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${overdue ? "border-red-500/40 text-red-400" : "border-gray-700 text-gray-300"}`}>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  {overdue ? "Overdue · " : ""}
                  {due.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              ) : (
                <span className="text-xs text-gray-600">No date</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => (isEditing ? cancelEdit() : startEdit(task))} className="rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200">
              {isEditing ? "Close" : "Edit"}
            </button>
            <button onClick={() => pushToGoogle(task.id)} className="rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-blue-400">
              → Google
            </button>
            <button onClick={() => remove(task.id)} className="rounded-lg px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-800 hover:text-red-400">
              Delete
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 border-t border-gray-800 pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-gray-400">
                Date
                <input type="date" value={editDay} onChange={(e) => setEditDay(e.target.value)} className="mt-1 block rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </label>
              <label className="text-xs text-gray-400">
                Time
                <input type="time" step="60" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="mt-1 block rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </label>
              <button onClick={() => saveEdit(task.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">Save</button>
              <button onClick={cancelEdit} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800">Cancel</button>
              {editDay && (
                <button onClick={() => { setEditDay(""); setEditTime(""); }} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800 hover:text-red-400">Clear date</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
        <p className="text-sm text-gray-500">{active.length} open · {completed.length} done</p>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="What needs doing?"
          className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-base text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-400">
            Date
            <input type="date" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="mt-1 block rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </label>
          <label className="text-xs text-gray-400">
            Time <span className="text-gray-600">(optional)</span>
            <input type="time" step="60" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="mt-1 block rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </label>
        </div>
        <button onClick={addTask} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          Add task
        </button>
      </div>

      <div className="space-y-3">
        {ordered.map(card)}
        {ordered.length === 0 && (
          <p className="text-sm text-gray-500">Nothing to do here. Add a task above.</p>
        )}
      </div>

      {completed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Completed ({completed.length})
          </h2>
          <div className="space-y-3">{completed.map(card)}</div>
        </div>
      )}
    </div>
  );
}