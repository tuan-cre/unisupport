import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-blue-50 to-blue-100 p-8">
      <section className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/80 p-12 text-center shadow-xl backdrop-blur">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          UniSupport
        </p>
        <h1 className="m-0 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          University IT help desk starter
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          A React frontend, a NestJS backend, and shared workspace packages — a real starting point
          for the help desk platform.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button>Get started</Button>
          <Button variant="outline">Documentation</Button>
        </div>
      </section>
    </main>
  );
}
