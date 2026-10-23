import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { focus } from "../lib/styles";
import { useAuth } from "../context/AuthContext";
import ThemeTogglerDemo from "../components/ThemeToggler";
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Database, RefreshCw, Bot, Lock } from "lucide-react";


type Outcome = "verified" | "blocked";
const rows: { platform: string; field: string; before: string; after: string; outcome: Outcome }[] = [
  { platform: "Maps A", field: "Hours", before: "Mon–Fri 8–4", after: "Mon–Sat 7–5", outcome: "verified" },
  { platform: "Maps B", field: "Phone", before: "555 0124", after: "555 0124", outcome: "blocked" },
  { platform: "Directory C", field: "Holiday", before: "Open Dec 25", after: "Closed Dec 25", outcome: "verified" },
];

const chip: Record<string, string> = {
  mismatch: "text-amber-800 bg-amber-500/15 dark:text-[#a3a3a3] dark:bg-white/10",
  verified: "text-emerald-700 bg-emerald-500/15 dark:text-[#10b981] dark:bg-[#10b981]/10",
  blocked: "text-neutral-700 bg-neutral-200 dark:text-[#a3a3a3] dark:bg-white/10",
};

const phrases = ["Your business hours", "Your phone number", "Your address", "Your holiday hours"];

// The box has a fixed height and full width, so nothing around it reflows while the phrase changes.
function RotatingPhrase() {
  const [i, setI] = useState(0);
  const n = phrases.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % n), 2600);
    return () => clearInterval(id);
  }, [n]);

  return (
    <span aria-hidden="true" className="relative block h-[1.2em] overflow-hidden leading-[1.2]">
      {phrases.map((p, k) => (
        <span
          key={p}
          className={`absolute inset-x-0 top-0 whitespace-nowrap transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
            k === i ? "translate-y-0 opacity-100" : k === (i - 1 + n) % n ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"
          }`}
        >
          {p}
        </span>
      ))}
    </span>
  );
}

const muted = "text-[var(--muted-foreground)]";
const ease = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm shadow-sm">
      <p className={`text-xs ${muted}`}>{label}</p>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </div>
  );
}

function Pill({ tone, children }: { tone: string; children: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-300 motion-reduce:transition-none ${tone}`}>{children}</span>;
}

function Rolling({ value }: { value: number }) {
  return (
    <span className="inline-flex tabular-nums" aria-label={String(value)}>
      {String(value).split("").map((d, k) => (
        <span key={k} aria-hidden="true" className="inline-block h-[1em] overflow-hidden leading-[1em]">
          <span className={`flex flex-col transition-transform duration-700 motion-reduce:transition-none ${ease}`} style={{ transform: `translateY(-${Number(d) * 10}%)` }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <span key={n} className="block h-[1em]">{n}</span>)}
          </span>
        </span>
      ))}
    </span>
  );
}

function FormatBody() {
  const [on, setOn] = useState(true);
  return (
    <>
      <div className="flex items-center justify-between">
        <span id="fmt" className="text-xs">Ignore formatting</span>
        <button role="switch" aria-checked={on} aria-labelledby="fmt" onClick={() => setOn((v) => !v)}
          className={`relative h-5 w-9 rounded-full transition-colors duration-300 motion-reduce:transition-none ${on ? "bg-[var(--primary)]" : "bg-black/15 dark:bg-white/15"} ${focus}`}>
          <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform duration-300 motion-reduce:transition-none ${ease} ${on ? "translate-x-4 bg-white dark:bg-[#171717]" : "bg-neutral-800 dark:bg-[#fafafa]"}`} />
        </button>
      </div>
      <ul className="mt-3 text-xs">
        {[["Maps A", "(415) 555-0142", on], ["Maps B", "(415) 555-0124", false]].map(([n, v, ok]) => (
          <li key={String(n)} className="flex items-center justify-between gap-2 border-t border-[var(--border)] py-2">
            <span>{n}</span><span className="tabular-nums">{v}</span>
            <Pill tone={ok ? "text-emerald-700 bg-emerald-500/15 dark:text-[#10b981] dark:bg-[#10b981]/10" : "text-amber-800 bg-amber-500/15 dark:text-[#a3a3a3] dark:bg-white/10"}>{ok ? "Match" : "Mismatch"}</Pill>
          </li>
        ))}
      </ul>
    </>
  );
}

