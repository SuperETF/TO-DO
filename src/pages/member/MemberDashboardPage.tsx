import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MemberDashboardContainer from "../../components/member/containers/MemberDashboardContainer";

export default function MemberDashboardPage() {
  const { memberId } = useParams();
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = memberId ?? localStorage.getItem("member_id");
    if (!id) {
      setLoading(false);
      return;
    }
    setResolvedId(id);
    setLoading(false);
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (!resolvedId) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        회원 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return <MemberDashboardContainer memberId={resolvedId} />;
}
