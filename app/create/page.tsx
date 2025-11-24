"use client";

import logo from "@/assets/logos/logo-dark.svg";
import arrow from "@/assets/svg/arrow.svg";
import { auth, database, storage } from "@/config/server";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Modal, ModalContent } from "@heroui/modal";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore/lite";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import Cropper, { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  FaCameraRetro,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaXmark,
} from "react-icons/fa6";
import Swal from "sweetalert2";
export default function BlogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = React.useState("");
  const [submitted, setSubmitted] = React.useState<Record<
    string,
    string
  > | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = React.useState(false);
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Estados para o crop
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );

  const toggleVisibility = () => setIsVisible(!isVisible);

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
      image.addEventListener("error", (error) => reject(error));
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
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const getPasswordError = (value: string) => {
    if (value.length < 4) {
      return "A senha deve ter pelo menos 4 caracteres";
    }

    return null;
  };

  const uploadPhoto = async (
    photoUrl: string,
    userId: string
  ): Promise<string> => {
    try {
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
      console.error("Erro ao fazer upload da foto:", error);
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

    // Password validation
    const passwordError = getPasswordError(data.password);

    if (passwordError) {
      newErrors.password = passwordError;
    }

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
      // Criar conta no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      let photoURL = null;

      // Fazer upload da foto se houver
      if (selectedPhoto) {
        try {
          photoURL = await uploadPhoto(selectedPhoto, user.uid);
        } catch (photoError) {
          console.error("Erro ao fazer upload da foto:", photoError);
          // Continuar mesmo se o upload da foto falhar
        }
      }

      // Atualizar perfil do usuário com nome e foto
      await updateProfile(user, {
        displayName: data.name,
        photoURL: photoURL || undefined,
      });

      // Salvar dados adicionais no Firestore
      const userDocRef = doc(collection(database, "users"), user.uid);
      const userData = {
        uid: user.uid,
        name: data.name,
        email: data.email,
        photoURL: photoURL,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, userData);

      // Salvar dados do usuário no localStorage
      localStorage.setItem("@momentu/user", JSON.stringify(userData));

      // Obter parâmetro da query string se existir
      const idParam = searchParams.get("id");

      // Se houver parâmetro na URL, salvar também em events_users
      if (idParam) {
        const eventUserDocRef = doc(
          collection(database, "events_users"),
          idParam
        );
        await setDoc(
          eventUserDocRef,
          {
            [user.uid]: userData,
          },
          { merge: true }
        );
      }

      // Mostrar sucesso e redirecionar
      await Swal.fire({
        title: "Conta criada!",
        text: "Sua conta foi criada com sucesso.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Limpar formulário após sucesso

      // Redirecionar para /m com o parâmetro se existir
      if (idParam) {
        router.push(`/m/${idParam}`);
      } else {
        router.push("/m");
      }
      setPassword("");
      setSelectedPhoto(null);
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);

      // Tratar erros específicos do Firebase
      let errorMessage = "Erro ao criar conta. Tente novamente.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso.";
        setErrors({ email: errorMessage });
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca.";
        setErrors({ password: errorMessage });
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
        setErrors({ email: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      className="w-full justify-center items-center p-5"
      validationErrors={errors}
      onReset={() => setSubmitted(null)}
      onSubmit={onSubmit}
    >
      <img src={logo.src} alt="Logo" width={145} height={32} className="mb-4" />

      <div className="flex flex-col gap-4 w-full">
        {/* Campo de Foto */}
        <div className="flex flex-col items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={openGallery}
            className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden"
          >
            {selectedPhoto ? (
              <img
                src={selectedPhoto}
                alt="Foto selecionada"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <FaCameraRetro className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </button>
          <div className="flex items-center gap-2 relative">
            <img
              src={arrow.src}
              alt="seta"
              width={22}
              height={22}
              className="rotate-45 absolute"
              style={{
                top: -15,
                right: 12,
              }}
            />
            <span className="text-xs text-gray-600 text-center">
              Clique aqui <br /> para {selectedPhoto ? "alterar" : "adicionar"}{" "}
              sua foto
            </span>
          </div>
        </div>

        <Input
          isRequired
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

        <Input
          isRequired
          errorMessage={getPasswordError(password)}
          isInvalid={getPasswordError(password) !== null}
          label="Senha"
          labelPlacement="outside"
          name="password"
          placeholder="Digite sua senha"
          type={isVisible ? "text" : "password"}
          value={password}
          onValueChange={setPassword}
          endContent={
            <button
              aria-label="toggle password visibility"
              className="focus:outline-solid outline-transparent"
              type="button"
              onClick={toggleVisibility}
            >
              {isVisible ? (
                <FaEyeSlash className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <FaEye className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
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
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
          <div className="w-full text-center text-sm text-gray-500 mt-2">
            Cancelar
          </div>
        </div>
      </div>

      {/* Modal de Crop */}
      <Modal
        isOpen={showCropModal}
        onClose={handleCancelCrop}
        size="full"
        hideCloseButton
        classNames={{
          base: "bg-black",
          backdrop: "bg-black",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="relative w-full h-full flex flex-col bg-black">
              <div
                className="relative flex-1"
                style={{ height: "calc(100vh - 120px)" }}
              >
                {imageToCrop && (
                  <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) => {
                      setCroppedAreaPixels(croppedAreaPixels);
                    }}
                    style={{
                      containerStyle: {
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      },
                    }}
                  />
                )}
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between p-4 bg-black">
                <button
                  onClick={handleCancelCrop}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <FaXmark className="w-6 h-6 text-white" />
                </button>

                <div className="flex-1 mx-4">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={handleCropComplete}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-white/90 transition-colors"
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
