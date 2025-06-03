import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/login/LoginPage";
import MemberDashboardPage from "../pages/member/MemberDashboardPage";
import TrainerDashboardPage from "../pages/trainer/TrainerDashboardPage";

const Router = () => {
  const role = localStorage.getItem("role"); // 'trainer' 또는 'member'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/member-dashboard" element={<MemberDashboardPage />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboardPage />} />
        <Route path="/member-dashboard/:memberId" element={<MemberDashboardPage />} /> {/* ✅ 추가 */}
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
    </BrowserRouter>
  );
};

export default Router;
