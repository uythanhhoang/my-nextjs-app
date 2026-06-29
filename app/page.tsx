import Link from "next/link";
import { supabase } from "@/lib/supabase";
import TeamsRealtime from "@/components/TeamsRealtime";

export default async function Home() {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  if (error) {
    return <div>❌ Lỗi: {error.message}</div>;
  }

  return (
    <main className="min-h-screen bg-slate-900 p-8 text-white">
      <h1 className="mb-2 text-4xl font-bold">⚽ World Cup 2026</h1>
      <p className="mb-8 text-slate-400">
        Theo dõi 32 đội tuyển, lịch thi đấu vòng loại trực tiếp và sơ đồ bracket
        đầy đủ — cập nhật trực tiếp từ Supabase.
      </p>

      {/* Liên kết nhanh tới các trang chi tiết */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/round-of-32"
          className="group rounded-xl border border-slate-700 bg-slate-800/50 p-5 transition-colors hover:border-emerald-500 hover:bg-slate-800"
        >
          <div className="mb-1 text-sm font-medium text-emerald-400">
            Vòng 32 đội
          </div>
          <div className="mb-2 text-lg font-semibold text-white">
            Xem danh sách 16 trận đấu{" "}
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Cặp đấu, ngày giờ, sân vận động và trạng thái từng trận — tự cập
            nhật realtime khi có tỷ số mới.
          </p>
        </Link>

        <Link
          href="/bracket"
          className="group rounded-xl border border-slate-700 bg-slate-800/50 p-5 transition-colors hover:border-emerald-500 hover:bg-slate-800"
        >
          <div className="mb-1 text-sm font-medium text-emerald-400">
            Sơ đồ Bracket
          </div>
          <div className="mb-2 text-lg font-semibold text-white">
            Xem toàn bộ nhánh đấu loại trực tiếp{" "}
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Từ Vòng 32 đội đến Chung kết — theo dõi đường đi của từng đội
            tuyển qua các vòng.
          </p>
        </Link>
      </div>

      <h2 className="mb-4 text-xl font-semibold">32 đội tham dự</h2>
      {/* 🔥 Realtime component */}
      <TeamsRealtime initialTeams={teams || []} />
    </main>
  );
}
