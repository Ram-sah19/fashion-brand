import {
  Phone,
  PhoneOff,
  Video,
} from "lucide-react";

import type { CallState } from "../Types";

type IncomingCallProps = {
  callState: CallState;
  onAccept: () => void;
  onReject: () => void;
};

export function IncomingCall({
  callState,
  onAccept,
  onReject,
}: IncomingCallProps) {
  const isVideo =
    callState.type === "video";

  const caller =
    callState.participants[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-700">
          {caller?.name
            ?.slice(0, 2)
            .toUpperCase() || "VC"}
        </div>

        <p className="text-sm font-medium text-slate-500">
          Incoming {isVideo ? "video" : "audio"} call
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          {caller?.name || "Velora User"}
        </h2>

        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onReject}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
            aria-label="Reject call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={onAccept}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700"
            aria-label={
              isVideo
                ? "Accept video call"
                : "Accept audio call"
            }
          >
            {isVideo ? (
              <Video className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Accept to start the call
        </p>
      </div>
    </div>
  );
}

