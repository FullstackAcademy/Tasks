const express = require("express");
const prisma = require("../prisma");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
  });
  res.json(categories);
});

router.post("/", async (req, res) => {
  const { name, color, parentId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name required" });
  }
  if (parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: parentId, userId: req.userId },
    });
    if (!parent) {
      return res.status(400).json({ error: "Parent not found" });
    }
  }
  const category = await prisma.category.create({
    data: { name, color, parentId: parentId ?? null, userId: req.userId },
  });
  res.status(201).json(category);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.category.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Not found" });
  }
  const { name, color, parentId } = req.body;
  if (parentId === id) {
    return res.status(400).json({ error: "A category cannot be its own parent" });
  }
  const category = await prisma.category.update({
    where: { id },
    data: { name, color, parentId },
  });
  res.json(category);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const result = await prisma.category.deleteMany({
    where: { id, userId: req.userId },
  });
  if (result.count === 0) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).end();
});

module.exports = router;