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
const audioIcon = document.getElementById("audioIcon");


const acceptBtn = document.getElementById("acceptBtn");
const rejectBtn = document.getElementById("rejectBtn");

const incomingUI = document.getElementById("incomingCall");

const switchCameraBtn = document.getElementById("switchCameraBtn");
const screenShareBtn = document.getElementById("screenShareBtn");



// STATE
let roomId = null;
let pc = null;
let currentOffer = null;
let localStream = null;

let iceQueue = [];
let isRemoteSet = false;

let usingFrontCamera = true;
let isScreenSharing = false;
let cameraTrack = null;
let isOtherSharing = false;


// ================================================
//  ACTIONS (USER → SERVER)
// OUTGOING (you send to server)


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

  // console.log("Joined room:", roomId);
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

    iceQueue = [];     
    isRemoteSet = false;  
    
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

      iceQueue = [];    
      isRemoteSet = false;  
      
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

  // console.log("Call rejected");
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

  // RESET ICE STATE
  iceQueue = [];
  isRemoteSet = false;

  // console.log("Call ended");
};

// =====================================================
// HANDLERS (SERVER → USER)
// INCOMING (server sends to you)

// INCOMING CALL / RECEIVE OFFER
socket.on("offer", (offer) => {
  currentOffer = offer;

  incomingUI.style.display = "block";

  // console.log("Incoming call...");
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
    // console.log("Received ICE:", candidate);

   if (!pc) {
    // console.log("Storing ICE (pc not ready)");
    iceQueue.push(candidate);
    return;
  }

  if (!isRemoteSet) {
  // console.log("Queueing ICE (remote not set)");
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
  alert("Call ended by other user");
  // console.log("Other user ended the call");
});

// REJECTED
socket.on("reject", () => {
  // console.log("Call rejected by other user");
  alert("Call rejected");
});

//ROOM-FULL
socket.on("room-full", () => {
  alert("TThis room is already taken for a 1-to-1 call 😅 Try another ID.");
});

//Unexpected Leave
socket.on("user-left", () => {
  if (pc) {
    pc.close();
    pc = null;
  }

  remoteVideo.srcObject = null;

  callBtn.disabled = false;
  joinBtn.disabled = false;

  alert("User disconnected unexpectedly");
});

// ==============================================
// AUTO MIC SWITCH

navigator.mediaDevices.addEventListener("devicechange", async () => {

  if (!pc || !localStream) return;

  try {

    //Current mic in use
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const newTrack = stream.getAudioTracks()[0];

    // Current Audio Sender
    const sender = pc.getSenders().find(s => s.track && s.track.kind === "audio");

    //Replace mic in live
    if (sender && newTrack) {
      await sender.replaceTrack(newTrack);
    }

    const oldTrack = localStream.getAudioTracks()[0];
    if (oldTrack) oldTrack.stop();

    localStream.removeTrack(oldTrack);
    localStream.addTrack(newTrack);

  } catch (err) {
    console.error("Mic switch failed:", err);
  }
});

// ======================================================
//  SCREEN SHARE

screenShareBtn.onclick = async () => {
  if (!pc || !localStream) return;
  if (isOtherSharing) {
  alert("Other user is already sharing screen");
  return;
}

  try {
    if (!isScreenSharing) {
      socket.emit("start-screen", roomId);

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = stream.getVideoTracks()[0];

      cameraTrack = localStream.getVideoTracks()[0];

      const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
      await sender.replaceTrack(screenTrack);

      localStream.removeTrack(cameraTrack);
      localStream.addTrack(screenTrack);

      localVideo.srcObject = localStream;

      isScreenSharing = true;
      screenShareBtn.innerText = "📷 Stop Share";

      // auto stop
      screenTrack.onended = stopScreenShare;

      // console.log("🖥 Screen sharing");

    } else {
      stopScreenShare();
      socket.emit("stop-screen", roomId);
    }

  } catch (err) {
    console.error("Screen share error:", err);
  }
};

async function stopScreenShare() {
  if (!pc || !cameraTrack) return;

  const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
  await sender.replaceTrack(cameraTrack);

  const screenTrack = localStream.getVideoTracks()[0];
  if (screenTrack) screenTrack.stop();

  localStream.removeTrack(screenTrack);
  localStream.addTrack(cameraTrack);

  localVideo.srcObject = localStream;

  isScreenSharing = false;
  screenShareBtn.innerText = "🖥 Screen";



  // console.log("Back to camera");
}

//HANDLERS for Screen Share
socket.on("screen-started", () => {
  isOtherSharing = true;
  // console.log("Other user started screen share");
});

socket.on("screen-stopped", () => {
  isOtherSharing = false;
  // console.log("Other user stopped screen share");
});

socket.on("screen-denied", () => {
  alert("Someone else is already sharing screen");
});


// Cleanup on page close
window.onbeforeunload = () => {
  socket.disconnect();
  if (pc) pc.close();
};