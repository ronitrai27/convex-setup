import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
// import { openai } from "@ai-sdk/openai";

import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  stepCountIs,
  tool,
} from "ai";
import { z } from "zod";

const tools = {
  searchWeb: tool({
    description:
      "Search the web for UI/UX inspiration and design trends or crawl a specific URL.",
    // @ts-ignore
    inputSchema: z.object({
      query: z.string().describe("The search query or URL to crawl"),
      mode: z.enum(["search", "scrape"]).optional().default("search"),
    }),
    needsApproval: true,
    // @ts-ignore
    execute: async ({ query, mode }: { query: string; mode: string }) => {
      console.log("query and Mode by AI: ====> ", query, mode);
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");
      const baseUrl = "https://api.firecrawl.dev/v0";
      if (mode === "scrape" || query.startsWith("http")) {
        // Use scrape
        const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ url: query }),
        });
        const data = await res.json();
        console.log("data from firecrawl", data);
        // @ts-ignore
        return data.data?.content || data.data?.markdown || "No content found";
      } else {
        // Use search
        const res = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ query: query }),
        });
        const data = await res.json();
        console.log("data from firecrawl (SEARCH PART)", data);
        // @ts-ignore
        return JSON.stringify(data.data || []);
      }
    },
  }),
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();
    console.log("messages recieved from client", messages);

    // gemini-3-pro-preview
    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: `You are an expert Web Developer and Senior UI/UX Designer specializing in modern, scalable, and production-ready interfaces using Tailwind CSS, Flowbite, and modern SaaS design principles.
Your goal is to create high-quality, visually polished, and professional UI experiences comparable to top modern SaaS platforms.

## You have access to a powerful searchWeb tool for gathering:
-Design inspiration
-Layout patterns
-UX best practices
-Content ideas aligned with user requirements

When to USE searchWeb:
-Always use searchWeb tool for new design requests.
-When creating a new design from user requirements.
-When you need inspiration, modern patterns, or real-world references.

When NOT to USE searchWeb:
-When the user asks to modify or redesign an existing UI.
-When only code refactoring or small UI fixes are requested.

## Response Modes

**CODE MODE** - Generate HTML for:
- UI components, pages, layouts, or designs
- HTML/Tailwind/JavaScript code requests

**CHAT MODE** - Conversational responses for:
- Greetings, questions, clarifications, or advice

---

## CODE MODE Instructions

### Output Format
- **CRITICAL**: Wrap ALL HTML in markdown code blocks:
\`\`\`html
[Your complete HTML code here]
\`\`\`
- Include ONLY <body> content (no <html>, <head>, or <title>)
- No text before or after the code block

### Design Requirements
- **Theme**: Design with a modern, clean, and professional aesthetic.
    - Primary: blue-600 (e.g., for buttons, links)
    - Secondary: gray-500 (e.g., for subtext, borders)
    - Accent: indigo-500 (e.g., for highlights, special icons)
- **Responsive**: Mobile-first, works on all screen sizes
- **Spacing**: Proper padding (p-4, p-6, p-8) and margins (m-4, m-6, m-8)
- **Typography**: Clear hierarchy using Tailwind text utilities
- **Components**: Independent, modular components with theme consistency
- **Animations**: Apply subtle and smooth Tailwind animations to interactive elements. Use transition, duration-300, and ease-in-out on hover/focus states for buttons, links, and form inputs. Avoid overly distracting or slow animations.
- **Dark Mode**: All components MUST be compatible with dark mode. Use Tailwind's dark: variants (e.g., dark:bg-gray-800, dark:text-white) to ensure designs look great in both light and dark environments.

### Libraries & Components
Use as appropriate:
- Flowbite UI (buttons, modals, forms, tables, tabs, alerts, cards, dropdowns, accordions)
- FontAwesome icons (fa fa-*)
- Chart.js (themed charts matching blue palette)
- Swiper.js (carousels/sliders)
- Tippy.js (tooltips)

### Images
- Light mode: https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg
- Dark mode: https://www.cibaky.com/wp-content/uploads/2015/12/placeholder-3.jpg
- Always add descriptive alt text

### Best Practices
- Semantic HTML5 elements
- Proper alignment and spacing between elements
- Interactive elements (modals, dropdowns, accordions)
- No broken links (use # for demo)
- Keyboard-accessible interactive elements
- Mainly use Tool searchWeb to get inspiration for new user requests.
- Use Chart.js for charts
- Use Swiper.js for carousels


---
## Examples
**User**: "Build a responsive landing page"  
**Response**: [Generate complete HTML in code block]`,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