const sims = [["Maps A", "Mon–Fri 8–4", "Mon–Sat 7–5"], ["Maps B", "555 0124", "555 0142"], ["Directory C", "Open Dec 25", "Closed Dec 25"]];
function PreviewBody() {
  const [tab, setTab] = useState(0);
  return (
    <>
      <div role="tablist" className="relative grid grid-cols-3 rounded-lg bg-black/5 dark:bg-white/5 p-0.5 text-xs">
        <span aria-hidden="true" className={`absolute inset-y-0.5 left-0.5 w-[calc(33.333%-2px)] rounded-md bg-white dark:bg-white/10 shadow-sm transition-transform duration-300 motion-reduce:transition-none ${ease}`} style={{ transform: `translateX(${tab * 100}%)` }} />
        {sims.map(([n], k) => (
          <button key={n} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`relative py-1.5 font-medium ${tab === k ? "text-[var(--foreground)]" : muted} ${focus}`}>{n}</button>
        ))}
      </div>
      <div role="tabpanel" className="mt-3 text-xs">
        <p className={muted}>If you approve</p>
        <p className="tabular-nums line-through decoration-black/30 dark:decoration-white/30">{sims[tab][1]}</p>
        <p className="text-sm font-medium tabular-nums">{sims[tab][2]}</p>
      </div>
    </>
  );
}

const log = [["Maps A hours", "Approved 9:12. Re-check confirmed Mon–Sat 7–5."], ["Maps B phone", "Approved 9:12. Platform is read-only, so it was blocked."], ["Directory C holiday", "Approved 9:13. Re-check is still pending."]];
function HistoryBody() {
  const [open, setOpen] = useState(0);
  return (
    <ul className="text-xs">
      {log.map(([t, b], k) => (
        <li key={t} className="border-t border-[var(--border)] first:border-t-0">
          <button aria-expanded={open === k} onClick={() => setOpen(open === k ? -1 : k)} className={`flex w-full items-center justify-between py-1.5 text-left font-medium ${focus}`}>
            {t}
            <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none ${open === k ? "rotate-180" : ""}`} aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${ease} ${open === k ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden"><p className={`pb-1.5 ${muted}`}>{b}</p></div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ApprovalBody() {
  const [c, setC] = useState([true, true, false]);
  const n = c.filter(Boolean).length;
  return (
    <>
      <ul className="text-xs">
        {["Maps A hours", "Directory C holiday", "Maps B phone"].map((l, k) => (
          <li key={l} className="flex items-center gap-2 py-1.5">
            <button role="checkbox" aria-checked={c[k]} aria-label={l} onClick={() => setC((v) => v.map((x, j) => (j === k ? !x : x)))}
              className={`grid h-4 w-4 place-items-center rounded border transition-colors duration-200 motion-reduce:transition-none ${c[k] ? "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-black/25 dark:border-white/25"} ${focus}`}>
              <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={c[k] ? 0 : 1} className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none" /></svg>
            </button>
            {l}
          </li>
        ))}
      </ul>
      <p className={`mt-1 text-xs ${muted}`}>{n} approved, {3 - n} waiting. Nothing is sent until you apply.</p>
    </>
  );
}

function ScoreBody() {
  const [hi, setHi] = useState(false);
  useEffect(() => {
    if (reduced()) return;
    const id = setInterval(() => setHi((v) => !v), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center">
      <p className="text-4xl font-semibold"><Rolling value={hi ? 89 : 67} />%</p>
      <p className={`mt-1 text-xs ${muted}`}>of checked fields match your profile</p>
    </div>
  );
}

const holiday = ["Closed", "Open 9–1", "Open 9–5"];
function HolidayBody() {
  const [v, setV] = useState(0);
  return (
    <>
      <div role="radiogroup" aria-label="Dec 25 hours" className="text-xs">
        {holiday.map((h, k) => (
          <button key={h} role="radio" aria-checked={v === k} onClick={() => setV(k)} className={`flex w-full items-center gap-2 py-1 ${focus}`}>
            <span className={`grid h-4 w-4 place-items-center rounded-full border ${v === k ? "border-[var(--primary)]" : "border-black/25 dark:border-white/25"}`}>
              <span className={`h-2 w-2 rounded-full bg-[var(--primary)] transition-transform duration-200 motion-reduce:transition-none ${v === k ? "scale-100" : "scale-0"}`} />
            </span>
            {h}
          </button>
        ))}
      </div>
      <p className={`mt-1 text-xs ${muted}`}>{v === 2 ? "Directory C says Open 9–5. It matches." : "Directory C says Open 9–5. Conflict."}</p>
    </>
  );
}

const toasts = ["2 mismatches need review", "Maps B blocked the update", "Re-check finished"];
function AlertsBody() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const id = setInterval(() => setI((v) => (v + 1) % toasts.length), 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative h-11">
      {toasts.map((t, k) => (
        <div key={t} className={`absolute inset-0 flex items-center rounded-lg bg-black/5 dark:bg-white/10 px-3 text-xs border border-[var(--border)] transition-[transform,opacity] duration-500 motion-reduce:transition-none ${ease} ${k === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>{t}</div>
      ))}
    </div>
  );
}

function RecheckBody() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (reduced()) { setPct(100); return; }
    const id = setInterval(() => setPct((v) => (v >= 120 ? 0 : v + 2)), 70);
    return () => clearInterval(id);
  }, []);
  const shown = Math.min(100, pct);
  return (
    <>
      <div className="flex items-center justify-between text-xs"><span>Re-checking 3 listings</span><span className="tabular-nums">{shown}%</span></div>
      <div className="mt-2 h-1.5 rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${shown}%` }} /></div>
    </>
  );
}

