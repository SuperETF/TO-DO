import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Member {
  id: string;
  name: string;
  score: number;
  level: number;
}

export default function MemberRankingAdminSection() {
  const [rankings, setRankings] = useState<Member[]>([]);

  useEffect(() => {
    const fetchRankings = async () => {
      const { data, error } = await supabase
        .from("member_achievement_view")
        .select("member_id, name, score, level")
        .order("score", { ascending: false });

      if (error || !data) {
        console.error("❌ 랭킹 조회 실패:", error);
        return;
      }

      setRankings(
        data.map((m: any) => ({
          id: m.member_id,
          name: m.name,
          score: m.score ?? 0,
          level: Math.floor(m.level ?? 0),
        }))
      );
    };

    fetchRankings();
  }, []);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">전체 회원 랭킹</h2>
      <div className="space-y-3">
        {rankings.map((member, index) => (
          <div
            key={member.id}
            className="flex items-center bg-gray-50 p-3 rounded-lg"
          >
            <span className="w-6 text-center text-gray-600 font-medium">{index + 1}</span>
            <div className="flex-1 ml-3">
              <p className="text-sm font-medium">{member.name}</p>
              <p className="text-xs text-gray-500">
                Lv.{member.level} · {member.score.toLocaleString()}점
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
