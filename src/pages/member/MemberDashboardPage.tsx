import { useParams } from "react-router-dom";
import MemberDashboardContainer from "../../components/member/containers/MemberDashboardContainer";

export default function MemberDashboardPage() {
  const { memberId } = useParams(); // 트레이너가 접근 시 URL 파라미터로 존재
  const resolvedId = memberId ?? localStorage.getItem("member_id");

  if (!resolvedId) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        회원 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return <MemberDashboardContainer memberId={resolvedId} />;
}
