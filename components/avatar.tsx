import DefaultAvatar from "@/assets/images/default-avatar.jpg";
import { getTimeAgo } from "@/utils/date";
export const Avatar = ({
  photo,
  name,
  time,
}: {
  photo: string;
  name: string;
  time?: Date | string;
}) => {
  return (
    <div className="flex flex-row items-center flex-shrink-0 cursor-pointer gap-2">
      <div className={`w-13 h-13 p-0.5`} style={{ borderRadius: "20px" }}>
        <div
          className="w-full h-full  border-2 border-default overflow-hidden"
          style={{ borderRadius: "20px" }}
        >
          <img
            alt={name}
            className="w-full h-full object-cover"
            src={photo || DefaultAvatar.src}
          />
        </div>
      </div>
      <div className="flex flex-col items-start justify-center">
        <span
          className="text-sm font-semibold max-w-[200px] truncate text-white"
          style={{
            textShadow: "1px 1px 6px rgba(0,0,0,0.62)",
          }}
        >
          {name}
        </span>
        <span
          className="text-xs max-w-[100px] truncate text-white"
          style={{
            textShadow: "1px 1px 6px rgba(0,0,0,0.62)",
          }}
        >
          {getTimeAgo(time, "atrás")}
        </span>
      </div>
    </div>
  );
};
