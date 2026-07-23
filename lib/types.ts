export type QuestionType = "multiple_choice" | "word_cloud" | "qa";

export interface Room {
  id: string;
  title: string;
  owner_id: string;
  active_question_id: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  room_id: string;
  title: string;
  type: QuestionType;
  options: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  room_id: string;
  content: string;
  created_at: string;
}
