import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
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
      className="bg-gray-50 rounded-lg p-3 mb-2 shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="text-xs text-gray-400 mb-2 cursor-move select-none"
      >
        ☰ 드래그
      </div>

      <div className="text-sm font-medium mb-1">
        {rec.trainer_recommendations.exercise_videos.title}
      </div>
      <iframe
        src={rec.trainer_recommendations.exercise_videos.video_url}
        className="w-full aspect-video rounded mb-2"
        allow="autoplay; fullscreen"
        allowFullScreen
        title={rec.trainer_recommendations.exercise_videos.title}
      />

      {rec.description && (
        <div className="text-xs text-gray-700 mb-2 whitespace-pre-wrap">
          {rec.description}
        </div>
      )}

      <div className="text-xs text-gray-500 flex justify-between items-center">
        <span>#{rec.trainer_recommendations.exercise_videos.category}</span>
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
                className="text-blue-500 hover:underline text-xs"
              >
                확인
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDescription(rec);
            }}
            className="text-green-500 hover:underline text-xs"
          >
            설명하기
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(rec.id);
            }}
            className="text-red-500 hover:underline text-xs"
          >
            삭제
          </button>
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
      <div className="bg-white p-5 rounded-xl shadow-lg w-full max-w-md z-50">
        <h3 className="text-lg font-semibold mb-2">설명 입력</h3>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full border rounded p-2 h-28"
          placeholder="예: 3세트 15회씩 반복하세요"
        />
        <div className="flex justify-end mt-3 gap-2">
          <button onClick={onClose} className="bg-gray-200 px-3 py-1 rounded">취소</button>
          <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrainerRecommendationInputSection({ memberId }: Props) {
  const [recommendations, setRecommendations] = useState<MemberRecommendation[]>([]);
  const [editingRec, setEditingRec] = useState<MemberRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);

  const assignedIds = new Set(recommendations.map((r) => r.recommendation_id));

  const fetchRecommendations = async () => {
    setLoading(true);
  
    const { data, error } = await supabase
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
  
    if (error) {
      console.error("[❌ fetchRecommendations ERROR]", error);
    } else {
      console.log("[✅ fetchRecommendations DATA]", data);
    }
  
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
    console.log("[Assign] member_id:", memberId, "recommendation_id:", trainerRecommendationId);

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
      console.error("[Assign] INSERT ERROR:", error);
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
    <div className="p-4">
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition flex items-center justify-center"
        >
          <i className="fas fa-plus-circle mr-2"></i>
          저장된 운동 추천하기
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={recommendations.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {recommendations.map((rec) => (
              <SortableItem
                key={rec.id}
                rec={rec}
                onConfirm={handleConfirm}
                onDelete={handleDelete}
                onEditDescription={setEditingRec}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">운동 영상 선택</h3>
            <div className="flex gap-2 mb-4">
              <select
                className="border rounded px-2 py-1 text-sm"
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
                className="border rounded px-2 py-1 text-sm flex-1"
                placeholder="검색어 입력(제목/태그)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {filteredVideos.length === 0 ? (
                <div className="text-xs text-gray-400">조건에 맞는 영상이 없습니다.</div>
              ) : (
                filteredVideos.map((rec) => (
                  <div
                    key={rec.id}
                    className={`border rounded-lg p-3 cursor-pointer transition ${
                      assignedIds.has(rec.id)
                        ? "bg-gray-200 pointer-events-none opacity-60"
                        : "hover:bg-indigo-50"
                    }`}
                    onClick={() => !assignedIds.has(rec.id) && handleAssign(rec.id)}
                  >
                    <div className="font-semibold mb-2 flex justify-between">
                      <span>{rec.title}</span>
                      {rec.category && <span className="text-xs text-gray-500">#{rec.category}</span>}
                    </div>
                    <iframe
                      src={rec.video_url}
                      className="rounded aspect-video mb-2 w-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={rec.title}
                      onError={(e) => {
                        (e.target as HTMLIFrameElement).style.display = "none";
                      }}
                    />
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
                ))
              )}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {editingRec && (
        <DescriptionEditModal
          rec={editingRec}
          onClose={() => setEditingRec(null)}
          onSaved={handleSaveDescription}
        />
      )}

      {status && (
        <div className="text-sm text-center text-teal-600 mt-2">{status}</div>
      )}
    </div>
  );
}
