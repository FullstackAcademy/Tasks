const express = require("express");
const prisma = require("../prisma");
const requireAuth = require("../middleware/auth");
const { createOAuthClient, getCalendarForUser } = require("../lib/google");
const { signToken, verifyToken } = require("../lib/jwt");

const router = express.Router();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

router.get("/url", requireAuth, (req, res) => {
  const auth = createOAuthClient();
  const url = auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: signToken(req.userId),
  });
  res.json({ url });
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  let userId;
  try {
    userId = verifyToken(state).userId;
  } catch {
    return res.status(400).send("Invalid state");
  }
  const auth = createOAuthClient();
  const { tokens } = await auth.getToken(code);
  await prisma.googleAccount.upsert({
    where: { userId },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
    create: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });
  res.redirect(`${process.env.CLIENT_URL}/?google=connected`);
});

router.get("/status", requireAuth, async (req, res) => {
  const account = await prisma.googleAccount.findUnique({
    where: { userId: req.userId },
  });
  res.json({ connected: Boolean(account) });
});

router.get("/events", requireAuth, async (req, res) => {
  const calendar = await getCalendarForUser(req.userId);
  if (!calendar) {
    return res.status(400).json({ error: "Google not connected" });
  }
  const result = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });
  const events = (result.data.items ?? []).map((e) => ({
    id: e.id,
    title: e.summary ?? "(no title)",
    start: e.start?.dateTime ?? e.start?.date,
    end: e.end?.dateTime ?? e.end?.date,
  }));
  res.json(events);
});

router.post("/push/:taskId", requireAuth, async (req, res) => {
  const taskId = Number(req.params.taskId);
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: req.userId },
  });
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  if (!task.dueDate) {
    return res.status(400).json({ error: "Task has no due date" });
  }
  const calendar = await getCalendarForUser(req.userId);
  if (!calendar) {
    return res.status(400).json({ error: "Google not connected" });
  }
  const start = task.dueDate;
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const event = {
    summary: task.title,
    description: task.description ?? undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
  if (task.recurringDays.length > 0) {
    const days = task.recurringDays.map((d) => WEEKDAYS[d]).join(",");
    event.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${days}`];
  }
  const created = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });
  res.json({ id: created.data.id });
});

module.exports = router;