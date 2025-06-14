// src/router/Router.tsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { SlideProvider } from "../context/SlideContext"; // ✅ 추가
import LoginPage from "../pages/login/LoginPage";
import MemberDashboardPage from "../pages/member/MemberDashboardPage";
import TrainerDashboardPage from "../pages/trainer/TrainerDashboardPage";
import TrainerMemberDetailPage from "../pages/trainer/member/TrainerMemberDetailPage";
import { useState } from "react";

const AnimatedRoutes = () => {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/member-dashboard" element={<MemberDashboardPage />} />
        <Route
          path="/trainer-dashboard"
          element={
            <TrainerDashboardPage
              selectedMemberId={selectedMemberId} //
              setSelectedMemberId={setSelectedMemberId}
            />
          }
        />
        <Route
          path="/trainer/member/:id"
          element={
            <TrainerMemberDetailPage
              setSelectedMemberId={setSelectedMemberId}
            />
          }
        />
        <Route path="/member-dashboard/:memberId" element={<MemberDashboardPage />} />
        <Route path="/trainer/member/:id" element={<TrainerMemberDetailPage setSelectedMemberId={function (): void {
          throw new Error("Function not implemented.");
        } } />} />
        <Route
          path="*"
          element={
            role === "trainer" ? (
              <Navigate to="/trainer-dashboard" />
            ) : role === "member" ? (
              <Navigate to="/member-dashboard" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const Router = () => (
  <SlideProvider> {/* ✅ 슬라이드 방향 상태 적용 */}
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  </SlideProvider>
);

export default Router;
