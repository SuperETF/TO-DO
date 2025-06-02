// pages/trainer/MemberDashboardReadOnlyPage.tsx

import MemberDashboardContainer from "../../components/member/containers/MemberDashboardContainer";
import { useParams } from "react-router-dom";

export default function MemberDashboardReadOnlyPage() {
  const { memberId } = useParams<{ memberId: string }>();

  if (!memberId) return <p>잘못된 접근입니다.</p>;

  return (
    <MemberDashboardContainer memberId={memberId} readOnly={true} />
  );
}
