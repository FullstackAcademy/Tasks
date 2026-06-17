// Prisma 7 config. THIS is the file that bit me for hours, so read the rest if ya want.
const path = require("path");

// path.resolve(__dirname, ".env") = absolute path to SERVER/.env, works no matter what folder I run from.
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { defineConfig, env } = require("@prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma", // where my models live

  // "classic" = the normal query engine. without this, Prisma 7 tries the new managed thing and blows up on my local Postgres.app
  engine: "classic",

  // feed the DB url from .env HERE (Prisma 7 removed `url` from schema.prisma, so it has to live in this config now)
  datasource: { url: env("DATABASE_URL") },
});
// finally realized this MUST be prisma.config.js (NOT .ts). if a prisma.config.ts exists, delete it.