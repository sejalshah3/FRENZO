# Frenzo

### Real-Time Video Calling with Interactive AR Effects

Frenzo is a real-time video calling web application designed to make online conversations more **interactive, expressive, and fun**.

Unlike a basic video-calling application, Frenzo combines **WebRTC video communication with real-time hand tracking, gesture detection, camera filters, and interactive AR effects**.

The project focuses on exploring how computer vision can be integrated into a real-time communication platform.


For example:

- Show your hand → the system detects it.
- Show 👍 → Frenzo recognizes the gesture.
- Move your finger → an AR flower follows your fingertip.
- Apply filters → change the appearance of your camera feed.

This makes video communication more expressive and engaging.

## ✨ Key Features

### 📹 Real-Time Video Calling
- Peer-to-peer video communication using WebRTC
- Camera and microphone support
- Real-time connection between users

### 🔗 Room-Based Calling
- Automatically generated room codes
- Users can join calls using a room code
- Socket.IO handles real-time signaling

### ✋ Hand Tracking
- Detects hands using MediaPipe
- Tracks 21 hand landmarks
- Tracks fingertips in real time

### 👍 Gesture Recognition
Currently supports gestures such as:

- 👍 Thumbs Up
- ✌️ Peace Sign

More gestures can be added in the future.

### 🌸 AR Hand Effects
Frenzo uses hand landmark coordinates to create interactive AR effects.