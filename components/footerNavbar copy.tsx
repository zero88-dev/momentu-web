import useModals from "@/store/modals.hooks";
import { TbHeart, TbHomeFilled, TbSearch, TbSquarePlus } from "react-icons/tb";
export const FooterNavbar = ({ openCam }: { openCam: () => void }) => {
  const { setVisibleSearch } = useModals() as {
    visibleSearch: boolean;
    setVisibleSearch: (visible: boolean) => void;
  };
  const logout = () => {
    localStorage.removeItem("@momentu/user");
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
        <button className="p-3 hover:opacity-60 transition">
          <TbHomeFilled className="w-7 h-7" fill="currentColor" />
        </button>
        <button
          className="p-3 hover:opacity-60 transition"
          onClick={() => setVisibleSearch(true)}
        >
          <TbSearch className="w-7 h-7" />
        </button>
        <button className="p-3 hover:opacity-60 transition" onClick={openCam}>
          <TbSquarePlus className="w-7 h-7" />
        </button>
        <button className="p-3 hover:opacity-60 transition relative">
          <TbHeart className="w-7 h-7" />
          <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
        <button
          className="p-3 hover:opacity-60 transition"
          onClick={() => logout()}
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-gray-900">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>
    </nav>
  );
};
