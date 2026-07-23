"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import type { Answer, Question, Room } from "@/lib/types";
import { getJoinUrl, questionTypeLabel } from "@/lib/utils";
import QuestionResults from "@/components/QuestionResults";

export default function PresentPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [joinUrl, setJoinUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAnswers = useCallback(async (questionId: string) => {
    const { data } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false });

    setAnswers((data as Answer[]) ?? []);
  }, []);

  const loadActiveQuestion = useCallback(
    async (questionId: string | null) => {
      if (!questionId) {
        setActiveQuestion(null);
        setAnswers([]);
        return;
      }

      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("id", questionId)
        .single();

      if (data) {
        setActiveQuestion(data as Question);
        await loadAnswers(questionId);
      }
    },
    [loadAnswers],
  );

  useEffect(() => {
    setJoinUrl(getJoinUrl(roomId));

    async function init() {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomData) {
        setRoom(roomData as Room);
        await loadActiveQuestion(roomData.active_question_id);
      }
      setLoading(false);
    }

    init();
  }, [roomId, loadActiveQuestion]);

  useEffect(() => {
    const roomChannel = supabase
      .channel(`present-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          loadActiveQuestion(updated.active_question_id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, loadActiveQuestion]);

  useEffect(() => {
    if (!activeQuestion) return;

    const answerChannel = supabase
      .channel(`present-answers-${activeQuestion.id}`)
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
      supabase.removeChannel(answerChannel);
    };
  }, [activeQuestion, loadAnswers]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-violet-950 text-white">
        <p className="text-xl opacity-70">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-violet-900 to-fuchsia-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-8 py-10 lg:flex-row lg:gap-12">
        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-300">
            {room?.title ?? "Vibe Meter"}
          </p>

          {activeQuestion ? (
            <>
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-violet-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {questionTypeLabel(activeQuestion.type)}
              </span>
              <h1 className="mb-10 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {activeQuestion.title}
              </h1>
              <QuestionResults
                question={activeQuestion}
                answers={answers}
                variant="present"
              />
            </>
          ) : (
            <div className="py-20 text-center lg:text-left">
              <h1 className="text-5xl font-bold">곧 시작합니다</h1>
              <p className="mt-4 text-xl text-violet-200">
                QR 코드를 스캔하거나 링크로 참여해 주세요.
              </p>
            </div>
          )}
        </div>

        <aside className="mt-10 flex shrink-0 flex-col items-center justify-center lg:mt-0">
          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-black/30">
            {joinUrl && (
              <QRCodeSVG value={joinUrl} size={220} level="M" />
            )}
          </div>
          <p className="mt-6 max-w-xs text-center text-sm text-violet-200">
            스캔하여 참여
          </p>
          {joinUrl && (
            <p className="mt-2 max-w-xs break-all text-center text-xs text-violet-300/80">
              {joinUrl}
            </p>
          )}
          {activeQuestion && (
            <p className="mt-6 text-2xl font-bold tabular-nums text-violet-100">
              {answers.length}명 참여
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
