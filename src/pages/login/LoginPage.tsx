import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [role, setRole] = useState<"trainer" | "member">("trainer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const navigate = useNavigate();

  // ✅ DB에 저장된 auto_login 값 확인해서 자동 로그인 처리
  useEffect(() => {
    const checkAutoLogin = async () => {
      const memberId = localStorage.getItem("member_id");
      if (!memberId) return;

      const { data, error } = await supabase
        .from("members")
        .select("auto_login")
        .eq("id", memberId)
        .single();

      if (error || !data?.auto_login) return;

      navigate("/member-dashboard");
    };

    const role = localStorage.getItem("role");

    if (role === "trainer") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) navigate("/trainer-dashboard");
      });
    } else if (role === "member") {
      checkAutoLogin();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (role === "trainer") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        alert("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("trainer_id", data.user.id);
      localStorage.setItem("role", "trainer");

      navigate("/trainer-dashboard");
    } else {
      const { data, error } = await supabase
        .from("members")
        .select("id, auto_login")
        .eq("name", name.trim())
        .eq("phone_last4", phoneLast4.trim())
        .single();

      if (error || !data) {
        alert("회원 정보를 찾을 수 없습니다. 이름과 전화번호를 확인해주세요.");
        setIsLoading(false);
        return;
      }

      // ✅ member_id 저장 (기기 자동 로그인 시 사용)
      localStorage.setItem("member_id", data.id);
      localStorage.setItem("role", "member");

      // ✅ auto_login 상태 DB에 반영
      await supabase
        .from("members")
        .update({ auto_login: autoLogin })
        .eq("id", data.id);

      navigate("/member-dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#4CD6B4] text-3xl font-bold">TO-DO</h1>
          <p className="text-gray-600 mt-2">오늘도 건강하세요!</p>
        </div>

        <div className="bg-gray-50/50 p-1 rounded-2xl mb-8 flex">
          <button
            onClick={() => setRole("trainer")}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              role === "trainer"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            전문가
          </button>
          <button
            onClick={() => setRole("member")}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              role === "member"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            회원
          </button>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {role === "trainer" ? "전문가 로그인" : "회원 로그인"}
          </h2>

          {role === "trainer" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 입력"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50/50 text-gray-800 focus:ring-2 focus:ring-[#4CD6B4] outline-none"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50/50 text-gray-800 focus:ring-2 focus:ring-[#4CD6B4] outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50/50 text-gray-800 focus:ring-2 focus:ring-[#4CD6B4] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 뒤 4자리
                </label>
                <input
                  type="text"
                  value={phoneLast4}
                  onChange={(e) => setPhoneLast4(e.target.value)}
                  placeholder="0000"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50/50 text-gray-800 focus:ring-2 focus:ring-[#4CD6B4] outline-none"
                  required
                />
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <input
              id="autoLogin"
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
              className="w-4 h-4 text-[#4CD6B4] border-gray-300 rounded focus:ring-[#4CD6B4]"
            />
            <label htmlFor="autoLogin" className="text-sm text-gray-600">
              자동 로그인
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#4CD6B4] text-white py-3 rounded-xl font-medium shadow-md hover:bg-[#3bc0a0] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#4CD6B4]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-circle-notch fa-spin mr-2"></i>
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-8">
          © 2025 TODO-DOTO. All rights reserved.
        </p>
      </div>
    </div>
  );
}
