"use client";

// components/NavBar.tsx
// Thanh điều hướng chung, hiển thị trên mọi trang (gắn trong app/layout.tsx)
// để người xem luôn thấy lối vào các trang chi tiết: Trang chủ / Vòng 32 đội / Vòng 16 đội / Bracket.

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "🏠 Trang chủ" },
  { href: "/live", label: "🔴 Trực tiếp" },
  { href: "/round-of-32", label: "⚽ Vòng 32 đội" },
  { href: "/round-of-16", label: "🔥 Vòng 16 đội" },
  { href: "/bracket", label: "🏆 Sơ đồ Bracket" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3 sm:gap-2">
        <span className="mr-2 hidden text-sm font-semibold text-slate-500 sm:inline">
          World Cup 2026
        </span>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
