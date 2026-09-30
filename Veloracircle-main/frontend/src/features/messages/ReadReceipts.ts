export type ReadReceiptMessage = {
  _id: string;
  sender: {
    _id: string;
  };
  readBy?: string[];
};

export const isMessageRead = (
  message: ReadReceiptMessage,
  currentUserId: string,
): boolean => {
  if (!message.readBy) {
    return false;
  }

  return message.readBy.includes(currentUserId);
};

