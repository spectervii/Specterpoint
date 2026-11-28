import Link from "next/link";

export const metadata = { title: "Not found · Specterpoint", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[1320px] flex-col justify-center gap-6 px-4 sm:px-10">
      <p className="kicker !text-left !m-0">404</p>
      <h1 className="text-[clamp(40px,8vw,96px)] font-bold leading-none">Nothing here.</h1>
      <Link
        href="/"
        className="inline-flex min-h-11 w-fit items-center rounded-full border border-[var(--line-strong)] px-5 font-sans text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-page"
      >
        Back to Specterpoint
      </Link>
    </main>
  );
}
