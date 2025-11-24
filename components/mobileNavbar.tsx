"use client";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";

import background from "@/assets/images/backgroundHeader.png";
import logo from "@/assets/logos/logo-white.svg";
import footer from "@/assets/svg/footerHeaderBackgorund.svg";
import useEvent from "@/store/event.hooks";
export const MobileNavbar = () => {
  const { dataEvent, loading } = useEvent();

  return (
    <>
      <header
        className="py-3 bg-primary w-full h-25 w-full"
        style={{
          backgroundImage: `url(${background.src})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          backgroundRepeat: "no-repeat",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image alt="logo" className="" height={100} src={logo} width={100} />
        </div>
        <Image
          alt="logo"
          className="w-full"
          src={footer}
          style={{ width: "100%", position: "absolute", bottom: 0 }}
        />
      </header>
      <div
        className="w-full flex items-center justify-center"
        style={{
          marginTop: "-35px",
          height: "35px",
          zIndex: 2,
        }}
      >
        {loading ? (
          <Skeleton height={17} width={140} />
        ) : (
          <span className="text-sm font-bold">{dataEvent.title}</span>
        )}
      </div>
    </>
  );
};
