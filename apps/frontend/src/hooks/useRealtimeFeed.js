import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useRealtimeFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      reconnectionAttempts: 3,
      timeout: 5000
    });

    function pushEvent(type, payload) {
      setEvents((current) => [{ id: crypto.randomUUID(), type, payload }, ...current].slice(0, 20));
    }

    socket.on("system:ready", (payload) => pushEvent("system", payload));
    socket.on("dashboard:update", (payload) => pushEvent("dashboard", payload));
    socket.on("alert:new", (payload) => pushEvent("alert", payload));
    socket.on("connect_error", () => {
      // Keep the UI quiet when the lightweight backend is running without socket support.
    });

    return () => socket.close();
  }, []);

  return events;
}
