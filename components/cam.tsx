"use client";

import { Input } from "@heroui/input";
import { Modal, ModalContent } from "@heroui/modal";
import { addDoc, collection } from "firebase/firestore/lite";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  FaArrowRight,
  FaArrowsRotate,
  FaImage,
  FaXmark,
} from "react-icons/fa6";
import Webcam from "react-webcam";

import { database, storage } from "@/config/server";
import { useEventHooks } from "@/hooks/useEventHooks";
export const Cam = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [isUploading, setIsUploading] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getEventData, getFeed } = useEventHooks();
  const params = useParams();
  const eventId = params?.id as string;

  const getUserData = () => {
    try {
      const userDataStr = localStorage.getItem("@momentu/user");

      if (userDataStr) {
        return JSON.parse(userDataStr);
      }
    } catch {
      // Error reading user data from localStorage
    }

    return null;
  };

  const compressImage = async (
    blob: Blob,
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    maxSizeMB: number = 1
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calcular novas dimensões mantendo proporção
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Criar canvas e redimensionar
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(blob);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Comprimir com qualidade progressiva até ficar abaixo do tamanho máximo
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        let quality = 0.9;

        const compress = () => {
          canvas.toBlob(
            (compressedBlob) => {
              if (!compressedBlob) {
                resolve(blob);
                return;
              }

              // Se o tamanho estiver OK ou qualidade muito baixa, retornar
              if (compressedBlob.size <= maxSizeBytes || quality <= 0.1) {
                resolve(compressedBlob);
              } else {
                // Reduzir qualidade e tentar novamente
                quality -= 0.1;
                compress();
              }
            },
            "image/jpeg",
            quality
          );
        };

        compress();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(blob);
      };

      img.src = url;
    });
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (imageSrc) {
      setCapturedPhoto(imageSrc);
      setOriginalFile(null); // Foto da câmera não é HEIC
    }
  };

  const handleSend = async () => {
    if (!capturedPhoto) {
      return;
    }

    setIsUploading(true);
    try {
      let blob: Blob;

      // Se temos o arquivo original e é HEIC, converter para JPG
      if (originalFile) {
        const isHeic =
          originalFile.type === "image/heic" ||
          originalFile.type === "image/heif" ||
          originalFile.type === "image/heic-sequence" ||
          originalFile.type === "image/heif-sequence" ||
          originalFile.name.toLowerCase().endsWith(".heic") ||
          originalFile.name.toLowerCase().endsWith(".heif");

        if (isHeic) {
          try {
            // Importar heic2any dinamicamente (apenas no cliente)
            const heic2anyModule = await import("heic2any");
            const heic2any = heic2anyModule.default || heic2anyModule;

            // Converter HEIC para JPEG
            const converted = await heic2any({
              blob: originalFile,
              toType: "image/jpeg",
              quality: 0.92,
            });

            // heic2any retorna um array de blobs, pegar o primeiro
            blob = Array.isArray(converted) ? converted[0] : converted;

            if (!blob) {
              throw new Error("Falha ao converter HEIC para JPEG");
            }
          } catch (error) {
            console.error("Erro ao converter HEIC:", error);
            // Se falhar a conversão, tentar usar o base64
            const response = await fetch(capturedPhoto);
            blob = await response.blob();
          }
        } else {
          // Arquivo não é HEIC, converter base64 para blob
          const response = await fetch(capturedPhoto);
          blob = await response.blob();
        }
      } else {
        // Foto da câmera ou sem arquivo original, converter base64 para blob
        const response = await fetch(capturedPhoto);
        blob = await response.blob();
      }

      // Comprimir imagem se necessário (redimensionar e comprimir para < 1MB)
      blob = await compressImage(blob, 1920, 1920, 1);

      // Criar nome único para o arquivo
      const timestamp = new Date().toISOString();
      const fileName = `photos/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;

      // Fazer upload para Firebase Storage
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, blob);

      // Obter URL de download
      const photoUrl = await getDownloadURL(storageRef);

      // Obter dados do usuário do localStorage
      const userData = getUserData();

      if (!userData) {
        throw new Error("Dados do usuário não encontrados no localStorage");
      }

      if (!eventId) {
        throw new Error("ID do evento não encontrado");
      }

      // Criar documento no Firestore
      await addDoc(collection(database, `feed/${eventId}/photos`), {
        likes: [],
        time: new Date().toISOString(),
        title: description,
        photo: photoUrl,
        user: {
          id: userData.uid || userData.id,
          name: userData.name,
          photo: userData.photoURL,
        },
      });

      await getEventData();
      await getFeed();
      setCapturedPhoto(null);
      setOriginalFile(null);
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      alert("Erro ao enviar foto. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
    setOriginalFile(null);
    setDescription("");
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    // Verificar se é HEIC
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.type === "image/heic-sequence" ||
      file.type === "image/heif-sequence" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    // Armazenar arquivo original para conversão no envio se necessário
    setOriginalFile(file);

    if (isHeic) {
      try {
        // Importar heic2any dinamicamente (apenas no cliente)
        const heic2anyModule = await import("heic2any");
        const heic2any = heic2anyModule.default || heic2anyModule;

        // Converter HEIC para JPEG usando heic2any
        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.92,
        });

        // heic2any retorna um array de blobs, pegar o primeiro
        const jpegBlob = Array.isArray(converted) ? converted[0] : converted;

        if (!jpegBlob) {
          throw new Error("Falha ao converter HEIC para JPEG");
        }

        // Converter blob para base64 para preview
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setCapturedPhoto(result);
        };
        reader.onerror = () => {
          throw new Error("Erro ao ler arquivo convertido");
        };
        reader.readAsDataURL(jpegBlob);
      } catch (error) {
        console.error("Erro ao converter HEIC:", error);
        alert("Erro ao converter imagem HEIC para JPG. Tente novamente.");
      }
    } else {
      // Arquivo não é HEIC, usar normalmente
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedPhoto(result);
      };
      reader.readAsDataURL(file);
    }

    // Resetar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <Modal hideCloseButton isOpen={isOpen} size={"full"} onClose={onClose}>
      <ModalContent style={{ padding: 0 }}>
        {() => (
          <>
            {capturedPhoto ? (
              <div className="relative w-full h-full flex flex-col p-2  bg-black">
                <div
                  className="p-1 rounded-full absolute top-4 left-4"
                  role="button"
                  style={{
                    backgroundColor: "#FFFFFFcc",
                    border: "1px solid #FFFFFF30",
                    cursor: "pointer",
                  }}
                  tabIndex={0}
                  onClick={handleCancel}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleCancel();
                    }
                  }}
                >
                  <FaXmark className="w-5 h-5 text-black" />
                </div>
                <img
                  alt="Foto capturada"
                  className="w-full h-full object-cover rounded-2xl"
                  height={window.innerHeight}
                  src={capturedPhoto}
                />
                <div className="flex items-center gap-2 my-4">
                  <Input
                    className="flex-1 rounded-full"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/20 border-white/30",
                    }}
                    placeholder="Adicione uma legenda..."
                    radius="full"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div
                    className="p-2 rounded-full"
                    role="button"
                    style={{
                      backgroundColor: isUploading ? "#FFFFFF80" : "#FFFFFFF2",
                      border: "1px solid #FFFFFF30",
                      cursor: isUploading ? "not-allowed" : "pointer",
                    }}
                    tabIndex={isUploading ? -1 : 0}
                    onClick={isUploading ? undefined : handleSend}
                    onKeyDown={(e) => {
                      if (
                        !isUploading &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        handleSend();
                      }
                    }}
                  >
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaArrowRight className="w-6 h-6 text-black" />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-full relative"
                style={{ padding: 0 }}
              >
                <div
                  className="p-1 rounded-full absolute top-4 left-4"
                  role="button"
                  style={{
                    backgroundColor: "#FFFFFFcc",
                    border: "1px solid #FFFFFF30",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                  tabIndex={0}
                  onClick={onClose}
                >
                  <FaXmark className="w-5 h-5 text-black" />
                </div>
                <input
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  type="file"
                  onChange={handleFileSelect}
                />
                <Webcam
                  key={facingMode}
                  ref={webcamRef}
                  audio={false}
                  className="w-full h-full object-cover"
                  height={window.innerHeight}
                  mirrored={true}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: facingMode,
                  }}
                  width={window.innerWidth}
                />
                <div className="flex items-center justify-between absolute bottom-0 w-full px-4 mb-4">
                  <button
                    className="rounded-full p-3 flex items-center justify-center"
                    style={{ backgroundColor: "#FFFFFF30" }}
                    onClick={openGallery}
                  >
                    <FaImage className="w-6 h-6 text-white" />
                  </button>
                  <button
                    className="rounded-full p-3 flex items-center justify-center"
                    style={{ backgroundColor: "#FFFFFF30" }}
                    onClick={handleCapture}
                  >
                    <div className="w-14 h-14 bg-white rounded-full" />
                  </button>
                  <button
                    className="rounded-full p-3 flex items-center justify-center"
                    style={{ backgroundColor: "#FFFFFF30" }}
                    onClick={toggleCamera}
                  >
                    <FaArrowsRotate className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
