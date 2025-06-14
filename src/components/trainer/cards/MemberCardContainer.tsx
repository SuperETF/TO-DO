import { useRef, useState, useMemo, useEffect } from "react";
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
import WeeklyExerciseStatusSection from "../sections/WeeklyExerciseStatusSection";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Placeholder = () => (
  <div className="text-gray-400 py-3 text-center">준비 중인 기능입니다</div>
);

export const INITIAL_SECTIONS = [
  { key: "workout", title: "운동 로그", enabled: true, Component: WeeklyExerciseStatusSection },
  { key: "routine", title: "주간 운동 체크", enabled: true, Component: WeeklyRoutineSummarySection },
  { key: "mission", title: "미션 목록", enabled: true, Component: MissionSection },
  { key: "achievement", title: "나의 성취", enabled: true, Component: AchievementSummarySection },
  { key: "ranking", title: "멤버 랭킹", enabled: true, Component: MemberRankingAdminSection },
  { key: "appointment", title: "예약 일정", enabled: true, Component: AppointmentSection },
  { key: "note", title: "트레이너 한마디", enabled: true, Component: TrainerNoteSection },
  { key: "pain", title: "통증 로그", enabled: true, Component: PainLogManagerSection },
  { key: "body", title: "체성분 추이", enabled: true, Component: BodyCompositionChartSection },
  { key: "history", title: "운동 기록", enabled: true, Component: WorkoutSection },
  { key: "recommend", title: "추천 운동 입력", enabled: true, Component: TrainerRecommendationInputSection },
  // 준비 중인 메뉴들
  { key: "sleep", title: "수면 분석", enabled: true, Component: Placeholder },
  { key: "goal", title: "목표 설정", enabled: true, Component: Placeholder },
  { key: "feedback", title: "피드백", enabled: true, Component: Placeholder },
];

interface Member {
  id: string;
  name: string;
  created_at?: string;
  program_type?: "membership" | "lesson";
  start_date?: string;
  membership_months?: number;
  membership_days?: number;
  lesson_total_count?: number;
  lesson_used_count?: number;
}

interface SectionType {
  key: string;
  title: string;
  enabled: boolean;
  Component: React.ComponentType<any>;
}

