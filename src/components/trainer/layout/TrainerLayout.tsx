// src/layouts/TrainerLayout.tsx

import Header from "../../../components/trainer/layout/Header";
import MemberScrollBar from "../../../components/trainer/layout/MemberScrollBar";
import type { ReactNode } from "react";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
}

interface TrainerLayoutProps {
  children: ReactNode;
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function TrainerLayout({
  children,
  members,
  selectedId,
  onSelect,
}: TrainerLayoutProps) {
  return (
    <>
      {/* 고정 헤더 */}
      <Header />

      {/* 헤더 아래 고정 멤버 선택 바 */}
      <div className="fixed top-[64px] z-20 w-full bg-white shadow-sm">
        <MemberScrollBar
          members={members}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>

      {/* 아래 콘텐츠는 헤더 + 스크롤바 만큼 아래에서 시작 */}
      <div className="pt-[160px] bg-gray-50 min-h-screen">
        {children}
      </div>
    </>
  );
}
