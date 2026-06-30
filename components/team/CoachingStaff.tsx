import Image from "next/image";
import type { StaffMember } from "@/lib/queries/team";

export default function CoachingStaff({ staff }: { staff: StaffMember[] }) {
  if (staff.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
        Ban huấn luyện
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {staff.map((member) => (
          <div
            key={member.id}
            className="flex flex-col items-center gap-2 rounded-xl bg-slate-800 p-4 text-center ring-1 ring-white/5"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-900 ring-1 ring-white/10">
              {member.image_url ? (
                <Image
                  src={member.image_url}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  {initials(member.name)}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold leading-tight text-white">
              {member.name}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-emerald-400">
              {member.role}
            </p>
            {member.nationality && (
              <p className="text-[11px] text-slate-500">{member.nationality}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
