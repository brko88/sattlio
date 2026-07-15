import { useEffect, useState } from "react";
import api from "../services/api";

interface Announcement {
  kind: string;
  message: string;
}

function GlobalAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    api
      .get("/api/v1/public/announcements")
      .then((res) => setAnnouncements(res.data))
      .catch(() => setAnnouncements([]));
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div>
      {announcements.map((a, i) => (
        <div
          key={i}
          className={`w-full text-center text-sm px-4 py-2 ${
            a.kind === "beta"
              ? "bg-blue-600 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {a.message}
        </div>
      ))}
    </div>
  );
}

export default GlobalAnnouncementBanner;
