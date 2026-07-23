"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Question, Room } from "@/lib/types";
import { questionTypeLabel } from "@/lib/utils";
import JoinAnswerForm from "@/components/JoinAnswerForm";

export default function JoinPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadActiveQuestion = useCallback(async (questionId: string | null) => {
    if (!questionId) {
      setActiveQuestion(null);
      return;
    }

    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

    setActiveQuestion((data as Question) ?? null);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: roomData, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error || !roomData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRoom(roomData as Room);
      await loadActiveQuestion(roomData.active_question_id);
      setLoading(false);
    }

    init();
  }, [roomId, loadActiveQuestion]);

  useEffect(() => {
    const channel = supabase
      .channel(`join-room-${roomId}`)
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
      supabase.removeChannel(channel);
    };
  }, [roomId, loadActiveQuestion]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-violet-50">
        <p className="text-violet-600">접속 중...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-full items-center justify-center bg-violet-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">방을 찾을 수 없습니다</h1>
          <p className="mt-2 text-slate-500">링크를 다시 확인해 주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-violet-50 to-white">
      <header className="border-b border-violet-100 bg-white/80 px-6 py-5 backdrop-blur">
        <p className="text-center text-sm font-medium text-violet-600">
          {room?.title}
        </p>
      </header>

      <main className="mx-auto max-w-lg px-6 py-10">
        {activeQuestion ? (
          <>
            <span className="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              {questionTypeLabel(activeQuestion.type)}
            </span>
            <h1 className="mb-8 text-2xl font-bold leading-snug text-slate-900">
              {activeQuestion.title}
            </h1>
            <JoinAnswerForm
              question={activeQuestion}
              roomId={roomId}
            />
          </>
        ) : (
          <div className="rounded-2xl border border-violet-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-500" />
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              질문 대기 중
            </h2>
            <p className="mt-2 text-slate-500">
              발표자가 질문을 시작하면 이 화면이 자동으로 업데이트됩니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
