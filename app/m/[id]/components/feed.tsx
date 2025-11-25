"use client";

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore/lite";
import { useEffect, useState } from "react";
import { TbCloudDownload, TbHeart } from "react-icons/tb";

import { Avatar } from "@/components/avatar";
import { database } from "@/config/server";
import useFeed from "@/store/feed.hooks";

export const Feed = ({ eventId }: { eventId: string }) => {
  const [likedItems, setLikedItems] = useState<
    Record<string | number, boolean>
  >({});
  const [isLiked, setIsLiked] = useState<string | null>(null);
  const { dataFeed, setDataFeed } = useFeed() as {
    dataFeed: any;
    setDataFeed: (data: any) => void;
  };
  const handleDoubleClick = async (itemId: string | number) => {
    try {
      setIsLiked(itemId as string);
      setTimeout(() => {
        setIsLiked(null);
      }, 1000);
      const userDataStr = localStorage.getItem("@momentu/user");
      if (!userDataStr) {
        console.error("Usuário não autenticado");
        return;
      }

      const userData = JSON.parse(userDataStr);
      const userId = userData.uid || userData.id;

      if (!userId) {
        console.error("ID do usuário não encontrado");
        return;
      }

      // Obter o item atual do feed para verificar se já tem like
      const currentItem = dataFeed?.find((item: any) => item.id === itemId);
      const currentLikes = currentItem?.likes || [];
      const isCurrentlyLiked = currentLikes.includes(userId);

      // Atualizar estado local otimisticamente
      setLikedItems((prev) => ({
        ...prev,
        [itemId]: !isCurrentlyLiked,
      }));

      // Atualizar no Firestore
      const docRef = doc(database, `feed/${eventId}/photos`, itemId as string);

      if (isCurrentlyLiked) {
        // Remover o ID do usuário do array de likes
        await updateDoc(docRef, {
          likes: arrayRemove(userId),
        });
      } else {
        // Adicionar o ID do usuário ao array de likes
        await updateDoc(docRef, {
          likes: arrayUnion(userId),
        });
      }

      // Recarregar o feed para refletir as mudanças
      await getFeed();
    } catch (error) {
      console.error("Erro ao atualizar like:", error);
      // Reverter o estado local em caso de erro
      setLikedItems((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
    }
  };

  const handleDownload = async (imageUrl: string, title: string) => {};

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

  // Inicializar estado de likes baseado nos dados do feed
  useEffect(() => {
    if (dataFeed && dataFeed.length > 0) {
      const userDataStr = localStorage.getItem("@momentu/user");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const userId = userData.uid || userData.id;

        if (userId) {
          const initialLikedItems: Record<string | number, boolean> = {};
          dataFeed.forEach((item: any) => {
            const likes = item.likes || [];
            initialLikedItems[item.id] = likes.includes(userId);
          });
          setLikedItems(initialLikedItems);
        }
      }
    }
  }, [dataFeed]);

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
          {isLiked === item.id && (
            <div className="absolute top-0 right-0 w-full h-full flex items-center justify-center animate-ping">
              <TbHeart
                className={`w-30 h-30 ${likedItems[item.id] ? "text-red-500" : "text-white"}`}
                fill={"currentColor"}
              />
            </div>
          )}
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
                    {item?.likes?.length || 0} Like
                    {(item?.likes?.length || 0) === 1 ? "" : "s"}
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
