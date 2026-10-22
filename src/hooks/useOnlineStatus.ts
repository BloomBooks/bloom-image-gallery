import { useEffect, useState } from "react";

// Whether the browser thinks it has a network connection, kept current by the online/offline
// events. This reliably notices Wi-Fi turned off or a cable unplugged, but not a network that
// is up with no real internet behind it, so treat it as a hint only.
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return isOnline;
}
