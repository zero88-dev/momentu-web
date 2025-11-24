import { create } from "zustand";

interface EventState {
  dataEvent: {
    id: string;
    title: string;
    image?: string;
  };
  participants?: {
    id: string;
    name: string;
    photoURL: string;
  }[];
  loading: boolean;
  setDataEvent: (data: EventState["dataEvent"]) => void;
  setLoading: (loading: boolean) => void;
  setParticipants: (participants: EventState["participants"]) => void;
}
const useEvent = create<EventState>((set) => ({
  dataEvent: {
    id: "",
    title: "",
    image: "",
    participants: [],
  },
  participants: [],
  setDataEvent: (data: EventState["dataEvent"]) => set({ dataEvent: data }),
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
  setParticipants: (participants: EventState["participants"]) =>
    set({ participants }),
}));

export default useEvent;
