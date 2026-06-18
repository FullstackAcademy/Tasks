import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../api";

// dark, rounded, Apple/Notion-ish styling for FullCalendar
const calendarStyle = `
  .ff-cal .fc {
    --fc-border-color: #1f2937;
    --fc-page-bg-color: transparent;
    --fc-neutral-bg-color: #0b1220;
    --fc-today-bg-color: rgba(59,130,246,0.10);
    --fc-button-bg-color: #1f2937;
    --fc-button-border-color: #374151;
    --fc-button-hover-bg-color: #374151;
    --fc-button-hover-border-color: #4b5563;
    --fc-button-active-bg-color: #2563eb;
    --fc-button-active-border-color: #2563eb;
    --fc-button-text-color: #e5e7eb;
    font-family: inherit;
  }
  .ff-cal .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; color: #fff; }
  .ff-cal .fc .fc-button { border-radius: 0.6rem; text-transform: capitalize; font-weight: 500; box-shadow: none; padding: 0.4rem 0.8rem; }
  .ff-cal .fc .fc-button:focus { box-shadow: none; }
  .ff-cal .fc .fc-col-header-cell-cushion { color: #9ca3af; text-decoration: none; font-weight: 600; padding: 8px; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; }
  .ff-cal .fc .fc-daygrid-day-number { color: #9ca3af; text-decoration: none; padding: 6px 8px; font-size: 0.8rem; }
  .ff-cal .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number { color: #fff; font-weight: 700; }
  .ff-cal .fc-theme-standard td, .ff-cal .fc-theme-standard th { border-color: #1f2937; }
  .ff-cal .fc-theme-standard .fc-scrollgrid { border-color: #1f2937; border-radius: 12px; overflow: hidden; }
  .ff-cal .fc .fc-daygrid-day:hover { background: rgba(255,255,255,0.02); }
  .ff-cal .fc-event { border: none; border-radius: 7px; padding: 2px 6px; font-size: 0.72rem; font-weight: 500; }
  .ff-cal .fc .fc-timegrid-now-indicator-line { border-color: #ef4444; }
`;

export default function Calendar({ tasks = [] }) {
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [noteEvents, setNoteEvents] = useState([]);

  async function loadGoogle() {
    try {
      const statusRes = await api.get("/google/status");
      setGoogleConnected(statusRes.data.connected);
      if (statusRes.data.connected) {
        const eventsRes = await api.get("/google/events");
        setGoogleEvents(
          eventsRes.data.map((e) => ({ title: e.title, start: e.start, end: e.end, color: "#10b981" }))
        );
      }
    } catch {
      setGoogleConnected(false);
    }
  }

  async function loadNotes() {
    try {
      const res = await api.get("/notes");
      setNoteEvents(
        res.data.map((n) => ({
          title: `📝 ${n.title}`,
          start: n.createdAt, // notes show on the day they were created
          allDay: true,
          color: "#f59e0b",
        }))
      );
    } catch {
      setNoteEvents([]);
    }
  }

  useEffect(() => {
    loadGoogle();
    loadNotes();
  }, []);

  // every task with a due date goes on the calendar (blue)
  const taskEvents = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({ title: t.title, start: t.dueDate, color: "#3b82f6" }));

  const events = [...taskEvents, ...noteEvents, ...googleEvents];

  async function connectGoogle() {
    const res = await api.get("/google/url");
    window.location.href = res.data.url;
  }

  async function exportIcs() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/ics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taskflow.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <style>{calendarStyle}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Calendar</h1>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Tasks</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Notes</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Google</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={connectGoogle}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-200"
          >
            {googleConnected ? "Reconnect Google" : "Connect Google"}
          </button>
          <button
            onClick={exportIcs}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
          >
            Export .ics
          </button>
        </div>
      </div>

      <div className="ff-cal rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
          events={events}
          nowIndicator={true}
          dayMaxEvents={3}
          height="auto"
        />
      </div>
    </div>
  );
}