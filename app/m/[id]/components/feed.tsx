"use client";

import { collection, doc, getDocs, updateDoc } from "firebase/firestore/lite";
import { useEffect, useState } from "react";
import { TbCloudDownload, TbHeart } from "react-icons/tb";

import { Avatar } from "@/components/avatar";
import { database } from "@/config/server";
import useFeed from "@/store/feed.hooks";

export const Feed = ({ eventId }: { eventId: string }) => {
  const [likedItems, setLikedItems] = useState<
    Record<string | number, boolean>
  >({});
  const { dataFeed, setDataFeed } = useFeed() as {
    dataFeed: any;
    setDataFeed: (data: any) => void;
  };
  const handleDoubleClick = async (itemId: string | number) => {
    const colRef = doc(database, `feed/${eventId}/photos`, itemId as string);
    const wasLiked = !likedItems[itemId];

    try {
      // 2. Use updateDoc to apply partial updates
      await updateDoc(colRef, {
        likes: wasLiked,
      });
    } catch {
      // Error updating document
    }

    setLikedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${title || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Error downloading image
    }
  };

  const getFeed = async () => {
    try {
      const colRef = collection(database, `feed/${eventId}/photos`);
      const querySnapshot = await getDocs(colRef);

      const photosData: any[] = [];

      querySnapshot.forEach((doc) => {
        photosData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Ordenar por time (mais nova para mais antiga)
      photosData.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);

        return timeB.getTime() - timeA.getTime(); // Ordem decrescente (mais recente primeiro)
      });

      setDataFeed(photosData);
    } catch {
      // Error fetching feed
    }
  };

  useEffect(() => {
    getFeed();
  }, [eventId]);

  return (
    <div className="w-full h-full">
      {dataFeed?.map((item: any, index: number) => (
        <div
          key={item.id}
          className="relative"
          style={{
            borderRadius: "38px",
            marginTop: index > 0 ? "-40px" : "0px",
            ...(index > 0
              ? {
                  boxShadow: "1px -8px 53px -10px rgba(0,0,0,0.75)",
                  WebkitBoxShadow: "1px -8px 53px -10px rgba(0,0,0,0.75)",
                  MozBoxShadow: "1px -8px 53px -10px rgba(0,0,0,0.75)",
                }
              : {}),
          }}
          onDoubleClick={() => handleDoubleClick(item.id)}
        >
          <img
            alt={item?.title || ""}
            className="w-full h-122 object-cover"
            src={item.photo}
            style={{
              borderRadius: "38px",
              borderBottomLeftRadius: "0px",
              borderBottomRightRadius: "0px",
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 h-full flex flex-col justify-between">
            <Avatar
              name={item.user.name}
              photo={item.user.photo}
              time={item.time}
            />
            <div
              className={`${index === dataFeed.length - 1 ? "mb-0" : "mb-10"} flex flex-col`}
            >
              <p
                className="text-sm font-medium text-white"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  display: "block",
                  textOverflow: "ellipsis",
                  textShadow: "1px 1px 6px rgba(0,0,0,0.62)",
                }}
              >
                {item.title}
              </p>
              <div
                className={`flex flex-row items-center justify-between mt-2 ${index === dataFeed.length - 1 ? "mb-0" : "mb-0"}`}
              >
                <div
                  className="flex flex-row items-center gap-2"
                  role="button"
                  style={{
                    borderRadius: "20px",
                    padding: "6px 12px",
                    backgroundColor: "#FFFFFF30",
                    cursor: "pointer",
                  }}
                  tabIndex={0}
                  onClick={() => handleDoubleClick(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleDoubleClick(item.id);
                    }
                  }}
                >
                  <TbHeart
                    className={`w-5 h-5 ${likedItems[item.id] ? "text-red-500" : "text-white"}`}
                    fill={"currentColor"}
                  />
                  <span className="text-white text-sm">
                    {likedItems[item.id]
                      ? item?.likes?.length + 1
                      : item?.likes?.length}{" "}
                    Likes
                  </span>
                </div>
                <div
                  role="button"
                  style={{
                    borderRadius: "20px",
                    padding: "6px",
                    backgroundColor: "#FFFFFF30",
                    cursor: "pointer",
                  }}
                  tabIndex={0}
                  onClick={() => handleDownload(item.photo, item.title)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleDownload(item.photo, item.title);
                    }
                  }}
                >
                  <TbCloudDownload className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
