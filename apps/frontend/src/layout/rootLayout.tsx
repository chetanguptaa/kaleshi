import Footer from "@/components/footer/footer";
import { useSocketEvent } from "@/hooks/use-socket-event";
import {
  OrderCancelledSocketEvent,
  OrderFilledSocketEvent,
  OrderPartialSocketEvent,
  OrderPlacedSocketEvent,
  OrderRejectedSocketEvent,
  TradeSocketEvent,
} from "@/lib/common";
import { TGetCurrentUserResponse } from "@/schemas/layout/schema";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function RootLayout({
  children,
  isPrivate = true,
  currentUser,
}: {
  children: React.ReactNode;
  isPrivate: boolean;
  currentUser: TGetCurrentUserResponse | null;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isPrivate) return;
    if (!currentUser?.user || !currentUser.success) {
    }
  }, [isPrivate, currentUser, navigate]);

  const handleOrderPlaced = useCallback(
    (event: OrderPlacedSocketEvent) => {
      if (
        !currentUser?.user ||
        !currentUser.success ||
        !currentUser?.user?.accountId
      )
        return;
      if (currentUser?.user?.accountId === event.account_id) {
        toast("Order placed successfully");
      }
    },
    [currentUser?.success, currentUser?.user],
  );

  useSocketEvent<OrderPlacedSocketEvent>("order.placed", handleOrderPlaced);

  const handleOrderFilled = useCallback(
    (event: OrderFilledSocketEvent) => {
      if (
        !currentUser?.user ||
        !currentUser.success ||
        !currentUser?.user?.accountId
      )
        return;
      if (currentUser?.user?.accountId === event.account_id) {
        toast("Order filled successfully " + event.order_id);
      }
    },
    [currentUser?.success, currentUser?.user],
  );

  useSocketEvent<OrderFilledSocketEvent>("order.filled", handleOrderFilled);

  const handleOrderCancelled = useCallback(
    (event: OrderCancelledSocketEvent) => {
      if (
        !currentUser?.user ||
        !currentUser.success ||
        !currentUser?.user?.accountId
      )
        return;
      if (currentUser?.user?.accountId === event.account_id) {
        toast("Order cancelled successfully " + event.order_id);
      }
    },
    [currentUser?.success, currentUser?.user],
  );

  useSocketEvent<OrderCancelledSocketEvent>(
    "order.cancelled",
    handleOrderCancelled,
  );

  const handleOrderPartial = useCallback(
    (event: OrderPartialSocketEvent) => {
      if (
        !currentUser?.user ||
        !currentUser.success ||
        !currentUser?.user?.accountId
      )
        return;
      if (currentUser?.user?.accountId === event.account_id) {
        toast(
          "Order partially filled successfully " +
            event.order_id +
            " Placed: " +
            event.quantity +
            " Remaining: " +
            event.remaining,
        );
      }
    },
    [currentUser?.success, currentUser?.user],
  );

  useSocketEvent<OrderPartialSocketEvent>("order.partial", handleOrderPartial);

  const handleOrderRejected = useCallback(
    (event: OrderRejectedSocketEvent) => {
      if (
        !currentUser?.user ||
        !currentUser.success ||
        !currentUser?.user?.accountId
      )
        return;
      if (currentUser?.user?.accountId === event.account_id) {
        toast(
          "Your order request has been rejected, and your funds have been returned.",
        );
      }
    },
    [currentUser?.success, currentUser?.user],
  );

  useSocketEvent<OrderRejectedSocketEvent>(
    "order.rejected",
    handleOrderRejected,
  );

  const handleTrade = useCallback(
    (event: TradeSocketEvent) => {
      if (
        !currentUser?.user ||
        !currentUser.success ||
        !currentUser?.user?.accountId
      )
        return;
      if (currentUser?.user?.accountId === event.filled_account_id) {
        toast(
          "Order filled successfully " +
            event.trade_id +
            " Placed: " +
            event.quantity +
            " Remaining: " +
            event.remaining,
        );
      }
    },
    [currentUser?.success, currentUser?.user],
  );

  useSocketEvent<TradeSocketEvent>("trade", handleTrade);

  return (
    <div className="bg-background">
      <div className="flex-1 overflow-hidden pb-20">{children}</div>
      <Footer />
    </div>
  );
}
