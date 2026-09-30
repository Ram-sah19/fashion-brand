import { useRef, useState } from "react";
import {
    Mic,
    Square,
    Trash2,
    Send,
} from "lucide-react";
import { toast } from "sonner";

export function VoiceRecorder({
    onCancel,
    onRecorded,
}: {
    onCancel: () => void;
    onRecorded: (audioBlob: Blob) => void;
}) {
    const mediaRecorderRef =
        useRef<MediaRecorder | null>(null);

    const chunksRef =
        useRef<Blob[]>([]);

    const [isRecording, setIsRecording] =
        useState(false);

    const [audioBlob, setAudioBlob] =
        useState<Blob | null>(null);

    const startRecording = async () => {
        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

            const recorder =
                new MediaRecorder(stream);

            mediaRecorderRef.current =
                recorder;

            chunksRef.current = [];

            recorder.ondataavailable = (
                event,
            ) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(
                        event.data,
                    );
                }
            };

            recorder.onstop = () => {
                const blob =
                    new Blob(
                        chunksRef.current,
                        {
                            type: "audio/webm",
                        },
                    );

                setAudioBlob(blob);

                stream
                    .getTracks()
                    .forEach((track) =>
                        track.stop(),
                    );
            };

            recorder.start();

            setIsRecording(true);
        } catch (error) {
            console.error(
                "Microphone error:",
                error,
            );

            toast.error(
                "Microphone permission is required",
            );
        }
    };

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !==
            "inactive"
        ) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        chunksRef.current = [];
    };

    const sendRecording = () => {
        if (!audioBlob) {
            return;
        }

        onRecorded(audioBlob);
    };

    if (!isRecording && !audioBlob) {
        return (
            <div className="border-border bg-surface-2/60 flex items-center gap-2 rounded-2xl border p-2">
                <button
                    type="button"
                    onClick={startRecording}
                    className="bg-primary text-primary-foreground inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    aria-label="Start recording"
                >
                    <Mic
                        className="h-4 w-4"
                        aria-hidden
                    />
                </button>

                <span className="text-muted-foreground text-sm">
                    Tap the microphone to record
                </span>

                <button
                    type="button"
                    onClick={onCancel}
                    className="text-muted-foreground hover:text-foreground ml-auto px-2 text-xs"
                >
                    Cancel
                </button>
            </div>
        );
    }

    if (isRecording) {
        return (
            <div className="border-border bg-surface-2/60 flex items-center gap-3 rounded-2xl border p-2">
                <span className="bg-destructive/10 text-destructive flex h-9 w-9 items-center justify-center rounded-xl">
                    <Mic
                        className="h-4 w-4"
                        aria-hidden
                    />
                </span>

                <span className="text-sm font-medium">
                    Recording...
                </span>

                <button
                    type="button"
                    onClick={stopRecording}
                    className="bg-destructive text-destructive-foreground ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    aria-label="Stop recording"
                >
                    <Square
                        className="h-4 w-4"
                        aria-hidden
                    />
                </button>
            </div>
        );
    }

    return (
        <div className="border-border bg-surface-2/60 flex items-center gap-2 rounded-2xl border p-2">
            <audio
                controls
                src={
                    audioBlob
                        ? URL.createObjectURL(audioBlob)
                        : undefined
                }
                className="h-9 min-w-0 flex-1"
            />

            <button
                type="button"
                onClick={deleteRecording}
                className="text-muted-foreground hover:text-destructive inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                aria-label="Delete recording"
            >
                <Trash2
                    className="h-4 w-4"
                    aria-hidden
                />
            </button>

            <button
                type="button"
                onClick={sendRecording}
                className="bg-primary text-primary-foreground inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                aria-label="Send voice message"
            >
                <Send
                    className="h-4 w-4"
                    aria-hidden
                />
            </button>
        </div>
    );
}