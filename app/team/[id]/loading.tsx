function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-800 ${className}`} />;
}

export default function TeamLoading() {
  return (
    <main className="min-h-screen bg-slate-900">
      {/* Hero skeleton */}
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <Block className="h-6 w-20" />
        <div className="mt-5 flex items-center gap-5">
          <Block className="h-20 w-20 rounded-full sm:h-24 sm:w-24" />
          <Block className="h-10 w-64" />
        </div>
        <div className="mt-7 flex gap-3">
          <Block className="h-16 w-28" />
          <Block className="h-16 w-28" />
          <Block className="h-16 w-28" />
        </div>
      </div>

      {/* Generic section skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i} className="mx-auto max-w-5xl px-6 py-10">
          <Block className="mb-4 h-7 w-48" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Block key={j} className="h-32" />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
