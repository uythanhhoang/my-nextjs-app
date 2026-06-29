"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tables } from "@/supabase_types";
import TeamCard from "./TeamCard";

type Team = Tables<"teams">;

export default function TeamsRealtime({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  useEffect(() => {
    const channel = supabase
      .channel("teams-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        (payload) => {
          console.log("Realtime update:", payload);

          // 🔥 refresh simple way
          supabase
            .from("teams")
            .select("*")
            .order("name")
            .then(({ data }) => {
              if (data) setTeams(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}