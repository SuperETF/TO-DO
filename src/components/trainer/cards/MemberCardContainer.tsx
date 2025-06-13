// 최종 리팩토링된 MemberCardContainer 전체 코드(트레이너 대시보드 카드)
import { useRef, useState, useMemo, type DragEvent, type SetStateAction, useEffect } from "react";
import AppointmentSection from "../sections/AppointmentSection";
import PainLogManagerSection from "../sections/PainLogManagerSection";
import { supabase } from "../../../lib/supabaseClient";
import WeeklyRoutineSummarySection from "../sections/WeeklyRoutineSummarySection";
import BodyCompositionChartSection from "../sections/BodyCompositionSection";
import TrainerNoteSection from "../sections/TrainerNoteSection";
import TrainerRecommendationInputSection from "../sections/TrainerRecommendationInputSection";
import AchievementSummarySection from "../sections/AchievementSummarySection";
import MemberRankingAdminSection from "../sections/MemberRankingAdminSection";
import WorkoutSection from "../sections/WorkoutSection";
import MissionSection from "../sections/MissionSection";


const Placeholder = () => (
  <div className="text-gray-400 py-3 text-center">준비 중인 기능입니다</div>
);

export const INITIAL_SECTIONS = [
  { key: "workout", title: "운동 로그", enabled: true, Component: TrainerRecommendationInputSection },
  { key: "routine", title: "주간 운동 체크", enabled: true, Component: WeeklyRoutineSummarySection },
  { key: "mission", title: "미션 목록", enabled: true, Component: MissionSection },
  { key: "achievement", title: "나의 성취", enabled: true, Component: AchievementSummarySection },
  { key: "ranking", title: "멤버 랭킹", enabled: true, Component: MemberRankingAdminSection },
  { key: "appointment", title: "예약 일정", enabled: true, Component: AppointmentSection },
  { key: "note", title: "트레이너 한마디", enabled: true, Component: TrainerNoteSection },
  { key: "pain", title: "통증 로그", enabled: true, Component: PainLogManagerSection },
  { key: "body", title: "체성분 추이", enabled: true, Component: BodyCompositionChartSection },
  { key: "history", title: "운동 기록", enabled: true, Component: WorkoutSection }, // ✅ 고정 섹션 반영

  // 준비 중 섹션들 (아직 감춰야 함)
  { key: "sleep", title: "수면 분석", enabled: true, Component: Placeholder },
  { key: "goal", title: "목표 설정", enabled: true, Component: Placeholder },
  { key: "feedback", title: "피드백", enabled: true, Component: Placeholder },
  { key: "recommend", title: "추천 운동 입력", enabled: true, Component: Placeholder },
];



interface Member {
  id: string;
  name: string;
  created_at?: string;
  program_type?: "membership" | "lesson";
  start_date?: string;
  membership_months?: number;
  lesson_total_count?: number;
  lesson_used_count?: number;
}

export default function MemberCardContainer({ member }: { member: Member }) {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    goal: "",
    age: "",
    height: "",
    weight: "",
    lesson_total_count: "",
    body_fat_percent: "",
    muscle_mass: ""
  });
  const [showDashboard, setShowDashboard] = useState(false); // ✅ 대시보드 보기 상태

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const fetchLatestBodyComposition = async () => {
      const { data } = await supabase
        .from("body_compositions")
        .select("weight, body_fat_percent, muscle_mass")
        .eq("member_id", member.id)
        .order("date", { ascending: false })
        .limit(1)
        .single();
  
      if (data) {
        setEditForm((prev) => ({
          ...prev,
          weight: data.weight?.toString() ?? "",
          body_fat_percent: data.body_fat_percent?.toString() ?? "",
          muscle_mass: data.muscle_mass?.toString() ?? "",
        }));
      }
    };
  
    fetchLatestBodyComposition();
  }, [member.id]);
  
  // ✅ 최신 goal, 나이, 키 등도 함께 불러오기 위한 useEffect 추가
  useEffect(() => {
    const fetchMemberMeta = async () => {
      
      const { data } = await supabase
        .from("members")
        .select("goal, age, height, weight, lesson_total_count")
        .eq("id", member.id)
        .single();
  
      if (data) {
        setEditForm((prev) => ({
          ...prev,
          goal: data.goal ?? "",
          age: data.age?.toString() ?? "",
          height: data.height?.toString() ?? "",
          weight: data.weight?.toString() ?? "",
          lesson_total_count: data.lesson_total_count?.toString() ?? "",
        }));
      }
    };
  
    fetchMemberMeta();
  }, [member.id]);

  // ✅ fetchSectionSettings: 저장된 섹션 설정 불러오기 (order 포함 정렬)
