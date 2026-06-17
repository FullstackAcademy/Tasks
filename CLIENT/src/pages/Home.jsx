import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import Tasks from "../components/Tasks";
import Notes from "../components/Notes";
import Calendar from "../components/Calendar";

export default function Home() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState("dashboard");

  async function loadCategories() {
    const res = await api.get("/categories");
    setCategories(res.data);
  }

  async function loadTasks() {
    const res = await api.get("/tasks");
    setTasks(res.data);
  }

  useEffect(() => {
    loadCategories();
    loadTasks();
  }, []);

  const tabs = ["dashboard", "tasks", "notes", "calendar"];

  const activeCategory = selectedCategory
    ? categories.find((c) => c.id === selectedCategory.id) ?? selectedCategory
    : null;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Sidebar
        categories={categories}
        selectedCategory={activeCategory}
        onSelect={setSelectedCategory}
        onChange={loadCategories}
      />
      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div className="inline-flex rounded-xl bg-gray-900 p-1 ring-1 ring-gray-800">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${
                  tab === t
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </header>
        <div className="p-6">
          {activeCategory?.image && (tab === "tasks" || tab === "notes") && (
            <div
              className="relative mb-6 h-40 overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-gray-800"
              style={{ backgroundImage: `url(${activeCategory.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: activeCategory.color || "#3b82f6" }}
                />
                <h2 className="text-xl font-semibold text-white drop-shadow-lg">
                  {activeCategory.name}
                </h2>
              </div>
            </div>
          )}
          {tab === "dashboard" && (
            <Dashboard
              tasks={tasks}
              onOpenTasks={() => setTab("tasks")}
              onOpenNotes={() => setTab("notes")}
            />
          )}
          {tab === "tasks" && (
            <Tasks
              tasks={tasks}
              categoryId={activeCategory?.id ?? null}
              categories={categories}
              onChanged={loadTasks}
            />
          )}
          {tab === "notes" && <Notes categoryId={activeCategory?.id ?? null} />}
          {tab === "calendar" && <Calendar tasks={tasks} />}
        </div>
      </main>
    </div>
  );
}