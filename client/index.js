import ensureMedia from './setup/media.js';
import setupConnection from './setup/webrtc.js';

const socket = io();

// ELEMENTS
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const callBtn = document.getElementById("callBtn");
const hangupBtn = document.getElementById("hangupBtn");
const muteBtn = document.getElementById("muteBtn");
const videoToggleBtn = document.getElementById("videoToggleBtn");

const acceptBtn = document.getElementById("acceptBtn");
const rejectBtn = document.getElementById("rejectBtn");

const incomingUI = document.getElementById("incomingCall");

// STATE
let roomId = null;
let pc = null;
let currentOffer = null;
let localStream = null;

let iceQueue = [];
let isRemoteSet = false;

// ==============================
//  ACTIONS (USER → SERVER)
// OUTGOING (you send to server)
// ==============================


//JOIN ROOM
joinBtn.onclick = () => {
  const value = roomInput.value.trim();

  if (!value) {
    alert("Enter a room ID");
    return;
  }

  roomId = value;
  roomInput.value = ''

  socket.emit("join", roomId);

  console.log("Joined room:", roomId);
};

//VIDEO
videoToggleBtn.onclick = () => {
  if (!localStream) return;

  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;

  videoToggleBtn.innerText = videoTrack.enabled ? "📷 video off" : "📷 video on";
};

//MUTE
muteBtn.onclick = () => {
  if (!localStream) return;

  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;

  muteBtn.innerText = audioTrack.enabled ? "🎤 mute" : "🔇 unmute";
};

//CALL
callBtn.onclick = async () => {
  if (!roomId) {
    alert("Join a room first");
    return;
  }

  try {
    if (pc) {
       pc.close();
       pc = null;
       
      }
    
    localStream = await ensureMedia(localVideo);

    // get STUN/TURN  Server
    socket.emit("get-ice");

    socket.once("ice-servers", async (iceServers) => {

      pc = setupConnection(socket,roomId, remoteVideo, localStream,iceServers);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", { offer, roomId });

      
      })

    callBtn.disabled = true;
    joinBtn.disabled = true;
  
  } catch (err) {
    console.error(err);
    alert("Error starting call");
  }
};

// ACCEPT
acceptBtn.onclick = async () => {
  if (!roomId) {
    alert("Join a room first");
    return;
  }

  try {

      if (pc) {
       pc.close();
       pc = null;
      }
      
    incomingUI.style.display = "none";

    localStream = await ensureMedia(localVideo);

    // get STUN/TURN  Server
    socket.emit("get-ice");

    socket.once("ice-servers", async (iceServers) => {

      pc = setupConnection(socket,roomId, remoteVideo, localStream,iceServers);

      if (!currentOffer) {
       console.error("No offer to accept");
       return;
       }

      await pc.setRemoteDescription(new RTCSessionDescription(currentOffer));
      isRemoteSet = true;

      // ADD Past ICE
      for (const c of iceQueue) {
         try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
         } catch (e) {
         console.error("Queue ICE error:", e);
         }
         }
      iceQueue = [];


      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { answer, roomId });

       })

    callBtn.disabled = true;
    joinBtn.disabled = true;

  } catch (err) {
    console.error(err);
  }
};


//REJECT
rejectBtn.onclick = () => {
  incomingUI.style.display = "none";

  currentOffer = null;

  if (roomId) {
    socket.emit("reject", roomId);
  }

  console.log("Call rejected");
};

// HANGUP
hangupBtn.onclick = () => {
  if (pc) {
    pc.close();
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  currentOffer = null; 
  callBtn.disabled = false;
  joinBtn.disabled = false;

  if (roomId) {
    socket.emit("hangup", roomId);
    callBtn.disabled = false;
    joinBtn.disabled = false;
  }

  console.log("Call ended");
};


// ==============================
// HANDLERS (SERVER → USER)
// INCOMING (server sends to you)
// ==============================

// INCOMING CALL / RECEIVE OFFER
socket.on("offer", (offer) => {
  currentOffer = offer;

  incomingUI.style.display = "block";

  console.log("Incoming call...");
});

// RECEIVE ANSWER
socket.on("answer", async (answer) => {
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  isRemoteSet = true;

   // ADD Past ICE
  for (const c of iceQueue) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    } catch (e) {
      console.error("Queue ICE error:", e);
    }
  }

  iceQueue = [];

});

// ICE --> receive + use other users connection paths
socket.on("ice-candidate", async (candidate) => {
    console.log("Received ICE:", candidate);

   if (!pc) {
    console.log("Storing ICE (pc not ready)");
    iceQueue.push(candidate);
    return;
  }

  if (!isRemoteSet) {
  console.log("Queueing ICE (remote not set)");
  iceQueue.push(candidate);
  return;
   }

  //ADD future ICE
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.warn("ICE candidate delayed, retrying...", err);
  }

});

// REMOTE HANGUP
socket.on("hangup", () => {
  if (pc) {
    pc.close();
    pc = null;
  }

  remoteVideo.srcObject = null;

  currentOffer = null; 

  callBtn.disabled = false;
  joinBtn.disabled = false;
  console.log("Other user ended the call");
});

// REJECTED
socket.on("reject", () => {
  console.log("Call rejected by other user");
  alert("Call rejected");
});

//ROOM-FULL
socket.on("room-full", () => {
  alert("TThis room is already taken for a 1-to-1 call 😅 Try another ID.");
});
// Cleanup on page close
window.onbeforeunload = () => {
  socket.disconnect();
  if (pc) pc.close();
};