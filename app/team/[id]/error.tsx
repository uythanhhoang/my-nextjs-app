"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";

// Next.js 16.2.9: error.tsx receives `unstable_retry`, not `reset`.
// See node_modules/next/dist/docs/.../file-conventions/error.md
export default function TeamError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-white">
      <p className="text-sm uppercase tracking-wide text-slate-500">
        Hồ sơ đội tuyển
      </p>
      <h1 className="text-2xl font-bold">Không thể tải đội tuyển này</h1>
      <p className="max-w-sm text-sm text-slate-400">
        Đã có lỗi xảy ra khi tải đội hình và thống kê. Vui lòng thử lại, hoặc
        quay về danh sách đội tuyển.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={() => unstable_retry()}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-900"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="rounded-full bg-slate-800 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/10"
        >
          Tất cả đội tuyển
        </Link>
      </div>
    </main>
  );
}
