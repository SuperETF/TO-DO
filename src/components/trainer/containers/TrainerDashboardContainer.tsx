// src/components/trainer/containers/TrainerDashboardContainer.tsx

import MemberCardContainer from "../cards/MemberCardContainer";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  created_at?: string;
  trainer_id?: string;
}

interface Props {
  member: Member;
}

export default function TrainerDashboardContainer({ member }: Props) {
  return (
    <div className="px-4">
      <MemberCardContainer member={member} />
    </div>
  );
}
