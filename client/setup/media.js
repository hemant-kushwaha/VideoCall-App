let localStream = null;

export default async function ensureMedia(localVideoEl) {
  
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideoEl.srcObject = localStream;
  

  return localStream;
}