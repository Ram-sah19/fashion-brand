import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";

export function AttachmentPicker({
  conversationId,
  onFileSent,
}: {
  conversationId: string;
  onFileSent: (message: any) => void;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!conversationId) {
      toast.error(
        "Please select a conversation first",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        "File size cannot exceed 10 MB",
      );
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      toast.error(
        "Please log in again",
      );
      return;
    }

    try {
      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "conversationId",
        conversationId,
      );

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          "/api/messages/file",
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
            "Failed to upload file",
        );
      }

      onFileSent(data.message);

      toast.success(
        "File sent successfully",
      );
    } catch (error) {
      console.error(
        "File upload error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send file",
      );
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      event.target.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Attach file"
        disabled={uploading}
        onClick={() =>
          inputRef.current?.click()
        }
        className="hover:bg-muted inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Paperclip
          className="h-4 w-4"
          aria-hidden
        />
      </button>

      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}