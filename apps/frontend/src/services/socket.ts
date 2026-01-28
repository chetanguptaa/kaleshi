import { io, Socket } from "socket.io-client";

type MarketId = number;

class SocketService {
  private socket: Socket;
  private subscribedMarkets = new Set<MarketId>();
  private isConnected = false;

  constructor() {
    const url = import.meta.env.VITE_WS_URL ?? "http://localhost:3000";
    this.socket = io(url, {
      transports: ["websocket"],
      autoConnect: false,
    });
    this.registerCoreListeners();
  }

  private registerCoreListeners() {
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.subscribedMarkets.forEach((marketId) => {
        this.socket.emit("subscribeMarket", { marketId });
      });
    });
    this.socket.on("disconnect", () => {
      this.isConnected = false;
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  subscribeToMarket(marketId: number, accountId: number | null): Promise<void> {
    this.connect();
    if (this.subscribedMarkets.has(marketId)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.socket.emit(
        "subscribeMarket",
        { marketId },
        (response: { success: boolean }) => {
          if (!response?.success) {
            reject();
            return;
          }
          this.subscribedMarkets.add(marketId);
          if (accountId) {
            this.socket.emit("registerAccount", { accountId });
          }
          resolve();
        },
      );
    });
  }

  unsubscribeFromMarket(marketId: MarketId, accountId: number | null) {
    if (!this.subscribedMarkets.has(marketId)) {
      return;
    }
    this.subscribedMarkets.delete(marketId);
    this.socket.emit("unsubscribeMarket", { marketId });
    if (accountId) {
      this.socket.emit("unregisterAccount", { accountId });
    }
  }

  on<T>(event: string, handler: (payload: T) => void) {
    this.socket.on(event, handler);
  }

  off(event: string, handler?: (...args: any[]) => void) {
    this.socket.off(event, handler);
  }

  emit<T>(event: string, payload: T) {
    this.socket.emit(event, payload);
  }
}

export const socketService = new SocketService();
