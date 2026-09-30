import EmojiPicker, {
  type EmojiClickData,
} from "emoji-picker-react";

export function VeloraEmojiPicker({
  onEmojiSelect,
}: {
  onEmojiSelect: (emoji: string) => void;
}) {
  const handleEmojiClick = (
    emojiData: EmojiClickData,
  ) => {
    onEmojiSelect(emojiData.emoji);
  };

  return (
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
      width={320}
      height={400}
      lazyLoadEmojis
    />
  );
}