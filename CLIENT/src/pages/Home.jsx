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

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
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
              categoryId={selectedCategory?.id ?? null}
              categories={categories}
              onChanged={loadTasks}
            />
          )}
          {tab === "notes" && <Notes categoryId={selectedCategory?.id ?? null} />}
          {tab === "calendar" && <Calendar tasks={tasks} />}
        </div>
      </main>
    </div>
  );
}