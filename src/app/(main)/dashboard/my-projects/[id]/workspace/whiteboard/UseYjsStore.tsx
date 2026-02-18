import {
  type TLAnyShapeUtilConstructor,
  type TLInstancePresence,
  type TLRecord,
  type TLStoreWithStatus,
  createTLStore,
  defaultShapeUtils,
  react,
  transact,
} from "tldraw";
import { useRoom } from "@liveblocks/react";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useEffect, useState } from "react";
import * as Y from "yjs";

export function useYjsStore({
  roomId = "example",
  version = 1,
  customShapeUtils = [],
  userInfo,
}: Partial<{
  roomId: string;
  version: number;
  customShapeUtils: TLAnyShapeUtilConstructor[];
  userInfo: { id: string; name: string; color: string; avatar?: string };
}>) {
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...customShapeUtils],
    });
    return store;
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  const room = useRoom();

  // Use selector to only re-render if user info changes, not on every presence update (cursor move)
  // const userInfo = useSelf((me) => me.info);

  useEffect(() => {
    setStoreWithStatus({ status: "loading" });

    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);
    const unsubs: (() => void)[] = [];

    const yMapRecords = yDoc.getMap<TLRecord>(`tl_${version}_records`);

    // 1. Initialize store from Yjs
    transact(() => {
      // If the Yjs map has data, we load it into the store.
      // If it's empty, we seed it with the initial default local store state.
      if (yMapRecords.size > 0) {
        // Remove existing standard records to prevent duplicates with default initial state,
        // but CAREFULLY preserve instance/session state which store.clear() wipes.
        // For simplicity/safety to fix the crash, we just PUT the remote records.
        // Tldraw handles merging.
        
        const records: TLRecord[] = [];
        yMapRecords.forEach((record) => {
          records.push(record);
        });
        store.put(records);
      } else {
        // Seed the Yjs map with the default local records
        const initialRecords = store.allRecords();
        initialRecords.forEach((record) => {
           // Only sync document-scoped records ideally, but broadly sync for now 
           // to ensure consistent initial state.
           yMapRecords.set(record.id, record);
        });
      }
    });

    // 2. Listen for Yjs updates
    const handleYjsUpdate = (event: Y.YMapEvent<TLRecord>) => {
      transact(() => {
        event.keysChanged.forEach((key) => {
          const change = event.changes.keys.get(key);
          if (change) {
            if (change.action === "add" || change.action === "update") {
              const record = yMapRecords.get(key);
              if (record) store.put([record]);
            } else if (change.action === "delete") {
              store.remove([key as any]);
            }
          }
        });
      });
    };

    yMapRecords.observe(handleYjsUpdate);
    unsubs.push(() => yMapRecords.unobserve(handleYjsUpdate));

    // 3. Listen for Store updates and sync to Yjs
    const handleStoreUpdate = (event: any) => {
      if (event.source === "remote") return;

      yDoc.transact(() => {
        Object.values(event.changes.added).forEach((record: any) => {
          yMapRecords.set(record.id, record);
        });
        Object.values(event.changes.updated).forEach((record: any) => {
          const [, to] = record as [any, any];
          yMapRecords.set(to.id, to);
        });
        Object.values(event.changes.removed).forEach((record: any) => {
          yMapRecords.delete(record.id);
        });
      });
    };
    // @ts-ignore - store.listen types might slightly vary across versions
    unsubs.push(store.listen(handleStoreUpdate, { source: "user", scope: "document" }));

    // 4. Presence Sync (Disabled in favor of Liveblocks Presence + Custom Cursors)
    // const awareness = yProvider.awareness;
    //
    // const removePresenceDerivation = react("when presence changes", () => {
    //   const presence = store.get(
    //     createTLStore().schema.types.instance_presence.createId(store.id)
    //   );
    //   if (presence) {
    //     awareness.setLocalStateField("presence", presence as any);
    //     // const userInfo = useSelf((me) => me.info); // Not accessible here without hook
    //     // But we passed userInfo in props? 
    //     // Anyhow, disabled.
    //   }
    // });
    // unsubs.push(removePresenceDerivation);
    //
    // const handleAwarenessUpdate = () => {
    //   const states = awareness.getStates();
    //
    //   transact(() => {
    //     const records: TLInstancePresence[] = [];
    //
    //     states.forEach((state: any, clientID) => {
    //       if (clientID === awareness.doc.clientID) return;
    //
    //       const presence = state.presence as TLInstancePresence;
    //       const user = state.user;
    //       
    //       if (presence && user) {
    //          records.push({
    //            ...presence,
    //            userId: user.id,
    //            userName: user.name,
    //            chatMessage: "", // Required types
    //            color: user.color, 
    //          });
    //       } else if (presence) {
    //         records.push(presence);
    //       }
    //     });
    //
    //     if (records.length) store.put(records);
    //   });
    // };
    //
    // awareness.on("update", handleAwarenessUpdate);
    // unsubs.push(() => awareness.off("update", handleAwarenessUpdate));

    setStoreWithStatus({
      store,
      status: "synced-remote",
      connectionStatus: "online",
    });

    return () => {
      unsubs.forEach((fn) => fn());
      yProvider.destroy();
      yDoc.destroy();
    };
  }, [room, store, version, userInfo]);

  return storeWithStatus;
}
