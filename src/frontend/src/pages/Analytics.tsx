import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Flame, Loader2, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useActor } from "../hooks/useActor";
import type { Chapter, Lecture, Subject } from "../hooks/useQueries";

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().slice(0, 10).replace(/-/g, ""),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });
}

function useWeeklyMinutes() {
  const { actor, isFetching } = useActor();
  const days = useMemo(getLast7Days, []);
  return useQuery<{ label: string; minutes: number }[]>({
    queryKey: ["weekly-minutes"],
    queryFn: async () => {
      if (!actor) return days.map((d) => ({ label: d.label, minutes: 0 }));
      const results = await Promise.all(
        days.map(async (d) => {
          const mins = await actor.getTotalMinutesForDate(d.date);
          return { label: d.label, minutes: Number(mins) };
        }),
      );
      return results;
    },
    enabled: !!actor && !isFetching,
  });
}

type SubjectProgress = {
  subjectName: string;
  chapters: { name: string; done: number; total: number }[];
};

function useSubjectProgress() {
  const { actor, isFetching } = useActor();
  return useQuery<SubjectProgress[]>({
    queryKey: ["subject-progress"],
    queryFn: async () => {
      if (!actor) return [];
      const subjects: Subject[] = await actor.getAllSubjects();
      return Promise.all(
        subjects.map(async (sub) => {
          const chapters: Chapter[] = await actor.getChaptersBySubject(sub.id);
          const chapData = await Promise.all(
            chapters.map(async (ch) => {
              const lecs: Lecture[] = await actor.getLecturesByChapter(ch.id);
              return {
                name: ch.name,
                done: lecs.filter((l) => l.status === "done").length,
                total: lecs.length,
              };
            }),
          );
          return { subjectName: sub.name, chapters: chapData };
        }),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

function useStreak() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["streak"],
    queryFn: async () => {
      if (!actor) return 0;
      const s = await actor.updateStreak();
      return Number(s);
    },
    enabled: !!actor && !isFetching,
  });
}

const TEAL = "oklch(0.78 0.12 192)";
const TEAL2 = "oklch(0.72 0.16 210)";

export default function Analytics() {
  const { data: weeklyData = [], isLoading: loadingWeekly } =
    useWeeklyMinutes();
  const { data: progress = [], isLoading: loadingProgress } =
    useSubjectProgress();
  const { data: streak = 0 } = useStreak();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <motion.div
          data-ocid="analytics.streak.card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl card-surface"
        >
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-semibold text-foreground">
            {streak} day streak
          </span>
        </motion.div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly bar chart */}
        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Weekly Study Time (min)
          </h3>
          {loadingWeekly ? (
            <div
              className="flex justify-center py-8"
              data-ocid="analytics.weekly.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={weeklyData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fill: "oklch(0.60 0.025 235)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.60 0.025 235)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.038 228)",
                    border: "1px solid oklch(0.98 0.01 240 / 0.08)",
                    borderRadius: 10,
                    color: "oklch(0.95 0.015 240)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "oklch(0.78 0.12 192 / 0.1)" }}
                />
                <Bar dataKey="minutes" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart */}
        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Study Hours Trend
          </h3>
          {loadingWeekly ? (
            <div
              className="flex justify-center py-8"
              data-ocid="analytics.trend.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={weeklyData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.98 0.01 240 / 0.07)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "oklch(0.60 0.025 235)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.60 0.025 235)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.038 228)",
                    border: "1px solid oklch(0.98 0.01 240 / 0.08)",
                    borderRadius: 10,
                    color: "oklch(0.95 0.015 240)",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: 12,
                    color: "oklch(0.60 0.025 235)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke={TEAL}
                  strokeWidth={2}
                  dot={{ fill: TEAL, r: 4 }}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="goal"
                  stroke={TEAL2}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Goal"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subject progress */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Lecture Completion by Subject
          </h3>
        </div>
        {loadingProgress ? (
          <div
            className="flex justify-center py-6"
            data-ocid="analytics.progress.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : progress.length === 0 ? (
          <p
            className="text-sm text-muted-foreground text-center py-4"
            data-ocid="analytics.progress.empty_state"
          >
            No subjects tracked yet
          </p>
        ) : (
          <div className="space-y-4">
            {progress.map((sub, si) => (
              <motion.div
                key={sub.subjectName}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.05 }}
                data-ocid={`analytics.subject.item.${si + 1}`}
              >
                <p className="text-sm font-semibold text-foreground mb-2">
                  {sub.subjectName}
                </p>
                <div className="space-y-2 pl-3">
                  {sub.chapters.map((ch) => {
                    const pct =
                      ch.total > 0 ? Math.round((ch.done / ch.total) * 100) : 0;
                    return (
                      <div key={ch.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {ch.name}
                          </span>
                          <span className="text-xs text-primary font-medium">
                            {ch.done}/{ch.total} ({pct}%)
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-muted" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
