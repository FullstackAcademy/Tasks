import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../AuthContext";
import Sidebar from "../components/Sidebar";
import Tasks from "../components/Tasks";
import Notes from "../components/Notes";
import Calendar from "../components/Calendar";

export default function Home() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tab, setTab] = useState("tasks");

  async function loadCategories() {
    const res = await api.get("/categories");
    setCategories(res.data);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const tabs = ["tasks", "notes", "calendar"];

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
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm capitalize ${
                  tab === t
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800"
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
          {tab === "tasks" && <Tasks categoryId={selectedCategory?.id ?? null} />}
          {tab === "notes" && <Notes categoryId={selectedCategory?.id ?? null} />}
          {tab === "calendar" && <Calendar />}
        </div>
      </main>
    </div>
  );
}