import { useEffect, useState } from "react";
import api from "../api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Tasks({ categoryId }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurringDays, setRecurringDays] = useState([]);

  async function load() {
    const res = await api.get("/tasks", {
      params: categoryId ? { categoryId } : {},
    });
    setTasks(res.data);
  }

  useEffect(() => {
    load();
  }, [categoryId]);

  function toggleDay(day) {
    setRecurringDays((days) =>
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
    load();
  }

  async function toggleComplete(task) {
    await api.patch(`/tasks/${task.id}`, { completed: !task.completed });
    load();
  }

  async function remove(id) {
    await api.delete(`/tasks/${id}`);
    load();
  }

  async function pushToGoogle(id) {
    try {
      await api.post(`/google/push/${id}`);
      alert("Pushed to Google Calendar");
    } catch (err) {
      alert(err.response?.data?.error ?? "Failed to push");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task"
          className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
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
                className={`h-8 w-9 rounded-md text-xs ${
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

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 ring-1 ring-gray-800"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleComplete(task)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800"
            />
            <div className="flex-1">
              <p
                className={`text-sm ${
                  task.completed ? "text-gray-500 line-through" : "text-white"
                }`}
              >
                {task.title}
              </p>
              <div className="mt-0.5 flex gap-3 text-xs text-gray-500">
                {task.dueDate && <span>{new Date(task.dueDate).toLocaleString()}</span>}
                {task.recurringDays.length > 0 && (
                  <span>
                    {task.recurringDays.slice().sort().map((d) => DAYS[d]).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => pushToGoogle(task.id)}
              className="text-xs text-gray-400 hover:text-blue-400"
            >
              → Google
            </button>
            <button
              onClick={() => remove(task.id)}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-gray-500">No tasks yet.</p>}
      </div>
    </div>
  );
}