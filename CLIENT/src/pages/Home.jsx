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
  const [categories, setCategories] = useState([]); // all my cats, shared down to Sidebar + the banner
  const [selectedCategory, setSelectedCategory] = useState(null); // the cat I clicked (null = "All")
  const [tasks, setTasks] = useState([]); // all my tasks, shared to Dashboard/Tasks/Calendar so they stay in sync
  const [tab, setTab] = useState("dashboard"); // which tab is open

  // banner height in px. read from localStorage so my drag size sticks after refresh. default 160
  const [bannerHeight, setBannerHeight] = useState(() => {
    const saved = Number(localStorage.getItem("bannerHeight"));
    return saved >= 100 && saved <= 480 ? saved : 160; // ignore junk, keep it in my min/max range
  });

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

  // pull the LIVE cat obj out of the list by id (not the stale one I clicked) so the banner pic refreshes instantly after I change the image
  const activeCategory = selectedCategory
    ? categories.find((c) => c.id === selectedCategory.id) ?? selectedCategory
    : null;

  // drag-to-resize the banner. grab the bar -> track how far I drag -> set height (clamped 100-480) -> save on release
  function startResize(e) {
    e.preventDefault();
    const startY = e.clientY; // where my cursor started
    const startH = bannerHeight; // banner height when I grabbed it
    let latest = startH; // hold the final value so I can save it on pointerup

    function onMove(ev) {
      // drag down = taller, up = shorter. clamp so it never goes dumb small or huge
      latest = Math.min(480, Math.max(100, startH + (ev.clientY - startY)));
      setBannerHeight(latest);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      localStorage.setItem("bannerHeight", String(latest)); // remember the size for next time
    }
    // listen on window (not the bar) so the drag keeps working even if my cursor slides off the bar
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

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
          {/* only show the banner if this cat has a pic AND I'm on tasks/notes */}
          {activeCategory?.image && (tab === "tasks" || tab === "notes") && (
            <div
              className="relative mb-6 overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-gray-800"
              style={{
                backgroundImage: `url(${activeCategory.image})`,
                height: `${bannerHeight}px`, 
              }}
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
              {/* the drag bar. grab + drag up/down to resize */}
              <div
                onPointerDown={startResize}
                title="Drag to resize"
                className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-center justify-center bg-white/0 transition hover:bg-white/20"
              >
                <div className="h-1 w-10 rounded-full bg-white/60" />
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