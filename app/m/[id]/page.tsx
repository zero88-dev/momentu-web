"use client";
import { doc, getDoc } from "firebase/firestore/lite";
import { redirect } from "next/navigation";
import { use, useEffect } from "react";
import Skeleton from "react-loading-skeleton";

import { Feed } from "./components/feed";
import { Search } from "./page-search";

import { database } from "@/config/server";
import useEvent from "@/store/event.hooks";
import useModals from "@/store/modals.hooks";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { setDataEvent, setLoading, loading, setParticipants } = useEvent();
  const { visibleSearch, setVisibleSearch } = useModals() as {
    visibleSearch: boolean;
    setVisibleSearch: (visible: boolean) => void;
  };

  const getEventData = async () => {
    setLoading(true);
    try {
      // Buscar dados do evento
      const docRef = doc(database, "events", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Buscar usuários do evento em events_users
        const eventsUsersRef = doc(database, "events_users", id);
        const eventsUsersSnap = await getDoc(eventsUsersRef);

        if (eventsUsersSnap.exists()) {
          const usersData = eventsUsersSnap.data();

          // Converter objeto de usuários em array
          const users = Object.keys(usersData).map((userId) => ({
            id: userId,
            ...usersData[userId],
          }));

          setParticipants(users);
        }

        if (data) {
          setDataEvent({
            id,
            title: data.title || "",
            image: data.image,
            ...data,
          });
        }
      } else {
        redirect("/404");
      }
    } catch {
      // Error fetching event data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEventData();
  }, [id]);

  return (
    <div>
      {loading ? <Skeleton count={3} height={300} /> : <Feed eventId={id} />}
      <Search close={() => setVisibleSearch(false)} isOpen={visibleSearch} />
    </div>
  );
}
