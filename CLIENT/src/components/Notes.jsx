import { useEffect, useState } from "react";
import api from "../api";

export default function Notes({ categoryId }) {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function load() {
    const res = await api.get("/notes", {
      params: categoryId ? { categoryId } : {},
    });
    setNotes(res.data);
  }

  useEffect(() => {
    load();
    setSelected(null);
    setTitle("");
    setContent("");
  }, [categoryId]);

  function openNote(note) {
    setSelected(note);
    setTitle(note.title);
    setContent(note.content);
  }

  function newNote() {
    setSelected(null);
    setTitle("");
    setContent("");
  }

  async function save() {
    if (!title.trim()) return;
    if (selected) {
      await api.patch(`/notes/${selected.id}`, { title: title.trim(), content });
    } else {
      await api.post("/notes", {
        title: title.trim(),
        content,
        categoryId: categoryId ?? null,
      });
    }
    await load();
    newNote();
  }

  async function remove(id) {
    await api.delete(`/notes/${id}`);
    await load();
    if (selected?.id === id) newNote();
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 space-y-2">
        <button
          onClick={newNote}
          className="mb-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          New note
        </button>
        {notes.map((note) => (
          <div
            key={note.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              selected?.id === note.id
                ? "bg-gray-800 text-white"
                : "bg-gray-900 text-gray-300 hover:bg-gray-800/60"
            }`}
          >
            <button onClick={() => openNote(note)} className="flex-1 text-left">
              {note.title}
            </button>
            <button
              onClick={() => remove(note.id)}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-gray-500">No notes yet.</p>}
      </div>
      <div className="col-span-2 rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something..."
          rows={16}
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={save}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}