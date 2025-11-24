"use client";
import Skeleton from "react-loading-skeleton";

import useEvent from "@/store/event.hooks";

const MemberPhoto = ({
  id,
  photo,
  name,
  isOwn,
}: {
  id: string | number;
  photo: string;
  name: string;
  isOwn: boolean;
}) => {
  return (
    <div
      key={id}
      className="flex flex-col items-center flex-shrink-0 cursor-pointer"
    >
      <div
        className={`w-13 h-13 p-0.5 ${isOwn ? "bg-gray-300" : "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600"}`}
        style={{ borderRadius: "20px" }}
      >
        <div
          className="w-full h-full  border-1 border-default overflow-hidden"
          style={{ borderRadius: "18px" }}
        >
          <img alt={name} className="w-full h-full object-cover" src={photo} />
        </div>
      </div>
      <span className="text-xs mt-1 max-w-[64px] truncate">{name}</span>
    </div>
  );
};

const SkeletonMember = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-center px-1"
        >
          <Skeleton height={50} style={{ borderRadius: "20px" }} width={50} />
          <Skeleton height={12} style={{ borderRadius: "20px" }} width={44} />
        </div>
      ))}
    </>
  );
};

export const Party = () => {
  const { loading, participants } = useEvent();

  return (
    <div className="flex flex-row items-center justify-center mt-2 mb-4">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 max-w-2xl mx-auto">
          {loading && <SkeletonMember />}
          {!loading &&
            participants?.map((participant) => (
              <MemberPhoto
                key={participant.id}
                id={participant.id}
                isOwn={(participant as any).isOwn || false}
                name={participant.name}
                photo={participant.photoURL}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
