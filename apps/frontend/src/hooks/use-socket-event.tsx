import { socketService } from "@/services/socket";
import { useEffect } from "react";

export function useSocketEvent<T>(
  event: string,
  handler: (payload: T) => void,
) {
  useEffect(() => {
    socketService.on<T>(event, handler);
    return () => {
      socketService.off(event, handler);
    };
  }, [event, handler]);
}
