import mongoose from "mongoose";

import Message from "../../models/Message";

type ReadReceiptPayload = {
  conversationId: string;
  userId: string;
};

export const markConversationMessagesAsRead = async ({
  conversationId,
  userId,
}: ReadReceiptPayload): Promise<string[]> => {
  if (
    !mongoose.isValidObjectId(conversationId) ||
    !mongoose.isValidObjectId(userId)
  ) {
    return [];
  }

  const userObjectId =
    new mongoose.Types.ObjectId(userId);

  const unreadMessages = await Message.find({
    conversation: conversationId,
    sender: { $ne: userObjectId },
    readBy: { $ne: userObjectId },
  }).select("_id");

  if (unreadMessages.length === 0) {
    return [];
  }

  const messageIds = unreadMessages.map(
    (message) => message._id.toString(),
  );

  await Message.updateMany(
    {
      _id: {
        $in: unreadMessages.map(
          (message) => message._id,
        ),
      },
    },
    {
      $addToSet: {
        readBy: userObjectId,
      },
    },
  );

  return messageIds;
};