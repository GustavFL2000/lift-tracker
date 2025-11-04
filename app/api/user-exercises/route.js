import { cookies } from "next/headers";
import { getPrisma } from "@/app/lib/prisma";
import { rateLimit } from "@/app/lib/rateLimit";

// Helper til at læse brugerens uid-cookie (pseudo-login)
async function getUid() {
  const store = await cookies();
  return store.get("uid")?.value || "";
}

export async function GET() {
  const prisma = await getPrisma();
  const uid = await getUid();
  if (!uid) return Response.json([], { status: 200 });
  // Hent brugerens liste sorteret med favoritter først
  const list = await prisma.userExercise.findMany({
    where: { userId: uid },
    include: { exercise: true },
    orderBy: [{ favorite: "desc" }, { orderIndex: "asc" }, { createdAt: "asc" }]
  });
  return Response.json(list);
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(ip)) return Response.json({ error: "Too many requests" }, { status: 429 });
  const origin = req.headers.get("origin");
  if (origin && !origin.startsWith(process.env.NEXT_PUBLIC_BASE_URL || "http://")) {
    return Response.json({ error: "Bad origin" }, { status: 400 });
  }
  const prisma = await getPrisma();
  const uid = await getUid();
  if (!uid) return Response.json({ error: "Ingen bruger" }, { status: 400 });
  const body = await req.json();
  const { exerciseId, targetSets, targetReps, targetWeightKg, orderIndex, favorite } = body || {};
  if (!exerciseId || Number.isNaN(Number(exerciseId))) return Response.json({ error: "exerciseId kræves" }, { status: 400 });
  const s = Number(targetSets ?? 3);
  const r = Number(targetReps ?? 8);
  const w = Number(targetWeightKg ?? 0);
  const ord = orderIndex == null ? undefined : Number(orderIndex);
  if (s < 1 || s > 20) return Response.json({ error: "Ugyldigt antal sæt" }, { status: 400 });
  if (r < 1 || r > 50) return Response.json({ error: "Ugyldigt antal reps" }, { status: 400 });
  if (w < 0 || w > 2000) return Response.json({ error: "Ugyldig vægt" }, { status: 400 });

  // Ensure user exists
  await prisma.user.upsert({ where: { id: uid }, update: {}, create: { id: uid } });

  const entry = await prisma.userExercise.upsert({
    where: { userId_exerciseId: { userId: uid, exerciseId: Number(exerciseId) } },
    update: {
      targetSets: s,
      targetReps: r,
      targetWeightKg: w,
      orderIndex: ord,
      favorite: favorite != null ? Boolean(favorite) : undefined,
    },
    create: {
      userId: uid,
      exerciseId: Number(exerciseId),
      targetSets: s,
      targetReps: r,
      targetWeightKg: w,
      orderIndex: Number(ord ?? 0),
      favorite: Boolean(favorite ?? false),
    },
    include: { exercise: true }
  });
  return Response.json(entry, { status: 201 });
}

export async function DELETE(req) {
  const prisma = await getPrisma();
  const uid = getUid();
  if (!uid) return Response.json({ error: "Ingen bruger" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id kræves" }, { status: 400 });
  await prisma.userExercise.delete({ where: { id: Number(id) } });
  return Response.json({ ok: true });
}


