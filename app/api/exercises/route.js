import { cookies } from "next/headers";
import { getPrisma } from "@/app/lib/prisma";
import { rateLimit } from "@/app/lib/rateLimit";

export async function GET() {
  const prisma = await getPrisma();
  const store = await cookies();
  const uid = store.get("uid")?.value || "";
  // Hent alle øvelser; markér hvilke der tilhører brugeren
  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" }
  });
  const withMine = exercises.map(e => ({ ...e, isMine: !!uid && e.createdByUserId === uid }));
  return Response.json(withMine);
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(ip)) return Response.json({ error: "Too many requests" }, { status: 429 });
  const origin = req.headers.get("origin");
  if (origin && !origin.startsWith(process.env.NEXT_PUBLIC_BASE_URL || "http://")) {
    return Response.json({ error: "Bad origin" }, { status: 400 });
  }
  const prisma = await getPrisma();
  const body = await req.json();
  const { name, category } = body || {};
  if (!name || typeof name !== "string" || name.length > 100) {
    return Response.json({ error: "Navn er påkrævet" }, { status: 400 });
  }
  const safeName = name.trim();
  const safeCategory = category && typeof category === "string" ? String(category).slice(0, 100) : null;
  const store = await cookies();
  const uid = store.get("uid")?.value || null;
  const created = await prisma.exercise.create({ data: { name: safeName, category: safeCategory, createdByUserId: uid } });
  return Response.json(created, { status: 201 });
}

export async function DELETE(req) {
  const prisma = await getPrisma();
  const store = await cookies();
  const uid = store.get("uid")?.value || "";
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return Response.json({ error: "id kræves" }, { status: 400 });
  const ex = await prisma.exercise.findUnique({ where: { id } });
  if (!ex) return Response.json({ error: "Ikke fundet" }, { status: 404 });
  if (!uid || ex.createdByUserId !== uid) return Response.json({ error: "Mangler tilladelse" }, { status: 403 });
  await prisma.exercise.delete({ where: { id } });
  return Response.json({ ok: true });
}


