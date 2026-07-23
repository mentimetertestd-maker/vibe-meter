"use client";

import { useMemo } from "react";
import type { Answer, Question } from "@/lib/types";

interface QuestionResultsProps {
  question: Question;
  answers: Answer[];
  variant?: "default" | "present";
}

export default function QuestionResults({
  question,
  answers,
  variant = "default",
}: QuestionResultsProps) {
  const isPresent = variant === "present";

  if (question.type === "multiple_choice") {
    return (
      <MultipleChoiceResults
        question={question}
        answers={answers}
        isPresent={isPresent}
      />
    );
  }

  if (question.type === "word_cloud") {
    return <WordCloudResults answers={answers} isPresent={isPresent} />;
  }

  return <QAResults answers={answers} isPresent={isPresent} />;
}

function MultipleChoiceResults({
  question,
  answers,
  isPresent,
}: {
  question: Question;
  answers: Answer[];
  isPresent: boolean;
}) {
  const options = question.options ?? [];
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const opt of options) map.set(opt, 0);
    for (const a of answers) {
      map.set(a.content, (map.get(a.content) ?? 0) + 1);
    }
    return options.map((opt) => ({
      label: opt,
      count: map.get(opt) ?? 0,
    }));
  }, [answers, options]);

  const max = Math.max(...counts.map((c) => c.count), 1);
  const total = answers.length;

  return (
    <div className={`space-y-4 ${isPresent ? "space-y-6" : ""}`}>
      {counts.map(({ label, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span
                className={`font-medium text-slate-800 ${isPresent ? "text-2xl" : "text-sm"}`}
              >
                {label}
              </span>
              <span
                className={`tabular-nums text-violet-600 ${isPresent ? "text-xl font-bold" : "text-sm"}`}
              >
                {count} ({pct}%)
              </span>
            </div>
            <div
              className={`overflow-hidden rounded-full bg-violet-100 ${isPresent ? "h-5" : "h-3"}`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className={`text-slate-500 ${isPresent ? "text-lg" : "text-sm"}`}>
        총 {total}표
      </p>
    </div>
  );
}

function WordCloudResults({
  answers,
  isPresent,
}: {
  answers: Answer[];
  isPresent: boolean;
}) {
  const words = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of answers) {
      const word = a.content.trim().toLowerCase();
      if (!word) continue;
      map.set(word, (map.get(word) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [answers]);

  const maxCount = words[0]?.[1] ?? 1;

  if (words.length === 0) {
    return (
      <p className={`text-slate-400 ${isPresent ? "text-xl" : "text-sm"}`}>
        아직 제출된 단어가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-4">
      {words.map(([word, count]) => {
        const scale = 0.8 + (count / maxCount) * 1.4;
        return (
          <span
            key={word}
            className="inline-block rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 px-4 py-2 font-semibold text-violet-800 transition-transform hover:scale-105"
            style={{
              fontSize: isPresent ? `${scale * 1.75}rem` : `${scale}rem`,
            }}
          >
            {word}
            <span className="ml-1.5 text-violet-500 opacity-70">×{count}</span>
          </span>
        );
      })}
    </div>
  );
}

function QAResults({
  answers,
  isPresent,
}: {
  answers: Answer[];
  isPresent: boolean;
}) {
  const sorted = useMemo(
    () =>
      [...answers].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [answers],
  );

  if (sorted.length === 0) {
    return (
      <p className={`text-slate-400 ${isPresent ? "text-xl" : "text-sm"}`}>
        아직 질문이 없습니다.
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${isPresent ? "space-y-4" : ""}`}>
      {sorted.map((a) => (
        <div
          key={a.id}
          className={`rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 ${isPresent ? "px-6 py-4" : ""}`}
        >
          <p
            className={`text-slate-800 ${isPresent ? "text-xl leading-relaxed" : "text-sm"}`}
          >
            {a.content}
          </p>
        </div>
      ))}
    </div>
  );
}
