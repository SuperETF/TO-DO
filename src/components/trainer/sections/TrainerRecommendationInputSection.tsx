import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

interface MemberRecommendation {
  id: string;
  assigned_at: string;
  is_completed: boolean;
  recommendation_id: string;
  exercise_videos: {
    title: string;
    video_url: string;
    category?: string;
    tags?: string[];
  };
}

interface ExerciseVideo {
  id: string;
  title: string;
  video_url: string;
  category?: string;
  tags?: string[];
}

export default function TrainerRecommendationInputSection({ memberId }: Props) {
  const [recommendations, setRecommendations] = useState<MemberRecommendation[]>([]);
  const [allVideos, setAllVideos] = useState<ExerciseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);

  // 검색/카테고리 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryList, setCategoryList] = useState<string[]>([]);

  const assignedIds = new Set(recommendations.map(r => r.recommendation_id));

  // fetch: 추천 내역
  const fetchRecommendations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("member_recommendations")
      .select("id, assigned_at, is_completed, recommendation_id, exercise_videos(title, video_url, category, tags)")
      .eq("member_id", memberId)
      .order("assigned_at", { ascending: false });
    if (error) setStatus("❌ 불러오기 실패: " + error.message);
    else setRecommendations((data ?? []) as unknown as MemberRecommendation[]);
    setLoading(false);
  };

  // fetch: 모든 영상
  const fetchAllVideos = async () => {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select("id, title, video_url, category, tags");
    if (!error && data) setAllVideos(data);
  };

  // 추천(배정)
  const handleAssign = async (videoId: string) => {
    if (assignedIds.has(videoId)) {
      setStatus("⚠️ 이미 추천한 영상입니다.");
      return;
    }
    const { error } = await supabase.from("member_recommendations").insert({
      member_id: memberId,
      recommendation_id: videoId,
    });
    if (error) setStatus("❌ 배정 실패: " + error.message);
    else {
      setStatus("✅ 영상이 성공적으로 배정되었습니다.");
      setShowModal(false);
      fetchRecommendations();
    }
  };

  // 삭제
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("member_recommendations").delete().eq("id", id);
    if (error) setStatus("❌ 삭제 실패: " + error.message);
    else {
      setStatus("🗑️ 삭제 완료");
      fetchRecommendations();
    }
  };

  // 완료 토글
  const toggleComplete = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("member_recommendations")
      .update({ is_completed: !current })
      .eq("id", id);
    if (error) setStatus("❌ 상태 변경 실패");
    else fetchRecommendations();
  };

  // 카테고리 자동 추출 (리스트 중복 제거)
  useEffect(() => {
    const cats = Array.from(new Set(allVideos.map(v => v.category || ""))).filter(Boolean);
    setCategoryList(cats);
  }, [allVideos]);

  useEffect(() => {
    fetchRecommendations();
    fetchAllVideos();
  }, [memberId]);

  // 필터 적용
  const filteredVideos = allVideos.filter(
    v =>
      (!selectedCategory || v.category === selectedCategory) &&
      (!searchTerm ||
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.tags && v.tags.some((tag: string) => tag.includes(searchTerm))))
  );
  return (
    <div className="p-4 space-y-6">
      {/* "운동 추천" 섹션 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition flex items-center justify-center"
        >
          <i className="fas fa-plus-circle mr-2"></i>
          저장된 운동 추천하기
        </button>
      </div>

      {/* 추천 영상 리스트 */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400">불러오는 중...</div>
        ) : recommendations.length === 0 ? (
          <div className="text-sm text-gray-400">아직 추천 영상이 없습니다.</div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium">
                  {rec.exercise_videos.title}
                </h4>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => toggleComplete(rec.id, rec.is_completed)}
                    className="text-blue-600 hover:underline"
                  >
                    {rec.is_completed ? "✅ 완료 해제" : "⏳ 완료 처리"}
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="aspect-video bg-gray-200 rounded-lg mb-2 overflow-hidden">
                <iframe
                  src={rec.exercise_videos.video_url}
                  className="w-full h-full rounded-lg"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title={rec.exercise_videos.title}
                  onError={e => {
                    // 영상 임베드 에러 시 대체 썸네일/문구
                    (e.target as HTMLIFrameElement).style.display = "none";
                  }}
                />
                {/* 썸네일 fallback이 필요하면 여기에 img 태그로 대체 이미지도 가능 */}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>추천일: {new Date(rec.assigned_at).toLocaleDateString("ko-KR")}</span>
                <span>{rec.exercise_videos.category && `#${rec.exercise_videos.category}`}</span>
                <span>{rec.is_completed ? "✅ 완료됨" : "⏳ 미완료"}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 안내 문구 */}
      <p className="text-sm text-gray-500 mt-2">
        <i className="fas fa-info-circle mr-1"></i>
        회원에게 맞춤 운동 영상을 추천해보세요
      </p>

      {/* 모달: 영상 추천하기 */}
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
                    {/* 임베드 주소가 이상하면 오류화면 대신 아래 fallback 추가 */}
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