useEffect(() => {
  const fetchSectionSettings = async () => {
    const { data, error } = await supabase
      .from("member_section_settings")
      .select("settings")
      .eq("member_id", member.id)
      .single();

    if (error) {
      console.warn("❕ 설정 불러오기 실패. 기본값 사용:", error.message);
      return;
    }

    if (data && data.settings) {
      const savedSettings: { key: string; enabled: boolean; order: number }[] = data.settings;
      const updatedSections = savedSettings
        .map((saved) => {
          const original = INITIAL_SECTIONS.find((s) => s.key === saved.key);
          return original ? { ...original, enabled: saved.enabled, _order: saved.order } : null;
        })
        .filter(Boolean)
        .sort((a, b) => (a!._order ?? 0) - (b!._order ?? 0))
        .map((saved) => {
          const { _order, ...section } = saved as { _order: number; key: string; enabled: boolean; title: string; Component: any; hasOnSaved?: boolean };
          return section;
        }); // _order 제거 후 설정 적용

      setSections(updatedSections as typeof INITIAL_SECTIONS);
    }
  };

  fetchSectionSettings();
}, [member.id]);


  const registrationDate = useMemo(() => new Date(member.start_date ?? member.created_at ?? ""), [member]);
  
  const membershipEndDate = useMemo(() => {
    if (member.program_type === "membership" && member.membership_months) {
      const end = new Date(registrationDate);
      end.setMonth(end.getMonth() + member.membership_months);
      return end;
    }
    return null;
  }, [member, registrationDate]);
  
  const membershipRemainingDays = useMemo(() => {
    if (membershipEndDate) {
      return Math.max(0, Math.ceil((membershipEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return null;
  }, [membershipEndDate, today]);
  
  const diffDays = useMemo(() => Math.ceil((today.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)), [registrationDate, today]);
  
  const remainingLessons = useMemo(() => {
    if (member.program_type === "lesson" && typeof member.lesson_total_count === "number" && typeof member.lesson_used_count === "number") {
      return Math.max(0, member.lesson_total_count - member.lesson_used_count);
    }
    return null;
  }, [member]);
  
  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const items = [...sections];
    const [dragged] = items.splice(draggedIdx, 1);
    items.splice(idx, 0, dragged);
    setSections(items);
    setDraggedIdx(idx);
  };
  // ✅ handleDragEnd 수정
const handleDragEnd = () => {
  setDraggedIdx(null);
  showToast("메뉴 순서가 저장되었습니다");
  saveSectionSettings(sections);
};
  // ✅ toggleSectionStatus 수정
const toggleSectionStatus = (key: string) => {
  setSections((prev) => {
    const updated = prev.map((item) =>
      item.key === key ? { ...item, enabled: !item.enabled } : item
    );
    const toggledItem = updated.find((i) => i.key === key);
    if (toggledItem) {
      showToast(`${toggledItem.title}이(가) ${toggledItem.enabled ? "활성화" : "비활성화"}되었습니다`);
    }
    saveSectionSettings(updated);
    return updated;
  });
};
  const showToast = (msg: SetStateAction<string>) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2500);
  };
  
  const handleSaveMemberInfo = async () => {
    console.log("🟡 저장 시도 중: 업데이트 내용:", editForm);
    console.log("🟡 대상 멤버 ID:", member.id);
    const updates = {
      goal: editForm.goal,
      age: Number(editForm.age),
      height: Number(editForm.height),
      weight: Number(editForm.weight),
      ...(member.program_type === "lesson" && editForm.lesson_total_count && {
        lesson_total_count: Number(editForm.lesson_total_count),
      }),
    };
    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", member.id);
  
    if (error) {
      console.error("🔴 Supabase 업데이트 실패:", error);
    } else {
      console.log("🟢 Supabase 업데이트 성공:", data);
      if (error) {
        showToast("저장 실패: " + (error as any).message);
      } else {
        showToast("회원 정보가 저장되었습니다");
        setIsEditingInfo(false);
      }
    }
  };
  
  const handleSectionOpen = (key: string | null) => setActiveSection((prev) => (prev === key ? null : key));

  const saveSectionSettings = async (sections: typeof INITIAL_SECTIONS) => {
    const { error } = await supabase
      .from("member_section_settings")
      .upsert({
        member_id: member.id,
        settings: sections.map((s, index) => ({ key: s.key, enabled: s.enabled, order: index })),
        updated_at: new Date().toISOString(),
      });
  
    if (error) {
      console.error("❌ 설정 저장 실패:", error);
    } else {
      console.log("✅ 설정 저장 성공");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-t-xl flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <div className="flex items-center text-sm mt-1 space-x-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{member.program_type === "lesson" ? "레슨권" : "회원권"}</span>
                <span>시작일: {registrationDate.toLocaleDateString("ko-KR")}</span>
              </div>
            </div>
            <button onClick={() => setIsEditingInfo(!isEditingInfo)} className="bg-white/20 p-2 rounded-md border border-white hover:bg-white/30 transition">
              <i className="fas fa-pen text-white"></i>
            </button>
          </div>

          {isEditingInfo ? (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">목표</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="예: 체중 감량 및 근력 향상" value={editForm.goal} onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">키</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">체중</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} />
                </div>

        {member.program_type === "lesson" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">총 레슨 횟수</label>
                    <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={editForm.lesson_total_count} onChange={(e) => setEditForm({ ...editForm, lesson_total_count: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveMemberInfo} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                저장하기
              </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4">
                <div className="col-span-2 bg-yellow-50 rounded-lg text-center py-3">
    <div className="text-sm text-yellow-600">목표</div>
    <div className="text-base font-semibold text-yellow-800">
      {editForm.goal || "설정된 목표가 없습니다"}
    </div>
  </div>
              <div className="bg-gray-100 rounded-lg text-center py-3">
                <div className="text-sm text-gray-500">체지방률</div>
                <div className="text-lg font-bold text-gray-800">{editForm.body_fat_percent ? `${editForm.body_fat_percent}%` : "-"}</div>
              </div>
              <div className="bg-gray-100 rounded-lg text-center py-3">
                <div className="text-sm text-gray-500">골격근량</div>
                <div className="text-lg font-bold text-gray-800">{editForm.muscle_mass ? `${editForm.muscle_mass}kg` : "-"}</div>
              </div>
              {member.program_type === "membership" ? (
                <>
                  <div className="bg-purple-50 rounded-lg text-center py-3">
                    <div className="text-sm text-purple-600">남은 일수</div>
                    <div className="text-2xl font-bold text-purple-700">{membershipRemainingDays ?? "-"}일</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg text-center py-3">
                    <div className="text-sm text-indigo-600">등록 기간</div>
                    <div className="text-2xl font-bold text-indigo-700">{diffDays}일</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-purple-50 rounded-lg text-center py-3">
                    <div className="text-sm text-purple-600">남은 레슨</div>
                    <div className="text-2xl font-bold text-purple-700">{remainingLessons ?? "-"}회</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg text-center py-3">
                    <div className="text-sm text-indigo-600">총 레슨</div>
                    <div className="text-2xl font-bold text-indigo-700">{member.lesson_total_count ?? "-"}회</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 메뉴 관리 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">메뉴 관리</h3>
          <button className="text-sm px-3 py-1 bg-purple-600 text-white rounded-md">
            + 메뉴 추가
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          드래그하여 순서를 변경하거나 토글을 사용하여 메뉴를 활성화/비활성화할 수 있습니다.
        </p>

        {sections.map((item, idx) => {
          const Comp = item.Component;
          const isOpen = activeSection === item.key;
          return (
            <div
              key={item.key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl shadow-sm mb-3 border-l-4 transition-all duration-300 ${
                item.enabled ? "border-purple-500" : "border-gray-200 opacity-50"
              }`}
            >
              <div className="p-4 flex items-center justify-between">
              <div
  className="flex items-center gap-3 cursor-pointer"
  onClick={() => handleSectionOpen(item.key)}
>
  <div className="text-gray-400">
    <i className="fas fa-grip-lines"></i>
  </div>
  <span className="font-medium text-gray-800">{item.title}</span>
</div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleSectionOpen(item.key)} className="text-gray-500">
                    <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`}></i>
                  </button>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.enabled}
                      onChange={() => toggleSectionStatus(item.key)}
                    />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-600 relative">
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.enabled ? "translate-x-4" : ""}`}></div>
                    </div>
                  </label>
                </div>
              </div>
              {isOpen && item.enabled && (
                <div className="px-4 pb-4 transition-all duration-300 ease-in-out">
                  <Comp memberId={member.id} />
                </div>
              )}
            </div>
          );
        })}

{showDashboard && (
  <div className="mt-6 bg-white rounded-xl shadow-sm p-4 space-y-4">
    {/* 닫기 버튼 상단으로 이동 */}
    <div className="flex justify-end">
      <button
        onClick={() => setShowDashboard(false)}
        className="text-xs text-gray-500 hover:text-gray-700 transition"
      >
        <i className="fas fa-times mr-1" /> 대시보드 닫기
      </button>
    </div>


    {/* 대시보드 iframe */}
    <div className="rounded-xl overflow-hidden border shadow">
      <iframe
        src={`/member-dashboard/${member.id}`}
        title="회원 대시보드"
        className="w-full h-[600px] border-0"
      ></iframe>
    </div>
  </div>
)}


<div className="text-center text-sm text-gray-500 mt-4 cursor-pointer" onClick={() => setShowDashboard((v) => !v)}>
  {showDashboard ? "대시보드 닫기" : "회원 대시보드 미리보기"}
</div>

      </div>

      {/* 토스트 메시지 */}
      <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0 pointer-events-none"}`} style={{ zIndex: 9999 }}>
        <div className="flex items-center">
          <i className="fas fa-check-circle mr-2 text-green-400"></i>
          <span className="text-sm">{toast}</span>
        </div>
      </div>
    </div>
  );
}