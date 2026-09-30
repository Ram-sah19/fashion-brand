import { createFileRoute } from "@tanstack/react-router";

import { useMessageReadStatus } from "@/hooks/UseMessageReadStatus";
import { useRealtimeMessages } from "@/hooks/UseRealtimeMessages";
import { useMarkMessagesAsRead } from "@/hooks/UseMarkMessagesAsRead";
import { useCall } from "@/hooks/UseCall";

import { CallScreen } from "@/features/calls/components/CallScreen";
import { IncomingCall } from "@/features/calls/components/IncomingCall";

import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Video,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { AppShell } from "@/components/velora/app-shell";

import {
  MessageBubble,
  MessageComposer,
} from "@/components/velora/chat";

import {
  IconButton,
  PrivacyBadge,
} from "@/components/velora/primitives";

import { cn } from "@/lib/utils";

import { messageSocket } from "@/socket";

export const Route =
  createFileRoute("/messages")({
    head: () => ({
      meta: [
        {
          title:
            "Messages — Velora Circle",
        },
        {
          name: "description",
          content:
            "Private one-to-one and Circle conversations with hidden participant information and encrypted delivery.",
        },
        {
          property: "og:title",
          content:
            "Messages — Velora Circle",
        },
        {
          property: "og:description",
          content:
            "Private conversations without unnecessary visibility.",
        },
      ],
    }),

    component: MessagesPage,
  });

/* =====================================================
   TYPES
===================================================== */

