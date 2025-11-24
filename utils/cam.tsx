export const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoElement = document.querySelector("#my-video");
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  } catch (error) {
    console.error("Erro ao acessar a câmera:", error);
  }
};
