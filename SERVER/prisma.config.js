const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { defineConfig, env } = require("@prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});