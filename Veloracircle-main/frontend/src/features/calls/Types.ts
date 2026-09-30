export type CallType =
  | "audio"
  | "video";

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "ended";

export type CallParticipant = {
  id: string;
  name: string;
  email?: string;
};

export type CallState = {
  status: CallStatus;
  type: CallType | null;
  callId: string | null;
  participants: CallParticipant[];
  isMuted: boolean;
  isCameraOff: boolean;
};

