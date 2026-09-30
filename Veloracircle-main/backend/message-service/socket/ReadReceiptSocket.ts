import { Server, Socket } from "socket.io";

import {
  markConversationMessagesAsRead,
} from "../features/messages/ReadReceipts";

export const registerReadReceiptSocket = (
  io: Server,
  socket: Socket,
) => {
  socket.on(
    "markMessagesAsRead",
    async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      try {
        const messageIds =
          await markConversationMessagesAsRead({
            conversationId,
            userId,
          });

        if (messageIds.length === 0) {
          return;
        }

        io.to(
          `conversation:${conversationId}`,
        ).emit("messagesRead", {
          conversationId,
          userId,
          messageIds,
        });
      } catch (error) {
        console.error(
          "Read receipt socket error:",
          error,
        );
      }
    },
  );
};