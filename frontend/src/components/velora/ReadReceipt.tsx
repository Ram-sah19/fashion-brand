type ReadReceiptProps = {
  isRead: boolean;
};

export function ReadReceipt({
  isRead,
}: ReadReceiptProps) {
  return (
    <span
      className="ml-1 text-[11px]"
      title={isRead ? "Read" : "Sent"}
      aria-label={isRead ? "Read" : "Sent"}
    >
      {isRead ? "✓✓" : "✓"}
    </span>
  );
}



