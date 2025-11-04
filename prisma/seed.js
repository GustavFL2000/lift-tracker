/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exercises = [
    { name: "Bænkpres", category: "Bryst" },
    { name: "Dødløft", category: "Ryg" },
    { name: "Squat", category: "Ben" },
    { name: "Skulderpres", category: "Skulder" },
    { name: "Lat pulldown", category: "Ryg" }
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: ex,
      create: ex
    });
  }

  console.log("Seed færdig: øvelser oprettet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


