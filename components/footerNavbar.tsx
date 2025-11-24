import { FaCamera } from "react-icons/fa6";

export const FooterNavbar = ({ openCam }: { openCam: () => void }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0"
      style={{
        borderTopLeftRadius: "26px",
        borderTopRightRadius: "26px",
      }}
    >
      <div className="flex items-center justify-center max-w-screen-xl mx-auto mb-3">
        <button
          className="p-2 hover:opacity-60 transition rounded-full"
          style={{
            backgroundColor: "#FFFFFF30",
          }}
          onClick={openCam}
        >
          <div className="w-15 h-15 bg-white rounded-full flex items-center justify-center">
            <FaCamera className="w-7 h-7" />
          </div>
        </button>
      </div>
    </nav>
  );
};
