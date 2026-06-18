import { useEffect, useState } from "react";
import api from "../api";

// flatten descendants of `parentId` into ordered rows with relative depth
function flatten(categories, parentId = null, depth = 0, out = []) {
  categories
    .filter((c) => c.parentId === parentId)
    .forEach((c) => {
      out.push({ ...c, depth });
      flatten(categories, c.id, depth + 1, out);
    });
  return out;
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

export default function Dashboard({ tasks = [], categories = [], category = null, onOpenTasks, onOpenNotes, onOpenCategory }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    api.get("/notes").then((res) => setNotes(res.data)).catch(() => {});
  }, []);

  const catId = category?.id ?? null;

  // everything below reflects the category I'm in (or everything, at the root)
  const scopedTasks = catId ? tasks.filter((t) => t.categoryId === catId) : tasks;
  const scopedNotes = catId ? notes.filter((n) => n.categoryId === catId) : notes;
  const open = scopedTasks.filter((t) => !t.completed).length;
  const done = scopedTasks.filter((t) => t.completed).length;

  const rows = flatten(categories, catId); // sub-spaces of the current category (or all at root)
  const tasksIn = (id) => tasks.filter((t) => t.categoryId === id).length;
  const notesIn = (id) => notes.filter((n) => n.categoryId === id).length;
  const uncatTasks = tasks.filter((t) => !t.categoryId).length;
  const uncatNotes = notes.filter((n) => !n.categoryId).length;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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

  function CountRow({ color, name, depth, taskN, noteN, onClick }) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-left transition hover:border-gray-700"
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color || "#6b7280" }} />
        <span className="flex-1 truncate text-sm font-medium text-gray-200">{name}</span>
        <span className="shrink-0 text-xs text-gray-400">
          {taskN} {taskN === 1 ? "task" : "tasks"} · {noteN} {noteN === 1 ? "note" : "notes"}
        </span>
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* header reflects the selected category, or a greeting at the root */}
      <div className="mb-8">
        {category ? (
          <>
            <button
              onClick={() => onOpenCategory?.(null)}
              className="mb-2 text-xs text-gray-500 transition hover:text-gray-300"
            >
              ← All spaces
            </button>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: category.color || "#3b82f6" }} />
              {category.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {open} open · {done} done · {scopedNotes.length} {scopedNotes.length === 1 ? "note" : "notes"}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-white">{greeting}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </>
        )}
      </div>

      {/* tiles reflect the current scope */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="Open tasks" value={open} chip="bg-blue-500/15 text-blue-400" icon={icons.open} onClick={onOpenTasks} />
        <Tile label="Completed" value={done} chip="bg-emerald-500/15 text-emerald-400" icon={icons.done} onClick={onOpenTasks} />
        <Tile label="Notes" value={scopedNotes.length} chip="bg-violet-500/15 text-violet-400" icon={icons.notes} onClick={onOpenNotes} />
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {category ? "Sub-spaces" : "Spaces"}
      </h2>
      <div className="space-y-2">
        {rows.map((cat) => (
          <CountRow
            key={cat.id}
            color={cat.color}
            name={cat.name}
            depth={cat.depth}
            taskN={tasksIn(cat.id)}
            noteN={notesIn(cat.id)}
            onClick={() => onOpenCategory?.(cat)}
          />
        ))}
        {!category && (uncatTasks > 0 || uncatNotes > 0) && (
          <CountRow color="#6b7280" name="Uncategorized" depth={0} taskN={uncatTasks} noteN={uncatNotes} onClick={() => onOpenCategory?.(null)} />
        )}
        {rows.length === 0 && (
          <p className="text-sm text-gray-500">
            {category ? "No sub-spaces in here." : "No categories yet — add one in the sidebar."}
          </p>
        )}
      </div>
    </div>
  );
}