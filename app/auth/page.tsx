"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import blurBG from "@/assets/images/blur-gradient.png";
import logo from "@/assets/logos/icon.svg";

function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get("id");

  const goToCreate = () => {
    router.push("/create?id=" + idParam);
  };

  const goToLogin = () => {
    if (idParam) {
      router.push(`/login?id=${idParam}`);
    } else {
      router.push("/login");
    }
  };

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center p-2"
      style={{
        backgroundImage: `url(${blurBG.src})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
      }}
    >
      <div className="flex flex-col items-center justify-center flex-1">
        <img alt="Logo" className="mb-4" height={2} src={logo.src} width={55} />
        <h2 className="text-lg text-center font-bold p-6">
          Cadastre-se ou faça login a baixo para começar a usar o Momentu!
        </h2>
      </div>
      <div className="w-full flex flex-col items-center justify-center gap-2 mb-10">
        <button
          type="button"
          className="w-full bg-primary text-white p-3 rounded-sm cursor-pointer flex items-center justify-center hover:bg-primary-dark transition-all duration-300"
          onClick={goToLogin}
        >
          <span className="text-white text-center font-bold">Fazer login</span>
        </button>
        <span className="text-gray-500 text-center text-sm">ou</span>
        <button
          type="button"
          className="w-full border-2 border-primary text-primary p-3 rounded-sm cursor-pointer flex items-center justify-center hover:bg-primary-dark transition-all duration-300"
          onClick={() => goToCreate()}
        >
          <span className="text-primary text-center font-bold">
            Criar conta
          </span>
        </button>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AuthPage />
    </Suspense>
  );
}
