const express = require("express");
const { createEvents } = require("ics");
const prisma = require("../prisma");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function toDateArray(date) {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

router.get("/", requireAuth, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.userId, dueDate: { not: null } },
  });

  res.setHeader("Content-Type", "text/calendar");
  res.setHeader("Content-Disposition", 'attachment; filename="taskflow.ics"');

  if (tasks.length === 0) {
    return res.send(
      "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TaskFlow//EN\nEND:VCALENDAR"
    );
  }

  const events = tasks.map((task) => {
    const event = {
      title: task.title,
      description: task.description ?? "",
      start: toDateArray(task.dueDate),
      duration: { minutes: 30 },
    };
    if (task.recurringDays.length > 0) {
      const days = task.recurringDays.map((d) => WEEKDAYS[d]).join(",");
      event.recurrenceRule = `FREQ=WEEKLY;BYDAY=${days}`;
    }
    return event;
  });

  const { error, value } = createEvents(events);
  if (error) {
    return res.status(500).json({ error: "Failed to build calendar" });
  }
  res.send(value);
});

module.exports = router;