"use client";

import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Modal, ModalContent } from "@heroui/modal";
import { onAuthStateChanged, updateEmail, updateProfile } from "firebase/auth";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore/lite";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useParams, useRouter } from "next/navigation";
import React, { Suspense, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { FaCameraRetro, FaCheck, FaXmark } from "react-icons/fa6";
import Swal from "sweetalert2";

import logo from "@/assets/logos/logo-dark.svg";
import arrow from "@/assets/svg/arrow.svg";
import { auth, database, storage } from "@/config/server";

function EditProfileForm() {
  const router = useRouter();
  const params = useParams();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [userData, setUserData] = React.useState<any>(null);
  const [initialPhoto, setInitialPhoto] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Estados para o crop
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Obter dados do localStorage
        const userDataStr = localStorage.getItem("@momentu/user");

        if (userDataStr) {
          const localData = JSON.parse(userDataStr);
          setUserData(localData);
          setInitialPhoto(localData.photoURL || null);
          setSelectedPhoto(localData.photoURL || null);
        }

        // Obter dados atualizados do Firestore
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userDocRef = doc(collection(database, "users"), user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const firestoreData = userDocSnap.data();
              setUserData(firestoreData);
              setInitialPhoto(firestoreData.photoURL || null);
              setSelectedPhoto(firestoreData.photoURL || null);
            }
          }
          setIsLoadingData(false);
        });
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, []);

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result as string;

        setImageToCrop(result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
    // Resetar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();

      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", () =>
        reject(new Error("Failed to load image"))
      );
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve("");

          return;
        }
        const url = URL.createObjectURL(blob);

        resolve(url);
      }, "image/jpeg");
    });
  };

  const handleCropComplete = async () => {
    if (!imageToCrop || !croppedAreaPixels) {
      return;
    }

    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);

      setSelectedPhoto(croppedImage);
      setShowCropModal(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch {
      // Error processing image
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const uploadPhoto = async (
    photoUrl: string,
    userId: string
  ): Promise<string> => {
    try {
      // Se a foto já é uma URL (não foi alterada), retornar a URL original
      if (photoUrl && photoUrl.startsWith("http")) {
        return photoUrl;
      }

      // Converter URL do blob para blob
      const response = await fetch(photoUrl);
      const blob = await response.blob();

      // Criar nome único para o arquivo
      const fileName = `avatars/${userId}_${Date.now()}.jpg`;

      // Fazer upload para Firebase Storage
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, blob);

      // Obter URL de download
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      throw error;
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    // Converter FormData para objeto, convertendo valores para string
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Custom validation checks
    const newErrors: Record<string, string> = {};

    // Username validation
    if (data.name === "admin") {
      newErrors.name = "Tente outro nome de usuário";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      let photoURL = initialPhoto;

      // Fazer upload da foto se houver uma nova foto selecionada
      if (selectedPhoto && selectedPhoto !== initialPhoto) {
        try {
          photoURL = await uploadPhoto(selectedPhoto, user.uid);
        } catch {
          // Continuar mesmo se o upload da foto falhar
        }
      }

      // Atualizar perfil do usuário com nome e foto
      await updateProfile(user, {
        displayName: data.name,
        photoURL: photoURL || undefined,
      });

      // Atualizar email se foi alterado
      if (data.email !== user.email) {
        await updateEmail(user, data.email);
      }

      // Atualizar dados adicionais no Firestore
      const userDocRef = doc(database, "users", user.uid);
      const userDataToUpdate = {
        uid: user.uid,
        name: data.name,
        email: data.email,
        photoURL: photoURL,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userDocRef, userDataToUpdate);

      // Atualizar dados do usuário no localStorage
      const updatedUserData = {
        ...userData,
        ...userDataToUpdate,
      };
      localStorage?.setItem?.("@momentu/user", JSON.stringify(updatedUserData));

      // Atualizar também em events_users se houver eventId
      const eventId = params.id as string;
      if (eventId) {
        const eventUserDocRef = doc(
          collection(database, "events_users"),
          eventId
        );

        await updateDoc(eventUserDocRef, {
          [user.uid]: userDataToUpdate,
        });
      }

      // Mostrar sucesso e redirecionar
      await Swal.fire({
        title: "Perfil atualizado!",
        text: "Seus dados foram atualizados com sucesso.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirecionar para a página do evento
      if (eventId) {
        router.push(`/m/${eventId}`);
      } else {
        router.push("/m");
      }
    } catch (error: any) {
      // Tratar erros específicos do Firebase
      let errorMessage = "Erro ao atualizar perfil. Tente novamente.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso.";
        setErrors({ email: errorMessage });
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
        setErrors({ email: errorMessage });
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Por favor, faça login novamente para atualizar seu email.";
        setErrors({ general: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="w-full justify-center items-center p-5 flex flex-col gap-4">
        <img
          alt="Logo"
          className="mb-4"
          height={32}
          src={logo.src}
          width={145}
        />
        <div className="text-center text-gray-500">Carregando dados...</div>
      </div>
    );
  }

  return (
    <Form
      className="w-full justify-center items-center p-5"
      validationErrors={errors}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-4 w-full">
        {/* Campo de Foto */}
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            type="file"
            onChange={handleFileSelect}
          />
          <button
            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden"
            type="button"
            onClick={openGallery}
          >
            {selectedPhoto ? (
              <img
                alt="Foto selecionada"
                className="w-full h-full object-cover rounded-full"
                src={selectedPhoto}
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <FaCameraRetro className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </button>
          <div className="flex items-center gap-2 relative">
            <img
              alt="seta"
              className="rotate-45 absolute"
              height={22}
              src={arrow.src}
              style={{
                top: -15,
                right: 12,
              }}
              width={22}
            />
            <span className="text-xs text-gray-600 text-center">
              Clique aqui <br /> para {selectedPhoto ? "alterar" : "adicionar"}{" "}
              sua foto
            </span>
          </div>
        </div>

        <Input
          isRequired
          defaultValue={userData?.name || ""}
          errorMessage={({ validationDetails }) => {
            if (validationDetails.valueMissing) {
              return "Seu nome é obrigatório";
            }

            return errors.name;
          }}
          label="Nome"
          labelPlacement="outside"
          name="name"
          placeholder="Digite seu nome"
        />

        <Input
          isRequired
          defaultValue={userData?.email || ""}
          errorMessage={({ validationDetails }) => {
            if (validationDetails.valueMissing) {
              return "Seu email é obrigatório";
            }
            if (validationDetails.typeMismatch) {
              return "Digite um email válido";
            }
          }}
          label="Email"
          labelPlacement="outside"
          name="email"
          placeholder="Digite seu email"
          type="email"
        />

        <div className="flex gap-4 flex-col">
          {errors.general && (
            <div className="text-sm text-red-500 text-center">
              {errors.general}
            </div>
          )}
          <Button
            className="w-full"
            color="primary"
            disabled={isLoading}
            isLoading={isLoading}
            type="submit"
          >
            {isLoading ? "Salvando..." : "Salvar alterações"}
          </Button>
          <button
            className="w-full text-center text-sm text-gray-500 mt-2"
            type="button"
            onClick={() => {
              localStorage.removeItem("@momentu/user");
              const eventId = params.id as string;
              if (eventId) {
                router.push(`/m/${eventId}`);
              } else {
                router.push("/m");
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Modal de Crop */}
      <Modal
        hideCloseButton
        classNames={{
          base: "bg-black",
          backdrop: "bg-black",
        }}
        isOpen={showCropModal}
        size="full"
        onClose={handleCancelCrop}
      >
        <ModalContent>
          {() => (
            <div className="relative w-full h-full flex flex-col bg-black">
              <div
                className="relative flex-1"
                style={{ height: "calc(100vh - 120px)" }}
              >
                {imageToCrop && (
                  <Cropper
                    aspect={1}
                    crop={crop}
                    image={imageToCrop}
                    style={{
                      containerStyle: {
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      },
                    }}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onCropComplete={(_, croppedAreaPixels) => {
                      setCroppedAreaPixels(croppedAreaPixels);
                    }}
                    onZoomChange={setZoom}
                  />
                )}
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between p-4 bg-black">
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  onClick={handleCancelCrop}
                >
                  <FaXmark className="w-6 h-6 text-white" />
                </button>

                <div className="flex-1 mx-4">
                  <input
                    className="w-full"
                    max={3}
                    min={1}
                    step={0.1}
                    type="range"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                </div>

                <button
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-white/90 transition-colors"
                  onClick={handleCropComplete}
                >
                  <FaCheck className="w-6 h-6 text-black" />
                </button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </Form>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditProfileForm />
    </Suspense>
  );
}
