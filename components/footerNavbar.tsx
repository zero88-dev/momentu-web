import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaCamera } from "react-icons/fa6";
import { TbHomeFilled } from "react-icons/tb";

export const FooterNavbar = ({ openCam }: { openCam: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [userDataStr, setUserDataStr] = useState<string>("{}");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = window.localStorage.getItem("@momentu/user");
      setUserDataStr(userData || "{}");
    }
  }, []);

  const profile = () => {
    router.push(`${pathname}/profile`);
  };

  return (
    <nav
      className="fixed bottom-0 bg-default-50 left-0 right-0 px-6 py-2 z-50"
      style={{
        borderTopLeftRadius: "26px",
        borderTopRightRadius: "26px",
      }}
    >
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <button
          className="p-3 hover:opacity-60 transition"
          onClick={() => router.push(`/m/${pathname.split("/")[2]}`)}
        >
          <TbHomeFilled className="w-7 h-7" fill="currentColor" />
        </button>

        <button className="p-3 hover:opacity-60 transition" onClick={openCam}>
          <FaCamera className="w-7 h-7" />
        </button>

        <button
          className="p-3 hover:opacity-60 transition"
          onClick={() => profile()}
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-gray-900">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src={userDataStr ? JSON.parse(userDataStr).photoURL : ""}
            />
          </div>
        </button>
      </div>
    </nav>
  );
};
