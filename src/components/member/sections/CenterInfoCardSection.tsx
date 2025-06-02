interface Props {
  readOnly?: boolean;
}

export default function CenterInfoCardSection({ readOnly = false }: Props) {
  void readOnly; 
  const cards = [
    {
      title: "출입문",
      icon: "fa-key",
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-500",
      line1: "1층 - 0412",
      line2: "2층 - 0509",
    },
    {
      title: "화장실",
      icon: "fa-restroom",
      bgColor: "bg-pink-100",
      iconColor: "text-pink-500",
      line1: "비밀번호",
      line2: "1234",
    },
    {
      title: "와이파이",
      icon: "fa-wifi",
      bgColor: "bg-cyan-100",
      iconColor: "text-cyan-500",
      line1: "KT_GIGA_파브 필라테스",
      line2: "pab1234567890",
    },
  ];

  return (
    <div className="mb-6 overflow-x-auto scrollbar-none">
      <div className="flex space-x-3 px-1 pb-1">
        {cards.map((card, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm px-3 pt-2.5 pb-3"
          >
            <div className="mb-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bgColor}`}
              >
                <i className={`fas ${card.icon} text-xl ${card.iconColor}`}></i>
              </div>
            </div>

            <h3 className="font-medium text-sm mb-1">{card.title}</h3>
            <div className="space-y-0.5 leading-snug">
              <p className="text-xs text-gray-600">{card.line1}</p>
              {card.line2 && (
                <p className="text-xs text-gray-600">{card.line2}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
