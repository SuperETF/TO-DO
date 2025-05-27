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
  const navigate = useNavigate();

  // ✅ 자동 로그인 처리
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole === "trainer") {
      navigate("/trainer-dashboard");
    } else if (storedRole === "member") {
      navigate("/member-dashboard");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "trainer") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        alert("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
        return;
      }

      localStorage.setItem("role", "trainer");
      localStorage.setItem("trainer_id", data.user.id);
      navigate("/trainer-dashboard");
    } else {
        const { data, error } = await supabase
        .from("members")
        .select("id, name, phone_last4")
        .eq("name", name.trim())
        .eq("phone_last4", phoneLast4.trim())
        .single();
      

if (error || !data) {
  alert("회원 정보를 찾을 수 없습니다. 이름과 전화번호를 확인해주세요.");
  return;
}

      

      localStorage.setItem("role", "member");
      localStorage.setItem("member_id", data.id);
      navigate("/member-dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4CD6B4]">TO-DO</h1>
          <p className="text-gray-600 mt-2">오늘도 건강하세요!</p>
        </div>

        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 ${role === "trainer" ? "text-[#4CD6B4] border-b-2 border-[#4CD6B4] font-semibold" : "text-gray-500"}`}
            onClick={() => setRole("trainer")}
          >
            트레이너 로그인
          </button>
          <button
            className={`flex-1 py-2 ${role === "member" ? "text-[#4CD6B4] border-b-2 border-[#4CD6B4] font-semibold" : "text-gray-500"}`}
            onClick={() => setRole("member")}
          >
            회원 로그인
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {role === "trainer" ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CD6B4] focus:bg-white"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CD6B4] focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CD6B4] focus:bg-white"
                required
              />
              <input
                type="text"
                value={phoneLast4}
                onChange={(e) => setPhoneLast4(e.target.value)}
                placeholder="전화번호 뒤 4자리"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CD6B4] focus:bg-white"
                required
              />
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#4CD6B4] text-white font-medium rounded-lg hover:bg-[#3bc0a0] transition"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
