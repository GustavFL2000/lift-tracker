import { cookies } from "next/headers";
import { getPrisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const isAdminCookie = store.get("isAdmin")?.value === "1";
  const allowAdminCookie = process.env.ENABLE_ADMIN_COOKIE === "1";
  const isAdmin = allowAdminCookie && isAdminCookie;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-xl p-4">
          <h1 className="text-2xl font-semibold mb-4">Admin</h1>
          <p className="text-sm">Adgang nægtet. Til udvikling kan du aktivere admin-cookien ved at besøge <a className="underline" href="/?admin=1">/?admin=1</a>.</p>
        </div>
      </div>
    );
  }
  const prisma = getPrisma();
  const [users, exercises, userExercises] = await Promise.all([
    (await prisma).user.count(),
    (await prisma).exercise.count(),
    (await prisma).userExercise.count(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-xl p-4">
        <h1 className="text-2xl font-semibold mb-4">Admin</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4"><div className="text-sm text-zinc-500">Brugere</div><div className="text-2xl font-semibold">{users}</div></div>
          <div className="rounded-lg border bg-white p-4"><div className="text-sm text-zinc-500">Øvelser</div><div className="text-2xl font-semibold">{exercises}</div></div>
          <div className="rounded-lg border bg-white p-4"><div className="text-sm text-zinc-500">Min liste</div><div className="text-2xl font-semibold">{userExercises}</div></div>
        </div>
      </div>
    </div>
  );
}


