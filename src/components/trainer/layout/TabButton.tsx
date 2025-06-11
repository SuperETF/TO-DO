import { useRef, useState, useEffect } from "react";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
}

interface Props {
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function MemberScrollBar({ members, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      m.phone_last4.includes(search.trim())
  );

  useEffect(() => {
    const el = document.getElementById(`member-btn-${selectedId}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedId]);

  return (
    <div className="w-full bg-white z-10 shadow-sm rounded-b-lg">
      <div className="max-w-screen-lg mx-auto">
        <div className="px-4 flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="이름 또는 뒷자리 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 px-4 rounded-full bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600"
              title="검색 초기화"
              type="button"
            >
              <i className="fas fa-times-circle" />
            </button>
          )}
        </div>
        <div
          ref={containerRef}
          className="flex overflow-x-auto px-4 py-2 gap-2 scrollbar-hide snap-x snap-mandatory touch-pan-x"
        >
          {filtered.length === 0 ? (
            <span className="text-sm text-gray-400 px-4 py-2">검색 결과 없음</span>
          ) : (
            filtered.map((member) => (
              <button
                key={member.id}
                id={`member-btn-${member.id}`}
                onClick={() => onSelect(member.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-center transition
                  ${
                    selectedId === member.id
                      ? "bg-[#6B4EFF] text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
              >
                {member.name} ({member.phone_last4})
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
