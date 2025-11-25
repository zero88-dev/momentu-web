"use client";

import { useEffect, useState } from "react";
import { IoCloseOutline } from "react-icons/io5";

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed top-1 z-50 w-full flex items-center justify-center">
      <div className="bg-secondary w-90 h-10 flex items-center justify-center rounded-lg px-3">
        <span
          className="text-white text-sm w-full"
          onClick={handleInstallClick}
        >
          Click <b>aqui</b> e faça o download do app
        </span>
        <div
          style={{
            backgroundColor: "#FFFFFF30",
            width: "1px",
            height: "20px",
          }}
        />
        <div
          style={{
            marginLeft: "10px",
          }}
          onClick={() => setShowInstallButton(false)}
        >
          <IoCloseOutline className="w-5 h-5 text-white" />
        </div>
      </div>
      {/* <button
        onClick={handleInstallClick}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-primary/90 transition-colors"
        aria-label="Instalar aplicativo"
      >
        Instalar App
      </button> */}
    </div>
  );
}
