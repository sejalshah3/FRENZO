import { useState, useEffect, useRef } from "react";

import { io } from "socket.io-client";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
} from "lucide-react";

const socket = io("http://localhost:3001");

function CallScreen({
  onEndCall,
  friendName = "Rohan Verma",
  isHost = true,
}) {
  // ================================
  // ROOM
  // ================================

  const [roomId] = useState(
    () => `FRENZO-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const [currentRoomId, setCurrentRoomId] = useState(
    isHost ? roomId : ""
  );

  const [isHostUser, setIsHostUser] = useState(isHost);

  const [showJoin, setShowJoin] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");

  // ================================
  // CALL STATE
  // ================================

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [filter, setFilter] = useState("none");
const [showFilters, setShowFilters] = useState(false);
const [handDetected, setHandDetected] = useState(false);
const [gesture, setGesture] = useState("");
  const [isFriendBig, setIsFriendBig] = useState(false);
  const [friendConnected, setFriendConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);

  // ================================
  // VIDEO / WEBRTC REFS
  // ================================

  const videoRef = useRef(null);
  const friendVideoRef = useRef(null);

  const streamRef = useRef(null);
  const peerRef = useRef(null);
  const friendSocketIdRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const canvasRef = useRef(null);
const drawingPointsRef = useRef([]);

  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
  
    handLandmarkerRef.current = await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: "/models/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      }
    );
  
    console.log("Hand detector ready");
  };

  useEffect(() => {
    createHandLandmarker();
  }, []);

  useEffect(() => {
    let animationFrameId;
  
    const detectHands = () => {
      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;
  
      if (
        video &&
        handLandmarker &&
        video.readyState >= 2
      ) {
        const results = handLandmarker.detectForVideo(
          video,
          performance.now()
        );
        const hasHand =
        results.landmarks && results.landmarks.length > 0;
      
      setHandDetected(hasHand);
      
      if (hasHand) {
        const detectedGesture = detectGesture(results.landmarks);
        setGesture(detectedGesture);
      
        drawFinger(results.landmarks);
      }
      
      else {
        setGesture("");
      }
        
      }
  
      animationFrameId = requestAnimationFrame(detectHands);
    };
  
    detectHands();
  
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const detectGesture = (landmarks) => {
    if (!landmarks || landmarks.length === 0) {
      return "";
    }
  
    const hand = landmarks[0];
  
    const thumbUp =
      hand[4].y < hand[3].y &&
      hand[3].y < hand[2].y &&
      hand[2].y < hand[1].y;
  
    const fingersClosed =
      hand[8].y > hand[6].y &&
      hand[12].y > hand[10].y &&
      hand[16].y > hand[14].y &&
      hand[20].y > hand[18].y;
  
      if (thumbUp && fingersClosed) {
        return "👍";
      }
      
      const peaceSign =
        hand[8].y < hand[6].y &&
        hand[12].y < hand[10].y &&
        hand[16].y > hand[14].y &&
        hand[20].y > hand[18].y;
      
      if (peaceSign) {
        return "✌️";
      }
      
      return "";
  };

  const drawFinger = (landmarks) => {
    if (!canvasRef.current || !landmarks || landmarks.length === 0) {
      return;
    }
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
  
    const finger = landmarks[0][8];
  
    const x = finger.x * canvas.width;
    const y = finger.y * canvas.height;
  
    drawingPointsRef.current.push({ x, y });
  
    if (drawingPointsRef.current.length > 1) {
      const previous =
        drawingPointsRef.current[
          drawingPointsRef.current.length - 2
        ];
  
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#ff4f9a";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  };

  const pendingCandidatesRef = useRef([]);

  // ================================
  // START CAMERA
  // ================================

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

        console.log("Camera and microphone ready");
      } catch (error) {
        console.error(
          "Camera/Microphone error:",
          error
        );
      }
    };

    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      const friendSocketId = peerRef.current?.remoteSocketId;

if (peerRef.current) {
  peerRef.current.close();
  peerRef.current = null;
}
    };
  }, []);

  // ================================
  // CREATE PEER CONNECTION
  // ================================

  const createPeer = (otherUserId) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    

    peerRef.current = peer;

    // Add our camera + microphone
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          peer.addTrack(
            track,
            streamRef.current
          );
        });
    }

    // Receive friend's camera + microphone
    peer.ontrack = (event) => {
      console.log("Friend media received");
    
      const stream = event.streams[0];
    
      setRemoteStream(stream);
      setFriendConnected(true);
    };

    // Send ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: otherUserId,
        });
      }
    };

    // Connection status
    peer.onconnectionstatechange = () => {
      console.log(
        "WebRTC connection:",
        peer.connectionState
      );

      if (peer.connectionState === "connected") {
        setFriendConnected(true);
      }

      if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        setFriendConnected(false);
      }
    };

    return peer;
  };

  useEffect(() => {
    if (
      friendVideoRef.current &&
      remoteStream
    ) {
      friendVideoRef.current.srcObject =
        remoteStream;
  
      console.log("Remote video attached");
    }
  }, [remoteStream]);

  // ================================
  // HOST CREATES / JOINS ROOM
  // ================================

  useEffect(() => {
    if (!isHostUser) return;

    socket.emit("join-room", roomId);

    setCurrentRoomId(roomId);

    console.log(
      "Host created room:",
      roomId
    );
  }, [isHostUser, roomId]);

  // ================================
  // WEBRTC SIGNALING
  // ================================

  useEffect(() => {
    // --------------------------------
    // HOST:
    // FRIEND JOINED
    // --------------------------------

    const handleUserJoined = async (userId) => {

      friendSocketIdRef.current = userId;

      console.log(
        "Friend joined:",
        userId
      );

      if (!isHostUser) return;

      if (!streamRef.current) {
        console.log(
          "Camera is not ready yet"
        );
        return;
      }

      const peer = createPeer(userId);

      try {
        const offer =
          await peer.createOffer();

        await peer.setLocalDescription(
          offer
        );

        socket.emit("offer", {
          offer,
          to: userId,
        });

        console.log("Offer sent");
      } catch (error) {
        console.error(
          "Offer error:",
          error
        );
      }
    };

    // --------------------------------
    // GUEST:
    // RECEIVE OFFER
    // --------------------------------

    const handleOffer = async ({
      offer,
      from,
    }) => {
      console.log(
        "Offer received from:",
        from
      );

      if (!streamRef.current) {
        console.log(
          "Camera is not ready yet"
        );
        return;
      }

      const peer = createPeer(from);

      try {
        await peer.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        // Add waiting ICE candidates
        for (const candidate of
          pendingCandidatesRef.current) {
          await peer.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );
        }

        pendingCandidatesRef.current = [];

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        socket.emit("answer", {
          answer,
          to: from,
        });

        console.log("Answer sent");
      } catch (error) {
        console.error(
          "Offer handling error:",
          error
        );
      }
    };

    // --------------------------------
    // HOST:
    // RECEIVE ANSWER
    // --------------------------------

    const handleAnswer = async ({
      answer,
    }) => {
      console.log("Answer received");

      if (!peerRef.current) return;

      try {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(
            answer
          )
        );

        // Add waiting ICE candidates
        for (const candidate of
          pendingCandidatesRef.current) {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );
        }

        pendingCandidatesRef.current = [];

        console.log(
          "Remote description added"
        );
      } catch (error) {
        console.error(
          "Answer error:",
          error
        );
      }
    };

    // --------------------------------
    // ICE CANDIDATES
    // --------------------------------

    const handleIceCandidate = async ({
      candidate,
    }) => {
      if (!candidate) return;

      if (
        peerRef.current &&
        peerRef.current.remoteDescription
      ) {
        try {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );

          console.log(
            "ICE candidate added"
          );
        } catch (error) {
          console.error(
            "ICE candidate error:",
            error
          );
        }
      } else {
        pendingCandidatesRef.current.push(
          candidate
        );
      }
    };

    socket.on(
      "user-joined",
      handleUserJoined
    );

    socket.on(
      "offer",
      handleOffer
    );

    socket.on(
      "answer",
      handleAnswer
    );

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    socket.on("call-ended", () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    
      onEndCall();
    });

    return () => {
      socket.off(
        "user-joined",
        handleUserJoined
      );

      socket.off(
        "offer",
        handleOffer
      );

      socket.off(
        "answer",
        handleAnswer
      );

      socket.off(
        "ice-candidate",
        handleIceCandidate
      );
      socket.off("call-ended");
    };
  }, [isHostUser]);

  // ================================
  // JOIN ROOM
  // ================================

  const joinRoom = () => {
    const room =
      joinRoomId.trim().toUpperCase();

    if (!room) {
      alert("Please enter a room code");
      return;
    }

    // This window becomes the guest
    setIsHostUser(false);

    socket.emit(
      "join-room",
      room
    );

    setCurrentRoomId(room);

    setShowJoin(false);

    setJoinRoomId("");

    console.log(
      "Joined room:",
      room
    );
  };

  // ================================
  // MICROPHONE
  // ================================

  const toggleMic = () => {
    const newState = !micOn;

    setMicOn(newState);

    if (streamRef.current) {
      streamRef.current
        .getAudioTracks()
        .forEach((track) => {
          track.enabled = newState;
        });
    }
  };

  // ================================
  // CAMERA
  // ================================

  const toggleCamera = () => {
    const newState = !cameraOn;

    setCameraOn(newState);

    if (streamRef.current) {
      streamRef.current
        .getVideoTracks()
        .forEach((track) => {
          track.enabled = newState;
        });
    }
  };

  // ================================
  // END CALL
  // ================================

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  
    if (friendSocketIdRef.current) {
      socket.emit("end-call", {
        to: friendSocketIdRef.current,
      });
    }
  
    onEndCall();
  };

  // ================================
  // SWAP VIDEOS
  // ================================

  const swapScreens = () => {
    setIsFriendBig(
      (prev) => !prev
    );
  };

  // ================================
  // UI
  // ================================

  return (
    <div className="call-screen">

{handDetected && (
  <div className="hand-detected">
    {gesture || "✋ Hand detected!"}
  </div>
)}

      {/* HEADER */}

      <div className="call-header">

        <div>
          <h1>Frenzo</h1>

          <span>
            Private call ♡
          </span>
        </div>

        <div className="room-actions">

          <div className="room-id">
            Room:{" "}
            <strong>
              {currentRoomId ||
                "Not joined"}
            </strong>
          </div>

          <button
            className="join-btn"
            onClick={() =>
              setShowJoin(true)
            }
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
            isFriendBig
              ? "friend-big"
              : "friend-small"
          }`}
          onClick={swapScreens}
        >

          {friendConnected ? (
            <video
              ref={friendVideoRef}
              autoPlay
              playsInline
              className="friend-camera-video"
            />

            
          ) : (
            <div className="friend-avatar">
              👨🏻
            </div>
          )}

          <div className="friend-name">
            {friendName}
          </div>

        </div>

        {/* MY VIDEO */}

        <div
          className={`my-video ${
            isFriendBig
              ? "my-small"
              : "my-big"
          }`}
          onClick={swapScreens}
        >

{cameraOn ? (
  <>
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ filter: filter }}
    />

    <canvas
      ref={canvasRef}
      className="drawing-canvas"
    />
  </>
) : (
            <div className="camera-off">

              <VideoOff size={35} />

              <p>
                Camera off
              </p>

            </div>
          )}

          <div className="my-name">
            You
          </div>

        </div>

      </div>

      {/* CONTROLS */}

      <div className="call-controls">

        {/* MICROPHONE */}

        <button
          className={`control-btn ${
            !micOn
              ? "control-off"
              : ""
          }`}
          onClick={toggleMic}
        >
          {micOn ? (
            <Mic size={22} />
          ) : (
            <MicOff size={22} />
          )}
        </button>

        {/* CAMERA */}

        <button
          className={`control-btn ${
            !cameraOn
              ? "control-off"
              : ""
          }`}
          onClick={toggleCamera}
        >
          {cameraOn ? (
            <Video size={22} />
          ) : (
            <VideoOff size={22} />
          )}
        </button>

        <button

  className="control-btn"

  onClick={() => setShowFilters(!showFilters)}

  title="Filters"

