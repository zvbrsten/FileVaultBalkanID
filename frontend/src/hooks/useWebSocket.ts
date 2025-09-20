import { useEffect, useRef, useState, useCallback } from 'react';
import websocketDispatcher from '../utils/websocketDispatcher';

export interface WebSocketMessage {
  type: string;
  data: any;
  userId?: string;
  room?: string;
}

export interface WebSocketHook {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  error: string | null;
}

export const useWebSocket = (url: string): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setConnectionStatus('error');
        return;
      }

      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully to:', wsUrl);
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Dispatch the message to the dispatcher
          websocketDispatcher.dispatch(message.type, message.data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason, 'URL:', wsUrl);
        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to reconnect after multiple attempts');
          setConnectionStatus('error');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error for URL:', wsUrl, error);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('error');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }, []);

  useEffect(() => {
    // Only connect if we have a token
    const token = localStorage.getItem('token');
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    lastMessage,
    error
  };
};