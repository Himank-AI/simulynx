export const dynamic = "force-static";

export default function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center px-6 text-center">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">404</p>
        <h1 className="mt-2 font-display text-4xl">This path is not in the simulation.</h1>
        <a href="/dashboard" className="btn-primary mt-6 inline-flex h-11 items-center rounded-full px-5 text-sm">
          Return to Simulynx
        </a>
      </div>
    </div>
  );
}
