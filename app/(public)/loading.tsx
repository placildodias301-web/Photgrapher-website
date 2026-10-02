/** Lightweight loading skeleton shown instantly while server-rendered pages stream in.
 *  This Suspense boundary is what makes navigations feel immediate — the browser shows
 *  this component right away instead of waiting for the full server response. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[1600px] items-center justify-center px-6 pb-28 pt-36 lg:px-12">
      <div className="flex flex-col items-center gap-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
