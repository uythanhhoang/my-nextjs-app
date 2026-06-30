import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeamFullProfile } from "@/lib/queries/team";
import HeroBanner from "@/components/team/HeroBanner";
import QualificationJourney from "@/components/team/QualificationJourney";
import StartingXI from "@/components/team/StartingXI";
import Substitutes from "@/components/team/Substitutes";
import CoachingStaff from "@/components/team/CoachingStaff";
import TeamStatistics from "@/components/team/TeamStatistics";
import HonoursTimeline from "@/components/team/HonoursTimeline";
import Gallery from "@/components/team/Gallery";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getTeamFullProfile(id);
  if (!profile) return { title: "Không tìm thấy đội tuyển" };
  return {
    title: `${profile.overview.name} — World Cup 2026`,
    description:
      profile.overview.description ??
      `Đội hình, lịch sử và thống kê của ${profile.overview.name}.`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const profile = await getTeamFullProfile(id);

  if (!profile) notFound();

  const {
    overview,
    recentForm,
    players,
    coachingStaff,
    qualificationMatches,
    honours,
    media,
  } = profile;

  return (
    <main className="min-h-screen bg-slate-900">
      <HeroBanner team={overview} recentForm={recentForm} />
      <QualificationJourney matches={qualificationMatches} />
      <StartingXI players={players} />
      <Substitutes players={players} />
      <CoachingStaff staff={coachingStaff} />
      <TeamStatistics team={overview} />
      <HonoursTimeline honours={honours} />
      <Gallery media={media} />
    </main>
  );
}
