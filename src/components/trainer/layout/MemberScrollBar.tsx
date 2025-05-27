import { useRef } from "react";

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

  return (
    <div className="bg-white w-full shadow-sm z-10">
      <div
        ref={containerRef}
        className="flex overflow-x-auto px-4 py-2 gap-2 scrollbar-hide"
      >
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => {
              onSelect(member.id);
              const el = document.getElementById(`member-${member.id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "start", inline: "center" });
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition
              ${selectedId === member.id
                ? "bg-[#6C4CF1] text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
          >
            <i className="fas fa-user-circle"></i>
            {member.name} ({member.phone_last4})
          </button>
        ))}
      </div>
    </div>
  );
}