export default function MemberCardContainer({ member, trainerId }: { member: Member; trainerId: string }) {
  const [sections, setSections] = useState<SectionType[]>(INITIAL_SECTIONS);
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
    membership_months: "",
    membership_days: "",
    start_date: "",
    program_type: [] as ("membership" | "lesson")[],
  });
  const [showDashboard, setShowDashboard] = useState(false);

  const today = useMemo(() => new Date(), []);
  const [usedLessonCount, setUsedLessonCount] = useState(0);

  useEffect(() => {
    if (!member.id) return;
    const fetchUsedCount = async () => {
      const { count } = await supabase
        .from("routine_logs")
        .select("*", { count: "exact", head: true })
        .eq("member_id", member.id)
        .eq("lesson_count", 1);
      setUsedLessonCount(count ?? 0);
    };
    fetchUsedCount();
  }, [member.id]);

  useEffect(() => {
    const fetchMemberMeta = async () => {
      const { data } = await supabase
        .from("members")
        .select("goal, start_date, lesson_total_count, membership_months, membership_days, program_type")
        .eq("id", member.id)
        .single();

      if (data) {
        setEditForm((prev) => ({
          ...prev,
          goal: data.goal ?? "",
          start_date: data.start_date
            ? new Date(data.start_date).toISOString().slice(0, 10)
            : "",
          lesson_total_count: data.lesson_total_count?.toString() ?? "",
          membership_months: data.membership_months?.toString() ?? "",
          membership_days: data.membership_days?.toString() ?? "",
          program_type: Array.isArray(data.program_type)
            ? data.program_type
            : [],
        }));
      }
    };
    fetchMemberMeta();
  }, [member.id]);

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
            const { _order, ...section } = saved as { _order: number; key: string; enabled: boolean; title: string; Component: any };
            return section;
          });

        setSections(updatedSections as SectionType[]);
      }
    };

    fetchSectionSettings();
  }, [member.id]);

  const registrationDate = useMemo(
    () =>
      new Date(
        editForm.start_date || member.start_date || member.created_at || ""
      ),
    [editForm.start_date, member.start_date, member.created_at]
  );
  const membershipEndDate = useMemo(() => {
    if (
      editForm.start_date &&
      (editForm.membership_months || editForm.membership_days)
    ) {
      const end = new Date(editForm.start_date);
      if (editForm.membership_months)
        end.setMonth(
          end.getMonth() + Number(editForm.membership_months)
        );
      if (editForm.membership_days)
        end.setDate(end.getDate() + Number(editForm.membership_days));
      return end;
    }
    return null;
  }, [editForm.start_date, editForm.membership_months, editForm.membership_days]);

  const membershipRemainingDays = useMemo(() => {
    if (membershipEndDate) {
      const diff =
        Math.ceil(
          (membershipEndDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );
      return diff >= 0 ? diff : 0;
    }
    return null;
  }, [membershipEndDate, today]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2500);
  };

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

  const handleSaveMemberInfo = async (): Promise<void> => {
    const updates = {
      goal: editForm.goal,
      start_date: editForm.start_date || null,
      program_type: Array.isArray(editForm.program_type) ? editForm.program_type : [],
      lesson_total_count: editForm.lesson_total_count ? Number(editForm.lesson_total_count) : null,
      membership_months: editForm.membership_months ? Number(editForm.membership_months) : null,
      membership_days: editForm.membership_days ? Number(editForm.membership_days) : null,
    };
    const { error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", member.id);

    if (error) {
      showToast("저장 실패: " + (error as any).message);
    } else {
      showToast("회원 정보가 저장되었습니다");
      setIsEditingInfo(false);
    }
  };

  const saveSectionSettings = async (sections: SectionType[]) => {
    const { error } = await supabase
      .from("member_section_settings")
      .upsert({
        member_id: member.id,
        settings: sections.map((s, index) => ({ key: s.key, enabled: s.enabled, order: index })),
        updated_at: new Date().toISOString(),
      });
    if (error) {
      console.error("❌ 설정 저장 실패:", error);
    }
  };

  // DnD Kit sensor
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex(s => s.key === active.id);
    const newIndex = sections.findIndex(s => s.key === over.id);
    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);
    showToast("메뉴 순서가 저장되었습니다");
    saveSectionSettings(newSections);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4">
      <div className="max-w-3xl mx-auto">

        {/* --- [A] 상단 회원 정보 카드 --- */}
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-t-xl flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <div className="flex items-center text-sm mt-1 space-x-2">
                {/* 회원권/레슨권 토글만! (입력폼 없음) */}
                {isEditingInfo ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`
                        px-3 py-1 rounded-full text-xs font-semibold transition border
                        ${editForm.program_type?.includes("membership")
                          ? "bg-cyan-600 text-white border-cyan-700"
                          : "bg-cyan-100 text-cyan-700 border-cyan-200"
                        }
                      `}
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          program_type: prev.program_type?.includes("membership")
                            ? prev.program_type.filter((t: string) => t !== "membership")
                            : [...(prev.program_type || []), "membership"]
                        }))
                      }
                    >
                      회원권
                    </button>
                    <button
                      type="button"
                      className={`
                        px-3 py-1 rounded-full text-xs font-semibold transition border
                        ${editForm.program_type?.includes("lesson")
                          ? "bg-indigo-600 text-white border-indigo-700"
                          : "bg-indigo-100 text-indigo-700 border-indigo-200"
                        }
                      `}
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          program_type: prev.program_type?.includes("lesson")
                            ? prev.program_type.filter((t: string) => t !== "lesson")
                            : [...(prev.program_type || []), "lesson"]
                        }))
                      }
                    >
                      레슨권
                    </button>
                  </div>
                ) : (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {(editForm.program_type?.length === 2)
                      ? "회원권+레슨권"
                      : editForm.program_type?.[0] === "lesson"
                        ? "레슨권"
                        : editForm.program_type?.[0] === "membership"
                          ? "회원권"
                          : "-"}
                  </span>
                )}
                <span className="text-base font-normal text-white">
                  시작일:{" "}
                  {isEditingInfo ? (
                    <input
                      type="date"
                      className="
                        bg-transparent
                        border-b border-white/50
                        text-base
                        font-normal
                        text-white
                        appearance-none
                        outline-none
                        leading-normal
                        h-6
                        p-0
                        m-0
                        inline
                        align-middle
                      "
                      value={editForm.start_date}
                      onChange={e =>
                        setEditForm((prev) => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                      style={{ width: 130 }}
                    />
                  ) : (
                    registrationDate
                      .toLocaleDateString("ko-KR")
                      .replace(/\. /g, ". ")
                      .replace(/\.$/, ".")
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isEditingInfo) {
                    handleSaveMemberInfo();
                  } else {
                    setIsEditingInfo(true);
                  }
                }}
                className="bg-white/20 p-2 rounded-md border border-white hover:bg-white/30 transition"
                title={isEditingInfo ? "저장" : "수정"}
              >
                <i className="fas fa-pen text-white"></i>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
            <div className="col-span-2 bg-yellow-50 rounded-lg text-center py-3">
              <div className="text-sm text-yellow-600">목표</div>
              <div className="text-base font-semibold text-yellow-800">
                {isEditingInfo ? (
                  <input
                    className="
                      bg-transparent
                      border-b border-yellow-400
                      text-center
                      font-semibold
                      text-base
                      text-yellow-800
                      appearance-none
                      outline-none
                      leading-normal
                      h-6
                      p-0
                      m-0
                      inline
                      align-middle
                    "
                    value={editForm.goal}
                    onChange={e => setEditForm({ ...editForm, goal: e.target.value })}
                    style={{ width: "90%" }}
                  />
                ) : (
                  editForm.goal || "설정된 목표가 없습니다"
                )}
              </div>
            </div>
            {/* 레슨권/회원권 정보 (생략 없이 그대로 유지) */}
            {editForm.program_type?.includes("lesson") && (
              <>
                <div className="bg-indigo-50 rounded-lg text-center py-3">
                  <div className="text-sm text-indigo-700 font-semibold mb-1">남은 레슨</div>
                  <div className={`text-2xl font-bold ${Math.max(Number(member.lesson_total_count ?? 0) - usedLessonCount, 0) === 0 ? "text-red-600" : "text-indigo-700"}`}>
                    {Math.max(Number(member.lesson_total_count ?? 0) - usedLessonCount, 0)}회
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-lg text-center py-3">
                  <div className="text-sm text-indigo-700 font-semibold mb-1">총 레슨</div>
                  <div className="text-2xl font-bold text-indigo-700">
                    {isEditingInfo && editForm.program_type.includes("lesson") ? (
                      <input
                        type="number"
                        className="
                          bg-transparent
                          border-b border-indigo-300
                          text-center
                          text-2xl
                          font-bold
                          text-indigo-700
                          appearance-none
                          outline-none
                          leading-normal
                          h-8
                          p-0
                          m-0
                          inline
                          align-middle
                        "
                        value={editForm.lesson_total_count ?? ""}
                        onChange={e =>
                          setEditForm((prev) => ({
                            ...prev,
                            lesson_total_count: e.target.value,
                          }))
                        }
                        min={0}
                        style={{ width: "60px" }}
                      />
                    ) : (
                      (member.lesson_total_count ?? "-") + "회"
                    )}
                  </div>
                </div>
              </>
            )}
            {editForm.program_type?.includes("membership") && (
              <>
                <div className="bg-cyan-50 rounded-lg text-center py-3 flex flex-col items-center">
                  <div className="text-sm text-cyan-700 font-semibold mb-1">남은 일수</div>
                  <div className="text-2xl font-bold text-cyan-700">
                    {membershipRemainingDays != null ? `${membershipRemainingDays}일` : "-일"}
                  </div>
                </div>
                <div className="bg-cyan-50 rounded-lg text-center py-3 flex flex-col items-center">
                  <div className="text-sm text-cyan-700 font-semibold mb-1">등록 기간</div>
                  <div className="text-2xl font-bold text-cyan-700 flex items-center justify-center gap-2">
                    {isEditingInfo && editForm.program_type.includes("membership") ? (
                      <>
                        <input
                          type="number"
                          className="bg-transparent border-b border-cyan-300 text-center text-2xl font-bold text-cyan-700 appearance-none outline-none leading-normal h-8 p-0 m-0 inline align-middle"
                          value={editForm.membership_months ?? ""}
                          onChange={e =>
                            setEditForm((prev) => ({
                              ...prev,
                              membership_months: e.target.value,
                            }))
                          }
                          min={0}
                          placeholder="0"
                          style={{ width: "36px" }}
                        />
                        <span className="text-base font-semibold text-cyan-600">개월</span>
                        <input
                          type="number"
                          className="bg-transparent border-b border-cyan-300 text-center text-2xl font-bold text-cyan-700 appearance-none outline-none leading-normal h-8 p-0 m-0 inline align-middle"
                          value={editForm.membership_days ?? ""}
                          onChange={e =>
                            setEditForm((prev) => ({
                              ...prev,
                              membership_days: e.target.value,
                            }))
                          }
                          min={0}
                          max={31}
                          placeholder="0"
                          style={{ width: "36px" }}
                        />
                        <span className="text-base font-semibold text-cyan-600">일</span>
                      </>
                    ) : (
                      <>
                        {member.membership_months ? `${member.membership_months}개월` : ""}
                        {member.membership_days ? ` ${member.membership_days}일` : ""}
                        {(!member.membership_months && !member.membership_days) ? "-" : ""}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- [B] 메뉴 관리 안내문 --- */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">메뉴 관리</h3>
          <button className="text-sm px-3 py-1 bg-purple-600 text-white rounded-md">
            + 메뉴 추가
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          드래그하여 순서를 변경하거나 토글을 사용하여 메뉴를 활성화/비활성화할 수 있습니다.
        </p>

        {/* --- [C] 메뉴(섹션) 리스트: DnD Kit 적용 --- */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map(s => s.key)} strategy={verticalListSortingStrategy}>
            {sections.map((item) => (
              <SortableSection
                key={item.key}
                item={item}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                toggleSectionStatus={toggleSectionStatus}
                member={member}
                trainerId={trainerId}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* --- [D] 회원 대시보드 미리보기 --- */}
        {showDashboard && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4 space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowDashboard(false)}
                className="text-xs text-gray-500 hover:text-gray-700 transition"
              >
                <i className="fas fa-times mr-1" /> 대시보드 닫기
              </button>
            </div>
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
      {/* --- [E] 토스트 메시지 --- */}
      <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0 pointer-events-none"}`} style={{ zIndex: 9999 }}>
        <div className="flex items-center">
          <i className="fas fa-check-circle mr-2 text-green-400"></i>
          <span className="text-sm">{toast}</span>
        </div>
      </div>
    </div>
  );
}

// ---- DnD Kit용 SortableSection (최하단에 추가) ----
interface SortableSectionProps {
  item: SectionType;
  activeSection: string | null;
  setActiveSection: React.Dispatch<React.SetStateAction<string | null>>;
  toggleSectionStatus: (key: string) => void;
  member: Member;
  trainerId: string;
}
function SortableSection({
  item,
  activeSection,
  setActiveSection,
  toggleSectionStatus,
  member,
  trainerId,
}: SortableSectionProps) {
  const Comp = item.Component;
  const isOpen = activeSection === item.key;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl shadow-sm mb-3 border-l-4 transition-all duration-300 ${
        item.enabled ? "border-purple-500" : "border-gray-200 opacity-50"
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setActiveSection((prev) => (prev === item.key ? null : item.key))}
        >
          <div className="text-gray-400">
            <i className="fas fa-grip-lines"></i>
          </div>
          <span className="font-medium text-gray-800">{item.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection((prev) => (prev === item.key ? null : item.key))}
            className="text-gray-500"
          >
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
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  item.enabled ? "translate-x-4" : ""
                }`}
              ></div>
            </div>
          </label>
        </div>
      </div>
      {isOpen && item.enabled && (
        <div className="px-4 pb-4 transition-all duration-300 ease-in-out">
          <Comp memberId={member.id} trainerId={trainerId} />
        </div>
      )}
    </div>
  );
}
