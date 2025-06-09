// lib/realtime.ts

import { supabase } from "./supabaseClient";

export function subscribeToRealtime(onChange: () => void) {
  const channel = supabase.channel("member-achievement-updates");

  channel
    .on("postgres_changes", { event: "*", schema: "public", table: "mission_logs" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "member_recommendations" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "routine_logs" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => onChange());

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
