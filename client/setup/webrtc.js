let pc = null;

export default function setupConnection(socket,roomId, remoteVideo, localStream,iceServers) {
  const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    ...(iceServers || [])
     ]
   });

  // send ICE
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("ice-candidate", { candidate: e.candidate, roomId });
    }
  };

  // receive stream
  pc.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };

  // send local stream
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  return pc;
}