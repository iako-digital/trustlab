"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldQuestion,
  CircleCheck,
  CircleX,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Award,
  Medal,
  Search,
  Flame,
  Zap,
  Share2,
  Home,
  Check,
} from "lucide-react";
import { SmartReader } from "@/components/common/smart-reader";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  LEVEL_MULTIPLIER,
  LEVEL_NAME,
  QUESTIONS_PER_LEVEL,
  QUIZ_LEVELS,
  QUIZ_QUESTIONS,
  badgeTierForCorrect,
  pointsFor,
  type BadgeTier,
  type QuizLevel,
} from "@/lib/quiz-data";

type Phase = "intro" | "levelIntro" | "question" | "levelDone" | "result";

const BADGE_STYLE: Record<BadgeTier, { gradient: string; icon: typeof ShieldCheck }> = {
  master: { gradient: "from-[#E4B429] to-[#B7791F]", icon: ShieldCheck },
  analyst: { gradient: "from-brand to-ink", icon: Award },
  investigator: { gradient: "from-ink-faint to-ink-soft", icon: Search },
  apprentice: { gradient: "from-[#C47A50] to-[#8B4F31]", icon: Medal },
};

const LETTERS = ["A", "B", "C", "D"];
const LEVELS = QUIZ_LEVELS.length;

