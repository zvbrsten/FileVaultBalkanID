// WebSocket message dispatcher for custom events
class WebSocketDispatcher {
  private static instance: WebSocketDispatcher;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    // Listen for WebSocket messages from the useWebSocket hook
    window.addEventListener('websocket-message', this.handleMessage.bind(this) as EventListener);
  }

  public static getInstance(): WebSocketDispatcher {
    if (!WebSocketDispatcher.instance) {
      WebSocketDispatcher.instance = new WebSocketDispatcher();
    }
    return WebSocketDispatcher.instance;
  }

  private handleMessage(event: Event) {
    const customEvent = event as CustomEvent;
    const message = customEvent.detail;
    const listeners = this.listeners.get(message.type);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message.data);
        } catch (error) {
          console.error('Error in WebSocket message listener:', error);
        }
      });
    }
  }

  public addEventListener(type: string, listener: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  public removeEventListener(type: string, listener: (data: any) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  public dispatch(type: string, data: any) {
    const event = new CustomEvent('websocket-message', {
      detail: { type, data }
    });
    window.dispatchEvent(event);
  }
}

export default WebSocketDispatcher.getInstance();