>

  <Sparkles size={22} />

</button>

{showFilters && (
  <div className="filter-menu">
    <button onClick={() => setFilter("none")}>
      Normal
    </button>

    <button onClick={() => setFilter("grayscale(1)")}>
      🖤 Grayscale
    </button>

    <button onClick={() => setFilter("sepia(1)")}>
      🟤 Sepia
    </button>

    <button onClick={() => setFilter("brightness(1.3)")}>
      ☀️ Bright
    </button>

    <button onClick={() => setFilter("blur(3px)")}>
      🌫️ Blur
    </button>
  </div>
)}

        {/* END CALL */}

        <button
          className="end-call-btn"
          onClick={endCall}
        >
          <PhoneOff size={22} />
        </button>

      </div>

      {/* STATUS */}

      <p className="call-hint">

        {friendConnected
          ? "Connected to your friend ♡"
          : micOn && cameraOn
          ? "Your camera and microphone are ready ♡"
          : !micOn && !cameraOn
          ? "Camera and microphone are off"
          : !micOn
          ? "Microphone is off"
          : "Camera is off"}

      </p>

      {/* JOIN POPUP */}

      {showJoin && (
        <div className="join-overlay">

          <div className="join-box">

            <h2>
              Join a Frenzo Call ♡
            </h2>

            <p>
              Enter your friend's room
              code
            </p>

            <input
              value={joinRoomId}
              onChange={(e) =>
                setJoinRoomId(
                  e.target.value
                )
              }
              placeholder="FRENZO-1234"
            />

            <div className="join-actions">

              <button
                onClick={() => {
                  setShowJoin(false);
                  setJoinRoomId("");
                }}
              >
                Cancel
              </button>

              <button
                onClick={joinRoom}
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