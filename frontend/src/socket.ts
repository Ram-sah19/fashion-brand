import { io } from "socket.io-client";

// In production, connect directly to the Render backend URL (e.g. https://velora-circle-backend.onrender.com).
// In local development, undefined falls back to window.location.origin, using Vite's proxy.
const backendUrl =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  undefined;

// Call Service socket
const callSocket = io(backendUrl, {
  path: "/socket.io/calls",
  autoConnect: false,
});

// Message Service socket
const messageSocket = io(backendUrl, {
  path: "/socket.io/messages",
  autoConnect: false,
});

export const connectCallSocket = () => {
  const token = localStorage.getItem("token");

  callSocket.auth = {
    token,
  };

  if (!callSocket.connected) {
    callSocket.connect();
  }
};

export const connectMessageSocket = () => {
  const token = localStorage.getItem("token");

  messageSocket.auth = {
    token,
  };

  if (!messageSocket.connected) {
    messageSocket.connect();
  }
};

export {
  callSocket,
  messageSocket,
};

export default callSocket;