import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  messageSocket,
  connectMessageSocket,
} from "@/socket";

type UseMarkMessagesAsReadProps = {
  activeId: string | null;
};

export function useMarkMessagesAsRead({
  activeId,
}: UseMarkMessagesAsReadProps) {
  const lastMarkedConversation =
    useRef<string | null>(null);

  useEffect(() => {
    connectMessageSocket();

    return () => {
      // Do not disconnect the shared message socket here.
      // Other realtime features may still be using it.
    };
  }, []);

  const markMessagesAsRead =
    useCallback(() => {
      if (!activeId) {
        return;
      }

      const currentUser =
        JSON.parse(
          localStorage.getItem(
            "user",
          ) || "{}",
        );

      const currentUserId =
        currentUser.id ||
        currentUser._id;

      if (!currentUserId) {
        return;
      }

      const emitReadReceipt = () => {
        messageSocket.emit(
          "markMessagesAsRead",
          {
            conversationId:
              activeId,
            userId:
              currentUserId,
          },
        );

        lastMarkedConversation.current =
          activeId;
      };

      if (messageSocket.connected) {
        emitReadReceipt();
        return;
      }

      messageSocket.once(
        "connect",
        emitReadReceipt,
      );
    }, [activeId]);

  const markIfNeeded =
    useCallback(() => {
      if (
        !activeId ||
        lastMarkedConversation.current ===
          activeId
      ) {
        return;
      }

      markMessagesAsRead();
    }, [
      activeId,
      markMessagesAsRead,
    ]);

  return {
    markMessagesAsRead,
    markIfNeeded,
  };
}