const bcrypt = require("bcrypt");
const prisma = require("../src/prisma");

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "demo@taskflow.app" },
    update: {},
    create: { email: "demo@taskflow.app", passwordHash },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });