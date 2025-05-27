// src/components/member/layout/MemberDashboardLayout.tsx

import React from "react";

export default function MemberDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gray-50 min-h-screen pb-16">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <i className="fas fa-dumbbell text-teal-500 mr-2"></i>
            <span className="font-semibold text-lg">피트니스 대시보드</span>
          </div>
          <div className="flex items-center">
            <i className="far fa-bell text-gray-500 mr-4 cursor-pointer"></i>
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              JK
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 pb-20 px-4">
        {children}
      </main>

      {/* Tab Bar */}
      <div className="fixed bottom-0 w-full bg-white shadow-md border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16">
          {[
            { icon: "fa-home", label: "홈", active: true },
            { icon: "fa-dumbbell", label: "운동" },
            { icon: "fa-calendar-alt", label: "예약" },
            { icon: "fa-chart-line", label: "분석" },
            { icon: "fa-user", label: "내정보" },
          ].map(({ icon, label, active }) => (
            <div
              key={label}
              className={`flex flex-col items-center justify-center cursor-pointer ${
                active ? "text-teal-500" : "text-gray-400"
              }`}
            >
              <i className={`fas ${icon} text-xl`}></i>
              <span className="text-xs mt-1">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
