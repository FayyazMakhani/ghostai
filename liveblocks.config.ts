import type { LiveblocksFlow } from "@liveblocks/react-flow"
import type { LiveList } from "@liveblocks/client"
import type { CanvasNode, CanvasEdge } from "./types/canvas"
import type { AiStatusFeedPayload, ChatMessage } from "./types/tasks"

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>;
      "ai-status-feed": LiveList<AiStatusFeedPayload>;
      "ai-chat": LiveList<ChatMessage>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent: { type: "ai-status"; message: string };
    ThreadMetadata: {};
    RoomInfo: {};
    ActivitiesData: {};
  }
}

export {};
