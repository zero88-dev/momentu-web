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

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (imageSrc) {
      setCapturedPhoto(imageSrc);
    }
  };

  const handleSend = async () => {
    if (!capturedPhoto) {
      return;
    }

    setIsUploading(true);
    try {
      // Converter base64 para blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();

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
      setDescription("");
      onClose();
    } catch {
      alert("Erro ao enviar foto. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
    setDescription("");
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
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
