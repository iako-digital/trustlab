"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldQuestion,
  Users,
  ScanFace,
  CircleCheck,
  CircleX,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Award,
  Home,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { QUIZ_QUESTIONS, badgeTierForScore, type QuizOptionId, type BadgeTier } from "@/lib/quiz-data";

type Phase = "intro" | "question" | "result";

const BADGE_STYLE: Record<BadgeTier, { gradient: string; icon: typeof ShieldCheck }> = {
  gold: { gradient: "from-[#E4B429] to-[#B7791F]", icon: ShieldCheck },
  silver: { gradient: "from-ink-faint to-ink-soft", icon: Award },
  bronze: { gradient: "from-[#C47A50] to-[#8B4F31]", icon: Sparkles },
};

export function QuizApp() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<string, QuizOptionId>>>({});

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[index];
  const selected = answers[question?.id];
  const score = QUIZ_QUESTIONS.filter((q) => answers[q.id] === q.correct).length;

  function selectAnswer(optionId: QuizOptionId) {
    if (selected) return; // lock after first pick — immediate feedback only
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  function goNext() {
    if (index + 1 < total) {
      setIndex(index + 1);
    } else {
      setPhase("result");
    }
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setPhase("intro");
  }

  if (phase === "intro") {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-ink text-paper shadow-card glow-soft">
          <ShieldQuestion className="h-7 w-7" strokeWidth={2} />
        </span>
        <h2 className="mt-5 font-serif text-2xl font-semibold text-ink">{t("quiz.title")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
          {t("quiz.subtitle")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          {QUIZ_QUESTIONS.map((_, i) => (
            <span key={i} className="h-1.5 w-8 rounded-full bg-paper-line" />
          ))}
        </div>
        <Button
          variant="brand"
          size="lg"
          className="mt-7"
          onClick={() => setPhase("question")}
        >
          <Sparkles className="h-4 w-4" />
          {t("quiz.start")}
        </Button>
      </Card>
    );
  }

  if (phase === "result") {
    const tier = badgeTierForScore(score, total);
    const { gradient, icon: BadgeIcon } = BADGE_STYLE[tier];
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
          {t("quiz.resultsTitle")}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {t("quiz.resultsSubtitle", { score, total })}
        </p>

        <div
          className={cn(
            "animate-badge-pop mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br text-paper shadow-card",
            gradient,
          )}
        >
          <BadgeIcon className="h-11 w-11" strokeWidth={2} />
        </div>

        <h2 className="mt-5 font-serif text-xl font-semibold text-ink">
          {t(`quiz.badge${cap(tier)}Title`)}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          {t(`quiz.badge${cap(tier)}Desc`)}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="h-4 w-4" />
            {t("quiz.retry")}
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
            <Home className="h-4 w-4" />
            {t("quiz.backHome")}
          </Link>
        </div>
      </Card>
    );
  }

  // phase === "question"
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
          {t("quiz.questionOf", { current: index + 1, total })}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
          {t("quiz.scoreLabel", { score, total })}
        </span>
      </div>
      <div className="mb-6 flex items-center gap-2">
        {QUIZ_QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-smooth",
              i < index ? "bg-brand" : i === index ? "bg-ink" : "bg-paper-line",
            )}
          />
        ))}
      </div>

      <Card key={question.id} className="animate-pop-in p-6 sm:p-8">
        <h2 className="font-serif text-lg font-semibold leading-snug text-ink sm:text-xl">
          {t(`quiz.${question.id}prompt`)}
        </h2>

        {question.visual ? (
          <VisualOptions
            questionId={question.id}
            correct={question.correct}
            selected={selected}
            onSelect={selectAnswer}
          />
        ) : (
          <TextOptions
            questionId={question.id}
            correct={question.correct}
            selected={selected}
            onSelect={selectAnswer}
          />
        )}

        {selected && (
          <div
            className={cn(
              "animate-pop-in mt-5 rounded-card border p-4 shadow-card",
              selected === question.correct
                ? "border-verdict-true/40 bg-verdict-truebg"
                : "border-verdict-fake/40 bg-verdict-fakebg",
            )}
          >
            <p
              className={cn(
                "flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em]",
                selected === question.correct ? "text-verdict-true" : "text-verdict-fake",
              )}
            >
              {selected === question.correct ? (
                <CircleCheck className="h-3.5 w-3.5" />
              ) : (
                <CircleX className="h-3.5 w-3.5" />
              )}
              {selected === question.correct ? t("quiz.correct") : t("quiz.incorrect")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {t(`quiz.${question.id}explanation`)}
            </p>
            <Button variant="brand" size="sm" className="mt-4" onClick={goNext}>
              {index + 1 < total ? t("quiz.next") : t("quiz.seeResults")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function optionStateClasses(isSelected: boolean, isCorrectOption: boolean, revealed: boolean) {
  if (!revealed) {
    return "border-paper-line hover:border-brand/40 hover:bg-paper";
  }
  if (isCorrectOption) {
    return "border-verdict-true/50 bg-verdict-truebg";
  }
  if (isSelected && !isCorrectOption) {
    return "border-verdict-fake/50 bg-verdict-fakebg";
  }
  return "border-paper-line opacity-60";
}

function TextOptions({
  questionId,
  correct,
  selected,
  onSelect,
}: {
  questionId: string;
  correct: QuizOptionId;
  selected: QuizOptionId | undefined;
  onSelect: (id: QuizOptionId) => void;
}) {
  const t = useT();
  const revealed = Boolean(selected);
  const options: QuizOptionId[] = ["a", "b"];

  return (
    <div className="mt-5 flex flex-col gap-2.5">
      {options.map((opt) => (
        <button
          key={opt}
          disabled={revealed}
          onClick={() => onSelect(opt)}
          className={cn(
            "flex items-start gap-3 rounded-card border p-4 text-left text-sm leading-relaxed text-ink transition-smooth",
            optionStateClasses(selected === opt, opt === correct, revealed),
          )}
        >
          <span className="mt-0.5 font-mono text-xs font-semibold uppercase text-ink-faint">
            {opt}
          </span>
          <span className="flex-1">{t(`quiz.${questionId}option${cap(opt)}`)}</span>
          {revealed && opt === correct && (
            <CircleCheck className="h-4 w-4 shrink-0 text-verdict-true" />
          )}
          {revealed && selected === opt && opt !== correct && (
            <CircleX className="h-4 w-4 shrink-0 text-verdict-fake" />
          )}
        </button>
      ))}
    </div>
  );
}

function VisualOptions({
  questionId,
  correct,
  selected,
  onSelect,
}: {
  questionId: string;
  correct: QuizOptionId;
  selected: QuizOptionId | undefined;
  onSelect: (id: QuizOptionId) => void;
}) {
  const t = useT();
  const revealed = Boolean(selected);
  const [failed, setFailed] = useState<Partial<Record<QuizOptionId, boolean>>>({});
  const options: { id: QuizOptionId; icon: typeof Users; pattern: string; src: string }[] = [
    { id: "a", icon: Users, pattern: "from-brand/25 via-brand/10 to-transparent", src: "/quiz-photo-a.jpg" },
    { id: "b", icon: ScanFace, pattern: "from-ink/25 via-ink/10 to-transparent", src: "/quiz-photo-b.jpg" },
  ];

  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      {options.map(({ id, icon: Icon, pattern, src }) => (
        <button
          key={id}
          disabled={revealed}
          onClick={() => onSelect(id)}
          className={cn(
            "group overflow-hidden rounded-card border text-left transition-smooth",
            optionStateClasses(selected === id, id === correct, revealed),
          )}
        >
          <div
            className={cn(
              "relative flex h-28 items-center justify-center bg-gradient-to-br sm:h-36",
              pattern,
            )}
          >
            {/* Icon placeholder underneath: shows instantly, and stays visible as the
                permanent fallback if quiz-photo-{a,b}.jpg hasn't been added to public/. */}
            <Icon className="h-10 w-10 text-ink-soft transition-smooth group-hover:scale-105" strokeWidth={1.5} />
            {!failed[id] && (
              // eslint-disable-next-line @next/next/no-img-element -- plain img so onError fallback works without next/image's build-time asset checks
              <img
                src={src}
                alt={t(id === "a" ? "quiz.photoA" : "quiz.photoB")}
                onError={() => setFailed((prev) => ({ ...prev, [id]: true }))}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex items-center justify-between p-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                {t(id === "a" ? "quiz.photoA" : "quiz.photoB")}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-ink-soft">
                {t(`quiz.${questionId}option${cap(id)}`)}
              </p>
            </div>
            {revealed && id === correct && <CircleCheck className="h-4 w-4 shrink-0 text-verdict-true" />}
            {revealed && selected === id && id !== correct && (
              <CircleX className="h-4 w-4 shrink-0 text-verdict-fake" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
