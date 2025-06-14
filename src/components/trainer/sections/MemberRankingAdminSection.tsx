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
  const [loading, setLoading] = useState(true);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <i className="fas fa-trophy text-yellow-500 text-lg" />;
      case 2:
        return <i className="fas fa-medal text-gray-400 text-lg" />;
      case 3:
        return <i className="fas fa-medal text-amber-700 text-lg" />;
      default:
        return (
          <span className="text-gray-500 font-semibold text-base">{rank}</span>
        );
    }
  };

  const getRowBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-50";
      case 2:
        return "bg-gray-50";
      case 3:
        return "bg-amber-50";
      default:
        return "bg-white";
    }
  };

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("member_achievement_view")
        .select("member_id, name, score, level")
        .order("score", { ascending: false });

      if (error || !data) {
        setRankings([]);
        setLoading(false);
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
      setLoading(false);
    };
    fetchRankings();
  }, []);

  return (
    <section className="bg-white rounded-2xl overflow-hidden mb-6">
      <div className="p-4">
        <h2 className="text-lg font-bold">전체 회원 랭킹</h2>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("ko-KR")} 기준
        </p>
      </div>
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-base">
          랭킹을 불러오는 중...
        </div>
      ) : rankings.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <i className="fas fa-trophy text-gray-300 text-4xl mb-4"></i>
          <p className="text-gray-500 text-center">
            아직 랭킹 데이터가 없습니다.
          </p>
          <p className="text-gray-400 text-sm text-center mt-1">
            활동을 통해 랭킹에 참여해보세요!
          </p>
        </div>
      ) : (
        <div
          className="divide-y divide-gray-100 max-h-96 overflow-y-auto"
          style={{ maxHeight: 384 }}
        >
          {rankings.slice(0, 10).map((member, idx) => (
            <div
              key={member.id}
              className={`flex items-center py-3 px-4 ${getRowBgColor(idx + 1)}`}
            >
              {/* 랭킹/아이콘 */}
              <div className="w-10 flex justify-center">{getRankIcon(idx + 1)}</div>
              {/* 이름/레벨/점수 */}
              <div className="flex-1 ml-3">
                <div className="font-bold text-base">{member.name}</div>
                <div className="text-xs text-gray-500">
                  레벨 {member.level} · {member.score.toLocaleString()} 점
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
