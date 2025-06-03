// src/pages/member/MemberDashboardPage.tsx

import { useParams } from "react-router-dom";
import MemberDashboardContainer from "../../components/member/containers/MemberDashboardContainer";

export default function MemberDashboardPage() {
  const { memberId } = useParams();  // 트레이너가 접근 시 존재함
  const resolvedId = memberId ?? localStorage.getItem("member_id");

  if (!resolvedId) {
    return <div>회원 정보를 불러올 수 없습니다.</div>;
  }

  return <MemberDashboardContainer memberId={resolvedId} />;
}
