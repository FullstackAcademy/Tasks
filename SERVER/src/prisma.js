require("dotenv").config(); // load .env so process.env.DATABASE_URL exists

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg"); // pg adapter — Prisma 7 wants me to hand it the connection myself

// one shared Prisma client for the whole app.
// I pass the pg adapter w/ my DATABASE_URL instead of letting the schema hold the url (Prisma 7 style).
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

module.exports = prisma; // import this anywhere I need the DB
// REMINDER: nodemon does NOT pick up a regenerated client. after `npx prisma generate` I have to fully Ctrl+C and `npm run dev` again.