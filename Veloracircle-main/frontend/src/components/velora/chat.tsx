import { ReadReceipt } from "@/components/velora/ReadReceipt";
import { VeloraEmojiPicker } from "@/components/velora/EmojiPicker";
import { AttachmentPicker } from "@/components/velora/AttachmentPicker";
import { VoiceRecorder } from "@/components/velora/VoiceRecorder";
import {
  Bookmark,
  Copy,
  CornerUpLeft,
  FileText,
  Forward,
  Mic,
  MoreHorizontal,
  Play,
  Plus,
  Send,
  Smile,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Avatar,
  IconButton,
} from "@/components/velora/primitives";

import type { Conversation } from "@/lib/mock-data";

import { cn } from "@/lib/utils";

/* =====================================================
   CONVERSATION ITEM
===================================================== */

export function ConversationItem({
  conversation,
  active,
  onSelect,
}: {
  conversation: Conversation;
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={
        active ? "true" : undefined
      }
      className={cn(
        "focus-visible:ring-ring grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all duration-200 outline-none focus-visible:ring-2",
        active
          ? "border-border bg-surface-2/80"
          : "hover:bg-accent/50",
      )}
    >
      <Avatar
        initials={conversation.initials}
        size="md"
        tone={
          active ? "brand" : "default"
        }
      />

      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">
          {conversation.name}
        </span>

        <span className="text-muted-foreground block truncate text-xs">
          {conversation.preview}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-muted-foreground text-[11px]">
          {conversation.time}
        </span>

        {conversation.unread ? (
          <span className="bg-primary text-primary-foreground min-w-5 rounded-full px-1.5 text-center text-[10px] leading-[18px] font-semibold">
            {conversation.unread}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* =====================================================
   MESSAGE ACTIONS
   Delete is ONLY available inside three-dot menu.
===================================================== */

function MessageActions({
  onDelete,
  onSave,
}: {
  onDelete?: () => void;
  onSave?: () => void;
}) {
  const act = (label: string) => {
    toast(label, {
      description: "Mock action",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Message actions"
          className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <MoreHorizontal
            className="h-4 w-4"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-40"
      >
        <DropdownMenuItem
          onSelect={() =>
            act("Reply")
          }
        >
          <CornerUpLeft className="h-4 w-4" />
          Reply
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() =>
            act("Reaction added")
          }
        >
          <Smile className="h-4 w-4" />
          React
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() =>
            act("Copied")
          }
        >
          <Copy className="h-4 w-4" />
          Copy
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() => {
            if (onSave) {
              onSave();
            }
          }}
        >
          <Bookmark className="h-4 w-4" />
          Save
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() =>
            act("Forwarded")
          }
        >
          <Forward className="h-4 w-4" />
          Forward
        </DropdownMenuItem>

        {onDelete ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() =>
              onDelete()
            }
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* =====================================================
   MESSAGE BUBBLE
===================================================== */

export function MessageBubble({
  message,
  onDelete,
  onSave,
}: {
  message: {
    id: string;
    author: string;
    body: string;
    time: string;
    initials: string;
    self: boolean;
    isRead?: boolean;
    kind?: "text" | "file" | "voice";
    file?: {
      name: string;
      size: string;
      url: string;
    };
    replyTo?: {
      author: string;
      body: string;
    };
    reactions?: {
      emoji: string;
      count: number;
    }[];
  };
  onDelete?: () => void;
  onSave?: () => void;
}) {
  const self = message.self;

  console.log(
    "BUBBLE VOICE CHECK:",
    message.kind,
    message.file,
  );

  const [showFileMenu, setShowFileMenu] =
    useState(false);

  /*
    Listen for another file menu opening.
    This makes sure only one file menu
    can stay open at a time.
  */
  useEffect(() => {
    const handleOtherFileMenu = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<string>;

      if (
        customEvent.detail !==
        message.id
      ) {
        setShowFileMenu(false);
      }
    };

    window.addEventListener(
      "velora-file-menu-open",
      handleOtherFileMenu,
    );

    return () => {
      window.removeEventListener(
        "velora-file-menu-open",
        handleOtherFileMenu,
      );
    };
  }, [message.id]);

  const toggleFileMenu = () => {
    if (!showFileMenu) {
      window.dispatchEvent(
        new CustomEvent(
          "velora-file-menu-open",
          {
            detail: message.id,
          },
        ),
      );
    }

    setShowFileMenu(
      (current) => !current,
    );
  };

  return (
    <div
      className={cn(
        "animate-velora-in group flex w-full gap-3",
        self
          ? "flex-row-reverse"
          : "flex-row",
      )}
    >
      <Avatar
        initials={message.initials}
        size="sm"
        tone={
          self ? "brand" : "default"
        }
      />

      <div
        className={cn(
          "flex min-w-0 max-w-[min(560px,82%)] flex-col",
          self && "items-end",
        )}
      >
        <div className="text-muted-foreground mb-1 flex items-center gap-2 text-[11px]">
          <span className="text-foreground/70 font-medium">
            {self ? "You" : message.author}
          </span>

          <span>
            {message.time}
          </span>

          {self ? (
            <MessageActions
              {...(onDelete
                ? { onDelete }
                : {})}
              {...(onSave
                ? { onSave }
                : {})}
            />
          ) : (
            <MessageActions
              {...(onSave
                ? { onSave }
                : {})}
            />
          )}
        </div>

        {message.replyTo ? (
          <div className="border-primary/50 bg-surface-2/50 text-muted-foreground mb-1.5 max-w-full truncate rounded-lg border-l-2 px-3 py-1.5 text-[11px]">
            <span className="text-foreground/70 font-medium">
              {message.replyTo.author}:{" "}
            </span>

            {message.replyTo.body}
          </div>
        ) : null}

        <div
          className={cn(
            "rounded-2xl border px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm transition-shadow",
            self
              ? "border-primary/30 bg-primary/15 rounded-tr-md"
              : "border-border bg-surface rounded-tl-md",
          )}
        >
          {message.kind === "file" &&
            message.file ? (
            <div className="border-border bg-surface-2/70 mb-2 flex items-center gap-3 rounded-xl border p-2.5">
              <span className="bg-primary/10 text-primary grid h-9 w-9 shrink-0 place-items-center rounded-lg">
                <FileText
                  className="h-4 w-4"
                  aria-hidden
                />
              </span>

              <div className="min-w-0">
                <span className="block truncate text-xs font-medium">
                  {message.file.name}
                </span>

                <span className="text-muted-foreground block text-[11px]">
                  {message.file.size}
                </span>

                <div className="mt-1">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      className="text-primary text-xs font-medium hover:underline"
                      onClick={
                        toggleFileMenu
                      }
                    >
                      Download
                    </button>

                    {showFileMenu ? (
                      <div className="bg-background border-border absolute bottom-full left-0 z-50 mb-2 w-28 overflow-hidden rounded-lg border shadow-lg">
                        <button
                          type="button"
                          className="hover:bg-muted block w-full px-3 py-2 text-left text-xs"
                          onClick={async () => {
                            setShowFileMenu(
                              false,
                            );

                            try {
                              const response =
                                await fetch(
                                  message.file
                                    ?.url ||
                                  "",
                                );

                              if (
                                !response.ok
                              ) {
                                throw new Error(
                                  "Failed to open file",
                                );
                              }

                              const blob =
                                await response.blob();

                              const blobUrl =
                                URL.createObjectURL(
                                  blob,
                                );

                              window.open(
                                blobUrl,
                                "_blank",
                                "noopener,noreferrer",
                              );

                              setTimeout(
                                () => {
                                  URL.revokeObjectURL(
                                    blobUrl,
                                  );
                                },
                                60000,
                              );
                            } catch (error) {
                              console.error(
                                "Open file error:",
                                error,
                              );
                            }
                          }}
                        >
                          Open
                        </button>

                        <button
                          type="button"
                          className="hover:bg-muted block w-full px-3 py-2 text-left text-xs"
                          onClick={async () => {
                            setShowFileMenu(
                              false,
                            );

                            try {
                              const response =
                                await fetch(
                                  message.file
                                    ?.url ||
                                  "",
                                );

                              if (
                                !response.ok
                              ) {
                                throw new Error(
                                  "Failed to download file",
                                );
                              }

                              const blob =
                                await response.blob();

                              const fileHandle =
                                await window.showSaveFilePicker(
                                  {
                                    suggestedName:
                                      message.file
                                        ?.name ||
                                      "download",
                                  },
                                );

                              const writable =
                                await fileHandle.createWritable();

                              await writable.write(
                                blob,
                              );

                              await writable.close();
                            } catch (error) {
                              if (
                                error instanceof
                                DOMException &&
                                error.name ===
                                "AbortError"
                              ) {
                                return;
                              }

                              console.error(
                                "Save file error:",
                                error,
                              );
                            }
                          }}
                        >
                          Save as
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {message.kind === "voice" ? (
            <audio
              controls
              src={message.file?.url || ""}
              className="h-9 max-w-[260px]"
            />
          ) : (
            message.body
          )}
        </div>

        <div className="text-muted-foreground mt-1 flex items-center text-[11px]">
          <span>
            {message.time}
          </span>

          {self ? (
            <ReadReceipt
              isRead={Boolean(
                message.isRead,
              )}
            />
          ) : null}
        </div>

        {message.reactions ? (
          <div className="mt-1.5 flex gap-1.5">
            {message.reactions.map(
              (reaction) => (
                <span
                  key={reaction.emoji}
                  className="border-border bg-surface-2/70 text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]"
                >
                  {reaction.emoji}{" "}
                  {reaction.count}
                </span>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* =====================================================
   MESSAGE COMPOSER
===================================================== */

export function MessageComposer({
  placeholder = "Message…",
  conversationId,
  onMessageSent,
}: {
  placeholder?: string;
  conversationId: string;
  onMessageSent: (
    message: any,
  ) => void;
}) {
  const [value, setValue] =
    useState("");

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [showVoiceRecorder, setShowVoiceRecorder] =
    useState(false);

  const send = async () => {
    const text = value.trim();

    if (!text) {
      return;
    }

    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      toast.error(
        "Please log in again",
      );
      return;
    }

    if (!conversationId) {
      toast.error(
        "Please select a conversation",
      );
      return;
    }

    try {
      const response =
        await fetch(
          "/api/messages",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              conversationId,
              text,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.message ||
          "Failed to send message",
        );
        return;
      }

      setValue("");

      onMessageSent(
        data.data ??
        data.message ??
        data,
      );

      toast.success(
        "Message sent",
      );
    } catch (error) {
      console.error(
        "Send message error:",
        error,
      );

      toast.error(
        "Unable to send message",
      );
    }
  };

  return (
    <>
      {showEmojiPicker ? (
        <div className="mb-2 flex justify-end">
          <VeloraEmojiPicker
            onEmojiSelect={(emoji) => {
              setValue(
                (currentValue) =>
                  currentValue + emoji,
              );
            }}
          />
        </div>
      ) : null}
      {showVoiceRecorder ? (
        <div className="mb-2">
          <VoiceRecorder
            onCancel={() =>
              setShowVoiceRecorder(false)
            }
            onRecorded={async (audioBlob) => {
              const token =
                localStorage.getItem("token");

              if (!token) {
                toast.error(
                  "Please log in again",
                );

                return;
              }

              if (!conversationId) {
                toast.error(
                  "Please select a conversation first",
                );

                return;
              }

              try {
                const formData =
                  new FormData();

                formData.append(
                  "conversationId",
                  conversationId,
                );

                formData.append(
                  "file",
                  audioBlob,
                  `voice-${Date.now()}.webm`,
                );

                const response =
                  await fetch(
                    "/api/messages/voice",
                    {
                      method: "POST",

                      headers: {
                        Authorization: `Bearer ${token}`,
                      },

                      body: formData,
                    },
                  );

                const data =
                  await response.json();

                if (!response.ok) {
                  throw new Error(
                    data.message ||
                    "Failed to send voice message",
                  );
                }

                onMessageSent(
                  data.message,
                );

                setShowVoiceRecorder(false);

                toast.success(
                  "Voice message sent",
                );
              } catch (error) {
                console.error(
                  "Voice message error:",
                  error,
                );

                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to send voice message",
                );
              }
            }}
          />
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="border-border bg-surface/80 safe-bottom border-t p-3 backdrop-blur-xl sm:p-4"
      >
        <div className="border-border bg-surface-2/60 focus-within:border-primary/40 flex items-end gap-1.5 rounded-2xl border p-1.5 transition-colors">
          <IconButton
            icon={Plus}
            label="More options"
            className="h-9 w-9"
          />

          <AttachmentPicker
            conversationId={conversationId}
            onFileSent={(message) => {
              onMessageSent(message);
            }}
          />

          <label
            className="sr-only"
            htmlFor="composer"
          >
            Write a message
          </label>

          <textarea
            id="composer"
            rows={1}
            value={value}
            onChange={(event) =>
              setValue(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder={placeholder}
            className="placeholder:text-muted-foreground max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          />

          <IconButton
            icon={Smile}
            label="Emoji"
            className="hidden h-9 w-9 sm:inline-flex"
            onClick={() =>
              setShowEmojiPicker(
                (current) => !current,
              )
            }
          />

          <IconButton
            icon={Mic}
            label="Record voice message"
            className="h-9 w-9"
            onClick={() =>
              setShowVoiceRecorder(true)
            }
          />

          <button
            type="submit"
            aria-label="Send message"
            className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 outline-none hover:brightness-110 active:scale-95 focus-visible:ring-2"
          >
            <Send
              className="h-4 w-4"
              aria-hidden
            />
          </button>
        </div>
      </form>
    </>
  );
}