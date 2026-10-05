import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold tracking-widest">
          ORDO
        </Link>
        <nav className="flex gap-4 text-sm text-stone-600">
          <Link href="/" className="hover:text-stone-900">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
