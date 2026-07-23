import type { QuestionType } from "./types";

export function questionTypeLabel(type: QuestionType): string {
  switch (type) {
    case "multiple_choice":
      return "객관식";
    case "word_cloud":
      return "단어구름";
    case "qa":
      return "익명 Q&A";
  }
}

export function getJoinUrl(roomId: string): string {
  if (typeof window === "undefined") return `/join/${roomId}`;
  return `${window.location.origin}/join/${roomId}`;
}
