import { useEffect, useState } from "react";
import api from "../api";

function Tile({ label, value, chip, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-gray-800 bg-gray-900 p-5 text-left transition hover:-translate-y-0.5 hover:border-gray-700"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${chip}`}>{icon}</span>
      <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </button>
  );
}

export default function Dashboard({ tasks = [], onOpenTasks, onOpenNotes }) {
  const [noteCount, setNoteCount] = useState(0);

  useEffect(() => {
    api.get("/notes").then((res) => setNoteCount(res.data.length)).catch(() => {});
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const open = tasks.filter((t) => !t.completed).length;
  const done = tasks.filter((t) => t.completed).length;

  const icons = {
    open: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" />
      </svg>
    ),
    done: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" />
      </svg>
    ),
    notes: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h8l6 6v14H6z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" />
      </svg>
    ),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">{greeting}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Open tasks" value={open} chip="bg-blue-500/15 text-blue-400" icon={icons.open} onClick={onOpenTasks} />
        <Tile label="Completed" value={done} chip="bg-emerald-500/15 text-emerald-400" icon={icons.done} onClick={onOpenTasks} />
        <Tile label="Notes" value={noteCount} chip="bg-violet-500/15 text-violet-400" icon={icons.notes} onClick={onOpenNotes} />
      </div>
    </div>
  );
}