import { createFileRoute } from "@tanstack/react-router";
import {
  Bookmark,
  ExternalLink,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AppShell } from "@/components/velora/app-shell";
import { FileRow } from "@/components/velora/cards";
import { EmptyState } from "@/components/velora/primitives";
import type { FileItem } from "@/lib/mock-data";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved — Velora Circle" },
      {
        name: "description",
        content:
          "Saved messages, files and links from your private Velora conversations.",
      },
      {
        property: "og:title",
        content: "Saved — Velora Circle",
      },
      {
        property: "og:description",
        content: "Everything you kept, privately.",
      },
    ],
  }),
  component: SavedPage,
});

/* =====================================================
   TYPES
===================================================== */

type SavedItem = {
  _id: string;

  type: "message" | "file" | "link";

  message?: {
    _id: string;
    text?: string;
    type?: string;
    createdAt?: string;
    sender?: {
      _id?: string;
      name?: string;
    };
  };

  file?: {
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
  };

  link?: {
    url: string;
    title?: string;
  };

  createdAt: string;
};

/* =====================================================
   FILE TYPE
===================================================== */

const getFileType = (
  mimeType: string,
  fileName: string,
): FileItem["type"] => {
  const extension = fileName
    .split(".")
    .pop()
    ?.toLowerCase();

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (
    mimeType === "application/pdf" ||
    extension === "pdf"
  ) {
    return "pdf";
  }

  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(
      extension || "",
    )
  ) {
    return "sheet";
  }

  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    ["zip", "rar", "7z"].includes(
      extension || "",
    )
  ) {
    return "zip";
  }

  return "doc";
};

/* =====================================================
   PAGE
===================================================== */

function SavedPage() {
  const [savedItems, setSavedItems] =
    useState<SavedItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =====================================================
     LOAD ALL SAVED ITEMS
  ===================================================== */

  useEffect(() => {
    const loadSavedItems = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "/api/messages/saved",
          {
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
              "Failed to load saved items",
          );
        }

        setSavedItems(
          Array.isArray(data.savedItems)
            ? data.savedItems
            : Array.isArray(data.data)
              ? data.data
              : [],
        );
      } catch (error) {
        console.error(
          "Failed to load saved items:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load saved items",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSavedItems();
  }, []);

  /* =====================================================
     FILTER SAVED ITEMS
  ===================================================== */

  const savedMessages =
    savedItems.filter(
      (item) =>
        item.type === "message",
    );

  const savedFiles =
    savedItems.filter(
      (item) =>
        item.type === "file" ||
        Boolean(item.file),
    );

  const savedLinks =
    savedItems.filter(
      (item) =>
        item.type === "link" ||
        Boolean(item.link),
    );

  /* =====================================================
     FORMAT SAVED FILES
  ===================================================== */

  const displayFiles: FileItem[] =
    savedFiles
      .filter(
        (saved) =>
          Boolean(saved.file),
      )
      .map((saved) => {
        const file =
          saved.file!;

        return {
          id: saved._id,

          name: file.name,

          size:
            (file.size || 0) >=
            1024 * 1024
              ? `${(
                  (file.size || 0) /
                  (1024 * 1024)
                ).toFixed(1)} MB`
              : `${(
                  (file.size || 0) /
                  1024
                ).toFixed(1)} KB`,

          type: getFileType(
            file.mimeType ||
              "application/octet-stream",
            file.name,
          ),

          date: new Date(
            saved.createdAt,
          ).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          }),

          owner: "Saved by you",

          group: "mine",
        };
      });

  /* =====================================================
     REMOVE SAVED ITEM
  ===================================================== */

  const handleRemoveSavedItem =
    async (savedItemId: string) => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        toast.error(
          "Authentication required",
        );
        return;
      }

      try {
        const response =
          await fetch(
            `/api/messages/saved/${savedItemId}`,
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
              "Failed to remove saved item",
          );
        }

        setSavedItems(
          (currentItems) =>
            currentItems.filter(
              (item) =>
                item._id !==
                savedItemId,
            ),
        );

        toast.success(
          "Removed from Saved",
        );
      } catch (error) {
        console.error(
          "Remove saved item error:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove saved item",
        );
      }
    };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Saved
          </h1>

          <p className="text-muted-foreground mt-1.5 text-sm">
            Private to you — nothing here
            is shared back to a Circle.
          </p>
        </header>

        <Tabs defaultValue="messages">
          <TabsList>
            <TabsTrigger value="messages">
              Messages
            </TabsTrigger>

            <TabsTrigger value="files">
              Files
            </TabsTrigger>

            <TabsTrigger value="links">
              Links
            </TabsTrigger>
          </TabsList>

          {/* =================================================
              MESSAGES
          ================================================= */}

          <TabsContent
            value="messages"
            className="mt-5 space-y-3"
          >
            {loading ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                Loading saved messages...
              </div>
            ) : savedMessages.length ? (
              savedMessages.map(
                (item) => (
                  <article
                    key={item._id}
                    className="surface-panel rounded-2xl p-4"
                  >
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-xl">
                        <MessageSquare
                          className="h-4 w-4"
                          aria-hidden
                        />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">
                          {item.message
                            ?.sender
                            ?.name ||
                            "Saved message"}
                        </p>

                        <p className="text-muted-foreground truncate text-[11px]">
                          Saved from conversation
                        </p>
                      </div>

                      <span className="text-muted-foreground text-[11px]">
                        {new Date(
                          item.createdAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-foreground/85 mt-3 text-[13px] leading-relaxed">
                      {item.message
                        ?.text ||
                        "Message content unavailable"}
                    </p>
                  </article>
                ),
              )
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No saved messages"
                description="Messages you save from your chats will appear here."
              />
            )}
          </TabsContent>

          {/* =================================================
              FILES
          ================================================= */}

          <TabsContent
            value="files"
            className="mt-5"
          >
            {loading ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                Loading saved files...
              </div>
            ) : displayFiles.length ? (
              <div className="surface-panel overflow-hidden rounded-2xl">
                {displayFiles.map(
                  (file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                    />
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                icon={Bookmark}
                title="No saved files"
                description="Files you save from conversations will appear here."
              />
            )}
          </TabsContent>

          {/* =================================================
              LINKS
          ================================================= */}

          <TabsContent
            value="links"
            className="mt-5 space-y-3"
          >
            {loading ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                Loading saved links...
              </div>
            ) : savedLinks.length ? (
              savedLinks.map(
                (item) => (
                  <div
                    key={item._id}
                    className="surface-panel grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4"
                  >
                    <span className="bg-primary/10 text-primary grid h-9 w-9 place-items-center rounded-xl">
                      <ExternalLink
                        className="h-4 w-4"
                        aria-hidden
                      />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {item.link
                          ?.title ||
                          item.link
                            ?.url ||
                          "Saved link"}
                      </p>

                      <p className="text-muted-foreground truncate text-[11px]">
                        {item.link?.url}
                      </p>
                    </div>

                    <span className="text-muted-foreground text-[11px]">
                      {new Date(
                        item.createdAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                ),
              )
            ) : (
              <EmptyState
                icon={Bookmark}
                title="No saved links"
                description="Links you save from your chats will appear here."
              />
            )}
          </TabsContent>
        </Tabs>

        {/* =================================================
            ARCHIVE
        ================================================= */}

        {/* <div className="mt-10">
          <EmptyState
            icon={FileText}
            title="Archive is empty"
            description="Older saved items you archive will appear in this section."
          />
        </div> */}
      </div>
    </AppShell>
  );
}