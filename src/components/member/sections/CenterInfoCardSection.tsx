import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  trainerId: string;
}

export default function CenterInfoCardSection({ trainerId }: Props) {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      const { data } = await supabase
        .from("center_info_cards")
        .select("*")
        .eq("trainer_id", trainerId)
        .order("order", { ascending: true });

      if (data) setCards(data);
    };

    fetchCards();
  }, [trainerId]);

  return (
    <div className="mb-6 overflow-x-auto scrollbar-none">
      <div className="flex space-x-3 px-1 pb-1">
        {cards.map((card, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm px-3 pt-2.5 pb-3"
          >
            {/* 아이콘 */}
            <div className="mb-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bg_color}`}
              >
                <i className={`fas ${card.icon} text-xl ${card.icon_color}`}></i>
              </div>
            </div>

            {/* 텍스트 */}
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
