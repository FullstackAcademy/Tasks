const express = require("express");
const prisma = require("../prisma");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { categoryId } = req.query;
  const notes = await prisma.note.findMany({
    where: {
      userId: req.userId,
      categoryId: categoryId ? Number(categoryId) : undefined,
    },
    orderBy: { updatedAt: "desc" },
  });
  res.json(notes);
});

router.post("/", async (req, res) => {
  const { title, content, categoryId } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }
  const note = await prisma.note.create({
    data: {
      title,
      content: content ?? "",
      categoryId: categoryId ?? null,
      userId: req.userId,
    },
  });
  res.status(201).json(note);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.note.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Not found" });
  }
  const { title, content, categoryId } = req.body;
  const note = await prisma.note.update({
    where: { id },
    data: { title, content, categoryId },
  });
  res.json(note);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await prisma.note.deleteMany({
    where: { id, userId: req.userId },
  });
  if (result.count === 0) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).end();
});

module.exports = router;