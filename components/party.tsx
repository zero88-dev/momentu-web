"use client";
import useEvent from "@/store/event.hooks";
import { LiaPlusSolid } from "react-icons/lia";
import Skeleton from "react-loading-skeleton";

const AddPhoto = () => {
  return (
    <div className="flex flex-col items-center justify-center px-3">
      <div
        className=" w-13 h-13 p-2 border-2 flex items-center justify-center bg-default-50 border-default-200"
        style={{
          borderRadius: "20px",
        }}
      >
        <LiaPlusSolid className="" size={20} />
      </div>
      <span className="text-xs mt-1 max-w-[64px] truncate">Meus</span>
    </div>
  );
};

const MemberPhoto = ({
  id,
  photo,
  name,
  isOwn,
}: {
  id: number;
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
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        </div>
      </div>
      <span className="text-xs mt-1 max-w-[64px] truncate">{name}</span>
    </div>
  );
};

const dataMembers = [
  {
    id: 1,
    name: "My Story",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    isOwn: true,
  },
  {
    id: 2,
    name: "Laura",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
  },
  {
    id: 3,
    name: "Dlers",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
  },
  {
    id: 4,
    name: "Jenny",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
  },
  {
    id: 5,
    name: "Andrey",
    photo:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
  },
  {
    id: 6,
    name: "David",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
  },
  {
    id: 7,
    name: "Maria",
    photo:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop",
  },
];

const SkeletonMember = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="flex flex-col items-center justify-center px-1"
          key={index}
        >
          <Skeleton width={50} height={50} style={{ borderRadius: "20px" }} />
          <Skeleton width={44} height={12} style={{ borderRadius: "20px" }} />
        </div>
      ))}
    </>
  );
};
export const Party = () => {
  const { dataEvent, loading, participants } = useEvent();
  console.log(participants);
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
                photo={participant.photoURL}
                name={participant.name}
                isOwn={participant.isOwn || false}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
