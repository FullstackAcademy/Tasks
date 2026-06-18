import { useState } from "react";
import api from "../api";

const pad = (n) => String(n).padStart(2, "0");

// datetime-local string (local) -> UTC ISO, or null
function localToISO(local) {
  if (!local) return null;
  const d = new Date(local);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// stored ISO -> "YYYY-MM-DDTHH:mm" in local time, to prefill the input
function isoToLocal(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Tasks({ tasks = [], categoryId, categories = [], onChanged }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c;
  });

  const visible = categoryId ? tasks.filter((t) => t.categoryId === categoryId) : tasks;

  async function addTask() {
    if (!title.trim()) return;
    await api.post("/tasks", {
      title: title.trim(),
      dueDate: localToISO(dueDate),
      categoryId: categoryId ?? null,
    });
    setTitle("");
    setDueDate("");
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
    setEditDate(task.dueDate ? isoToLocal(task.dueDate) : "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDate("");
  }

  async function saveEdit(id) {
    await api.patch(`/tasks/${id}`, { dueDate: localToISO(editDate) });
    cancelEdit();
    onChanged();
  }

  // ---- grouping (Apple/Notion style: Overdue, Today, Upcoming, No date, Completed) ----
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const active = visible.filter((t) => !t.completed);
  const completed = visible.filter((t) => t.completed);
  const dated = active.filter((t) => t.dueDate).map((t) => ({ t, d: new Date(t.dueDate) }));
  const byDate = (a, b) => a.d - b.d;

  const overdue = dated.filter((x) => x.d < startOfToday).sort(byDate).map((x) => x.t);
  const today = dated.filter((x) => x.d >= startOfToday && x.d < endOfToday).sort(byDate).map((x) => x.t);
  const upcoming = dated.filter((x) => x.d >= endOfToday).sort(byDate).map((x) => x.t);
  const noDate = active.filter((t) => !t.dueDate);
  const now = new Date();

  function card(task) {
    const category = task.categoryId ? categoryMap[task.categoryId] : null;
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const overdueFlag = due && !task.completed && due < now;
    const isEditing = editingId === task.id;
    return (
      <div
        key={task.id}
        className={`rounded-2xl border border-gray-800 bg-gray-900/70 p-4 transition hover:border-gray-700 ${task.completed ? "opacity-60" : ""}`}
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
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${overdueFlag ? "border-red-500/40 text-red-400" : "border-gray-700 text-gray-300"}`}>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
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
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="datetime-local"
                step="60"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <button onClick={() => saveEdit(task.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">Save</button>
              <button onClick={cancelEdit} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800">Cancel</button>
              {editDate && (
                <button onClick={() => setEditDate("")} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800 hover:text-red-400">Clear date</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  function Section({ label, items, tone }) {
    if (!items.length) return null;
    return (
      <div className="mb-7">
        <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${tone || "text-gray-500"}`}>
          {label} <span className="text-gray-600">· {items.length}</span>
        </h2>
        <div className="space-y-2.5">{items.map(card)}</div>
      </div>
    );
  }

  const nothing = active.length === 0 && completed.length === 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
        <p className="text-sm text-gray-500">{active.length} open · {completed.length} done</p>
      </div>

      <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="What needs doing?"
          className="mb-3 w-full rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-3 text-base text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-gray-400">
            Due <span className="text-gray-600">(optional)</span>
            <input
              type="datetime-local"
              step="60"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="ml-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </label>
          <button onClick={addTask} className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Add task
          </button>
        </div>
      </div>

      <Section label="Overdue" items={overdue} tone="text-red-400" />
      <Section label="Today" items={today} tone="text-blue-400" />
      <Section label="Upcoming" items={upcoming} />
      <Section label="No date" items={noDate} />
      <Section label="Completed" items={completed} />

      {nothing && <p className="text-sm text-gray-500">Nothing here yet. Add a task above.</p>}
    </div>
  );
}