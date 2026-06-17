import { useEffect, useState } from "react";
import api from "../api";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function StatTile({ label, value, chip, text, icon }) {
  return (
    <div className="rounded-2xl bg-gray-900 p-5 ring-1 ring-gray-800 transition hover:-translate-y-0.5 hover:ring-gray-700">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${chip}`}>
        {icon}
      </span>
      <p className={`mt-4 text-4xl font-bold tracking-tight ${text}`}>{value}</p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}

export default function Dashboard({ onOpenTasks, onOpenNotes }) {
  const [tasks, setTasks] = useState([]);
  const [noteCount, setNoteCount] = useState(0);

  async function load() {
    const [taskRes, noteRes] = await Promise.all([
      api.get("/tasks"),
      api.get("/notes"),
    ]);
    setTasks(taskRes.data);
    setNoteCount(noteRes.data.length);
  }

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const open = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const dueToday = open.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate), now)
  );
  const dueSoon = open
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const tiles = [
    {
      label: "Open tasks",
      value: open.length,
      chip: "bg-blue-500/15 text-blue-400",
      text: "text-blue-400",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="3.5" cy="6" r="1" />
          <circle cx="3.5" cy="12" r="1" />
          <circle cx="3.5" cy="18" r="1" />
        </svg>
      ),
    },
    {
      label: "Due today",
      value: dueToday.length,
      chip: "bg-amber-500/15 text-amber-400",
      text: "text-amber-400",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
    },
    {
      label: "Completed",
      value: completed.length,
      chip: "bg-emerald-500/15 text-emerald-400",
      text: "text-emerald-400",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      ),
    },
    {
      label: "Notes",
      value: noteCount,
      chip: "bg-violet-500/15 text-violet-400",
      text: "text-violet-400",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h8l6 6v14H6z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6M9 17h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <p className="text-sm text-gray-500">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            onClick={tile.label === "Notes" ? onOpenNotes : onOpenTasks}
            className="text-left"
          >
            <StatTile {...tile} />
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-gray-900 p-6 ring-1 ring-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Due soon</h2>
          <button
            onClick={onOpenTasks}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            View all tasks
          </button>
        </div>
        {dueSoon.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing scheduled. You're all caught up.
          </p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {dueSoon.map((task) => {
              const due = new Date(task.dueDate);
              const overdue = due < now;
              return (
                <li
                  key={task.id}
                  className="flex items-center justify-between py-3"
                >
                  <span className="truncate pr-4 text-sm text-gray-200">
                    {task.title}
                  </span>
                  <span
                    className={`shrink-0 text-xs ${
                      overdue ? "text-red-400" : "text-gray-400"
                    }`}
                  >
                    {overdue ? "Overdue · " : ""}
                    {due.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}