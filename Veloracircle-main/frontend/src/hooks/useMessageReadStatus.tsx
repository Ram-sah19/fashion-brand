import { useEffect } from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";

import { messageSocket } from "@/socket";

type ReadStatusMessage = {
  _id: string;
  readBy?: string[];
};

type UseMessageReadStatusProps<
  T extends ReadStatusMessage,
> = {
  activeId: string | null | undefined;
  setBackendMessages: Dispatch<
    SetStateAction<T[]>
  >;
};

export function useMessageReadStatus<
  T extends ReadStatusMessage,
>({
  activeId,
  setBackendMessages,
}: UseMessageReadStatusProps<T>) {
  useEffect(() => {
    const handleMessagesRead = ({
      conversationId,
      userId,
      messageIds,
    }: {
      conversationId: string;
      userId: string;
      messageIds: string[];
    }) => {
      if (conversationId !== activeId) {
        return;
      }

      setBackendMessages((previous) =>
        previous.map((message) => {
          if (!messageIds.includes(message._id)) {
            return message;
          }

          const readBy = message.readBy ?? [];

          if (readBy.includes(userId)) {
            return message;
          }

          return {
            ...message,
            readBy: [...readBy, userId],
          };
        }),
      );
    };

    messageSocket.on(
      "messagesRead",
      handleMessagesRead,
    );

    return () => {
      messageSocket.off(
        "messagesRead",
        handleMessagesRead,
      );
    };
  }, [activeId, setBackendMessages]);
}


