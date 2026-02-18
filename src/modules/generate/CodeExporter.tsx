import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

// 🔵 Shared transformer
function transformTree(mode: "react" | "vue") {
  return () => (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (!node.properties) return;

      Object.keys(node.properties).forEach((key) => {
        // ---------- REACT RULES ----------
        if (mode === "react") {
          if (key === "className" || key === "class") {
            node.properties.className = node.properties[key];
            delete node.properties[key];
          }

          if (key === "for") {
            node.properties.htmlFor = node.properties[key];
            delete node.properties[key];
          }

          // SVG camelCase example
          if (key === "stroke-width") {
            node.properties.strokeWidth = node.properties[key];
            delete node.properties[key];
          }
        }

        // ---------- VUE RULES ----------
        if (mode === "vue") {
          // Example: onclick → @click
          if (key === "onclick") {
            node.properties["@click"] = node.properties[key];
            delete node.properties[key];
          }
        }
      });
    });
  };
}

export async function exportCode(html: string, mode: "react" | "vue") {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(transformTree(mode))
    .use(rehypeStringify)
    .process(html);

  const body = String(file);

  // Wrap output
  if (mode === "react") {
    return `
export default function GeneratedComponent() {
  return (
    <>
${body}
    </>
  )
}
`;
  }

  return `
<template>
${body}
</template>

<script setup>
</script>
`;
}
