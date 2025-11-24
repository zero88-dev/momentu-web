"use client";
import { database } from "@/config/server";
import useEvent from "@/store/event.hooks";
import useModals from "@/store/modals.hooks";
import { doc, getDoc } from "firebase/firestore/lite";
import { redirect } from "next/navigation";
import { use, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { Feed } from "./components/feed";
import { Search } from "./page-search";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { setDataEvent, setLoading, loading, setParticipants } = useEvent() as {
    setDataEvent: (data: any) => void;
    setLoading: (loading: boolean) => void;
    loading: boolean;
  };
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

        let users = [];
        if (eventsUsersSnap.exists()) {
          const usersData = eventsUsersSnap.data();
          // Converter objeto de usuários em array
          users = Object.keys(usersData).map((userId) => ({
            id: userId,
            ...usersData[userId],
          }));
          setParticipants(users);
        }

        if (data) {
          setDataEvent({
            id,
            ...data,
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

  useEffect(() => {
    getEventData();
  }, []);

  return (
    <div>
      {loading ? <Skeleton height={300} count={3} /> : <Feed eventId={id} />}
      <Search isOpen={visibleSearch} close={() => setVisibleSearch(false)} />
    </div>
  );
}
