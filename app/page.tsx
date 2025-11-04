"use client";
// Forside med populære øvelser, oprettelse og hurtig tilføjelse til "Min liste"

import { useEffect, useMemo, useState } from "react";

type Exercise = { id: number; name: string; category: string | null; createdByUserId?: string | null; isMine?: boolean };
type UserExercise = { id: number; exercise: Exercise; exerciseId: number; targetSets: number; targetReps: number; targetWeightKg: number };
type NewExercise = { name: string; category: string };

export default function Home() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [myList, setMyList] = useState<UserExercise[]>([]);
  const [newExercise, setNewExercise] = useState<NewExercise>({ name: "", category: "" });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  async function fetchJsonSafe<T>(input: RequestInfo | URL, init?: RequestInit, fallback?: T): Promise<T> {
    try {
      const res = await fetch(input, init);
      if (!res.ok) return (fallback as T)!;
      const text = await res.text();
      if (!text) return (fallback as T)!;
      return JSON.parse(text) as T;
    } catch {
      return (fallback as T)!;
    }
  }

  useEffect(() => {
    (async () => {
      let [ex, list] = await Promise.all([
        fetchJsonSafe<Exercise[]>("/api/exercises", undefined, []),
        fetchJsonSafe<UserExercise[]>("/api/user-exercises", undefined, []),
      ]);
      if (ex.length === 0) {
        await fetch("/api/exercises/seed", { method: "POST" });
        ex = await fetchJsonSafe<Exercise[]>("/api/exercises", undefined, []);
      }
      setExercises(ex);
      setMyList(list);
    })();
  }, []);

  async function seedExercises() {
    await fetch("/api/exercises/seed", { method: "POST" });
    const ex = await fetchJsonSafe<Exercise[]>("/api/exercises", undefined, []);
    setExercises(ex);
  }

  async function createExercise() {
    if (!newExercise.name.trim()) return;
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newExercise.name.trim(), category: newExercise.category || null })
    });
    if (!res.ok) return;
    const created = await res.json();
    setExercises(prev => [...prev, created].sort((a,b) => a.name.localeCompare(b.name)));
    setNewExercise({ name: "", category: "" });
    setToast("Øvelse gemt");
    setTimeout(() => setToast(null), 1500);
  }

  async function addToMyList(exerciseId: number) {
    // optimistic
    const optimistic = { exerciseId, targetSets: 3, targetReps: 8, targetWeightKg: 0 } as any;
    const ex = exercises.find(e => e.id === exerciseId)!;
    setMyList(prev => [...prev, { id: Math.random(), exercise: ex, exerciseId, targetSets: 3, targetReps: 8, targetWeightKg: 0 }]);
    const res = await fetch("/api/user-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(optimistic)
    });
    if (res.ok) {
      const saved = await res.json();
      setMyList(prev => prev.map(it => (it.exerciseId === exerciseId ? saved : it)));
      setToast("Tilføjet til Min liste");
      setTimeout(() => setToast(null), 1200);
    }
  }

  async function updateMyItem(item: UserExercise, patch: Partial<UserExercise>) {
    const updated = { ...item, ...patch } as UserExercise;
    setMyList(prev => prev.map(it => it.id === item.id ? updated : it));
    await fetch("/api/user-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: item.exerciseId,
        targetSets: updated.targetSets,
        targetReps: updated.targetReps,
        targetWeightKg: updated.targetWeightKg
      })
    });
    // refresh authoritative copy
    const fresh = await fetchJsonSafe<UserExercise[]>("/api/user-exercises", undefined, []);
    setMyList(fresh);
    setToast("Gemt");
    setTimeout(() => setToast(null), 1000);
  }

  async function removeFromMyList(id: number) {
    const prev = myList;
    setMyList(prev.filter(x => x.id !== id));
    await fetch(`/api/user-exercises?id=${id}`, { method: "DELETE" });
  }

  function updateRow(index: number, patch: Partial<SetRow>) {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows(prev => [...prev, { exerciseId: "", reps: "", weightKg: "", rpe: "" }]);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-xl p-4">
        <h1 className="text-2xl font-semibold mb-4">Lift-tarcker</h1>

        {exercises.length === 0 && (
          <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm mb-2">Ingen øvelser fundet.</div>
            <button className="rounded-md bg-black px-3 py-2 text-white" onClick={seedExercises}>Opret standard øvelser</button>
          </div>
        )}
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-medium">Populære øvelser</h2>
          <input className="mb-3 w-full rounded-md border px-3 py-2 text-sm" placeholder="Søg øvelse..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {exercises
              .filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 24)
              .map(ex => (
              <div key={ex.id} className="flex items-center gap-1">
                <button className="rounded-md border px-3 py-1 text-sm" onClick={() => addToMyList(ex.id)}>
                  + {ex.name}{ex.category ? ` (${ex.category})` : ""}
                </button>
                {ex.isMine ? (
                  <>
                    <label className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <input type="checkbox" checked={!!selected[ex.id]} onChange={(e) => setSelected(prev => ({ ...prev, [ex.id]: e.target.checked }))} />
                      Vælg
                    </label>
                    <button className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600" onClick={async () => {
                      if (!confirm("Slette denne øvelse? Dette kan ikke fortrydes.")) return;
                      setExercises(prev => prev.filter(e => e.id !== ex.id));
                      await fetch(`/api/exercises?id=${ex.id}`, { method: "DELETE" });
                      const fresh = await fetchJsonSafe<Exercise[]>("/api/exercises", undefined, []);
                      setExercises(fresh);
                      setToast("Øvelse slettet");
                      setTimeout(() => setToast(null), 1200);
                    }}>Slet</button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
          {Object.values(selected).some(Boolean) && (
            <div className="mt-3 flex gap-2">
              <button className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700" onClick={async () => {
                const ids = Object.entries(selected).filter(([,v]) => v).map(([k]) => Number(k));
                if (!ids.length) return;
                if (!confirm(`Slette ${ids.length} valgte øvelse(r)?`)) return;
                // optimistic remove
                setExercises(prev => prev.filter(e => !ids.includes(e.id)));
                await Promise.all(ids.map(id => fetch(`/api/exercises?id=${id}`, { method: "DELETE" })));
                const fresh = await fetchJsonSafe<Exercise[]>("/api/exercises", undefined, []);
                setExercises(fresh);
                setSelected({});
                setToast("Valgte øvelser slettet");
                setTimeout(() => setToast(null), 1200);
              }}>Slet valgte</button>
              <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setSelected({})}>Ryd markering</button>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-medium">Tilføj egen øvelse</h2>
          <div className="grid grid-cols-3 gap-2">
            <input className="col-span-2 rounded-md border px-3 py-2 text-sm" placeholder="Navn" value={newExercise.name} onChange={(e) => setNewExercise(v => ({ ...v, name: e.target.value }))} />
            <input className="rounded-md border px-3 py-2 text-sm" placeholder="Kategori (fx Ben)" value={newExercise.category} onChange={(e) => setNewExercise(v => ({ ...v, category: e.target.value }))} />
          </div>
          <button className="mt-2 rounded-md bg-black px-4 py-2 text-sm text-white" onClick={createExercise}>Gem øvelse</button>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-medium">Min liste</h2>
          <p className="text-sm text-zinc-600">Gå til siden <a href="/my" className="underline">Min liste</a> for at redigere dine mål for sæt/reps/kg.</p>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-white text-sm shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
