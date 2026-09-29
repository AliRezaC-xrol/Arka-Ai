import { useEffect, useState } from "react";

/* ---------------------------------- nav ---------------------------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-white text-[15px] font-black text-ink">
            A
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Arka</span>
        </a>
        <nav className="hidden items-center gap-5 text-sm text-mist md:flex">
          <a className="transition hover:text-white" href="#features">Features</a>
          <a className="transition hover:text-white" href="#desktop">Desktop</a>
          <a className="transition hover:text-white" href="#cli">CLI</a>
          <a className="transition hover:text-white" href="#open">Open source</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <a
            className="hidden text-sm text-mist transition hover:text-white sm:block"
            href="https://github.com/AliRezaC-xrol/Arka-Ai"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="#download"
            className="rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition hover:bg-zinc-200"
          >
            Download
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ hero visual ------------------------------ */

function ChatMock() {
  return (
    <div className="fade-up overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-2xl shadow-black/60">
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="size-2.5 rounded-full bg-zinc-700" />
        <span className="ml-3 text-xs text-mist">Arka — new task</span>
      </div>
      <div className="space-y-4 p-5 text-[13px] leading-relaxed sm:p-6">
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-2.5 font-medium text-ink">
            Add dark mode to the settings page and wire the toggle to state
          </p>
        </div>
        <div className="flex items-start gap-2.5 text-mist">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-white/10 text-[10px] font-bold text-white">
            A
          </span>
          <div className="min-w-0">
            <p className="text-zinc-300">
              Reading <code className="rounded bg-white/10 px-1">settings/page.tsx</code> and the
              theme tokens… <span className="caret" />
            </p>
            <p className="mt-2 text-mist">
              Found 3 hardcoded colors. Planning 2 file edits.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-black/40 p-4 font-mono text-xs">
          <div className="mb-2 flex items-center justify-between text-mist">
            <span>src/settings/page.tsx</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5">+6 −2</span>
          </div>
          <p>
            <span className="text-zinc-500">+ </span>
            <span className="text-emerald-400">const theme = useTheme();</span>
          </p>
          <p>
            <span className="text-zinc-500">+ </span>
            <span className="text-emerald-400">document.documentElement.dataset.theme = theme;</span>
          </p>
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-4">
          <span className="size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <span className="text-xs text-mist">Applying edits…</span>
        </div>
      </div>
    </div>
  );
}

function TaskMock() {
  return (
    <div className="fade-up rounded-2xl border border-line bg-ink-2 p-5 shadow-xl shadow-black/50">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-mist">
        Agent plan
      </p>
      <ul className="space-y-2.5 text-[13px]">
        <li className="flex items-center gap-2.5 text-zinc-300">
          <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400">✓</span>
          Explore project structure
        </li>
        <li className="flex items-center gap-2.5 text-zinc-300">
          <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400">✓</span>
          Locate theme tokens
        </li>
        <li className="flex items-center gap-2.5 text-white">
          <span className="size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          Edit settings page
        </li>
        <li className="flex items-center gap-2.5 text-zinc-500">
          <span className="size-4 rounded-full border border-zinc-700" />
          Run typecheck &amp; lint
        </li>
      </ul>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
        <div className="fade-up mx-auto max-w-3xl text-center">
          <a
            href="#open"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2 px-3.5 py-1.5 text-xs text-mist transition hover:text-white"
          >
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Arka 3.14 — multi-agent coding is here
          </a>
          <h1 className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-6xl">
            Simple, Fast, <span className="text-zinc-400">Vibe-Ready.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-mist sm:text-lg">
            Arka is a coding agent that plans, writes and reviews code with you —
            on your desktop, in the browser and in the terminal. Your models,
            your keys, your flow.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#download"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-zinc-200"
            >
              Download for Windows
            </a>
            <a
              href="#features"
              className="rounded-xl border border-line bg-ink-2 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600"
            >
              See what it can do
            </a>
          </div>
          <p className="mt-4 text-xs text-zinc-500">Free · Works with your own API keys</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-[1fr_260px]">
          <ChatMock />
          <TaskMock />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- features -------------------------------- */

const FEATURES = [
  {
    title: "Agents that do the work",
    body: "Give Arka a goal and it explores the codebase, plans the change, edits files and verifies the result — you stay in control of every step.",
  },
  {
    title: "Your models, your keys",
    body: "Bring your own API keys for OpenAI, Anthropic, Google or any OpenAI-compatible endpoint. Switch models mid-conversation.",
  },
  {
    title: "Desktop, Web & CLI",
    body: "One codebase, three surfaces. Start a task on the desktop app, follow it in the browser, script it from the terminal.",
  },
];

const CAPABILITIES = [
  ["Plan mode", "Review the agent's plan before a single file changes."],
  ["Live preview", "HTML/SVG output renders right inside the chat."],
  ["MCP support", "Connect tools and data sources via Model Context Protocol."],
  ["Session sync", "Pick up a conversation on any device, mid-stream."],
  ["Code review", "Structured review reports with merge-blocker detection."],
  ["Skills & commands", "Teach Arka reusable workflows for your team."],
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Built for real work
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-line bg-ink-2 p-6 transition hover:border-zinc-600"
          >
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{f.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map(([t, b]) => (
          <div key={t} className="rounded-2xl border border-line p-5">
            <p className="text-sm font-semibold">{t}</p>
            <p className="mt-1 text-sm text-mist">{b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- download -------------------------------- */

function Download() {
  return (
    <section id="download" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="rounded-3xl border border-line bg-gradient-to-b from-ink-2 to-ink p-8 text-center sm:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Get Arka on Windows
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-mist">
          The desktop app is the fastest way to start. The web client and CLI
          ship from the same codebase.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/AliRezaC-xrol/Arka-Ai"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-zinc-200"
          >
            Download for Windows
          </a>
          <a
            href="#cli"
            className="rounded-xl border border-line px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600"
          >
            Use the CLI
          </a>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- open ---------------------------------- */

function OpenSource() {
  return (
    <section id="open" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="grid gap-4 md:grid-cols-2" id="cli">
        <div className="rounded-2xl border border-line bg-ink-2 p-8">
          <h3 className="text-xl font-semibold">Open core</h3>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Arka is built on an open, inspectable architecture. Read the code,
            audit the agent loop and extend it with plugins and skills.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-ink-2 p-8">
          <h3 className="text-xl font-semibold">The CLI</h3>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            The same agent, in your terminal. Script tasks, wire Arka into CI,
            or live entirely in the shell — the choice is yours.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-black/50 p-4 font-mono text-xs text-zinc-300">
            <code>{"$ npm i -g @arka/cli\n$ arka \"refactor the auth module\""}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- footer -------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-md bg-white text-[11px] font-black text-ink">A</span>
          <span>Arka</span>
        </div>
        <nav className="flex gap-5">
          <a className="transition hover:text-white" href="#features">Features</a>
          <a className="transition hover:text-white" href="#download">Download</a>
          <a className="transition hover:text-white" href="https://github.com/AliRezaC-xrol/Arka-Ai" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <p>© 2026 Arka. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ---------------------------------- app ---------------------------------- */

export default function App() {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="min-h-dvh">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Download />
        <OpenSource />
      </main>
      <Footer />
      {showTop && (
        <button
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 grid size-10 place-items-center rounded-full border border-line bg-ink-2 text-lg transition hover:border-zinc-600"
        >
          ↑
        </button>
      )}
    </div>
  );
}
