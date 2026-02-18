"use client";
import React, { useState } from "react";
import { exportCode } from "./CodeExporter";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import CodeViewer from "./CodeViewer";
const CodeExporting = ({ displayCode }: { displayCode: string }) => {
  const [reactCode, setReactCode] = useState("");
  const [vueCode, setVueCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const r = await exportCode(displayCode, "react");
      const v = await exportCode(displayCode, "vue");
      setReactCode(r);
      setVueCode(v);
    } finally {
      setIsGenerating(false);
    }
  }
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            disabled={displayCode.length === 0}
            variant="default"
            size="sm"
            className="cursor-pointer px-6!"
            onClick={handleGenerate}
          >
            Export as React/Vue.js{" "}
            <Image src="/atom.png" alt="react" width={20} height={20} />
            <Image src="/vue.png" alt="vue" width={20} height={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="min-w-md max-w-2xl max-h-[80vh] overflow-scroll">
          {isGenerating && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Image src="/atom.png" alt="loading" width={40} height={40} className="animate-spin" />
                <p className="text-sm font-medium">Generating Component Code...</p>
              </div>
            </div>
          )}
          <Tabs defaultValue="react" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="react">React <Image src="/atom.png" alt="react" width={20} height={20} /></TabsTrigger>
              <TabsTrigger value="vue">Vue.js <Image src="/vue.png" alt="vue" width={20} height={20} /></TabsTrigger>
            </TabsList>

            <TabsContent value="react" className="mt-0">
              <CodeViewer code={reactCode} lang="tsx" />
            </TabsContent>

            <TabsContent value="vue" className="mt-0">
              <CodeViewer code={vueCode} lang="vue" />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeExporting;