const statuses = [
  ["Verified", "Re-check confirmed the value.", "M4 10.5l4 4 8-9"],
  ["Pending", "Waiting on you or a re-check.", "M10 5.5v5l3 2"],
  ["Failed", "The value didn’t change.", "M5.5 5.5l9 9M14.5 5.5l-9 9"],
  ["Blocked", "The platform allows no edits.", "M6 9V7a4 4 0 018 0v2M5 9h10v7H5z"],
];
function StatusBody() {
  const [s, setS] = useState(0);
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {statuses.map(([n, , d], k) => (
          <button key={n} aria-label={n} aria-pressed={s === k} onClick={() => setS(k)}
            className={`grid aspect-square place-items-center rounded-lg border transition-[transform,background-color] duration-200 hover:scale-105 motion-reduce:transition-none ${s === k ? "border-transparent bg-black/10 dark:bg-white/15 text-[var(--foreground)]" : "border-[var(--border)] text-[var(--muted-foreground)]"} ${focus}`}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
              {k === 1 && <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />}
              <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs"><span className="font-medium">{statuses[s][0]}.</span> <span className={muted}>{statuses[s][1]}</span></p>
    </>
  );
}

const PANELS: [string, () => ReactElement][] = [
  ["Format matching", FormatBody], ["Previews", PreviewBody], ["Change history", HistoryBody],
  ["Approvals", ApprovalBody], ["Consistency score", ScoreBody], ["Holiday hours", HolidayBody],
  ["Alerts", AlertsBody], ["Re-checks", RecheckBody], ["Statuses", StatusBody],
];
const N = PANELS.length;

// The mark: a map pin with a ring cut out of its head and a check inside, a listing that has been verified.
// Each face is a stack of flat copies, so the shape has real thickness while it turns (no masks, so it stays cheap).
const PIN = "M37.4 135.1A76 76 0 1 1 162.6 135.1L107.9 214.5Q100 226 92.1 214.5ZM56 92a44 44 0 1 0 88 0a44 44 0 1 0-88 0Z";
const CHECK = "M77 94l16 16 31-37";
const LAYERS = [0, 1, 2, 3, 4, 5, 6, 7];
function Logo() {
  // Only the outermost layer is bright. The rest form a darker edge, so the face stays crisp.
  const tone = (k: number) => (k === 7 ? "#fafafa" : `rgb(${70 + k * 7},${70 + k * 7},${70 + k * 7})`);
  return (
    <div className="relative aspect-[200/240] h-[clamp(10rem,36vh,21rem)] [transform-style:preserve-3d]" aria-hidden="true">
      {[0, 180].map((side) => (
        <div key={side} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: `rotateY(${side}deg)` }}>
          {LAYERS.map((k) => (
            <svg key={k} viewBox="0 0 200 240" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${k * 1.8}px)` }}>
              <path d={PIN} fill={tone(k)} fillRule="evenodd" />
              <path d={CHECK} fill="none" stroke={tone(k)} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
      ))}
    </div>
  );
}

// Scrolling drives one continuous move: panels circle the logo, then settle into a grid you can use.
// Performance: sizes are measured once (not every frame), each frame only writes transforms,
// scroll progress is eased so it never jumps, and nothing is written once the grid has settled.
function Scene() {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const t1 = useRef<HTMLHeadingElement>(null);
  const t2 = useRef<HTMLHeadingElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const PH = 170, GAP = 16;
    let raf = 0, visible = true, last = 0, ps = -1;
    let W = 0, H = 0, top = 0, range = 1, pw = 300, R = 0, Ry = 0;
    let settled = false, interactive = false;

    const measure = () => {
      const s = sec.current, st = stage.current;
      if (!s || !st) return;
      W = st.clientWidth; H = st.clientHeight;
      top = s.getBoundingClientRect().top + window.scrollY;
      range = Math.max(1, s.offsetHeight - H);
      pw = Math.max(200, Math.min(320, (Math.min(W, 1000) - 32) / 3));
      R = Math.min(W * 0.36, 450);
      Ry = Math.min(H * 0.27, 200);
      cards.current.forEach((el) => {
        if (!el) return;
        el.style.width = `${pw}px`;
        el.style.height = `${PH}px`;
        el.style.marginLeft = `${-pw / 2}px`;
        el.style.marginTop = `${-PH / 2}px`;
      });
      settled = false;
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const target = clamp((window.scrollY + 64 - top) / range);
      ps = ps < 0 ? target : ps + (target - ps) * (1 - Math.exp(-dt * 9));
      const moving = Math.abs(target - ps) > 0.0004;
      const t = smooth(0.3, 0.62, ps);

      if (t < 1 || moving || !settled) {
        const spin = (now / 1000) * 0.12 + ps * 2.6;
        cards.current.forEach((el, i) => {
          if (!el) return;
          const th = spin + (i / N) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
          const x = lerp(R * sn, ((i % 3) - 1) * (pw + GAP), t);
          const y = lerp(Ry * c + 40, (Math.floor(i / 3) - 1) * (PH + GAP) + 44, t);
          const z = lerp(260 * c, 0, t);
          el.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateX(${lerp(-c * 10, 0, t)}deg) rotateY(${lerp(-sn * 28, 0, t)}deg) scale(${lerp(0.8, 1, t)})`;
        });
        const inter = t > 0.9;
        if (inter !== interactive) {
          interactive = inter;
          cards.current.forEach((el) => { if (el) el.style.pointerEvents = inter ? "auto" : "none"; });
        }
        if (mark.current) {
          mark.current.style.transform = `translateZ(${-700 * t}px) rotateY(${now * 0.03 + ps * 540}deg) scale(${1 - 0.3 * t})`;
          mark.current.style.visibility = t > 0.97 ? "hidden" : "visible";
        }
        const a = smooth(0.25, 0.5, ps), b = smooth(0.5, 0.72, ps);
        if (t1.current) { t1.current.style.opacity = String(1 - a); t1.current.style.transform = `translateY(${-a * 14}px)`; }
        if (t2.current) { t2.current.style.opacity = String(b); t2.current.style.transform = `translateY(${(1 - b) * 14}px)`; }
        settled = t >= 1 && !moving;
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (stage.current) ro.observe(stage.current);
    ro.observe(document.body); // the page above can change height, which moves this section
    document.fonts?.ready.then(measure);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { last = 0; raf = requestAnimationFrame(draw); }
    });
    if (sec.current) io.observe(sec.current);
    raf = requestAnimationFrame(draw);
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="features" ref={sec} className="relative h-[320vh] scroll-mt-16 border-t border-[var(--border)]">
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden [perspective:1200px]">
        <div ref={stage} className="absolute inset-0 [transform-style:preserve-3d]">
          <div className="pointer-events-none absolute inset-0 grid place-items-center [transform-style:preserve-3d]">
            <div ref={mark} className="will-change-transform [transform-style:preserve-3d]"><Logo /></div>
          </div>
          {PANELS.map(([label, Body], i) => (
            <div key={label} ref={(el) => { cards.current[i] = el; }} className="absolute left-1/2 top-1/2 will-change-transform">
              <Card label={label}><Body /></Card>
            </div>
          ))}
        </div>
        <h2 ref={t1} className="pointer-events-none absolute inset-x-0 top-8 text-center text-3xl font-semibold tracking-tight will-change-transform md:text-5xl">Every check, in the open.</h2>
        <h2 ref={t2} style={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 top-8 text-center text-3xl font-semibold tracking-tight will-change-transform md:text-5xl">Go ahead, try them.</h2>
      </div>
    </section>
  );
}

// Small screens and reduced motion get the same panels as a plain grid.
function FlatGrid() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-[var(--border)] px-6 py-20 md:px-[8vw]">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Every check, in the open.</h2>
        <p className={`mt-3 text-lg ${muted}`}>Go ahead, try them.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PANELS.map(([label, Body]) => (
            <div key={label} className="h-[170px]"><Card label={label}><Body /></Card></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const [scene, setScene] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setScene(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return scene ? <Scene /> : <FlatGrid />;
}

const STEPS = [
  {
    step: "01",
    title: "Approved Business Profile",
    subtitle: "Your canonical ground truth",
    desc: "Define your verified business name, postal address, E.164 phone number, standard opening hours, and holiday schedules. Every cross-directory comparison anchors strictly to this approved baseline.",
    icon: Database,
    badge: "Source of Truth",
    color: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  },
  {
    step: "02",
    title: "Continuous Crawl & Smart Normalization",
    subtitle: "Filters out formatting noise",
    desc: "Platform connectors fetch live listing snapshots across Google Maps, Apple Maps, Yelp, and regional directories. Built-in phone, text, and hours normalizers eliminate false alarms (like '(555) 010-2234' vs '+15550102234').",
    icon: RefreshCw,
    badge: "Noise Reduction",
    color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
  },
  {
    step: "03",
    title: "AI Conflict Investigation",
    subtitle: "Explains customer & SEO impact",
    desc: "Powered by Claude 3.5 & autonomous heuristic engines, ListoraAI evaluates discrepancies, explains why they hurt customer visits or map rankings, and formulates structured diff proposals. Ambiguous conflicts are never guessed.",
    icon: Bot,
    badge: "Guardrail Rule 2",
    color: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  },
  {
    step: "04",
    title: "Owner Sign-Off & Closed-Loop Verification",
    subtitle: "Zero unapproved writes",
    desc: "Nothing touches an external platform without your sign-off. Once approved, changes dispatch to write-enabled directories. The agent then re-reads the live page to verify the update took effect.",
    icon: ShieldCheck,
    badge: "Closed-Loop Verify",
    color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-[var(--border)] px-6 py-24 md:px-[8vw]">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            The Closed-Loop Orchestration
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
            How ListoraAI Works
          </h2>
          <p className="mt-3 max-w-[54ch] text-base text-[var(--muted-foreground)] md:text-lg">
            From discovering outdated directories to certified, verified listings in 4 guarded steps.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 shadow-sm hover:border-black/20 dark:hover:border-white/20 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-2xl font-bold tracking-tight text-neutral-400 dark:text-white/40 group-hover:text-[var(--foreground)] transition-colors">
                      {s.step}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.color}`}
                    >
                      {s.badge}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] text-[var(--foreground)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] tracking-tight">{s.title}</h3>
                      <p className="text-xs text-[var(--muted-foreground)]">{s.subtitle}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-[var(--border)] pt-4 text-xs font-medium text-[var(--muted-foreground)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Enforced by built-in security guardrails</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guardrail callout banner */}
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-black/[0.02] dark:bg-gradient-to-r dark:from-white/[0.03] dark:to-white/[0.01] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Lock className="h-4 w-4 text-[var(--primary)]" />
                The Zero-Bypass Guarantee
              </h4>
              <p className="text-sm text-[var(--muted-foreground)] max-w-[62ch]">
                The AI agent cannot execute directory writes directly. All modifications require human operator approval, permission verification, and post-update re-fetching.
              </p>
            </div>
            <Link
              to="/register"
              className={`shrink-0 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:brightness-110 ${focus}`}
            >
              <span>Start Free Audit</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <footer className="border-t border-[var(--border)] bg-slate-50 dark:bg-[#070707] text-[var(--muted-foreground)]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-[8vw]">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className={`inline-block text-xl font-bold tracking-tight text-[var(--foreground)] ${focus}`}>
              ListoraAI
            </Link>
            <p className="text-sm leading-relaxed max-w-[36ch]">
              Autonomous business listing consistency engine with human-in-the-loop verification, multi-user roles, and live platform sync.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All Platforms Monitored & Operational</span>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Product</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-[var(--foreground)] transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link to="/dashboard/profile" className="hover:text-[var(--foreground)] transition-colors">Business Profile</Link>
              </li>
              <li>
                <Link to="/dashboard/approvals" className="hover:text-[var(--foreground)] transition-colors">Approvals Queue</Link>
              </li>
              <li>
                <Link to="/dashboard/report" className="hover:text-[var(--foreground)] transition-colors">Before/After Report</Link>
              </li>
              <li>
                <Link to="/dashboard/score" className="hover:text-[var(--foreground)] transition-colors">Consistency Score</Link>
              </li>
            </ul>
          </div>

          {/* Core capabilities */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Platform</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#how-it-works" className="hover:text-[var(--foreground)] transition-colors">How it works</a>
              </li>
              <li>
                <a href="#features" className="hover:text-[var(--foreground)] transition-colors">Live checks demo</a>
              </li>
              <li>
                <Link to="/dashboard/users" className="hover:text-[var(--foreground)] transition-colors">Multi-User Roles (RBAC)</Link>
              </li>
              <li>
                <Link to="/dashboard/alerts" className="hover:text-[var(--foreground)] transition-colors">Alerts & Reminders</Link>
              </li>
              <li>
                <Link to="/dashboard/audit" className="hover:text-[var(--foreground)] transition-colors">Audit Trail Logs</Link>
              </li>
            </ul>
          </div>

          {/* Technology & Guardrails */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Technology</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1.5">
                <span>Claude 3.5 Sonnet & Haiku</span>
              </li>
              <li>
                <span>Autonomous Heuristic Engine</span>
              </li>
              <li>
                <span>E.164 Phone Normalization</span>
              </li>
              <li>
                <span>Holiday Hours Protection</span>
              </li>
              <li>
                <span>Closed-Loop Verification</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} ListoraAI Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-[var(--foreground)] transition-colors">Dashboard</Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-[var(--foreground)] transition-colors">Sign In</Link>
                <Link to="/register" className="hover:text-[var(--foreground)] transition-colors">Register</Link>
              </>
            )}
            <a href="#how-it-works" className="hover:text-[var(--foreground)] transition-colors">Documentation</a>
            <span className="font-mono text-[10px] text-[var(--muted-foreground)] opacity-50">v1.0.0-orchestrated</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { isAuthenticated, logout } = useAuth();
  const [applied, setApplied] = useState(false);
  const matched = applied ? 8 : 6;

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur px-6 md:px-[8vw]">
        <Link to="/" className={`text-lg font-semibold tracking-tight ${focus}`}>ListoraAI</Link>
        <nav className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
          <a href="#features" className={`hover:text-[var(--foreground)] ${focus}`}>Features</a>
          <a href="#how-it-works" className={`hover:text-[var(--foreground)] ${focus}`}>How it works</a>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 text-xs font-medium hover:brightness-110 ${focus}`}
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className={`text-xs hover:text-[var(--foreground)] transition-colors cursor-pointer ${focus}`}
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className={`hover:text-[var(--foreground)] ${focus}`}>Log in</Link>
              <Link
                to="/register"
                className={`hidden sm:inline-flex rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1.5 text-xs font-medium hover:brightness-110 ${focus}`}
              >
                Get started
              </Link>
            </>
          )}
          <ThemeTogglerDemo />
        </nav>
      </header>

      <section className="px-6 pt-16 md:pt-24 pb-24 flex flex-col items-center text-center">
        <a href="#how-it-works" className={`inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] ${focus}`}>
          <span className="rounded-full bg-black/5 dark:bg-white/10 px-2 text-xs text-[var(--foreground)]">New</span>
          Checks holiday hours & temporary closures
        </a>

        <h1
          aria-label="Your business hours, phone number, address and holiday hours should match everywhere."
          className="mt-8 w-full max-w-3xl text-[length:clamp(1.9rem,8.4vw,4.5rem)] font-semibold leading-[1.1] tracking-tight"
        >
          <RotatingPhrase />
          <span aria-hidden="true" className="block">should match everywhere.</span>
        </h1>
        <p className="mt-6 max-w-[52ch] text-lg text-[var(--muted-foreground)]">
          ListoraAI compares your business listings with the details you approved, explains each mismatch, and changes only what you sign off on.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className={`inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium px-5 py-2.5 hover:brightness-110 ${focus}`}
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/register" className={`rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium px-5 py-2.5 ${focus}`}>
              Check my listings
            </Link>
          )}
          <a href="#how-it-works" className={`rounded-lg border border-[var(--border)] font-medium px-5 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 ${focus}`}>See how it works</a>
        </div>

        <div className="mt-16 w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm text-left">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
            <p className="text-sm text-[var(--muted-foreground)]">Approved: Mon–Sat 7–5, 555 0142, closed Dec 25</p>
            <button
              onClick={() => setApplied((v) => !v)}
              className={`shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 ${focus}`}
            >
              {applied ? "Start over" : "Approve changes"}
            </button>
          </div>
          <ul>
            {rows.map((r) => {
              const status = applied ? r.outcome : "mismatch";
              return (
                <li key={r.platform} className="grid grid-cols-[1fr_auto] md:grid-cols-[9rem_5rem_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 border-b border-[var(--border)] last:border-b-0">
                  <span className="font-medium">{r.platform}</span>
                  <span className="text-sm text-[var(--muted-foreground)] md:order-none order-3">{r.field}</span>
                  <span className="tabular-nums md:order-none order-4 col-span-2 md:col-span-1">{applied ? r.after : r.before}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-300 motion-reduce:transition-none ${chip[status]}`}>
                    {status === "mismatch" ? "Mismatch" : status === "verified" ? "Verified" : "Blocked"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="px-5 py-3 border-t border-[var(--border)] text-sm text-[var(--muted-foreground)]" aria-live="polite">
            {matched} of 9 checked fields match. {applied && "Maps B doesn’t allow edits, so its phone number is left as it is."}
          </p>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}
