import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

const ICON_OPTIONS = [
  { label: "출입문", value: "fa-key", bg: "bg-indigo-100", text: "text-indigo-600" },
  { label: "화장실", value: "fa-restroom", bg: "bg-pink-100", text: "text-pink-500" },
  { label: "와이파이", value: "fa-wifi", bg: "bg-cyan-100", text: "text-cyan-500" },
  { label: "전화", value: "fa-phone", bg: "bg-blue-100", text: "text-blue-500" },
  { label: "운동", value: "fa-dumbbell", bg: "bg-red-100", text: "text-red-500" },
  { label: "러닝", value: "fa-running", bg: "bg-teal-100", text: "text-teal-500" },
  { label: "체온", value: "fa-thermometer-half", bg: "bg-yellow-100", text: "text-yellow-500" },
  { label: "음식", value: "fa-utensils", bg: "bg-lime-100", text: "text-lime-500" },
  { label: "공지", value: "fa-bullhorn", bg: "bg-violet-100", text: "text-violet-500" },
  { label: "기타", value: "fa-info-circle", bg: "bg-gray-100", text: "text-gray-600" },
  { label: "음악", value: "fa-music", bg: "bg-fuchsia-100", text: "text-fuchsia-500" },
  { label: "수면", value: "fa-bed", bg: "bg-purple-100", text: "text-purple-500" },
  { label: "달력", value: "fa-calendar-alt", bg: "bg-emerald-100", text: "text-emerald-500" },
  { label: "위치", value: "fa-map-marker-alt", bg: "bg-zinc-100", text: "text-zinc-500" },
  { label: "비밀번호", value: "fa-lock", bg: "bg-orange-100", text: "text-orange-600" },
];

interface InfoCard {
  id?: string;
  title: string;
  icon: string;
  line1: string;
  line2: string;
  bg_color: string;
}

interface Props {
  trainerId: string;
  onClose: () => void;
}

export default function InfoEditModal({ trainerId, onClose }: Props) {
  const [cards, setCards] = useState<InfoCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("center_info_cards")
        .select("*")
        .eq("trainer_id", trainerId)
        .order("order", { ascending: true });
      if (data) setCards(data);
    };
    fetch();
  }, [trainerId]);

  const updateCard = (index: number, field: keyof InfoCard, value: string) => {
    const updated = [...cards];
    updated[index][field] = value;
    setCards(updated);
  };

  const addCard = () => {
    const defaultIcon = ICON_OPTIONS[0];
    setCards([
      ...cards,
      {
        title: "",
        icon: defaultIcon.value,
        line1: "",
        line2: "",
        bg_color: defaultIcon.bg,
      },
    ]);
  };

  const removeCard = async (index: number) => {
    const cardToDelete = cards[index];
    setCards(cards.filter((_, i) => i !== index));
    if (cardToDelete.id) {
      const { error } = await supabase
        .from("center_info_cards")
        .delete()
        .eq("id", cardToDelete.id);
      if (error) {
        console.error("❌ Supabase 삭제 실패:", error.message);
        alert("삭제 실패: 콘솔 확인");
      }
    }
  };

  const save = async () => {
    setLoading(true);
    const payload = cards.map((c, i) => ({
      trainer_id: trainerId,
      title: c.title || "",
      icon: c.icon || "fa-info-circle",
      line1: c.line1 || "",
      line2: c.line2 || null,
      bg_color: c.bg_color || "bg-gray-100",
      order: i,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("center_info_cards").upsert(payload);
    setLoading(false);

    if (error) {
      console.error("❌ 저장 실패:", error.message);
      alert("저장 실패");
    } else {
      alert("저장 완료!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4 max-h-[90vh] flex flex-col">
        <h2 className="text-center font-bold text-lg text-gray-800">센터 정보 수정</h2>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
            >
              <input
                placeholder="제목"
                value={card.title}
                onChange={(e) => updateCard(idx, "title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                placeholder="1줄 설명"
                value={card.line1}
                onChange={(e) => updateCard(idx, "line1", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                placeholder="2줄 설명 (선택)"
                value={card.line2}
                onChange={(e) => updateCard(idx, "line2", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">아이콘 선택</label>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon.value}
                      onClick={() => {
                        updateCard(idx, "icon", icon.value);
                        updateCard(idx, "bg_color", icon.bg);
                      }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full border transition ${
                        card.icon === icon.value ? "ring-2 ring-[#6B4EFF]" : ""
                      } ${icon.bg} hover:brightness-105`}
                    >
                      <i className={`fas ${icon.value} ${icon.text}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => removeCard(idx)}
                  className="text-sm text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <button
            onClick={addCard}
            className="w-full text-sm text-blue-600 hover:underline"
          >
            + 카드 추가
          </button>

          <button
            onClick={save}
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

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }
        `}</style>
      </div>
    </div>
  );
}
