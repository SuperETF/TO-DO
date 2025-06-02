import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  readOnly?: boolean;
}

export default function CenterAnnouncementSection({ readOnly = false }: Props) {
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("center_announcements")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      setAnnouncement(data);
    };

    fetchAnnouncement();
  }, []);

  if (!announcement) return null;

  return (
    <button
      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 mb-6 text-left focus:outline-none hover:brightness-105 transition disabled:opacity-70"
      onClick={() => {
        if (!readOnly && announcement.link_url) {
          window.open(announcement.link_url, "_blank");
        }
      }}
      disabled={readOnly}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">{announcement.title}</h3>
          <p className="text-white text-sm opacity-90">{announcement.content}</p>
        </div>
        <i className="fas fa-chevron-right text-white opacity-70 ml-4"></i>
      </div>
    </button>
  );
}
