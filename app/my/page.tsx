"use client";
// Redigering af brugerens "Min liste" inkl. favorit og rækkefølge

import { useEffect, useState } from "react";

type Exercise = { id: number; name: string; category: string | null };
type UserExercise = { id: number; exercise: Exercise; exerciseId: number; targetSets: number; targetReps: number; targetWeightKg: number; orderIndex?: number; favorite?: boolean };

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

export default function MyPage() {
  const [list, setList] = useState<UserExercise[]>([]);

  useEffect(() => {
    fetchJsonSafe<UserExercise[]>("/api/user-exercises", undefined, []).then(setList);
  }, []);

  async function update(item: UserExercise, patch: Partial<UserExercise>) {
    const updated = { ...item, ...patch } as UserExercise;
    setList(prev => prev.map(it => it.id === item.id ? updated : it));
    await fetch("/api/user-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: item.exerciseId,
        targetSets: updated.targetSets,
        targetReps: updated.targetReps,
        targetWeightKg: updated.targetWeightKg,
        orderIndex: updated.orderIndex ?? 0,
        favorite: !!updated.favorite
      })
    });
  }

  async function onDrag(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= list.length) return;
    const reordered = [...list];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    // recompute orderIndex
    const withOrder = reordered.map((it, i) => ({ ...it, orderIndex: i }));
    setList(withOrder);
    // persist in background
    for (const it of withOrder) {
      fetch("/api/user-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: it.exerciseId, orderIndex: it.orderIndex })
      });
    }
  }

  async function remove(id: number) {
    setList(prev => prev.filter(x => x.id !== id));
    await fetch(`/api/user-exercises?id=${id}`, { method: "DELETE" });
  }

  function exportList() {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "min-liste.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importList(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const items = JSON.parse(text) as UserExercise[];
      for (const it of items) {
        await fetch("/api/user-exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId: it.exerciseId,
            targetSets: it.targetSets,
            targetReps: it.targetReps,
            targetWeightKg: it.targetWeightKg,
            orderIndex: it.orderIndex ?? 0,
            favorite: !!it.favorite
          })
        });
      }
      const fresh = await fetchJsonSafe<UserExercise[]>("/api/user-exercises", undefined, []);
      setList(fresh);
    } catch {}
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-xl p-4">
        <h1 className="text-2xl font-semibold mb-4">Min liste</h1>
        <div className="mb-3 flex items-center gap-3">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={exportList}>Eksporter</button>
          <label className="text-sm">
            Importer
            <input type="file" accept="application/json" className="hidden" onChange={importList} />
          </label>
        </div>
        {list.length === 0 ? (
          <div className="text-sm text-zinc-600">Ingen øvelser i din liste endnu.</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-6 items-center gap-2 text-xs text-zinc-500">
              <div className="col-span-2">Øvelse</div>
              <div>Sæt</div>
              <div>Reps</div>
              <div>Kg</div>
              <div></div>
            </div>
            {list.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-6 items-center gap-2" draggable onDragStart={(e) => (e.dataTransfer.setData("text/plain", String(idx)))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const from = Number(e.dataTransfer.getData("text/plain")); onDrag(from, idx); }}>
                <div className="col-span-2 text-sm">{item.exercise?.name}</div>
                <input className="rounded-md border px-2 py-2 text-sm" type="number" min={1} step={1} value={item.targetSets}
                  onChange={(e) => update(item, { targetSets: Number(e.target.value) })} />
                <input className="rounded-md border px-2 py-2 text-sm" type="number" min={1} step={1} value={item.targetReps}
                  onChange={(e) => update(item, { targetReps: Number(e.target.value) })} />
                <input className="rounded-md border px-2 py-2 text-sm" type="number" min={0} step={0.5} value={item.targetWeightKg}
                  onChange={(e) => update(item, { targetWeightKg: Number(e.target.value) })} />
                <div className="flex items-center justify-end gap-2">
                  <button className={`text-sm ${item.favorite ? "text-yellow-600" : "text-zinc-400"}`} onClick={() => update(item, { favorite: !item.favorite })}>★</button>
                  <button className="text-sm text-red-600" onClick={() => remove(item.id)}>Fjern</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


