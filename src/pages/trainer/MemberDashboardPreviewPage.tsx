// src/pages/trainer/MemberDashboardPreviewPage.tsx

import { useParams } from "react-router-dom";
import MemberDashboardContainer from "../../components/member/containers/MemberDashboardContainer";
import TrainerLayout from "../../components/trainer/layout/TrainerLayout";

export default function MemberDashboardPreviewPage() {
    const { memberId } = useParams();
  
    return (
      <TrainerLayout
        members={[]}
        selectedId={memberId ?? ""} // 또는 as string
        onSelect={() => {}}
      >
        <MemberDashboardContainer memberId={memberId} readOnly />
      </TrainerLayout>
    );
  }
  
