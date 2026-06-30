import Image from "next/image";
import type { TeamMedia } from "@/lib/queries/team";

const TYPE_LABEL: Record<TeamMedia["media_type"], string> = {
  flag: "Quốc kỳ",
  jersey: "Áo đấu",
  logo: "Huy hiệu",
  stadium: "Sân vận động",
};

export default function Gallery({ media }: { media: TeamMedia[] }) {
  if (media.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
        Thư viện ảnh
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {media.map((item) => (
          <figure
            key={item.id}
            className="group relative overflow-hidden rounded-xl bg-slate-800 ring-1 ring-white/5"
          >
            <div className="relative aspect-square">
              <Image
                src={item.image_url}
                alt={item.caption ?? TYPE_LABEL[item.media_type]}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <figcaption className="absolute bottom-0 left-0 right-0 bg-slate-900/80 px-2 py-1 text-[10px] uppercase tracking-wide text-white">
              {item.caption ?? TYPE_LABEL[item.media_type]}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
