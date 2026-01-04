"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { calculateImpactScore } from "./ImpactScore";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Label as LabelUI } from "@/components/ui/label";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

interface ImpactScoreDisplayProps {
  stats: {
    totalCommits: number;
    totalPRs: number;
    totalIssuesClosed: number;
    totalReviews: number;
    accountAgeInYears: number;
  };
}

export function PieChartVariant1({ stats }: ImpactScoreDisplayProps) {
  const data = calculateImpactScore(stats);
  console.log(data);
  const chartData = [
    { name: "Commits", value: stats.totalCommits, fill: COLORS[0] },
    { name: "PRs", value: stats.totalPRs, fill: COLORS[1] },
    { name: "Issues", value: stats.totalIssuesClosed, fill: COLORS[2] },
    { name: "Reviews", value: stats.totalReviews, fill: COLORS[3] },
  ];

  const chartConfig = {
    Commits: { label: "Commits", color: "hsl(var(--chart-1))" },
    PRs: { label: "PRs", color: "hsl(var(--chart-2))" },
    Issues: { label: "Issues", color: "hsl(var(--chart-3))" },
    Reviews: { label: "Reviews", color: "hsl(var(--chart-4))" },
  };

  return (
    <>
    <h1 className="text-center text-sm text-muted-foreground mb-2">Account Age: {Math.floor(stats.accountAgeInYears)} years</h1>
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={5}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold font-sans"
                      >
                        {data.displayScore}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground text-sm tracking-tight font-medium"
                      >
                        IMPACT SCORE
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
    </>
  );
}

export function ScoreDetailsDialog({ stats }: ImpactScoreDisplayProps) {
  const data = calculateImpactScore(stats);
  const [open, setOpen] = useState(false);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground text-xs cursor-pointer"
        >
          <Info className="h-5 w-5 mr-2" />
          <p>View Details</p>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-border bg-card ">
        <DialogHeader>
          <div className="flex items-center justify-between py-4 mt-2">
            <DialogTitle className="text-2xl font-bold">
              Impact Breakdown
            </DialogTitle>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 text-xs h-8"
            >
              {data.tier}
            </Badge>
          </div>
          <DialogDescription>
            Detailed analysis of your GitHub activity scores and bonuses.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 px-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <LabelUI className="text-xs text-muted-foreground uppercase tracking-wider">
                Weighted Activity
              </LabelUI>
              <p className="text-xl font-semibold">{data.weightedActivity}</p>
            </div>
            <div className="space-y-1">
              <LabelUI className="text-xs text-muted-foreground uppercase tracking-wider">
                Consistency Bonus
              </LabelUI>
              <p className="text-xl font-semibold text-emerald-500">
                +{data.consistencyBonus}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <LabelUI className="text-sm font-medium">
              Activity Distribution (Scores)
            </LabelUI>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.breakdown).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border/50"
                >
                  <span className="text-sm capitalize text-muted-foreground">
                    {key} Score
                  </span>
                  <span className="text-sm font-mono font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {data.penalties.length > 0 && (
            <div className="space-y-3">
              <LabelUI className="text-sm font-medium text-destructive">
                Active Penalties
              </LabelUI>
              <ul className="space-y-2">
                {data.penalties.map((penalty, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-center gap-2 text-muted-foreground"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {penalty}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.eliteBadge && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/10 flex items-center justify-center">
              <p className="text-sm font-medium bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                ✨ {data.eliteBadge}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
