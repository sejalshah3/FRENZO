import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
} from "lucide-react";
const socket = io("http://localhost:3001");

function CallScreen({ onEndCall, friendName = "Rohan Verma" }) {
    const [roomId] = useState(
        () => `FRENZO-${Math.floor(1000 + Math.random() * 9000)}`
      );
      const [showJoin, setShowJoin] = useState(false);
const [joinRoomId, setJoinRoomId] = useState("");

useEffect(() => {
    socket.on("user-joined", (userId) => {
      console.log("Friend joined:", userId);
    });
  
    return () => {
      socket.off("user-joined");
    };
  }, []);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isFriendBig, setIsFriendBig] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera
  useEffect(() => {
    const startMedia = async () => {
      try {
        const mediaStream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Camera/Microphone error:", error);
      }
    };

    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // Microphone
  const toggleMic = () => {
    const newState = !micOn;
    setMicOn(newState);

    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
  };

  // Camera
  const toggleCamera = () => {
    const newState = !cameraOn;
    setCameraOn(newState);

    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
  };

  // End call
  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (onEndCall) {
      onEndCall();
    }
  };

  // Swap screens
  const swapScreens = () => {
    setIsFriendBig((prev) => !prev);
  };

  return (
    <div className="call-screen">

      {/* Header */}
      <div className="call-header">
  <div>
    <h1>Frenzo</h1>
    <span>Private call ♡</span>
  </div>

  <div className="room-actions">
  <div className="room-id">
    Room: <strong>{roomId}</strong>
  </div>

  <button
  className="join-btn"
  onClick={() => setShowJoin(true)}
>
  Join Call
</button>
</div>
</div>

      {/* VIDEO AREA */}
      <div className="call-video-area">

        {/* FRIEND VIDEO */}
        <div
          className={`friend-video ${
            isFriendBig ? "friend-big" : "friend-small"
          }`}
          onClick={swapScreens}
        >
          <div className="friend-avatar">
            👨🏻
          </div>

          <div className="friend-name">
            {friendName}
          </div>
        </div>

        {/* MY VIDEO */}
        <div
          className={`my-video ${
            isFriendBig ? "my-small" : "my-big"
          }`}
          onClick={swapScreens}
        >
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
          ) : (
            <div className="camera-off">
              <VideoOff size={35} />
              <p>Camera off</p>
            </div>
          )}

          <div className="my-name">
            You
          </div>
        </div>

      </div>

      {/* CONTROLS */}
      <div className="call-controls">

        {/* Microphone */}
        <button
          className={`control-btn ${
            !micOn ? "control-off" : ""
          }`}
          onClick={toggleMic}
        >
          {micOn ? (
            <Mic size={22} />
          ) : (
            <MicOff size={22} />
          )}
        </button>

        {/* Camera */}
        <button
          className={`control-btn ${
            !cameraOn ? "control-off" : ""
          }`}
          onClick={toggleCamera}
        >
          {cameraOn ? (
            <Video size={22} />
          ) : (
            <VideoOff size={22} />
          )}
        </button>

        {/* End call */}
        <button
          className="end-call-btn"
          onClick={endCall}
        >
          <PhoneOff size={22} />
        </button>

      </div>

      {/* STATUS */}
      <p className="call-hint">
        {micOn && cameraOn
          ? "Your camera and microphone are ready ♡"
          : !micOn && !cameraOn
          ? "Camera and microphone are off"
          : !micOn
          ? "Microphone is off"
          : "Camera is off"}
      </p>

      {showJoin && (
  <div className="join-overlay">
    <div className="join-box">

      <h2>Join a Frenzo Call ♡</h2>

      <p>Enter your friend's room code</p>

      <input
        value={joinRoomId}
        onChange={(e) => setJoinRoomId(e.target.value)}
        placeholder="FRENZO-1234"
      />

      <div className="join-actions">
        <button
          onClick={() => setShowJoin(false)}
        >
          Cancel
        </button>

        <button
  onClick={() => {
    if (!joinRoomId.trim()) {
      alert("Please enter a room code");
      return;
    }

    socket.emit("join-room", joinRoomId.trim().toUpperCase());

    console.log("Joined room:", joinRoomId);

    setShowJoin(false);
  }}
>
  Join
</button>
      </div>

    </div>
  </div>
)}

    </div>
  );
}

export default CallScreen;