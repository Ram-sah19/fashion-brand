export const createPeerConnection = (
    onIceCandidate: (
        candidate: RTCIceCandidate,
    ) => void,
    onTrack: (
        event: RTCTrackEvent,
    ) => void,
): RTCPeerConnection => {
    const peerConnection =
        new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

    peerConnection.onicecandidate = (
        event: RTCPeerConnectionIceEvent,
    ) => {
        if (event.candidate) {
            onIceCandidate(event.candidate);
        }
    };

    peerConnection.ontrack = (
        event: RTCTrackEvent,
    ) => {
        onTrack(event);
    };

    return peerConnection;
};
export const getAudioStream =
  async (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,
      },
      video: false,
    });
  };

export const getVideoStream =
  async (): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,
      },
      video: true,
    });
  };
export const stopMediaStream = (
    stream: MediaStream | null,
): void => {
    if (!stream) {
        return;
    }

    stream
        .getTracks()
        .forEach((track) => {
            track.stop();
        });
};

