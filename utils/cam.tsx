export const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoElement = document.querySelector(
      "#my-video"
    ) as HTMLVideoElement | null;

    if (videoElement) {
      videoElement.srcObject = stream;
    }
  } catch {
    // Error accessing camera
  }
};
