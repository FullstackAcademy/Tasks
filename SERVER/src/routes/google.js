const express = require("express");
const prisma = require("../prisma");
const requireAuth = require("../middleware/auth");
const { createOAuthClient, getCalendarForUser } = require("../lib/google");
const { signToken, verifyToken } = require("../lib/jwt");

const router = express.Router();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]; // map my day index 0-6 -> RRULE codes

// RRULE UNTIL has to be UTC like 20260731T235959Z. I store "until" as UTC midnight,
// so read it w/ getUTC* and push it to end-of-day so the last occurrence still counts.
function toRRuleUntil(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T235959Z`;
}

router.get("/url", requireAuth, (req, res) => {
  const auth = createOAuthClient();
  const url = auth.generateAuthUrl({
    access_type: "offline", // gimme a refresh token so I can sync later
    prompt: "consent",
    scope: SCOPES,
    state: signToken(req.userId), // stash who I am in the state so /callback knows
  });
  res.json({ url });
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  let userId;
  try {
    userId = verifyToken(state).userId; // verify the signed state = which user this is
  } catch {
    return res.status(400).send("Invalid state");
  }
  const auth = createOAuthClient();
  const { tokens } = await auth.getToken(code);
  await prisma.googleAccount.upsert({
    where: { userId },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined, // keep old refresh token if Google doesn't resend one
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
    timeMin: new Date().toISOString(), // only upcoming stuff
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
    return res.status(400).json({ error: "Task has no due date" }); // need a start time to make an event
  }
  const calendar = await getCalendarForUser(req.userId);
  if (!calendar) {
    return res.status(400).json({ error: "Google not connected" });
  }
  const start = task.dueDate;
  const end = new Date(start.getTime() + 30 * 60 * 1000); // default 30-min block
  const event = {
    summary: task.title,
    description: task.description ?? undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
  // if it's recurring, build the RRULE: weekly or every-2-weeks, on my days, optional end date
  if (task.recurringDays.length > 0) {
    const days = task.recurringDays.map((d) => WEEKDAYS[d]).join(",");
    const parts = [`FREQ=WEEKLY`, `INTERVAL=${task.recurringInterval || 1}`, `BYDAY=${days}`];
    if (task.recurringUntil) parts.push(`UNTIL=${toRRuleUntil(task.recurringUntil)}`);
    event.recurrence = [`RRULE:${parts.join(";")}`]; // INTERVAL=2 = biweekly
  }
  const created = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });
  res.json({ id: created.data.id });
});

module.exports = router;