type BackendMessage = {
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

type BackendConversation = {
  id: string;

  type: "direct";

  unreadCount: number;

  pinned: boolean;

  otherUser: {
    id: string;
    name: string;
    email: string;
  } | null;

  latestMessage: {
    text: string;
    createdAt: string;
    sender: string;
  } | null;
};

type SearchUser = {
  _id: string;
  name: string;
  email: string;
};

/* =====================================================
   PAGE
===================================================== */

function MessagesPage() {
  const {
    callState,
    localStreamRef,
    remoteStreamRef,
    startCall,
    acceptCall,
    rejectCall,
    inviteUsers,
    toggleMute,
    toggleCamera,
    endCall,
  } = useCall();

  const [
    backendConversations,
    setBackendConversations,
  ] = useState<BackendConversation[]>(
    [],
  );

  const [
    backendMessages,
    setBackendMessages,
  ] = useState<BackendMessage[]>(
    [],
  );

  const [activeId, setActiveId] =
    useState<string | null>(null);

  useMessageReadStatus({
    activeId,
    setBackendMessages,
  });

  const {
    markMessagesAsRead,
    markIfNeeded,
  } = useMarkMessagesAsRead({
    activeId,
  });

  useRealtimeMessages({
    activeId,
    setBackendMessages,
  });

  const [tab, setTab] =
    useState("all");

  const [query, setQuery] =
    useState("");

  const [
    messageSearch,
    setMessageSearch,
  ] = useState("");

  const [
    showMessageSearch,
    setShowMessageSearch,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    showNewConversation,
    setShowNewConversation,
  ] = useState(false);

  const [
    userSearch,
    setUserSearch,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<SearchUser[]>([]);

  const receivedMessageIds =
    useRef<Set<string>>(
      new Set(),
    );

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =====================================================
     LOAD CONVERSATIONS
  ===================================================== */

  useEffect(() => {
    const loadConversations =
      async () => {
        const token =
          localStorage.getItem(
            "token",
          );

        if (!token) {
          return;
        }

        try {
          const response =
            await fetch(
              "/api/conversations",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

          if (!response.ok) {
            throw new Error(
              "Failed to load conversations",
            );
          }

          const data =
            await response.json();

          setBackendConversations(
            data.conversations,
          );

          if (
            data.conversations.length >
            0
          ) {
            setActiveId(
              data.conversations[0].id,
            );
          }
        } catch (error) {
          console.error(
            "Failed to load conversations:",
            error,
          );
        }
      };

    void loadConversations();
  }, []);

  /* =====================================================
     LOAD MESSAGES
  ===================================================== */

  useEffect(() => {
    if (!activeId) {
      setBackendMessages([]);
      return;
    }

    const loadMessages =
      async () => {
        const token =
          localStorage.getItem(
            "token",
          );

        if (!token) {
          return;
        }

        try {
          const response =
            await fetch(
              `/api/messages/${activeId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

          if (!response.ok) {
            throw new Error(
              "Failed to load messages",
            );
          }

          const data =
            await response.json();

          setBackendMessages(
            data.data,
          );

          const currentUser =
            typeof window !==
              "undefined"
              ? JSON.parse(
                localStorage.getItem(
                  "user",
                ) || "{}",
              )
              : {};

          const currentUserId =
            currentUser.id ||
            currentUser._id;

          if (currentUserId) {
            console.log(
              "📖 Marking messages as read:",
              activeId,
            );

            setBackendConversations(
              (previous) =>
                previous.map(
                  (
                    conversation,
                  ) =>
                    conversation.id ===
                      activeId
                      ? {
                        ...conversation,
                        unreadCount: 0,
                      }
                      : conversation,
                ),
            );
            markIfNeeded();
          }
        } catch (error) {
          console.error(
            "Failed to load messages:",
            error,
          );
        }
      };

    void loadMessages();
  }, [activeId]);

  /* =====================================================
     JOIN ACTIVE CONVERSATION
  ===================================================== */

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const joinRoom = () => {
      messageSocket.emit(
        "joinConversation",
        activeId,
      );
    };

    if (messageSocket.connected) {
      joinRoom();
    } else {
      messageSocket.once(
        "connect",
        joinRoom,
      );
    }

    return () => {
      messageSocket.off(
        "connect",
        joinRoom,
      );
    };
  }, [activeId]);

  /* =====================================================
     REAL-TIME MESSAGE DELETION
  ===================================================== */

  useEffect(() => {
    const handleMessageDeleted = ({
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    }) => {
      if (
        conversationId !== activeId
      ) {
        return;
      }

      setBackendMessages(
        (previous) =>
          previous.filter(
            (message) =>
              message._id !==
              messageId,
          ),
      );
    };

    messageSocket.on(
      "messageDeleted",
      handleMessageDeleted,
    );

    return () => {
      messageSocket.off(
        "messageDeleted",
        handleMessageDeleted,
      );
    };
  }, [activeId]);

  /* =====================================================
     AUTO-SCROLL TO LATEST MESSAGE
  ===================================================== */

  useEffect(() => {
    const container =
      messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop =
      container.scrollHeight;
  }, [backendMessages]);

  /* =====================================================
     SYNC LATEST MESSAGE WITH CONVERSATION LIST
  ===================================================== */

  useEffect(() => {
    if (
      !activeId ||
      backendMessages.length === 0
    ) {
      return;
    }

    const latestMessage =
      [...backendMessages].sort(
        (a, b) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      )[0];

    if (!latestMessage) {
      return;
    }

    setBackendConversations(
      (previous) =>
        previous.map(
          (conversation) =>
            conversation.id ===
              activeId
              ? {
                ...conversation,
                latestMessage: {
                  text:
                    latestMessage.text ??
                    "",
                  createdAt:
                    latestMessage.createdAt,
                  sender:
                    latestMessage
                      .sender?._id ??
                    "",
                },
              }
              : conversation,
        ),
    );
  }, [
    backendMessages,
    activeId,
  ]);

  /* =====================================================
     SEARCH USERS
  ===================================================== */

  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearch.trim()) {
        setSearchResults([]);
        return;
      }

      const token =
        localStorage.getItem(
          "token",
        );

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/users/search?q=${encodeURIComponent(
              userSearch,
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            "Failed to search users",
          );
        }

        const data =
          await response.json();

        setSearchResults(
          data.users,
        );
      } catch (error) {
        console.error(
          "Failed to search users:",
          error,
        );

        setSearchResults([]);
      }
    };

    void searchUsers();
  }, [userSearch]);

  /* =====================================================
     ACTIVE CONVERSATION
  ===================================================== */

  const activeConversation =
    backendConversations.find(
      (conversation) =>
        conversation.id ===
        activeId,
    );

  const activeName =
    activeConversation
      ?.otherUser?.name ||
    "Select a conversation";

  const activeInitials =
    activeConversation?.otherUser?.name
      ?.slice(0, 2)
      .toUpperCase() || "VC";

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(
        localStorage.getItem(
          "user",
        ) || "{}",
      )
      : {};

  const currentUserName =
    currentUser.name ||
    "Velora User";

  /* =====================================================
     MESSAGE SEARCH
  ===================================================== */

  const filteredMessages =
    backendMessages.filter(
      (message) =>
        (message.text ?? "")
          .toLowerCase()
          .includes(
            messageSearch
              .trim()
              .toLowerCase(),
          ),
    );

  /* =====================================================
     CONVERSATION FILTER
  ===================================================== */

  const list =
    backendConversations.filter(
      (conversation) => {
        const name =
          conversation.otherUser
            ?.name || "";

        const matchesSearch =
          name
            .toLowerCase()
            .includes(
              query.toLowerCase(),
            );

        if (!matchesSearch) {
          return false;
        }

        if (tab === "unread") {
          return (
            conversation.unreadCount >
            0
          );
        }

        if (tab === "pinned") {
          return conversation.pinned;
        }

        return true;
      },
    );

  /* =====================================================
     START NEW CONVERSATION
  ===================================================== */

  const startConversation =
    async (
      user: SearchUser,
    ) => {
      const token =
        localStorage.getItem(
          "token",
        );

      if (!token) {
        toast.error(
          "Authentication required",
        );

        return;
      }

      try {
        const response =
          await fetch(
            "/api/conversations",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userId: user._id,
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to create conversation",
          );
        }

        const newConversationId =
          data.conversation.id;

        const conversationResponse =
          await fetch(
            "/api/conversations",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        if (
          !conversationResponse.ok
        ) {
          throw new Error(
            "Failed to reload conversations",
          );
        }

        const conversationData =
          await conversationResponse.json();

        setBackendConversations(
          conversationData.conversations,
        );

        setActiveId(
          newConversationId,
        );

        setShowNewConversation(
          false,
        );

        setUserSearch("");

        setSearchResults([]);

        setMobileOpen(true);
      } catch (error) {
        console.error(
          "Failed to start conversation:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to start conversation",
        );
      }
    };

  /* =====================================================
     TOGGLE PIN
  ===================================================== */

  const togglePin = async (
    conversationId: string,
  ) => {
    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      toast.error(
        "Authentication required",
      );

      return;
    }

    try {
      const response =
        await fetch(
          `/api/conversations/${conversationId}/pin`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update pin",
        );
      }

      setBackendConversations(
        (previous) =>
          previous.map(
            (conversation) =>
              conversation.id ===
                conversationId
                ? {
                  ...conversation,
                  pinned: data.pinned,
                }
                : conversation,
          ),
      );

      toast.success(
        data.pinned
          ? "Conversation pinned"
          : "Conversation unpinned",
      );
    } catch (error) {
      console.error(
        "Failed to toggle pin:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update pin",
      );
    }
  };

  /* =====================================================
     DELETE CONVERSATION
  ===================================================== */

  const deleteConversation =
    async (
      conversationId: string,
    ) => {
      const token =
        localStorage.getItem(
          "token",
        );

      if (!token) {
        toast.error(
          "Authentication required",
        );

        return;
      }

      try {
        const response =
          await fetch(
            `/api/conversations/${conversationId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to delete conversation",
          );
        }

        setBackendConversations(
          (previous) =>
            previous.filter(
              (conversation) =>
                conversation.id !==
                conversationId,
            ),
        );

        if (
          activeId ===
          conversationId
        ) {
          setActiveId(null);
          setBackendMessages([]);
          setMobileOpen(false);
        }

        toast.success(
          "Conversation deleted",
        );
      } catch (error) {
        console.error(
          "Failed to delete conversation:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete conversation",
        );
      }
    };

  /* =====================================================
     DELETE MESSAGE
  ===================================================== */

  const deleteMessage = async (
    messageId: string,
  ) => {
    const token =
      localStorage.getItem(
        "token",
      );

    if (!token) {
      toast.error(
        "Authentication required",
      );

      return;
    }

    try {
      const response =
        await fetch(
          `/api/messages/${messageId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to delete message",
        );
      }

      setBackendMessages(
        (previous) =>
          previous.filter(
            (message) =>
              message._id !==
              messageId,
          ),
      );

      toast.success(
        "Message deleted",
      );
    } catch (error) {
      console.error(
        "Failed to delete message:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete message",
      );
    }
  };
  const saveMessage = async (
    message: BackendMessage,
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      toast.error(
        "Authentication required",
      );
      return;
    }

    try {
      const endpoint =
        message.type === "file"
          ? "/api/messages/saved/file"
          : "/api/messages/saved/message";

      const response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageId: message._id,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to save message",
        );
      }

      toast.success(
        message.type === "file"
          ? "File saved"
          : "Message saved",
      );
    } catch (error) {
      console.error(
        "Save message error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save message",
      );
    }
  };
  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AppShell flush>
      <div className="flex h-full min-h-0 overflow-hidden">

        {/* =================================================
            CONVERSATION LIST
        ================================================= */}

        <div
          className={cn(
            "border-border flex h-full min-h-0 w-full flex-col overflow-hidden border-r md:w-[320px] md:shrink-0",
            mobileOpen &&
            "hidden md:flex",
          )}
        >
          <div className="space-y-3 p-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  aria-hidden
                />

                <Input
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search conversations"
                  aria-label="Search conversations"
                  className="pl-9"
                />
              </div>

              <button
                type="button"
                aria-label="New conversation"
                onClick={() =>
                  setShowNewConversation(
                    true,
                  )
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Tabs
              value={tab}
              onValueChange={setTab}
            >
              <TabsList className="w-full">
                <TabsTrigger
                  value="all"
                  className="flex-1"
                >
                  All
                </TabsTrigger>

                <TabsTrigger
                  value="unread"
                  className="flex-1"
                >
                  Unread
                </TabsTrigger>

                <TabsTrigger
                  value="pinned"
                  className="flex-1"
                >
                  Pinned
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="scrollbar-slim min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-24 lg:pb-3">
            {list.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                No conversations
              </p>
            ) : (
              list.map(
                (conversation) => {
                  const name =
                    conversation
                      .otherUser
                      ?.name ||
                    "Unknown user";

                  const initials =
                    name
                      .slice(0, 2)
                      .toUpperCase();

                  return (
                    <div
                      key={
                        conversation.id
                      }
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setActiveId(
                          conversation.id,
                        );

                        setMobileOpen(
                          true,
                        );
                      }}
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                          "Enter" ||
                          event.key ===
                          " "
                        ) {
                          setActiveId(
                            conversation.id,
                          );

                          setMobileOpen(
                            true,
                          );
                        }
                      }}
                      className={cn(
                        "hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors",
                        conversation.id ===
                        activeId &&
                        "bg-muted",
                      )}
                    >
                      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm",
                              conversation.unreadCount >
                                0
                                ? "font-semibold"
                                : "font-medium",
                            )}
                          >
                            {name}
                          </p>

                          {conversation.unreadCount >
                            0 ? (
                            <span className="bg-primary text-primary-foreground flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
                              {conversation.unreadCount >
                                99
                                ? "99+"
                                : conversation.unreadCount}
                            </span>
                          ) : null}
                        </div>

                        <p className="text-muted-foreground truncate text-xs">
                          {conversation
                            .latestMessage
                            ?.text ||
                            "Private conversation"}
                        </p>
                      </div>

                      <div
                        className="shrink-0"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                          >
                            <button
                              type="button"
                              aria-label="Conversation options"
                              className="hover:bg-muted flex h-8 w-8 items-center justify-center rounded-full"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-32"
                          >
                            <DropdownMenuItem
                              onSelect={() =>
                                togglePin(
                                  conversation.id,
                                )
                              }
                            >
                              {conversation.pinned
                                ? "Unpin"
                                : "Pin"}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() =>
                                deleteConversation(
                                  conversation.id,
                                )
                              }
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>
        </div>

        {/* =================================================
            CONVERSATION WINDOW
        ================================================= */}

        <section
          className={cn(
            "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            !mobileOpen &&
            "hidden md:flex",
          )}
        >
          <header className="border-border bg-background/70 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                label="Back to conversations"
                className="md:hidden"
                onClick={() =>
                  setMobileOpen(
                    false,
                  )
                }
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {activeName}
                </p>

                <p className="text-muted-foreground truncate text-[11px]">
                  Private conversation
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                icon={Search}
                label="Search in conversation"
                className="hidden sm:inline-flex"
                onClick={() => {
                  setShowMessageSearch(
                    (previous) =>
                      !previous,
                  );

                  if (
                    showMessageSearch
                  ) {
                    setMessageSearch(
                      "",
                    );
                  }
                }}
              />

              <IconButton
                icon={Phone}
                label="Start audio call"
                onClick={() => {
                  if (
                    !activeConversation?.otherUser
                  ) {
                    toast.error(
                      "Select a conversation first",
                    );

                    return;
                  }

                  void startCall(
                    "audio",
                    activeConversation
                      .otherUser.id,
                    activeConversation
                      .otherUser.name,
                  );
                }}
              />

              <IconButton
                icon={Video}
                label="Start video call"
                onClick={() => {
                  if (
                    !activeConversation?.otherUser
                  ) {
                    toast.error(
                      "Select a conversation first",
                    );

                    return;
                  }

                  void startCall(
                    "video",
                    activeConversation
                      .otherUser.id,
                    activeConversation
                      .otherUser.name,
                  );
                }}
              />

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                >
                  <div>
                    <IconButton
                      icon={MoreVertical}
                      label="More options"
                    />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-36"
                >
                  <DropdownMenuItem
                    onSelect={() => {
                      if (
                        !activeConversation
                      ) {
                        toast.error(
                          "Select a conversation first",
                        );

                        return;
                      }

                      void togglePin(
                        activeConversation.id,
                      );
                    }}
                  >
                    {activeConversation?.pinned
                      ? "Unpin conversation"
                      : "Pin conversation"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => {
                      if (
                        !activeConversation
                      ) {
                        toast.error(
                          "Select a conversation first",
                        );

                        return;
                      }

                      void deleteConversation(
                        activeConversation.id,
                      );
                    }}
                  >
                    Delete conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {showMessageSearch ? (
              <div className="border-border flex shrink-0 items-center gap-2 border-b px-3 py-2 sm:px-6">
                <Search className="text-muted-foreground h-4 w-4 shrink-0" />

                <Input
                  value={messageSearch}
                  onChange={(event) =>
                    setMessageSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search messages..."
                  autoFocus
                  className="h-9"
                />

                <button
                  type="button"
                  onClick={() => {
                    setMessageSearch(
                      "",
                    );

                    setShowMessageSearch(
                      false,
                    );
                  }}
                  className="text-muted-foreground hover:text-foreground px-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            <div
              ref={
                messagesContainerRef
              }
              className="scrollbar-slim min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5 sm:px-6"
            >
              <div className="flex justify-center">
                <PrivacyBadge
                  label="Messages are visible only to authorized participants"
                  tone="muted"
                />
              </div>

              {filteredMessages.map(
                (message) => {
                  console.log(
                    "VOICE MESSAGE CHECK:",
                    JSON.stringify(
                      message,
                      null,
                      2,
                    ),
                  );

                  const currentUserId =
                    currentUser.id ||
                    currentUser._id;

                  const isSelf =
                    message.sender
                      ._id ===
                    currentUserId;

                  const isRead =
                    isSelf &&
                    Boolean(
                      message.readBy?.some(
                        (userId) =>
                          userId !==
                          currentUserId,
                      ),
                    );

                  return (
                    <MessageBubble
                      key={message._id}
                      message={{
                        id: message._id,

                        author: isSelf
                          ? "You"
                          : activeName,

                        body:
                          message.type ===
                            "file" ||
                            message.type ===
                            "voice"
                            ? ""
                            : message.text ??
                            "",

                        time: new Date(
                          message.createdAt,
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute:
                              "2-digit",
                          },
                        ),

                        initials: isSelf
                          ? currentUser.name
                            ?.slice(
                              0,
                              2,
                            )
                            .toUpperCase() ||
                          "ME"
                          : activeInitials,

                        self: isSelf,

                        isRead,

                        /* FIX:
                           kind is now INSIDE message */
                        kind:
                          message.type ===
                            "voice"
                            ? "voice"
                            : message.type ===
                              "file"
                              ? "file"
                              : "text",

                        /* FIX:
                           file is now INSIDE message */
                        ...(message.file
                          ? {
                            file: {
                              name:
                                message
                                  .file
                                  .name,

                              size: `${(
                                message
                                  .file
                                  .size /
                                1024
                              ).toFixed(
                                1,
                              )} KB`,

                              url:
                                message
                                  .file
                                  .url,
                            },
                          }
                          : {}),
                      }}

                      {...(isSelf
                        ? {
                          onDelete:
                            () => {
                              deleteMessage(
                                message._id,
                              );
                            },
                        }
                        : {})}
                      onSave={() => {
                        void saveMessage(message);
                      }}
                    />
                  );
                },
              )}
            </div>
          </div>

          <div className="shrink-0 pb-16 lg:pb-0">
            <MessageComposer
              placeholder={`Message ${activeName}…`}
              conversationId={
                activeId || ""
              }
              onMessageSent={(
                message,
              ) => {
                if (!message) {
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

                    if (
                      alreadyExists
                    ) {
                      return previous;
                    }

                    return [
                      ...previous,
                      message,
                    ];
                  },
                );

                setBackendConversations(
                  (previous) =>
                    previous
                      .map(
                        (
                          conversation,
                        ) =>
                          conversation.id ===
                            activeId
                            ? {
                              ...conversation,
                              latestMessage:
                              {
                                text:
                                  message.text ??
                                  "",
                                createdAt:
                                  message.createdAt ??
                                  new Date().toISOString(),
                                sender:
                                  message
                                    .sender
                                    ?._id ??
                                  "",
                              },
                            }
                            : conversation,
                      )
                      .sort(
                        (a, b) =>
                          new Date(
                            b
                              .latestMessage
                              ?.createdAt ||
                            0,
                          ).getTime() -
                          new Date(
                            a
                              .latestMessage
                              ?.createdAt ||
                            0,
                          ).getTime(),
                      ),
                );
              }}
            />
          </div>
        </section>

        {/* =================================================
            NEW CONVERSATION POPUP
        ================================================= */}

        {showNewConversation ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-background border-border w-full max-w-md rounded-2xl border p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    New conversation
                  </h2>

                  <p className="text-muted-foreground mt-1 text-xs">
                    Search for a user to
                    start a conversation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowNewConversation(
                      false,
                    );

                    setUserSearch("");

                    setSearchResults(
                      [],
                    );
                  }}
                  className="text-muted-foreground hover:text-foreground text-xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <Input
                value={userSearch}
                onChange={(event) =>
                  setUserSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by name or email..."
                autoFocus
              />

              <div className="mt-4 space-y-2">
                {searchResults.map(
                  (user) => (
                    <button
                      key={
                        user._id
                      }
                      type="button"
                      onClick={() =>
                        void startConversation(
                          user,
                        )
                      }
                      className="hover:bg-muted flex w-full items-center gap-3 rounded-xl p-3 text-left"
                    >
                      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {user.name
                          .slice(
                            0,
                            2,
                          )
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>

                        <p className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ),
                )}

                {userSearch &&
                  searchResults.length ===
                  0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    No users found.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {callState.status ===
        "ringing" ? (
        <IncomingCall
          callState={callState}
          onAccept={async () => {
            console.log(
              "CALL DEBUG - Accepting call:",
              callState.callId,
            );

            await acceptCall();

            console.log(
              "CALL DEBUG - Call accepted successfully",
            );
          }}
          onReject={rejectCall}
        />
      ) : null}
      {callState.status !==
        "idle" &&
        callState.status !==
        "ended" ? (
        <CallScreen
          callState={callState}
          localStream={
            localStreamRef.current
          }
          remoteStream={
            remoteStreamRef.current
          }
          onMute={toggleMute}
          onCamera={toggleCamera}
          onInviteUsers={inviteUsers}
          onEnd={endCall}
        />
      ) : null}
    </AppShell>
  );
}