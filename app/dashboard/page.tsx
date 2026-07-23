"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/lib/types";
import { ExternalLink, LogOut, Plus, Presentation, Settings } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  const loadRooms = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setRooms(data as Room[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      setEmail(user.email ?? null);
      await loadRooms(user.id);
    }

    init();
  }, [loadRooms, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("rooms")
      .insert({ title: newTitle.trim(), owner_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setRooms((prev) => [data as Room, ...prev]);
      setNewTitle("");
    }

    setCreating(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-slate-500">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/dashboard" className="text-xl font-bold text-violet-700">
              Vibe Meter
            </Link>
            {email && (
              <p className="text-sm text-slate-500">{email}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">내 방</h1>
          <p className="mt-2 text-slate-600">
            새 방을 만들고 질문을 설정한 뒤 전광판을 띄워 보세요.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="mb-10 flex flex-col gap-3 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm sm:flex-row"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="새 방 제목 (예: 2026 팀 워크샵)"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none ring-violet-400 focus:ring-2"
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            {creating ? "생성 중..." : "방 만들기"}
          </button>
        </form>

        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg text-slate-500">아직 방이 없습니다.</p>
            <p className="mt-2 text-sm text-slate-400">
              위에서 첫 번째 방을 만들어 보세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {room.title}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(room.created_at).toLocaleDateString("ko-KR")}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/${room.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                  >
                    <Settings className="h-4 w-4" />
                    관리
                  </Link>
                  <Link
                    href={`/present/${room.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                  >
                    <Presentation className="h-4 w-4" />
                    전광판
                  </Link>
                  <Link
                    href={`/join/${room.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    참여 링크
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
