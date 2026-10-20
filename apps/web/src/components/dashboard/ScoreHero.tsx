import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { Progress } from "@animate-ui/react/primitives/base-ui/progress";
import { muted } from "../../lib/styles";

type ScoreHeroProps = {
  score: number;
  matching: number;
  eligible: number;
};

export function ScoreHero({ score, matching, eligible }: ScoreHeroProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#0d0d0d]/80 p-5 md:p-6">
      <p className={`text-xs font-medium uppercase tracking-wider ${muted}`}>Consistency score</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
          <SlidingNumber number={score} fromNumber={0} inView />
        </span>
        <span className={`mb-1.5 text-xl ${muted}`}>%</span>
      </div>
      <p className={`mt-2 text-sm ${muted}`}>
        {matching} of {eligible} eligible fields match your approved profile.
      </p>
      <Progress.Root value={score} className="mt-5 grid gap-2">
        <div className="flex items-center justify-between text-xs">
          <Progress.Label className={muted}>Field coverage</Progress.Label>
          <Progress.Value className="tabular-nums text-[var(--foreground)]" />
        </div>
        <Progress.Track className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <Progress.Indicator className="h-full rounded-full bg-[var(--primary)]" />
        </Progress.Track>
      </Progress.Root>
    </div>
  );
}
