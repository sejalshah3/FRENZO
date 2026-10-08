import { useState, useEffect, useRef } from "react";

import { io } from "socket.io-client";
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
} from "@mediapipe/tasks-vision";
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
const [arEffect, setArEffect] = useState("flower");
const [drawingOn, setDrawingOn] = useState(true);
const [faceFilter, setFaceFilter] = useState("none");
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
  const faceLandmarkerRef = useRef(null);
  const visionPromiseRef = useRef(null);
  const faceLandmarkerInitializingRef = useRef(false);
const handLandmarkerInitializingRef = useRef(false);
  const canvasRef = useRef(null);
  const faceFilterCanvasRef = useRef(null);
  const drawingPointsRef = useRef([]);
  const previousGestureRef = useRef("");
  const gestureFramesRef = useRef(0);
  const boomParticlesRef = useRef([]);
  const isBoomingRef = useRef(false);

  const getVision = async () => {
    if (!visionPromiseRef.current) {
      visionPromiseRef.current =
        FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
        );
    }
  
    return visionPromiseRef.current;
  };

  const createHandLandmarker = async () => {

    if (
      handLandmarkerRef.current ||
      handLandmarkerInitializingRef.current
    ) {
      return;
    }
    
    handLandmarkerInitializingRef.current = true;
    const vision = await getVision();
  
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

    handLandmarkerInitializingRef.current = false;
  };

  const createFaceLandmarker = async () => {

    if (
      faceLandmarkerRef.current ||
      faceLandmarkerInitializingRef.current
    ) {
      return;
    }
    
    faceLandmarkerInitializingRef.current = true;

    const vision = await getVision();
  
    faceLandmarkerRef.current =
  
      await FaceLandmarker.createFromOptions(
  
        vision,
  
        {
  
          baseOptions: {
  
            modelAssetPath:
  
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  
            delegate: "GPU",
  
          },
  
          runningMode: "VIDEO",
  
          numFaces: 1,
  
        }
  
      );
  
    console.log("Face detector ready");
    faceLandmarkerInitializingRef.current = false;
  
  };

  useEffect(() => {
    createHandLandmarker();
    createFaceLandmarker();
  }, []);

  useEffect(() => {
    let animationFrameId;

    const drawFaceFilter = (faceLandmarks) => {
      const canvas = faceFilterCanvasRef.current;
    
      if (!canvas) return;
    
      const ctx = canvas.getContext("2d");
    
      // Clear old glasses every frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    
      // Don't draw anything if glasses are OFF
      if (
        faceFilter !== "glasses" &&
        faceFilter !== "mustache" &&
        faceFilter !== "cat"
      ) {
        return;
      }
    
      // Don't draw if no face is detected
      if (!faceLandmarks || faceLandmarks.length === 0) {
        return;
      }
    
      const face = faceLandmarks[0];
    
      const leftEye = face[33];
      const rightEye = face[263];
      const nose = face[1];
    
      const x1 = leftEye.x * canvas.width;
      const y1 = leftEye.y * canvas.height;
    
      const x2 = rightEye.x * canvas.width;
      const y2 = rightEye.y * canvas.height;
    
      const centerX = (x1 + x2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);

const centerY =
  faceFilter === "cat"
    ? nose.y * canvas.height - (canvas.height * 0.12)
    : faceFilter === "mustache"
    ? nose.y * canvas.height + (canvas.height * 0.04)
    : (y1 + y2) / 2;
    
    const faceWidth =
  Math.abs(face[454].x - face[234].x) * canvas.width;

const width =
  faceFilter === "cat"
    ? faceWidth * 1.1
    : faceFilter === "mustache"
    ? Math.abs(x2 - x1) * 0.8
    : Math.abs(x2 - x1) * 1.7;

const height =
  faceFilter === "cat"
    ? width * 1.5
    : faceFilter === "mustache"
    ? width * 0.65
    : width * 0.65;
    
    const image =
    faceFilter === "glasses"
      ? glassesImageRef.current
      : faceFilter === "mustache"
      ? mustacheImageRef.current
      : catImageRef.current;
    
      if (!image) return;
    
      ctx.save();

ctx.translate(centerX, centerY);
ctx.rotate(angle);

ctx.drawImage(
  image,
  -width / 2,
  -height / 2,
  width,
  height
);

ctx.restore();
    };
  
    const detectHands = () => {
      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;
      const faceLandmarker = faceLandmarkerRef.current;

      const faceCanvas = faceFilterCanvasRef.current;

if (
  video &&
  faceCanvas &&
  video.videoWidth > 0 &&
  video.videoHeight > 0
) {
  if (
    faceCanvas.width !== video.videoWidth ||
    faceCanvas.height !== video.videoHeight
  ) {
    faceCanvas.width = video.videoWidth;
    faceCanvas.height = video.videoHeight;
  }
}

      if (video && faceLandmarker && video.readyState >= 2) {
        const faceResults = faceLandmarker.detectForVideo(
          video,
          performance.now()
        );
      
        if (faceResults.faceLandmarks.length > 0) {
          drawFaceFilter(faceResults.faceLandmarks);
        }
      }
  
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
        console.log("Detected gesture:", detectedGesture);
        setGesture(detectedGesture);
      
        if (detectedGesture === "✋") {
          gestureFramesRef.current += 1;
        
          if (gestureFramesRef.current >= 12) {
            console.log("💥 BOOM! Open hand confirmed!");
            triggerBoom();
            gestureFramesRef.current = 0;
          }
        } else {
          gestureFramesRef.current = 0;
        }

        previousGestureRef.current = detectedGesture;
      
        if (drawingOn) {
          drawFinger(results.landmarks);
        }
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
  }, [arEffect, drawingOn, faceFilter]);

  const detectGesture = (landmarks) => {
    if (!landmarks || landmarks.length === 0) {
      return "";
    }
  
    const hand = landmarks[0];
  
    // 👍 Thumbs up
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
  
    // ✌️ Peace sign
    const peaceSign =
      hand[8].y < hand[6].y &&
      hand[12].y < hand[10].y &&
      hand[16].y > hand[14].y &&
      hand[20].y > hand[18].y;
  
    if (peaceSign) {
      return "✌️";
    }
  
    // ✋ Open hand
    const openHand =
      hand[8].y < hand[6].y &&
      hand[12].y < hand[10].y &&
      hand[16].y < hand[14].y &&
      hand[20].y < hand[18].y;
  
    if (openHand) {
      return "✋";
    }
  
    return "";
  };

  const flowerImageRef = useRef(null);
  const starImageRef = useRef(null);
  const heartImageRef = useRef(null);
  const glassesImageRef = useRef(null);
  const mustacheImageRef = useRef(null);
  const catImageRef = useRef(null);

  useEffect(() => {
    const flower = new Image();
    flower.src = "/effects/flower.png";
  
    flower.onload = () => {
      flowerImageRef.current = flower;
    };
  
    const star = new Image();
    star.src = "/effects/star.png";
  
    star.onload = () => {
      starImageRef.current = star;
    };
    const heart = new Image();
    heart.src = "/effects/heart.png";
  
    heart.onload = () => {
      heartImageRef.current = heart;
    };

    const glasses = new Image();
glasses.src = "/effects/glasses.png";

glasses.onload = () => {
  glassesImageRef.current = glasses;
};

const mustache = new Image();
mustache.src = "/effects/mustache.png";

mustache.onload = () => {
  mustacheImageRef.current = mustache;
};

const cat = new Image();
cat.src = "/effects/cat.png";

cat.onload = () => {
  catImageRef.current = cat;
};
  }, []);

  const triggerBoom = () => {
    if (!canvasRef.current || isBoomingRef.current) {
      return;
    }
  
    const canvas = canvasRef.current;
  
    isBoomingRef.current = true;
  
    boomParticlesRef.current = drawingPointsRef.current.map((point) => ({
      ...point,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      life: 1,
    }));
  
    drawingPointsRef.current = [];
  
    const animateBoom = () => {
      const ctx = canvas.getContext("2d");
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      boomParticlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
  
        particle.vx *= 0.98;
        particle.vy *= 0.98;
  
        particle.life -= 0.025;
  
        const image =
          particle.effect === "star"
            ? starImageRef.current
            : particle.effect === "heart"
            ? heartImageRef.current
            : flowerImageRef.current;
  
        if (image && particle.life > 0) {
          const size = 25 * particle.life;
  
          ctx.globalAlpha = particle.life;
  
          ctx.drawImage(
            image,
            particle.x - size / 2,
            particle.y - size / 2,
            size,
            size
          );
        }
      });
  
      ctx.globalAlpha = 1;
  
      boomParticlesRef.current =
        boomParticlesRef.current.filter(
          (particle) => particle.life > 0
        );
  
      if (boomParticlesRef.current.length > 0) {
        requestAnimationFrame(animateBoom);
      } else {
        isBoomingRef.current = false;
      }
    };
  
    animateBoom();
  };

  const drawFinger = (landmarks) => {
    if (
      !canvasRef.current ||
      !landmarks ||
      landmarks.length === 0
    ) {
      drawFinger.lastPositions = {};
      return;
    }
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
  
    const size = 14;
    const spacing = 45;
  
    if (!drawFinger.lastPositions) {
      drawFinger.lastPositions = {};
    }
  
    landmarks.forEach((hand, handIndex) => {
      const finger = hand[8];
  
      const x = finger.x * canvas.width;
const y = finger.y * canvas.height;
  
      const image =
        arEffect === "star"
          ? starImageRef.current
          : arEffect === "heart"
          ? heartImageRef.current
          : flowerImageRef.current;
  
      if (!image) return;
  
      const lastPoint = drawFinger.lastPositions[handIndex];
  
      if (!lastPoint) {
        drawingPointsRef.current.push({
          x,
          y,
          effect: arEffect,
        });
  
        ctx.drawImage(
          image,
          x - size / 2,
          y - size / 2,
          size,
          size
        );
  
        drawFinger.lastPositions[handIndex] = {
          x,
          y,
        };
  
        return;
      }
  
      const distance = Math.hypot(
        x - lastPoint.x,
        y - lastPoint.y
      );

      
  
      const steps = Math.max(
        1,
        Math.ceil(distance / spacing)
      );
  
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
  
        const newX =
          lastPoint.x + (x - lastPoint.x) * t;
  
        const newY =
          lastPoint.y + (y - lastPoint.y) * t;
  
        drawingPointsRef.current.push({
          x: newX,
          y: newY,
          effect: arEffect,
        });
  
        ctx.drawImage(
          image,
          newX - size / 2,
          newY - size / 2,
          size,
          size
        );
      }
  
      drawFinger.lastPositions[handIndex] = {
        x,
        y,
      };
    });
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

<canvas
  ref={faceFilterCanvasRef}
  className="face-filter-canvas"
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

    <button
  onClick={() => {
    setArEffect("star");
    console.log("STAR BUTTON CLICKED");
  }}
>
  ⭐ Stars
</button>

<button onClick={() => setArEffect("heart")}>
  💕 Hearts
</button>

<button onClick={() => setFaceFilter("glasses")}>
  🕶️ Glasses
</button>

<button onClick={() => setFaceFilter("mustache")}>
  🥸 Mustache
</button>

<button onClick={() => setFaceFilter("cat")}>
  🐱 Cat
</button>

<button onClick={() => setFaceFilter("none")}>
  ❌ Remove Face Filter
</button>

<button onClick={() => setDrawingOn(!drawingOn)}>
  {drawingOn ? "✏️ Drawing ON" : "🛑 Drawing OFF"}
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