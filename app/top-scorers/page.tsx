import { supabaseUntyped } from "@/lib/supabase-untyped";
import type { GoldenBootRow } from "@/types/golden-boot";
import GoldenBootTable from "@/components/GoldenBootTable";

export const revalidate = 0;

export default async function TopScorersPage() {
  const { data: rows, error } = await supabaseUntyped
    .from("golden_boot_top10")
    .select("*");

  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white">
      <h1 className="mb-2 text-3xl font-bold">👟 Top 10 Vua phá lưới — World Cup 2026</h1>
      <p className="mb-6 text-sm text-slate-400">
        Tính từ Vòng bảng đến hiện tại.
      </p>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-red-300">
          ❌ Lỗi tải dữ liệu từ Supabase: {error.message}
        </div>
      ) : (
        <GoldenBootTable initialRows={(rows ?? []) as GoldenBootRow[]} />
      )}
    </main>
  );
}
