"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WSIncomingMessage } from "@/app/types/websocket";

interface UseRescueWebSocketOptions {
  url?: string;
  onMessage?: (msg: WSIncomingMessage) => void;
}

export function useRescueWebSocket({
  url = "ws://localhost:3001",
  onMessage,
}: UseRescueWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setIsDemoMode(false);
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WSIncomingMessage = JSON.parse(event.data);
          onMessage?.(parsed);
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsDemoMode(true);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      socketRef.current = ws;
    } catch {
      setIsConnected(false);
      setIsDemoMode(true);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  return { isConnected, isDemoMode };
}
