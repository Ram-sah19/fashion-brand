import { createFileRoute } from "@tanstack/react-router";
import { Search, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/velora/app-shell";
import { FileRow } from "@/components/velora/cards";
import {
  EmptyState,
  SectionHeading,
} from "@/components/velora/primitives";
import type { FileItem } from "@/lib/mock-data";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "Files — Velora Circle" },
      {
        name: "description",
        content:
          "Secure file sharing across your private Circles and direct conversations.",
      },
      {
        property: "og:title",
        content: "Files — Velora Circle",
      },
      {
        property: "og:description",
        content: "Secure, private file sharing.",
      },
    ],
  }),
  component: FilesPage,
});

/* =====================================================
   TYPES
===================================================== */

type BackendFile = {
  id: string;
  conversationId: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  group: "mine" | "shared";
};

type DisplayFile = FileItem & {
  url: string;
};

/* =====================================================
   FILE TYPE CONVERTER
===================================================== */

const getFileType = (
  mimeType: string,
  fileName: string,
): DisplayFile["type"] => {
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

function FilesPage() {
  const [query, setQuery] = useState("");

  const [backendFiles, setBackendFiles] =
    useState<BackendFile[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =====================================================
     LOAD FILES
===================================================== */

  useEffect(() => {
    const loadFiles = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "/api/messages/files",
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
              "Failed to load files",
          );
        }

        setBackendFiles(
          data.files || [],
        );
      } catch (error) {
        console.error(
          "Failed to load files:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load files",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadFiles();
  }, []);

  /* =====================================================
     FORMAT BACKEND FILES
===================================================== */

  const displayFiles: DisplayFile[] =
    backendFiles.map((file) => ({
      id: file.id,

      name: file.name,

      size:
        file.size >= 1024 * 1024
          ? `${(
              file.size /
              (1024 * 1024)
            ).toFixed(1)} MB`
          : `${(
              file.size / 1024
            ).toFixed(1)} KB`,

      type: getFileType(
        file.mimeType,
        file.name,
      ),

      date: new Date(
        file.createdAt,
      ).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      }),

      owner:
        file.group === "mine"
          ? "You"
          : file.sender?.name ||
            "Unknown",

      group:
        file.group === "mine"
          ? "mine"
          : "shared",

      url: file.url,
    }));

  /* =====================================================
     DOWNLOAD
===================================================== */

  const handleDownload = (
    file: FileItem,
  ) => {
    const backendFile =
      backendFiles.find(
        (item) => item.id === file.id,
      );

    if (!backendFile) {
      toast.error(
        "File information not found",
      );
      return;
    }

    try {
      const fileUrl = new URL(
        backendFile.url,
        window.location.origin,
      ).href;

      const link =
        document.createElement("a");

      link.href = fileUrl;
      link.download = backendFile.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      toast.success(
        "Download started",
        {
          description:
            backendFile.name,
        },
      );
    } catch (error) {
      console.error(
        "Download error:",
        error,
      );

      toast.error(
        "Unable to download file",
      );
    }
  };

  /* =====================================================
     SHARE
===================================================== */

  const handleShare = async (
    file: FileItem,
  ) => {
    const backendFile =
      backendFiles.find(
        (item) => item.id === file.id,
      );

    if (!backendFile) {
      toast.error(
        "File information not found",
      );
      return;
    }

    try {
      const fileUrl = new URL(
        backendFile.url,
        window.location.origin,
      ).href;

      if (navigator.share) {
        await navigator.share({
          title: backendFile.name,
          url: fileUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(
        fileUrl,
      );

      toast.success(
        "Share link copied",
        {
          description:
            "The file link has been copied to your clipboard.",
        },
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Share error:",
        error,
      );

      toast.error(
        "Unable to share file",
      );
    }
  };

  /* =====================================================
     SAVE
===================================================== */
const handleSave = async (
  file: FileItem,
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
    const response =
      await fetch(
        "/api/messages/saved/file",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageId: file.id,
          }),
        },
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to save file",
      );
    }

    toast.success(
      "File saved",
      {
        description:
          file.name,
      },
    );
  } catch (error) {
    console.error(
      "Save file error:",
      error,
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to save file",
    );
  }
};
  /* =====================================================
     REMOVE
===================================================== */

  const handleRemove = async (
    file: FileItem,
  ) => {
    const confirmed =
      window.confirm(
        `Remove "${file.name}"?`,
      );

    if (!confirmed) {
      return;
    }

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
          `/api/messages/${file.id}`,
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
            "Failed to remove file",
        );
      }

      setBackendFiles(
        (currentFiles) =>
          currentFiles.filter(
            (item) =>
              item.id !== file.id,
          ),
      );

      toast.success(
        "File removed",
        {
          description: file.name,
        },
      );
    } catch (error) {
      console.error(
        "Remove file error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove file",
      );
    }
  };

  /* =====================================================
     SEARCH
===================================================== */

  const match = (
    group: "recent" | "shared" | "mine",
  ) =>
    displayFiles.filter(
      (file) =>
        (group === "recent" ||
          file.group === group) &&
        file.name
          .toLowerCase()
          .includes(
            query.toLowerCase(),
          ),
    );

  const sections = [
    {
      key: "recent" as const,
      title: "Recent",
    },
    {
      key: "shared" as const,
      title: "Shared with me",
    },
    {
      key: "mine" as const,
      title: "My files",
    },
  ];

  /* =====================================================
     RENDER
===================================================== */

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-9">
        {/* HEADER */}

        <header className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Files
            </h1>

            <p className="text-muted-foreground mt-1.5 text-sm">
              Encrypted at rest · Downloads
              follow Circle policy.
            </p>
          </div>

          <Button
            onClick={() =>
              toast.info(
                "Send a file from a conversation",
                {
                  description:
                    "Files sent in chat will automatically appear here.",
                },
              )
            }
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </header>

        {/* SEARCH */}

        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden
          />

          <Input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search files"
            aria-label="Search files"
            className="pl-9"
          />
        </div>

        {/* FILE SECTIONS */}

        {loading ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            Loading files...
          </div>
        ) : (
          sections.map((section) => {
            const list = match(
              section.key,
            );

            return (
              <section
                key={section.key}
              >
                <SectionHeading
                  title={section.title}
                />

                {list.length ? (
                  <div className="surface-panel overflow-hidden rounded-2xl">
                    {list.map((file) => (
                      <FileRow
                        key={file.id}
                        file={file}
                        onDownload={
                          handleDownload
                        }
                        onShare={
                          handleShare
                        }
                        onSave={
                          handleSave
                        }
                        onRemove={
                          handleRemove
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nothing here yet"
                    description={
                      section.key ===
                      "mine"
                        ? "Files you send in conversations will appear here."
                        : section.key ===
                            "shared"
                          ? "Files you receive from other users will appear here."
                          : "Files shared in your conversations will appear here."
                    }
                  />
                )}
              </section>
            );
          })
        )}
      </div>
    </AppShell>
  );
}