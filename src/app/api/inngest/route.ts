import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { indexRepo } from "@/inngest/functions";


// Create an API that serves functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [indexRepo],
});
