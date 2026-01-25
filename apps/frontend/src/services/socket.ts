import { io, Socket } from "socket.io-client";

type MarketId = number;
type OutcomeId = string;
type AccountId = string;

class SocketService {
  private socket: Socket;
  private subscribedMarkets = new Set<MarketId>();
  private subscribedOutcomes = new Set<OutcomeId>();
  private accounts = new Set<AccountId>();
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
      this.accounts.forEach((accountId) => {
        this.socket.emit("registerAccount", { accountId });
      });
      this.subscribedMarkets.forEach((marketId) => {
        this.socket.emit("subscribeMarket", { marketId });
      });
      this.subscribedOutcomes.forEach((outcomeId) => {
        this.socket.emit("subscribeOutcome", { outcomeId });
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

  registerAccount(accountId: string | null): Promise<void> {
    if (!accountId) return;
    this.connect();
    if (this.accounts.has(accountId)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.socket.emit(
        "registerAccount",
        { accountId },
        (response: { success: boolean }) => {
          if (!response?.success) {
            reject();
            return;
          }
          resolve();
        },
      );
    });
  }

  unregisterAccount(accountId: string | null): Promise<void> {
    if (!this.accounts.has(accountId)) {
      return;
    }
    this.accounts.delete(accountId);
    this.socket.emit("unregisterAccount", { accountId });
  }

  subscribeToMarket(marketId: number): Promise<void> {
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
          resolve();
        },
      );
    });
  }

  unsubscribeFromMarket(marketId: MarketId) {
    if (!this.subscribedMarkets.has(marketId)) {
      return;
    }
    this.subscribedMarkets.delete(marketId);
    this.socket.emit("unsubscribeMarket", { marketId });
  }

  subscribeToOutcome(outcomeId: string): Promise<void> {
    this.connect();
    if (this.subscribedOutcomes.has(outcomeId)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.socket.emit(
        "subscribeOutcome",
        { outcomeId },
        (response: { success: boolean }) => {
          if (!response?.success) {
            reject();
            return;
          }
          this.subscribedOutcomes.add(outcomeId);
          resolve();
        },
      );
    });
  }

  unsubscribeFromOutcome(outcomeId: OutcomeId) {
    if (!this.subscribedOutcomes.has(outcomeId)) {
      return;
    }
    this.subscribedOutcomes.delete(outcomeId);
    this.socket.emit("unsubscribeOutcome", { outcomeId });
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
