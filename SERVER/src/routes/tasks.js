const express = require("express");
const prisma = require("../prisma");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth); // every task route needs a logged-in user

router.get("/", async (req, res) => {
  const { categoryId } = req.query;
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      categoryId: categoryId ? Number(categoryId) : undefined, // optional filter by cat
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(tasks);
});

router.post("/", async (req, res) => {
  // pull the recurrence bits too: days[], interval (1 weekly / 2 biweekly), until (end date)
  const { title, description, dueDate, recurringDays, recurringInterval, recurringUntil, categoryId } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }
  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      recurringDays: recurringDays ?? [], // [] = not recurring
      recurringInterval: recurringInterval ?? 1, // default weekly
      recurringUntil: recurringUntil ? new Date(recurringUntil) : null, // null = forever
      categoryId: categoryId ?? null,
      userId: req.userId,
    },
  });
  res.status(201).json(task);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  // make sure this task is actually mine before touching it
  const existing = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Not found" });
  }
  const { title, description, completed, dueDate, recurringDays, recurringInterval, recurringUntil, categoryId } = req.body;
  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      completed,
      // undefined = "don't touch", anything else = set it (incl. clearing to null)
      dueDate: dueDate === undefined ? undefined : dueDate ? new Date(dueDate) : null,
      recurringDays,
      recurringInterval,
      recurringUntil: recurringUntil === undefined ? undefined : recurringUntil ? new Date(recurringUntil) : null,
      categoryId,
    },
  });
  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await prisma.task.deleteMany({
    where: { id, userId: req.userId }, // deleteMany w/ userId = can only nuke my own
  });
  if (result.count === 0) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).end();
});

module.exports = router;