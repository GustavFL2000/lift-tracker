import { getPrisma } from "@/app/lib/prisma";

export async function POST() {
  const prisma = await getPrisma();
  const exercises = [
    { name: "Bænkpres", category: "Bryst" },
    { name: "Dødløft", category: "Ryg" },
    { name: "Squat", category: "Ben" },
    { name: "Skulderpres", category: "Skulder" },
    { name: "Lat pulldown", category: "Ryg" }
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({ where: { name: ex.name }, update: ex, create: ex });
  }
  return Response.json({ ok: true });
}


