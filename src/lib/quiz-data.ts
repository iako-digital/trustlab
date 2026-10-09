export type QuizOptionId = "a" | "b";

export interface QuizQuestion {
  /** Translation-key prefix, e.g. "q1" -> quiz.q1prompt / quiz.q1optionA ... */
  id: "q1" | "q2" | "q3";
  correct: QuizOptionId;
  /** q1 renders a "spot the AI photo" visual pair instead of plain text options. */
  visual?: boolean;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: "q1", correct: "b", visual: true },
  { id: "q2", correct: "b" },
  { id: "q3", correct: "b" },
];

export type BadgeTier = "gold" | "silver" | "bronze";

export function badgeTierForScore(score: number, total: number): BadgeTier {
  if (score === total) return "gold";
  if (score >= Math.ceil(total / 2)) return "silver";
  return "bronze";
}
