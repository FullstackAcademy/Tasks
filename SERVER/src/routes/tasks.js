const express = require("express");
const prisma = require("../prisma");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { categoryId } = req.query;
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      categoryId: categoryId ? Number(categoryId) : undefined,
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(tasks);
});

router.post("/", async (req, res) => {
  const { title, description, dueDate, recurringDays, categoryId } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }
  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      recurringDays: recurringDays ?? [],
      categoryId: categoryId ?? null,
      userId: req.userId,
    },
  });
  res.status(201).json(task);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.task.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Not found" });
  }
  const { title, description, completed, dueDate, recurringDays, categoryId } = req.body;
  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      completed,
      dueDate: dueDate === undefined ? undefined : dueDate ? new Date(dueDate) : null,
      recurringDays,
      categoryId,
    },
  });
  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await prisma.task.deleteMany({
    where: { id, userId: req.userId },
  });
  if (result.count === 0) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).end();
});

module.exports = router;