"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

export default function CodeViewer({
  code,
  lang,
}: {
  code: string;
  lang: "tsx" | "vue";
}) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    async function highlight() {
      const out = await codeToHtml(code, {
        lang,
        theme: "github-light",
      });
      setHtml(out);
    }

    highlight();
  }, [code, lang]);

  return (
    <div
      className="rounded-lg overflow-auto border p-4 text-xs"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
