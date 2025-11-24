import { create } from "zustand";

interface FeedState {
  dataFeed: {
    title: string;
    photo: string;
    user: {
      id: string;
      name: string;
      photo: string;
    };
    likes: number;
    time: Date;
  }[];
  setDataFeed: (data: FeedState["dataFeed"]) => void;
}
const useFeed = create<FeedState>((set) => ({
  dataFeed: [],
  setDataFeed: (data: FeedState["dataFeed"]) => set({ dataFeed: data }),
}));

export default useFeed;
