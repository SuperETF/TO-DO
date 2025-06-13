import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  trainerId: string;
  onClose: () => void;
}

export default function NoticeEditModal({ trainerId, onClose }: Props) {
  const [notice, setNotice] = useState({
    title: "",
    content: "",
    link_url: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("center_announcements")
        .select("*")
        .eq("trainer_id", trainerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setNotice({
          title: data.title || "",
          content: data.content || "",
          link_url: data.link_url || "",
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          is_active: data.is_active ?? true,
        });
      }
    };
    fetch();
  }, [trainerId]);

  const handleChange = (field: keyof typeof notice, value: string | boolean) => {
    setNotice((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
  
    const payload = {
      ...notice,
      trainer_id: trainerId,
      updated_at: new Date().toISOString(),
    };
  
    console.log("📤 Supabase에 보낼 payload:", payload);
  
    const { data: session } = await supabase.auth.getSession();
    console.log("🙋 현재 로그인한 사용자 ID:", session.session?.user.id);
    console.log("🆔 trainerId prop으로 전달된 값:", trainerId);
  
    const { error } = await supabase.from("center_announcements").upsert(payload);
  
    setLoading(false);
  
    if (error) {
      console.error("❌ 저장 실패:", error.message, error.details);
      alert("저장 실패: 콘솔 로그를 확인해주세요.");
      return;
    }
  
    alert("공지사항이 저장되었습니다.");
    onClose();
  };
  

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800 text-center">공지사항 등록</h2>

        <input
          placeholder="제목"
          value={notice.title}
          onChange={(e) => handleChange("title", e.target.value)}
          className="w-full border px-4 py-2 rounded-md text-sm"
        />
        <textarea
          placeholder="내용"
          rows={4}
          value={notice.content}
          onChange={(e) => handleChange("content", e.target.value)}
          className="w-full border px-4 py-2 rounded-md text-sm"
        />
        <input
          placeholder="링크 (선택)"
          value={notice.link_url}
          onChange={(e) => handleChange("link_url", e.target.value)}
          className="w-full border px-4 py-2 rounded-md text-sm"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={notice.start_date}
            onChange={(e) => handleChange("start_date", e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm"
          />
          <input
            type="date"
            value={notice.end_date}
            onChange={(e) => handleChange("end_date", e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notice.is_active}
            onChange={(e) => handleChange("is_active", e.target.checked)}
          />
          <span>공지사항 활성화</span>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-[#6B4EFF] text-white font-medium hover:bg-[#5A3FFF] disabled:bg-gray-300"
        >
          {loading ? "저장 중..." : "저장하기"}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-gray-700 hover:underline"
        >
          취소
        </button>
      </div>
    </div>
  );
}
