import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Member {
  id: string;
  name: string;
  level: number;
  score: number;
}

interface Props {
  memberId: string;
}

export default function MemberRankingSection({ memberId }: Props) {
  const [rankings, setRankings] = useState<Member[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, level, score")
        .order("score", { ascending: false })
        .order("level", { ascending: false });

      if (data && !error) {
        setRankings(data);
        const index = data.findIndex((m) => m.id === memberId);
        if (index >= 0) setMyRank(index + 1);
      }
    };

    fetchRankings();
  }, [memberId]);

  const maskName = (name: string) => {
    if (!name) return "";
    if (name.length === 1) return name;
    if (name.length === 2) return name[0] + "*";
    return name[0] + "*" + name[name.length - 1];
  };

  const top3 = rankings.slice(0, 3);
  const others = rankings.slice(3, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">멤버 랭킹</h2>
        {myRank && (
          <span className="text-sm text-teal-500">나의 순위: {myRank}위</span>
        )}
      </div>

      {/* Top 3 */}
      <div className="flex justify-between items-end mb-6 px-4">
        {[1, 0, 2].map((index, displayOrder) => {
          const member = top3[index];
          if (!member) return <div key={displayOrder} className="w-1/3" />;

          return (
            <div
              key={member.id}
              className={`flex flex-col items-center w-1/3 ${
                index === 0 ? "-mt-4" : ""
              }`}
            >
              <div
                className={`${
                  index === 0 ? "w-10 h-10 bg-yellow-100" : "w-8 h-8 bg-gray-100"
                } rounded-full flex items-center justify-center mb-1`}
              >
                {index === 0 ? (
                  <i className="fas fa-crown text-yellow-500" />
                ) : (
                  <span className="text-gray-600 font-medium">{index + 1}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{maskName(member.name)}</p>
                <p className="text-xs text-gray-500">Lv.{member.level}</p>
                <p className="text-xs text-teal-500">
                  {member.score.toLocaleString()}점
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Others */}
      <div className="space-y-3">
        {others.map((member, idx) => (
          <div
            key={member.id}
            className="flex items-center bg-gray-50 p-3 rounded-lg"
          >
            <span className="w-6 text-center text-gray-600 font-medium">
              {idx + 4}
            </span>
            <div className="flex-1 ml-3">
              <p className="text-sm font-medium">{maskName(member.name)}</p>
              <p className="text-xs text-gray-500">
                Lv.{member.level} · {member.score.toLocaleString()}점
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
          </div>
        ))}
        <button className="w-full text-teal-500 text-sm font-medium py-2">
          전체 랭킹 보기 <i className="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  );
}
