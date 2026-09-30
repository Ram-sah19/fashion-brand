import { useEffect } from "react";

import { messageSocket } from "@/socket";

type RealtimeMessage = {
  _id: string;

  conversation: string;

  sender: {
    _id: string;
    name: string;
    email: string;
  };

  type: "text" | "file" | "voice";

  text?: string;

  file?: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
  };

  createdAt: string;

  readBy?: string[];
};

type UseRealtimeMessagesProps = {
  activeId: string | null;

  setBackendMessages: React.Dispatch<
    React.SetStateAction<RealtimeMessage[]>
  >;

  onIncomingMessage?: (
    message: RealtimeMessage,
  ) => void;
};

export function useRealtimeMessages({
  activeId,
  setBackendMessages,
  onIncomingMessage,
}: UseRealtimeMessagesProps) {
  useEffect(() => {
    if (!activeId) {
      return;
    }

    const handleNewMessage = (
      message: RealtimeMessage,
    ) => {
      if (
        message.conversation !==
        activeId
      ) {
        return;
      }

      setBackendMessages(
        (previous) => {
          const alreadyExists =
            previous.some(
              (existing) =>
                existing._id ===
                message._id,
            );

          if (alreadyExists) {
            return previous;
          }

          return [
            ...previous,
            message,
          ];
        },
      );

      onIncomingMessage?.(
        message,
      );
    };

    messageSocket.on(
      "newMessage",
      handleNewMessage,
    );

    return () => {
      messageSocket.off(
        "newMessage",
        handleNewMessage,
      );
    };
  }, [
    activeId,
    setBackendMessages,
    onIncomingMessage,
  ]);
}
