"use client";

/* If any part of the page fails to render, show a calm way back instead of a blank screen. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[1320px] flex-col justify-center gap-6 px-4 sm:px-10">
      <p className="kicker !text-left !m-0">Something went wrong</p>
      <h1 className="text-[clamp(40px,8vw,96px)] font-bold leading-none">Try that again.</h1>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex min-h-11 w-fit items-center rounded-full border border-[var(--line-strong)] px-5 font-sans text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-page"
      >
        Reload
      </button>
    </main>
  );
}
