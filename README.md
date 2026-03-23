### Real Time Video Calling + Screen Sharing App (WebRTC + Socket.IO)

> A production-ready peer-to-peer video calling application with advanced features like screen sharing, camera switching, and TURN-based connectivity.

---

## 🌐 Live Demo  
🔗 https://videocall-app-mldy.onrender.com

---

## ✨ Overview  

This project is a **real-time 1-to-1 video calling web application** built using **WebRTC** and **Socket.IO**.

Unlike basic WebRTC demos, this project focuses on **real-world reliability**, handling edge cases like:
- Network instability
- NAT/firewall restrictions
- Device switching
- Unexpected disconnects

---

## ⚡ Features  

### 🎯 Core Features  
- 🔗 Join room with unique ID  
- 📞 One-to-one video calling  
- 🎤 Mute / Unmute microphone  
- 📷 Toggle camera on/off  
- ❌ Call reject & hangup  
- 🚫 Room limit (2 users only)  

---

### 🔥 Advanced Features  
- 🖥 Screen sharing (only one user at a time)  
- 🔄 Camera switching (multi-device support)  
- 🎧 Auto microphone switching on device change  
- 🌍 STUN + TURN integration (Twilio)  
- 📡 ICE candidate queue system  
- 🔌 Graceful disconnect handling  

---

## 🧠 Tech Stack  

| Category      | Technology |
|--------------|-----------|
| Frontend     | HTML, CSS, JavaScript |
| Realtime     | WebRTC |
| Signaling    | Socket.IO |
| Backend      | Node.js, Express |
| Networking   | STUN (Google), TURN (Twilio) |

---

## 🏗 Project Structure  

```bash
8.VideoCall-App/
│
├── client/
│   ├── setup/
│   │   ├── media.js        # Handles camera & microphone
│   │   ├── webrtc.js       # RTCPeerConnection logic
│   │
│   ├── index.html          # UI structure
│   ├── index.js            # Main frontend logic
│   ├── style.css
│
├── Public/
│   ├── server.js           # Express server
│   ├── socket.js           # Socket signaling logic
│   ├── twil.js             # TURN credentials (Twilio)
│
├── .env                    # Environment variables
├── package.json

```
## ⚙️ How It Works  

1. Users join the same room ID  
2. Caller creates an **offer**  
3. Receiver accepts and sends **answer**  
4. ICE candidates are exchanged via Socket.IO  
5. WebRTC establishes a **direct peer-to-peer connection**  

---

## 🔍 Engineering Highlights  

- ✅ Room-based signaling system (1-to-1 architecture)  
- 🖥 Screen sharing with conflict control  
- 🔄 Camera switching using track replacement  
- 🎧 Dynamic microphone switching  
- 📡 ICE candidate queue for stable connections  
- 🌍 TURN server integration for real-world networking  
- 🔌 Graceful handling of disconnects and edge cases  

---

## 📈 Future Improvements  

- 👥 Group video calls (SFU architecture)  
- 💬 Chat messaging  
- 🎥 Call recording  
- 🔐 Authentication system  
- 🎨 UI upgrade (React + Tailwind)  

---

## 👨‍💻 Author  

**Your Name**  
🔗 GitHub:  https://github.com/hemant-kushwaha

---

## ⭐ Support  

If you like this project, please ⭐ the repo!



