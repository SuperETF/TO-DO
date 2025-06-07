// ✅ 드래그 & 드롭 순서 변경 + Supabase 업데이트 적용 버전 + 기존 기능 유지
// TrainerRecommendationInputSection.tsx (최종 통합)

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  memberId: string;
}

interface MemberRecommendation {
  id: string;
  assigned_at: string;
  is_completed: boolean;
  recommendation_id: string;
  order: number;
  exercise_videos: {
    title: string;
    video_url: string;
    category?: string;
    tags?: string[];
  };
}

function SortableItem({ rec }: { rec: MemberRecommendation }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rec.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-50 rounded-lg p-3 mb-2 shadow-sm"
    >
      <div className="text-sm font-medium mb-1">{rec.exercise_videos.title}</div>
      <iframe
        src={rec.exercise_videos.video_url}
        className="w-full aspect-video rounded mb-2"
        allow="autoplay; fullscreen"
        allowFullScreen
        title={rec.exercise_videos.title}
      />
      <div className="text-xs text-gray-500 flex justify-between">
        <span>#{rec.exercise_videos.category}</span>
        <span>{rec.is_completed ? "✅ 완료됨" : "⏳ 미완료"}</span>
      </div>
    </div>
  );
}

export default function TrainerRecommendationInputSection({ memberId }: Props) {
  const [recommendations, setRecommendations] = useState<MemberRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);

  const assignedIds = new Set(recommendations.map(r => r.recommendation_id));

  const fetchRecommendations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("member_recommendations")
      .select("id, assigned_at, is_completed, recommendation_id, order, exercise_videos(title, video_url, category, tags)")
      .eq("member_id", memberId)
      .order("order", { ascending: true });
    setRecommendations((data ?? []) as unknown as MemberRecommendation[]);
    setLoading(false);
  };

  const fetchAllVideos = async () => {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select("id, title, video_url, category, tags");
    if (!error && data) setAllVideos(data);
  };

  const handleAssign = async (videoId: string) => {
    if (assignedIds.has(videoId)) {
      setStatus("⚠️ 이미 추천한 영상입니다.");
      return;
    }
    const maxOrder = Math.max(...recommendations.map(r => r.order || 0), 0);
    const { error } = await supabase.from("member_recommendations").insert({
      member_id: memberId,
      recommendation_id: videoId,
      order: maxOrder + 1,
    });
    if (error) setStatus("❌ 배정 실패: " + error.message);
    else {
      setStatus("✅ 영상이 성공적으로 배정되었습니다.");
      setShowModal(false);
      fetchRecommendations();
    }
  };



  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = recommendations.findIndex(r => r.id === active.id);
      const newIndex = recommendations.findIndex(r => r.id === over.id);
      const newOrder = arrayMove(recommendations, oldIndex, newIndex);
      setRecommendations(newOrder);

      const updates = newOrder.map((rec, idx) => ({ id: rec.id, order: idx + 1 }));
      await Promise.all(
        updates.map(u =>
          supabase.from("member_recommendations").update({ order: u.order }).eq("id", u.id)
        )
      );
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchAllVideos();
  }, [memberId]);

  useEffect(() => {
    const cats = Array.from(new Set(allVideos.map(v => v.category || ""))).filter(Boolean);
    setCategoryList(cats);
  }, [allVideos]);

  const filteredVideos = allVideos.filter(
    v =>
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
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={recommendations.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {recommendations.map(rec => (
              <SortableItem key={rec.id} rec={rec} />
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
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="">전체 카테고리</option>
                {categoryList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                className="border rounded px-2 py-1 text-sm flex-1"
                placeholder="검색어 입력(제목/태그)"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                      onError={e => {
                        (e.target as HTMLIFrameElement).style.display = "none";
                      }}
                    />
                    <div className="text-xs text-gray-500">
                      {rec.tags && rec.tags.length > 0 && (
                        <span>태그: {rec.tags.join(", ")}</span>
                      )}
                      <span className="ml-2">
                        {assignedIds.has(rec.id) ? "이미 추천됨" : "클릭하여 추천"}
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

      {status && (
        <div className="text-sm text-center text-teal-600 mt-2">{status}</div>
      )}
    </div>
  );
}