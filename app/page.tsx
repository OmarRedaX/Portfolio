import { hero } from "@/content";

// Scaffold placeholder — proves the app renders and content/ wires up correctly.
// The real Hero/About/Tech-Stack/Projects/Experience/Contact sections are built in
// Phase 5, per implementation-plan.md. Do not treat this as final UI.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="tag">Phase 3 scaffold</p>
      <h1 className="font-display text-display">{hero.name}</h1>
      <p className="text-body-lg text-foreground-muted">{hero.title}</p>
    </main>
  );
}
