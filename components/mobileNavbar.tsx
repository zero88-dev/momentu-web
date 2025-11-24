"use client";
import background from "@/assets/images/backgroundHeader.png";
import logo from "@/assets/logos/logo-white.svg";
import footer from "@/assets/svg/footerHeaderBackgorund.svg";
import useEvent from "@/store/event.hooks";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
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
          <Image src={logo} alt="logo" width={100} height={100} className="" />
        </div>
        <Image
          src={footer}
          alt="logo"
          style={{ width: "100%", position: "absolute", bottom: 0 }}
          className="w-full"
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
          <Skeleton width={140} height={17} />
        ) : (
          <span className="text-sm font-bold">{dataEvent.title}</span>
        )}
      </div>
    </>
  );
};
