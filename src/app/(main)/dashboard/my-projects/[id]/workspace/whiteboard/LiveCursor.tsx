import { useOthers } from "@liveblocks/react/suspense";
import { useEditor } from "tldraw";
import { useEffect, useState } from "react";

export function LiveCursors() {
  const editor = useEditor();
  const others = useOthers();

  // We need to re-render when the camera moves to keep cursors in sync with the canvas
  // Tldraw's `editor.on('change')` might be too noisy, but we need standard React render cycle.
  // Actually, `useOthers` triggers render when others move.
  // But if *I* pan the camera, the *screen position* of others' cursors must update.
  // `useOthers` won't trigger on MY pan.
  // We can subscribe to the camera state.

  const [viewportHash, setViewportHash] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;
    const handleChange = () => {
      setViewportHash((prev) => prev + 1);
    };
    editor.on("change", handleChange);
    return () => {
      editor.off("change", handleChange);
    };
  }, [editor]);

  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        const userPresence = presence as { cursor?: { x: number; y: number } };
        const userInfo = info as { name?: string; color?: string };

        if (!userPresence?.cursor) return null;

        const { x, y } = userPresence.cursor;
        const screenPoint = editor.pageToViewport({ x, y });

        return (
          <Cursor
            key={connectionId}
            x={screenPoint.x}
            y={screenPoint.y}
            name={userInfo?.name}
            color={userInfo?.color}
          />
        );
      })}
    </>
  );
}

function Cursor({
  x,
  y,
  name,
  color,
}: {
  x: number;
  y: number;
  name?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translateX(${x}px) translateY(${y}px)`,
        pointerEvents: "none",
        zIndex: 100, // Above canvas
      }}
      className="flex flex-col items-start"
    >
      {/* SVG Cursor Icon */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19169L17.4087 18.0673L11.751 18.0673L11.5575 18.0673L11.4144 18.1976L8.88334 20.5019L8.2327 18.784L5.65376 12.3673Z"
          fill={color || "#000"}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      {/* Name Label */}
      {name && (
        <div
          className="ml-4 -mt-6 px-2 py-1 rounded-sm text-xs text-white whitespace-nowrap"
          style={{ backgroundColor: color || "#000" }}
        >
          {name}
        </div>
      )}
    </div>
  );
}
