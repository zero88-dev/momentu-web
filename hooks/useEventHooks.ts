"use client";
import { collection, doc, getDoc, getDocs } from "firebase/firestore/lite";
import { redirect, useParams } from "next/navigation";

import { database } from "@/config/server";
import useEvent from "@/store/event.hooks";
import useFeed from "@/store/feed.hooks";

export const useEventHooks = () => {
  const params = useParams();
  const { dataEvent, setDataEvent, setLoading } = useEvent() as {
    dataEvent: any;
    setDataEvent: (data: any) => void;
    setLoading: (loading: boolean) => void;
  };
  const { dataFeed, setDataFeed } = useFeed() as {
    dataFeed: any;
    setDataFeed: (data: any) => void;
  };
  const getEventData = async () => {
    if (!params.id) {
      return console.error("Event ID is required");
    }

    try {
      // Buscar dados do evento
      const docRef = doc(database, "events", params.id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Buscar usuários do evento em events_users
        const eventsUsersRef = doc(
          database,
          "events_users",
          params.id as string,
        );
        const eventsUsersSnap = await getDoc(eventsUsersRef);

        let users = [];

        if (eventsUsersSnap.exists()) {
          const usersData = eventsUsersSnap.data();

          // Converter objeto de usuários em array
          users = Object.keys(usersData).map((userId) => ({
            id: userId,
            ...usersData[userId],
          }));
        }

        if (data) {
          setDataEvent({
            id: params.id as string,
            ...data,
            users: users,
          });
        }
      } else {
        redirect("/404");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do evento:", error);
    } finally {
      setLoading(false);
    }
  };
  const getFeed = async () => {
    setLoading(true);
    if (!params.id) {
      return console.error("Event ID is required");
    }
    try {
      const colRef = collection(database, `feed/${params.id}/photos`);
      const querySnapshot = await getDocs(colRef);

      const photosData: any[] = [];

      querySnapshot.forEach((doc) => {
        photosData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setDataFeed(photosData);
    } catch (error) {
      console.error("Erro ao buscar feed:", error);
    } finally {
      setLoading(false);
    }
  };

  return { getEventData, getFeed };
};
