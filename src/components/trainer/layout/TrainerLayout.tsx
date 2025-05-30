// src/components/trainer/layout/TrainerLayout.tsx

import Header from "./Header";
import MemberScrollBar from "./MemberScrollBar";
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

      {/* 회원 선택 스크롤 바 */}
      <div className="fixed top-[64px] z-20 w-full bg-white shadow-sm">
        <MemberScrollBar
          members={members}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>

      {/* 콘텐츠 영역: 헤더와 스크롤바 높이 고려해서 패딩 설정 */}
      <div className="pt-[140px] bg-gray-50 min-h-screen">
        {children}
      </div>
    </>
  );
}
