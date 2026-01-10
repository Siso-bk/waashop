import Link from "next/link";

type Props = {
  signedIn: boolean;
};

export function SiteTopNav({ signedIn }: Props) {
  return (
    <header className="hidden md:block">
      <div className="web-panel rounded-3xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="text-lg font-semibold text-[color:var(--app-text)]">
            Waashop
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-[color:var(--app-text-muted)]">
            <Link href="/shop" className="hover:text-[color:var(--app-text)]">
              Shop
            </Link>
            <Link href="/play" className="hover:text-[color:var(--app-text)]">
              Play
            </Link>
            <Link href="/info" className="hover:text-[color:var(--app-text)]">
              Info
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {signedIn ? (
              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-full border border-[color:var(--surface-border)] px-4 py-2 text-sm font-semibold text-[color:var(--app-text)] transition hover:opacity-80"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-black bg-[#000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
