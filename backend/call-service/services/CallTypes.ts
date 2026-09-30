export type CallType =
  | "audio"
  | "video";

export type CallStatus =
  | "calling"
  | "accepted"
  | "rejected"
  | "ended";

export interface CallParticipant {
  userId: string;
  socketId: string;
}

export interface CallSession {
  callId: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  createdAt: Date;
}