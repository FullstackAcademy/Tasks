const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const taskRoutes = require("./routes/tasks");
const noteRoutes = require("./routes/notes");
const googleRoutes = require("./routes/google");
const icsRoutes = require("./routes/ics");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: "6mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/tasks", taskRoutes);
app.use("/notes", noteRoutes);
app.use("/google", googleRoutes);
app.use("/ics", icsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

module.exports = app;