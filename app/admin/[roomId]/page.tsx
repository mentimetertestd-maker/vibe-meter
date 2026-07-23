"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Answer, Question, QuestionType, Room } from "@/lib/types";
import { questionTypeLabel } from "@/lib/utils";
import QuestionResults from "@/components/QuestionResults";
import {
  ArrowLeft,
  ChevronRight,
  Play,
  Plus,
  Square,
  Trash2,
} from "lucide-react";

const QUESTION_TYPES: QuestionType[] = [
  "multiple_choice",
  "word_cloud",
  "qa",
];

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<QuestionType>("multiple_choice");
  const [optionsText, setOptionsText] = useState("옵션 1\n옵션 2\n옵션 3");

  const activeQuestion = questions.find((q) => q.id === room?.active_question_id);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/");
      return;
    }

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !roomData) {
      router.replace("/dashboard");
      return;
    }

    if (roomData.owner_id !== user.id) {
      router.replace("/dashboard");
      return;
    }

    setRoom(roomData as Room);

    const { data: qData } = await supabase
      .from("questions")
      .select("*")
      .eq("room_id", roomId)
      .order("sort_order", { ascending: true });

    setQuestions((qData as Question[]) ?? []);
    setLoading(false);
  }, [roomId, router]);

  const loadAnswers = useCallback(
    async (questionId: string) => {
      const { data } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", questionId)
        .order("created_at", { ascending: false });

      setAnswers((data as Answer[]) ?? []);
    },
    [],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeQuestion) loadAnswers(activeQuestion.id);
    else setAnswers([]);
  }, [activeQuestion, loadAnswers]);

  useEffect(() => {
    if (!activeQuestion) return;

    const channel = supabase
      .channel(`admin-answers-${activeQuestion.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `question_id=eq.${activeQuestion.id}`,
        },
        () => loadAnswers(activeQuestion.id),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeQuestion, loadAnswers]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new as Room);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const options =
      type === "multiple_choice"
        ? optionsText
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : null;

    const { data, error } = await supabase
      .from("questions")
      .insert({
        room_id: roomId,
        title: title.trim(),
        type,
        options,
        is_active: false,
        sort_order: questions.length,
      })
      .select()
      .single();

    if (!error && data) {
      setQuestions((prev) => [...prev, data as Question]);
      setTitle("");
      setOptionsText("옵션 1\n옵션 2\n옵션 3");
      setShowForm(false);
    }
  }

  async function activateQuestion(questionId: string) {
    await supabase
      .from("questions")
      .update({ is_active: false })
      .eq("room_id", roomId);

    await supabase
      .from("questions")
      .update({ is_active: true })
      .eq("id", questionId);

    await supabase
      .from("rooms")
      .update({ active_question_id: questionId })
      .eq("id", roomId);

    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        is_active: q.id === questionId,
      })),
    );
    setRoom((prev) =>
      prev ? { ...prev, active_question_id: questionId } : prev,
    );
  }

  async function stopQuestion() {
    await supabase
      .from("questions")
      .update({ is_active: false })
      .eq("room_id", roomId);

    await supabase
      .from("rooms")
      .update({ active_question_id: null })
      .eq("id", roomId);

    setQuestions((prev) => prev.map((q) => ({ ...q, is_active: false })));
    setRoom((prev) =>
      prev ? { ...prev, active_question_id: null } : prev,
    );
    setAnswers([]);
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("이 질문을 삭제할까요?")) return;

    await supabase.from("answers").delete().eq("question_id", questionId);
    await supabase.from("questions").delete().eq("id", questionId);

    if (room?.active_question_id === questionId) {
      await supabase
        .from("rooms")
        .update({ active_question_id: null })
        .eq("id", roomId);
    }

    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    if (activeQuestion?.id === questionId) setAnswers([]);
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{room?.title}</h1>
              <p className="text-sm text-slate-500">질문 관리</p>
            </div>
          </div>
          <Link
            href={`/present/${roomId}`}
            target="_blank"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            전광판 열기
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">질문 목록</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              질문 추가
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleCreateQuestion}
              className="mb-6 space-y-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="질문 내용"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-violet-400 focus:ring-2"
                required
              />

              <div className="flex flex-wrap gap-2">
                {QUESTION_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      type === t
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {questionTypeLabel(t)}
                  </button>
                ))}
              </div>

              {type === "multiple_choice" && (
                <textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  rows={4}
                  placeholder="한 줄에 하나씩 옵션 입력"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none ring-violet-400 focus:ring-2"
                />
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700"
              >
                질문 저장
              </button>
            </form>
          )}

          <div className="space-y-3">
            {questions.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
                질문을 추가해 보세요.
              </p>
            )}
            {questions.map((q) => (
              <div
                key={q.id}
                className={`rounded-xl border bg-white p-4 transition ${
                  q.is_active
                    ? "border-violet-400 ring-2 ring-violet-200"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      {questionTypeLabel(q.type)}
                    </span>
                    <p className="mt-2 font-medium text-slate-900">{q.title}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {q.is_active ? (
                      <button
                        onClick={stopQuestion}
                        className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                        title="질문 종료"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => activateQuestion(q.id)}
                        className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"
                        title="질문 시작"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="rounded-lg bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            실시간 결과
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {activeQuestion ? (
              <>
                <div className="mb-6 flex items-center gap-2 text-sm text-violet-600">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
                  </span>
                  LIVE · {questionTypeLabel(activeQuestion.type)}
                </div>
                <h3 className="mb-6 text-xl font-bold text-slate-900">
                  {activeQuestion.title}
                </h3>
                <QuestionResults
                  question={activeQuestion}
                  answers={answers}
                />
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <ChevronRight className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p>질문을 선택하고 ▶ 버튼으로 시작하세요.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
