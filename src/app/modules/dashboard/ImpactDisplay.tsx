// components/ImpactScoreDisplay.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { calculateImpactScore } from "./ImpactScore";

interface ImpactScoreDisplayProps {
  stats: {
    totalCommits: number;
    totalPRs: number;
    totalIssuesClosed: number;
    totalReviews: number;
    accountAgeInYears: number;
  };
}

export function ImpactScoreDisplay({ stats }: ImpactScoreDisplayProps) {
  const impactScore = calculateImpactScore(stats);

  // Prepare data for pie chart
  const chartData = [
    { name: "Commits", value: stats.totalCommits, color: "#3b82f6" },
    { name: "Pull Requests", value: stats.totalPRs, color: "#10b981" },
    { name: "Issues Closed", value: stats.totalIssuesClosed, color: "#f59e0b" },
    { name: "Reviews", value: stats.totalReviews, color: "#8b5cf6" },
  ];

  // Score color based on tier
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-gray-600";
  };

  const getTierBadgeVariant = (tier: string) => {
    if (tier === "Elite Contributor") return "default";
    if (tier === "Active Professional") return "default";
    if (tier === "Regular Developer") return "secondary";
    if (tier === "Casual Contributor") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Impact Score Card */}
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Impact Score
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div
            className={`text-7xl font-bold ${getScoreColor(
              impactScore.displayScore
            )}`}
          >
            {impactScore.displayScore}
            <span className="text-3xl text-muted-foreground">/100</span>
          </div>

          <div className="mt-4 space-y-2">
            <Badge
              className="text-base px-4 py-1"
              variant={getTierBadgeVariant(impactScore.tier)}
            >
              {impactScore.tier}
            </Badge>

            {impactScore.eliteBadge && (
              <div>
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                >
                  ⭐ {impactScore.eliteBadge}
                </Badge>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Based on {Math.floor(stats.accountAgeInYears)} years of activity
          </p>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score Calculation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            How Impact Score is Calculated
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="space-y-1">
            <p>
              📊 <strong>Weighted Activity:</strong>
            </p>
            <ul className="ml-6 space-y-0.5">
              <li>• Commits: 1x weight</li>
              <li>• Pull Requests: 3x weight (most valuable)</li>
              <li>• Issues Closed: 2x weight</li>
              <li>• Code Reviews: 2.5x weight</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p>
              ⏱️ <strong>Account Age Normalization:</strong>
            </p>
            <p className="ml-6">
              Score adjusted by √(years) to fairly compare new vs veteran
              accounts
            </p>
          </div>

          {impactScore.consistencyBonus > 1 && (
            <div className="space-y-1">
              <p className="text-emerald-600 font-medium">
                ✨ <strong>Consistency Bonus:</strong>
              </p>
              <p className="ml-6 text-emerald-600">
                +10% for diverse activity across multiple contribution types
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t space-y-1">
            <p className="font-medium text-foreground">Score Tiers:</p>
            <ul className="ml-6 space-y-0.5">
              <li>• 0-20: Inactive/New</li>
              <li>• 20-40: Casual Contributor</li>
              <li>• 40-60: Regular Developer</li>
              <li>• 60-80: Active Professional</li>
              <li>• 80-100: Elite Contributor</li>
              <li>• 100+: Top percentile badges awarded</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
