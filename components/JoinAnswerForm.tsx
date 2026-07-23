"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Question } from "@/lib/types";

interface JoinAnswerFormProps {
  question: Question;
  roomId: string;
  onSubmitted?: () => void;
}

export default function JoinAnswerForm({
  question,
  roomId,
  onSubmitted,
}: JoinAnswerFormProps) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const content =
      question.type === "multiple_choice" ? selected : value.trim();

    if (!content) {
      setError("답변을 입력해 주세요.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("answers").insert({
      question_id: question.id,
      room_id: roomId,
      content,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setValue("");
    setSelected(null);
    onSubmitted?.();
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-emerald-700">
          답변이 제출되었습니다!
        </p>
        <p className="mt-2 text-sm text-emerald-600">
          발표자가 다음 질문을 시작할 때까지 기다려 주세요.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm font-medium text-emerald-700 underline"
        >
          다시 답변하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {question.type === "multiple_choice" && (
        <div className="space-y-3">
          {(question.options ?? []).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
              className={`w-full rounded-xl border px-4 py-4 text-left text-base font-medium transition ${
                selected === opt
                  ? "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-400"
                  : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === "word_cloud" && (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={50}
          placeholder="한 단어 또는 짧은 구를 입력하세요"
          className="w-full rounded-xl border border-slate-200 px-4 py-4 text-lg outline-none ring-violet-400 focus:ring-2"
        />
      )}

      {question.type === "qa" && (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="익명으로 질문을 남겨 주세요"
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-4 text-base outline-none ring-violet-400 focus:ring-2"
        />
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 py-4 text-lg font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {loading ? "제출 중..." : "제출하기"}
      </button>
    </form>
  );
}
