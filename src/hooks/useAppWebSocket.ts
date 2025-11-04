import { useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";

const getUserToken = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    return userData?.access_token || null;
  } catch {
    return null;
  }
};

export const useAppWebSocket = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const token = useMemo(() => getUserToken(), []);
  const socketUrl = process.env.NEXT_PUBLIC_WS;

  const socketUrlWithToken = useMemo(() => {
    if (!token || !socketUrl) return null;
    return clientId
      ? `${socketUrl}?client_id=${clientId}&token=${token}`
      : `${socketUrl}?is_create_client_id=true&token=${token}`;
  }, [clientId, token, socketUrl]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    socketUrlWithToken || "",
    {
      shouldReconnect: () => true,
      onMessage: (event) => {
        try {
          if (event.data === "pong") return;
          // console.log("event", event);
          const data = JSON.parse(event.data);
          if (data?.client_id && !clientId) {
            setClientId(data.client_id);
          }
        } catch {
          console.error("Error: " + event.data);
        }
      },
      share: true,
    }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (readyState === WebSocket.OPEN) {
        sendMessage("ping");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [readyState, sendMessage]);

  return { sendMessage, lastMessage, readyState, clientId, setClientId };
};
