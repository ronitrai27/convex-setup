"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { AgentState, Orb } from "@/components/elevenLabs/Orb"

let ORBS: [string, string][] = [
  ["#CADCFC", "#A0B9D1"],
]

export function OrbDemo({ small = false }: { small?: boolean }) {
  const [agent, setAgent] = useState<AgentState>(null)

  ORBS = small ? [ORBS[0]] : ORBS
  const colors = ORBS[0]

  return (
    <div className="">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative block">
            <div className="bg-muted relative h-32 w-32 rounded-full p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
              <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
                <Orb
                  colors={colors}
                  seed={1000}
                  agentState={agent}
                />
              </div>
            </div>
          </div>
        </div>

        {/* <div className="flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAgent(null)}
            disabled={agent === null}
          >
            Idle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAgent("listening")}
            disabled={agent === "listening"}
          >
            Listening
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={agent === "talking"}
            onClick={() => setAgent("talking")}
          >
            Talking
          </Button>
        </div> */}
      </div>
    </div>
  )
}