export function QuizApp() {
  const { t, locale } = useI18n();
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState<QuizLevel>(1);
  const [qIndex, setQIndex] = useState(0); // index within the level
  const [picked, setPicked] = useState<number | null>(null);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
  const [lastGain, setLastGain] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const levelQuestions = QUIZ_QUESTIONS.filter((q) => q.level === level);
  const question = levelQuestions[qIndex];
  const total = QUIZ_QUESTIONS.length;
  const correctInLevel = levelQuestions.filter((q) => correctIds.includes(q.id)).length;
  const revealed = picked !== null;
  const wasCorrect = revealed && picked === question?.correct;

  function pick(i: number) {
    if (revealed || !question) return;
    setPicked(i);
    if (i === question.correct) {
      const nextStreak = streak + 1;
      const gain = pointsFor(level, nextStreak);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setPoints((p) => p + gain);
      setLastGain(gain);
      setCorrectIds((ids) => [...ids, question.id]);
    } else {
      setStreak(0);
      setLastGain(0);
    }
  }

  function goNext() {
    setPicked(null);
    if (qIndex + 1 < levelQuestions.length) {
      setQIndex(qIndex + 1);
    } else {
      setPhase(level === LEVELS ? "result" : "levelDone");
    }
  }

  function startNextLevel() {
    setLevel((level + 1) as QuizLevel);
    setQIndex(0);
    setPhase("levelIntro");
  }

  function restart() {
    setPhase("intro");
    setLevel(1);
    setQIndex(0);
    setPicked(null);
    setCorrectIds([]);
    setPoints(0);
    setLastGain(0);
    setStreak(0);
    setBestStreak(0);
    setShareNote(null);
  }

  const levelName = (l: QuizLevel) => LEVEL_NAME[l][locale];

  // ------------------------------------------------------------------ intro
  if (phase === "intro") {
    return (
      <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-ink text-paper shadow-card glow-soft">
          <ShieldQuestion className="h-7 w-7" strokeWidth={2} />
        </span>
        <h2 className="mt-5 font-serif text-2xl font-semibold text-ink">{t("quiz.title")}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
          {t("quiz.subtitle")}
        </p>
        <ol className="mt-6 grid gap-2 text-left sm:grid-cols-3">
          {QUIZ_LEVELS.map((l) => (
            <li key={l} className="rounded-2xl border border-paper-line bg-paper p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                {t("quiz.levelOf", { level: l, levels: LEVELS })}
              </p>
              <p className="mt-1 font-serif text-base font-semibold text-ink">{levelName(l)}</p>
              <p className="mt-0.5 font-mono text-[11px] text-brand">
                {t("quiz.multiplier", { n: LEVEL_MULTIPLIER[l] })}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-faint">{t("quiz.levelsIntro")}</p>
        <Button variant="brand" size="lg" className="mt-6" onClick={() => setPhase("levelIntro")}>
          <Sparkles className="h-4 w-4" />
          {t("quiz.start")}
        </Button>
      </Card>
    );
  }

  // ------------------------------------------------------------ level intro
  if (phase === "levelIntro") {
    return (
      <Card className="mx-auto max-w-xl animate-pop-in p-6 text-center sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
          {t("quiz.levelOf", { level, levels: LEVELS })}
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
          {t("quiz.levelIntro", { level, name: levelName(level) })}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
          {t("quiz.levelIntroDesc", { n: LEVEL_MULTIPLIER[level] })}
        </p>
        <Button variant="brand" size="lg" className="mt-6" onClick={() => setPhase("question")}>
          {t("quiz.startLevel")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  // ------------------------------------------------------------- level done
  if (phase === "levelDone") {
    return (
      <Card className="mx-auto max-w-xl animate-pop-in p-6 text-center sm:p-8">
        <CircleCheck className="mx-auto h-10 w-10 text-verdict-trueink" strokeWidth={1.75} />
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">
          {t("quiz.levelComplete", { level })}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {t("quiz.levelScore", { correct: correctInLevel, total: levelQuestions.length })}
        </p>
        <p className="mt-4 font-serif text-3xl font-semibold text-ink">
          {t("quiz.points", { points })}
        </p>
        <Button variant="brand" size="lg" className="mt-6" onClick={startNextLevel}>
          {t("quiz.nextLevel")}: {levelName((level + 1) as QuizLevel)}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  // ----------------------------------------------------------------- result
  if (phase === "result") {
    const correct = correctIds.length;
    const tier = badgeTierForCorrect(correct, total);
    const { gradient, icon: BadgeIcon } = BADGE_STYLE[tier];
    const tierName = t(`quiz.badge${cap(tier)}Title`);

    async function share() {
      const text = t("quiz.shareText", { points, correct, total, badge: tierName });
      const url = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "";
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: "TrustLab", text, url });
          setShareNote(t("quiz.shared"));
        } else {
          await navigator.clipboard.writeText(`${text} ${url}`);
          setShareNote(t("quiz.copied"));
        }
      } catch {
        // User dismissed the share sheet, or clipboard is unavailable: nothing to report.
      }
    }

    return (
      <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
          {t("quiz.resultsTitle")}
        </p>

        <div
          className={cn(
            "animate-badge-pop mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br text-paper shadow-card",
            gradient,
          )}
        >
          <BadgeIcon className="h-11 w-11" strokeWidth={2} />
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-brand">
          {t("quiz.badgeUnlocked")}
        </p>
        <h2 className="mt-1 font-serif text-xl font-semibold text-ink sm:text-2xl">{tierName}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          {t(`quiz.badge${cap(tier)}Desc`)}
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
          <Stat label={t("quiz.totalScore")} value={String(points)} />
          <Stat label={t("quiz.correctCount")} value={`${correct}/${total}`} />
          <Stat label={t("quiz.bestStreak")} value={String(bestStreak)} />
        </dl>

        <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button variant="brand" onClick={share}>
            {shareNote ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {shareNote ?? t("quiz.share")}
          </Button>
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="h-4 w-4" />
            {t("quiz.retry")}
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
            <Home className="h-4 w-4" />
            {t("quiz.backHome")}
          </Link>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {shareNote}
        </p>
      </Card>
    );
  }

  // --------------------------------------------------------------- question
  const answered = qIndex + (revealed ? 1 : 0);
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint sm:text-xs">
        <span>
          {t("quiz.levelOf", { level, levels: LEVELS })} · {levelName(level)}
        </span>
        <span>{t("quiz.questionOf", { current: qIndex + 1, total: levelQuestions.length })}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip icon={<Zap className="h-3.5 w-3.5" />}>
          {t("quiz.multiplier", { n: LEVEL_MULTIPLIER[level] })}
        </Chip>
        <Chip
          icon={<Flame className={cn("h-3.5 w-3.5", streak >= 2 && "text-verdict-manipink")} />}
          active={streak >= 2}
        >
          {t("quiz.streak", { n: streak })}
        </Chip>
        <Chip className="ml-auto">{t("quiz.points", { points })}</Chip>
      </div>

      <div
        className="mb-5 flex items-center gap-1.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={levelQuestions.length}
        aria-valuenow={answered}
      >
        {Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-smooth",
              i < qIndex || (i === qIndex && revealed)
                ? "bg-accent"
                : i === qIndex
                  ? "bg-ink"
                  : "bg-paper-line",
            )}
          />
        ))}
      </div>

      <Card key={question.id} className="animate-pop-in p-4 sm:p-8">
        <h2 className="break-words font-serif text-lg font-semibold leading-snug text-ink sm:text-xl">
          {question.prompt[locale]}
        </h2>
        <SmartReader
          compact
          className="mt-3"
          text={[
            question.prompt[locale],
            ...question.options.map((o, i) => `${LETTERS[i]}. ${o[locale]}`),
          ].join(" ")}
        />

        <div className="mt-5 flex flex-col gap-2.5" role="group" aria-label={t("quiz.answerIn")}>
          {question.options.map((opt, i) => {
            const isRight = i === question.correct;
            const isPicked = picked === i;
            return (
              <button
                key={i}
                type="button"
                disabled={revealed}
                onClick={() => pick(i)}
                className={cn(
                  "flex min-h-12 items-start gap-3 rounded-card border p-3.5 text-left text-sm leading-relaxed text-ink transition-smooth sm:p-4",
                  !revealed && "border-paper-line hover:border-brand/40 hover:bg-paper",
                  revealed && isRight && "border-verdict-true/50 bg-verdict-truebg",
                  revealed && isPicked && !isRight && "border-verdict-fake/50 bg-verdict-fakebg",
                  revealed && !isRight && !isPicked && "border-paper-line opacity-60",
                )}
              >
                <span className="mt-0.5 font-mono text-xs font-semibold text-ink-faint">{LETTERS[i]}</span>
                <span className="min-w-0 flex-1 break-words">{opt[locale]}</span>
                {revealed && isRight && <CircleCheck className="h-4 w-4 shrink-0 text-verdict-trueink" />}
                {revealed && isPicked && !isRight && <CircleX className="h-4 w-4 shrink-0 text-verdict-fakeink" />}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div
            role="status"
            className={cn(
              "animate-pop-in mt-5 rounded-card border p-4 shadow-card",
              wasCorrect ? "border-verdict-true/40 bg-verdict-truebg" : "border-verdict-fake/40 bg-verdict-fakebg",
            )}
          >
            <p
              className={cn(
                "flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs font-semibold uppercase tracking-[0.12em]",
                wasCorrect ? "text-verdict-trueink" : "text-verdict-fakeink",
              )}
            >
              {wasCorrect ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
              {wasCorrect ? t("quiz.correct") : t("quiz.incorrect")}
              {wasCorrect && (
                <span className="rounded-full bg-paper-card/70 px-2 py-0.5 normal-case tracking-normal">
                  {t("quiz.plusPoints", { points: lastGain })}
                  {streak >= 2 ? ` · ${t("quiz.streakBonus")}` : ""}
                </span>
              )}
            </p>
            <p className="mt-2 break-words text-sm leading-relaxed text-ink">{question.explanation[locale]}</p>
            <SmartReader
              compact
              className="mt-3 flex"
              text={`${wasCorrect ? t("quiz.correct") : t("quiz.incorrect")} ${question.explanation[locale]}`}
            />
            <Button variant="brand" className="mt-4 w-full sm:w-auto" onClick={goNext}>
              {qIndex + 1 < levelQuestions.length
                ? t("quiz.next")
                : level === LEVELS
                  ? t("quiz.seeResults")
                  : t("quiz.levelComplete", { level })}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-paper-line bg-paper p-3">
      <dd className="font-serif text-xl font-semibold text-ink sm:text-2xl">{value}</dd>
      <dt className="mt-0.5 text-[11px] leading-tight text-ink-faint">{label}</dt>
    </div>
  );
}

function Chip({
  children,
  icon,
  active,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] text-ink-soft",
        active ? "border-verdict-manip/50 bg-verdict-manipbg" : "border-paper-line bg-paper-card",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
