import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

interface Note {
  note: string;
  created_at: string;
  trainer_name?: string;
}

export default function TrainerCommentSection({ memberId }: Props) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestNote = async () => {
      const { data, error } = await supabase
        .from("trainer_notes")
        .select("note, created_at")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1); // ✅ .single() 제거

      if (error) {
        console.error("❌ 트레이너 노트 불러오기 실패:", error.message);
      }

      if (data && data.length > 0) {
        setNote(data[0]);
      } else {
        setNote(null);
      }

      setLoading(false);
    };

    if (memberId) fetchLatestNote();
  }, [memberId]);

  if (loading) return null;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">트레이너 한마디</h2>
      {note ? (
        <div className="flex">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-500 mr-3">
            <i className="fas fa-comment-dots text-xl"></i>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg p-3 relative">
            <p className="text-gray-700">{note.note}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">트레이너가 아직 코멘트를 남기지 않았습니다.</p>
      )}
      {note && (
        <p className="text-right text-xs text-gray-500 mt-1">
          {new Date(note.created_at).toLocaleDateString("ko-KR")}
        </p>
      )}
    </section>
  );
}
