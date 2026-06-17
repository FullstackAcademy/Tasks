import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../api";

export default function Calendar({ tasks = [] }) {
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);

  //Inital GOOGLE CONNECT___TRYING TO INTEGRATE, PIA
  async function loadGoogle() {
    try {
      const statusRes = await api.get("/google/status");
      setGoogleConnected(statusRes.data.connected);
      if (statusRes.data.connected) {
        const eventsRes = await api.get("/google/events");
        setGoogleEvents(
          eventsRes.data.map((e) => ({
            title: e.title,
            start: e.start,
            end: e.end,
            color: "#10b981",
          }))
        );
      }
    } catch {
      setGoogleConnected(false);
    }
  }

  useEffect(() => {
    loadGoogle();
  }, []);

  const taskEvents = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({ title: t.title, start: t.dueDate, color: "#3b82f6" }));
  const events = [...taskEvents, ...googleEvents];

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
    <div>
      <div className="mb-4 flex gap-3">
        <button 
          onClick={connectGoogle}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {googleConnected ? "Reconnect Google" : "Connect Google Calendar"}
        </button>
        <button
          onClick={exportIcs}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          Export to Apple (.ics)
        </button>
      </div>
      <div className="rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          events={events}
          height="auto"
        />
      </div>
    </div>
  );
}