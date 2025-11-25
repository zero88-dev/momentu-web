"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Cam } from "@/components/cam";
import { FooterNavbar } from "@/components/footerNavbar";
import { MobileNavbar } from "@/components/mobileNavbar";
import "react-loading-skeleton/dist/skeleton.css";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("@momentu/user");

    if (!userData) {
      const pathParts = pathname.split("/").filter(Boolean);
      const idIndex = pathParts.indexOf("m");
      const id =
        idIndex !== -1 && pathParts[idIndex + 1]
          ? pathParts[idIndex + 1]
          : null;

      if (id) {
        router.push(`/auth?id=${id}`);
      } else {
        router.push("/auth");
      }
    }
  }, [pathname, router]);

  return (
    <section className="flex flex-col items-center justify-center">
      <MobileNavbar />

      <main className="overflow-y-auto pb-16 w-full">
        <div className="inline-block w-full justify-center">{children}</div>
      </main>
      <FooterNavbar openCam={() => setIsOpen(true)} />
      <Cam isOpen={isOpen} onClose={onClose} />
    </section>
  );
}
