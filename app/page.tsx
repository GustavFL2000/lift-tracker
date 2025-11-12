"use client";
import { useEffect, useState } from "react";
import "./globals.css";

type Exercise = {
  id: number;
  name: string;
  category: string | null;
  createdByUserId?: string | null;
  isMine?: boolean;
};

type UserExercise = {
  id: number;
  exercise: Exercise;
  exerciseId: number;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number;
};

type NewExercise = { name: string; category: string };

export default function Home() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [myList, setMyList] = useState<UserExercise[]>([]);
  const [newExercise, setNewExercise] = useState<NewExercise>({ name: "", category: "" });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

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
      body: JSON.stringify({ name: newExercise.name.trim(), category: newExercise.category || null }),
    });
    if (!res.ok) return;
    const created = await res.json();
    setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setNewExercise({ name: "", category: "" });
    setToast("Øvelse gemt");
    setTimeout(() => setToast(null), 1500);
  }

  async function addToMyList(exerciseId: number) {
    const optimistic = { exerciseId, targetSets: 3, targetReps: 8, targetWeightKg: 0 } as any;
    const ex = exercises.find((e) => e.id === exerciseId)!;
    setMyList((prev) => [
      ...prev,
      { id: Math.random(), exercise: ex, exerciseId, targetSets: 3, targetReps: 8, targetWeightKg: 0 },
    ]);
    const res = await fetch("/api/user-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(optimistic),
    });
    if (res.ok) {
      const saved = await res.json();
      setMyList((prev) => prev.map((it) => (it.exerciseId === exerciseId ? saved : it)));
      setToast("Tilføjet til Min liste");
      setTimeout(() => setToast(null), 1200);
    }
  }

  function removeFromPopular(exId: number) {
    setExercises((prev) => prev.filter((e) => e.id !== exId));
    setToast("Fjernet fra populære");
    setTimeout(() => setToast(null), 1200);
  }

  return (
    <div className="min-h-screen text-zinc-900">
      <div className="mx-auto max-w-xl p-4 space-y-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-sm">🏋️ Lift-tracker</h1>

        {exercises.length === 0 && (
          <div className="card">
            <p className="text-sm mb-3">Ingen øvelser fundet.</p>
            <button className="btn btn-primary" onClick={seedExercises}>
              Opret standard øvelser
            </button>
          </div>
        )}

        <div className="card">
          <h2 className="mb-2 text-lg font-semibold">Populære øvelser</h2>
          <input
            className="input mb-3"
            placeholder="Søg øvelse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {exercises
              .filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 24)
              .map((ex) => (
                <div key={ex.id} className="flex items-center gap-1">
                  <button className="btn btn-outline text-sm" onClick={() => addToMyList(ex.id)}>
                    + {ex.name}
                    {ex.category ? ` (${ex.category})` : ""}
                  </button>
                  <button className="btn btn-danger" onClick={() => removeFromPopular(ex.id)}>
                    X
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-2 text-lg font-semibold">Tilføj egen øvelse</h2>
          <div className="grid grid-cols-3 gap-2">
            <input
              className="input col-span-2"
              placeholder="Navn"
              value={newExercise.name}
              onChange={(e) => setNewExercise((v) => ({ ...v, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Kategori (fx Ben)"
              value={newExercise.category}
              onChange={(e) => setNewExercise((v) => ({ ...v, category: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary mt-3" onClick={createExercise}>
            Gem øvelse
          </button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
