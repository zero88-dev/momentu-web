"use client";

import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore/lite";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { TbChevronLeft } from "react-icons/tb";
import Swal from "sweetalert2";

import blurBG from "@/assets/images/blur-gradient.png";
import logo from "@/assets/logos/icon.svg";
import { auth, database } from "@/config/server";

function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const idParam = searchParams.get("id");

  const toggleVisibility = () => setIsVisible(!isVisible);

  const goBack = () => {
    if (idParam) {
      router.push(`/auth?id=${idParam}`);
    } else {
      router.push("/auth");
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    setIsLoading(true);
    setErrors({});

    try {
      // Fazer login no Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      // Buscar dados do usuário no Firestore
      const userDocRef = doc(database, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userData = {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || null,
      };

      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();
        userData = {
          ...userData,
          ...firestoreData,
        };
      }

      // Salvar dados do usuário no localStorage
      localStorage.setItem("@momentu/user", JSON.stringify(userData));

      // Mostrar sucesso
      await Swal.fire({
        title: "Login realizado!",
        text: "Bem-vindo de volta!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirecionar para a página do evento se houver idParam, senão para /m
      if (idParam) {
        router.push(`/m/${idParam}`);
      } else {
        router.push("/m");
      }
    } catch (error: any) {
      // Tratar erros específicos do Firebase
      let errorMessage = "Erro ao fazer login. Tente novamente.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado.";
        setErrors({ email: errorMessage });
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta.";
        setErrors({ password: errorMessage });
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
        setErrors({ email: errorMessage });
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email ou senha incorretos.";
        setErrors({ general: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative w-full h-full min-h-screen flex flex-col items-center justify-center p-2"
      style={{
        backgroundImage: `url(${blurBG.src})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
      }}
    >
      {/* Botão de voltar */}
      <div className="w-full flex items-start justify-start p-4 absolute top-0 left-0">
        <button
          className="flex items-center justify-center text-white hover:opacity-70 transition-opacity"
          onClick={goBack}
          type="button"
        >
          <TbChevronLeft className="w-7 h-7" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-md px-4">
        <img alt="Logo" className="mb-8" height={2} src={logo.src} width={55} />

        <Form
          className="w-full"
          validationErrors={errors}
          onSubmit={handleLogin}
        >
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Fazer login
            </h2>

            <Input
              isRequired
              errorMessage={({ validationDetails }) => {
                if (validationDetails.valueMissing) {
                  return "Seu email é obrigatório";
                }
                if (validationDetails.typeMismatch) {
                  return "Digite um email válido";
                }
                return errors.email;
              }}
              label="Email"
              labelPlacement="outside"
              name="email"
              placeholder="Digite seu email"
              type="email"
              classNames={{
                label: "text-white",
                input: "text-white",
                inputWrapper: "bg-white/20 border-white/30",
              }}
            />

            <Input
              isRequired
              endContent={
                <button
                  aria-label="toggle password visibility"
                  className="focus:outline-solid outline-transparent"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <FaEyeSlash className="text-2xl text-white/70 pointer-events-none" />
                  ) : (
                    <FaEye className="text-2xl text-white/70 pointer-events-none" />
                  )}
                </button>
              }
              errorMessage={errors.password}
              isInvalid={!!errors.password}
              label="Senha"
              labelPlacement="outside"
              name="password"
              placeholder="Digite sua senha"
              type={isVisible ? "text" : "password"}
              value={password}
              onValueChange={setPassword}
              classNames={{
                label: "text-white",
                input: "text-white",
                inputWrapper: "bg-white/20 border-white/30",
              }}
            />

            <div className="flex gap-4 flex-col mt-4">
              {errors.general && (
                <div className="text-sm text-red-300 text-center">
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
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginPage />
    </Suspense>
  );
}
