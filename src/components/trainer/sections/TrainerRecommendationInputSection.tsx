import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import TrainerVideoUploadModal from "./trainerVideoUploadModal";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  memberId: string;
  trainerId: string; // prop으로 반드시 넘겨줘야 함
}

interface MemberRecommendation {
  id: string;
  assigned_at: string;
  is_completed: boolean;
  trainer_confirmed?: boolean;
  recommendation_id: string;
  order: number;
  description?: string;
  trainer_recommendations: {
    exercise_videos: {
      title: string;
      video_url: string;
      category?: string;
      tags?: string[];
    };
  };
}

// 드래그 가능한 리스트 아이템
function SortableItem({
  rec,
  onConfirm,
  onDelete,
  onEditDescription,
}: {
  rec: MemberRecommendation;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
  onEditDescription: (rec: MemberRecommendation) => void;
}) {
  const { setNodeRef, transform, transition, attributes, listeners } =
    useSortable({ id: rec.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl p-5 mb-4 flex flex-col gap-3 shadow-sm border border-gray-100 transition-all"
    >
      <div className="flex items-center justify-between">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 text-sm text-gray-400 cursor-grab select-none"
        >
          <i className="fas fa-grip-lines"></i>
          <span>드래그</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDescription(rec);
            }}
            className="text-[#A259F7] hover:text-[#8F43E9] font-semibold text-xs px-2 py-1 rounded transition"
          >
            설명
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(rec.id);
            }}
            className="text-red-400 hover:text-red-600 font-semibold text-xs px-2 py-1 rounded transition"
          >
            삭제
          </button>
        </div>
      </div>
      <div className="font-bold text-gray-800 text-base">
        {rec.trainer_recommendations.exercise_videos.title}
      </div>
      <div className="relative w-full aspect-video bg-gray-50 rounded-xl overflow-hidden shadow-sm">
        <iframe
          src={rec.trainer_recommendations.exercise_videos.video_url}
          className="absolute top-0 left-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title={rec.trainer_recommendations.exercise_videos.title}
        />
      </div>
      {rec.description && (
        <div className="text-xs text-gray-600 bg-purple-50 rounded-md p-2 whitespace-pre-wrap">
          {rec.description}
        </div>
      )}
      <div className="flex justify-between items-center text-xs mt-1">
        <span className="text-gray-400">
          #{rec.trainer_recommendations.exercise_videos.category}
        </span>
        <span className="flex gap-2 items-center">
          {!rec.is_completed && <span className="text-gray-400">⏳ 미완료</span>}
          {rec.is_completed && !rec.trainer_confirmed && (
            <>
              <span className="text-green-600">✅ 완료됨</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm(rec.id);
                }}
                className="text-[#A259F7] hover:text-[#8F43E9] font-semibold text-xs px-2 py-1 rounded transition"
              >
                확인
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function DescriptionEditModal({
  rec,
  onClose,
  onSaved,
}: {
  rec: MemberRecommendation;
  onClose: () => void;
  onSaved: (desc: string) => void;
}) {
  const [desc, setDesc] = useState(rec.description || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await supabase
      .from("member_recommendations")
      .update({ description: desc })
      .eq("id", rec.id);
    setLoading(false);
    onSaved(desc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">설명 입력</div>
          <div className="text-sm text-gray-500 mb-3">
            운동에 대한 추가 설명이나 당부사항을 자유롭게 적어주세요.
          </div>
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="
            w-full min-h-[96px] px-4 py-3 rounded-xl bg-gray-50 text-gray-800
            placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#A259F7] transition
            resize-none
          "
          placeholder="예: 3세트 15회씩 반복하세요"
          spellCheck={false}
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[#A259F7] hover:text-[#8F43E9] font-semibold px-3 py-1 transition"
            tabIndex={-1}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading || desc.trim() === ""}
            className={`
              bg-[#A259F7] hover:bg-[#8F43E9] text-white font-bold px-5 py-2 rounded-xl text-base transition
              disabled:bg-purple-200 disabled:cursor-not-allowed
            `}
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 메인 컴포넌트 ---
export default function TrainerRecommendationInputSection({ memberId, trainerId }: Props) {
  const [recommendations, setRecommendations] = useState<MemberRecommendation[]>([]);
  const [editingRec, setEditingRec] = useState<MemberRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);

  const assignedIds = new Set(recommendations.map((r) => r.recommendation_id));

  const fetchRecommendations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("member_recommendations")
      .select(`
        id,
        assigned_at,
        is_completed,
        trainer_confirmed,
        recommendation_id,
        order,
        description,
        trainer_recommendations:recommendation_id (
          exercise_videos:exercise_video_id (
            title,
            video_url,
            category,
            tags
          )
        )
      `)
      .eq("member_id", memberId)
      .or("trainer_confirmed.is.null,trainer_confirmed.eq.false")
      .order("order", { ascending: true });
    setRecommendations((data ?? []) as unknown as MemberRecommendation[]);
    setLoading(false);
  };

  const fetchAllVideos = async () => {
    const { data } = await supabase
      .from("exercise_videos")
      .select("id, title, video_url, category, tags");
    if (data) setAllVideos(data);
  };

  const handleAssign = async (trainerRecommendationId: string) => {
    const { data: trainerRec, error: trainerRecError } = await supabase
      .from("trainer_recommendations")
      .select("id, title")
      .eq("id", trainerRecommendationId)
      .single();

    if (trainerRecError || !trainerRec) {
      const { data: newTemplate, error: newTemplateError } = await supabase
        .from("trainer_recommendations")
        .insert({
          exercise_video_id: trainerRecommendationId,
          title: "[자동생성] 추천 템플릿",
        })
        .select()
        .single();

      if (newTemplateError || !newTemplate) {
        setStatus("❌ 추천 템플릿 생성에 실패했습니다.");
        return;
      }
      trainerRecommendationId = newTemplate.id;
    }

    if (assignedIds.has(trainerRecommendationId)) {
      setStatus("⚠️ 이미 이 추천이 할당되어 있습니다.");
      return;
    }

    const maxOrder = Math.max(...recommendations.map((r) => r.order || 0), 0);

    const { error } = await supabase.from("member_recommendations").insert({
      member_id: memberId,
      recommendation_id: trainerRecommendationId,
      order: maxOrder + 1,
    });

    if (error) {
      setStatus(`❌ 오류: ${error.message}`);
    } else {
      setStatus("✅ 추천이 성공적으로 배정되었습니다.");
      setShowModal(false);
      fetchRecommendations();
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = recommendations.findIndex((r) => r.id === active.id);
      const newIndex = recommendations.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(recommendations, oldIndex, newIndex);
      setRecommendations(reordered);
      await Promise.all(
        reordered.map((r, i) =>
          supabase.from("member_recommendations").update({ order: i + 1 }).eq("id", r.id)
        )
      );
    }
  };

  const handleConfirm = async (id: string) => {
    await supabase.from("member_recommendations").update({ trainer_confirmed: true }).eq("id", id);
    fetchRecommendations();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("member_recommendations").delete().eq("id", id);
    fetchRecommendations();
  };

  const handleSaveDescription = (desc: string) => {
    if (editingRec) {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === editingRec.id ? { ...r, description: desc } : r))
      );
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchAllVideos();
  }, [memberId]);

  useEffect(() => {
    const cats = Array.from(new Set(allVideos.map((v) => v.category || ""))).filter(Boolean);
    setCategoryList(cats);
  }, [allVideos]);

  const filteredVideos = allVideos.filter(
    (v) =>
      (!selectedCategory || v.category === selectedCategory) &&
      (!searchTerm ||
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.tags && v.tags.some((tag: string) => tag.includes(searchTerm))))
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-7 gap-3">
        <div className="flex flex-wrap gap-2 w-full justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#A259F7] hover:bg-[#8F43E9] text-white font-bold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-2xl whitespace-nowrap transition-all focus:outline-none"
            style={{ minWidth: 0, maxWidth: "100%" }}
          >
            <i className="fas fa-plus"></i>
            저장된 운동 추천하기
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[#A259F7] hover:bg-[#8F43E9] text-white font-bold text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-2xl whitespace-nowrap transition-all focus:outline-none"
            style={{ minWidth: 0, maxWidth: "100%" }}
          >
            <i className="fas fa-upload"></i>
            운동 영상 업로드하기
          </button>
        </div>
      </div>

      {status && (
        <div className="mb-4 px-4 py-2 text-base text-[#A259F7] text-center bg-purple-50 rounded-xl font-medium shadow-sm">
          {status}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-base text-gray-400">
          불러오는 중...
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={recommendations.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {recommendations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-video text-[#A259F7] text-2xl"></i>
                </div>
                <p className="text-gray-500 font-medium">
                  추천 영상이 없습니다
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  상단의 추가 버튼을 눌러 영상을 추가해주세요
                </p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <SortableItem
                  key={rec.id}
                  rec={rec}
                  onConfirm={handleConfirm}
                  onDelete={handleDelete}
                  onEditDescription={setEditingRec}
                />
              ))
            )}
          </SortableContext>
        </DndContext>
      )}

      {/* 영상 선택 모달 */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">운동 영상 선택</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-[#A259F7] cursor-pointer text-2xl transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-5 border-b border-gray-100">
              <div className="flex gap-2 mb-3">
                <select
                  className="bg-gray-50 border-none rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259F7]"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">전체 카테고리</option>
                  {categoryList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  className="flex-1 bg-gray-50 border-none rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A259F7]"
                  placeholder="검색어 입력(제목/태그)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto">
                {filteredVideos.length === 0 ? (
                  <div className="text-xs text-gray-400">
                    조건에 맞는 영상이 없습니다.
                  </div>
                ) : (
                  filteredVideos.map((rec) => (
                    <div
                      key={rec.id}
                      className={`border rounded-xl p-3 cursor-pointer transition-all ${
                        assignedIds.has(rec.id)
                          ? "bg-gray-100 pointer-events-none opacity-60"
                          : "hover:bg-purple-50"
                      }`}
                      onClick={() =>
                        !assignedIds.has(rec.id) && handleAssign(rec.id)
                      }
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-gray-800 text-base flex justify-between items-center mb-1">
                          <span>{rec.title}</span>
                          {rec.category && (
                            <span className="text-xs text-gray-400">
                              #{rec.category}
                            </span>
                          )}
                        </div>
                        <div className="relative w-full aspect-video bg-gray-50 rounded-xl overflow-hidden">
                          <iframe
                            src={rec.video_url}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={rec.title}
                            onError={(e) => {
                              (e.target as HTMLIFrameElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {rec.tags && rec.tags.length > 0 && (
                            <span>태그: {rec.tags.join(", ")}</span>
                          )}
                          <span className="ml-2">
                            {assignedIds.has(rec.id)
                              ? "이미 추천됨"
                              : "클릭하여 추천"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="m-5 px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showUploadModal && (
        <TrainerVideoUploadModal
          trainerId={trainerId}
          memberId={memberId}
          onClose={() => setShowUploadModal(false)}
          onUploaded={fetchAllVideos} />
      )}

      {editingRec && (
        <DescriptionEditModal
          rec={editingRec}
          onClose={() => setEditingRec(null)}
          onSaved={handleSaveDescription}
        />
      )}
    </div>
  );
}
