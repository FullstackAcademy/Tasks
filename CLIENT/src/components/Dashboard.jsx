import { useEffect, useState } from "react";
import api from "../api";

function Ring({ percent }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke="#3b82f6" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 60 60)"
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fill="#fff" style={{ fontSize: "24px", fontWeight: 700 }}>
        {percent}%
      </text>
    </svg>
  );
}

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
  const total = open + done;
  const percent = total ? Math.round((done / total) * 100) : 0;

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

      <div className="mb-4 flex items-center gap-6 rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950/40 p-6">
        <Ring percent={percent} />
        <div className="flex-1">
          <p className="text-2xl font-bold text-white">
            {done}
            <span className="text-gray-500"> / {total}</span>
          </p>
          <p className="mb-3 text-sm text-gray-400">tasks complete</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Open tasks" value={open} chip="bg-blue-500/15 text-blue-400" icon={icons.open} onClick={onOpenTasks} />
        <Tile label="Completed" value={done} chip="bg-emerald-500/15 text-emerald-400" icon={icons.done} onClick={onOpenTasks} />
        <Tile label="Notes" value={noteCount} chip="bg-violet-500/15 text-violet-400" icon={icons.notes} onClick={onOpenNotes} />
      </div>
    </div>
  );
}