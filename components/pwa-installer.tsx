"use client";

import { useEffect, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (typeof window === "undefined") return false;

      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");

      if (isStandaloneMode) {
        setIsStandalone(true);
        return true;
      }

      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Verificar se o service worker está registrado
    const checkServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.getRegistration();
        } catch (error) {
          // Silently handle error
        }
      }
    };

    checkServiceWorker();

    // Handler para o evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Adicionar listener para beforeinstallprompt
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallButton(false);
      } else {
        setShowInstallButton(false);
      }
    } catch (error) {
      setShowInstallButton(false);
    }
  };

  const handleClose = () => {
    setShowInstallButton(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  // Não mostrar se já estiver instalado
  if (isStandalone || !showInstallButton) return null;

  return (
    <div className="fixed top-1 z-50 w-full flex items-center justify-center">
      <div className="bg-secondary w-90 h-10 flex items-center justify-center rounded-lg px-3">
        <button
          type="button"
          className="text-white text-sm w-full text-left bg-transparent border-none cursor-pointer p-0"
          onClick={handleInstallClick}
          aria-label="Instalar aplicativo"
        >
          Click <b>aqui</b> e faça o download do app
        </button>
        <div
          style={{
            backgroundColor: "#FFFFFF30",
            width: "1px",
            height: "20px",
          }}
        />
        <button
          type="button"
          style={{
            marginLeft: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={handleClose}
          onKeyDown={(e) => handleKeyDown(e, handleClose)}
          aria-label="Fechar"
        >
          <IoCloseOutline className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
