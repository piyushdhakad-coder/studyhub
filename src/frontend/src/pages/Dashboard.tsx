import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckSquare,
  Clock,
  ListTodo,
  Loader2,
  Search,
  Timer,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useStats } from "../hooks/useQueries";

type Page =
  | "dashboard"
  | "lectures"
  | "timer"
  | "tasks"
  | "telegram"
  | "analytics";

interface Props {
  onNavigate: (page: Page) => void;
}

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function Dashboard({ onNavigate }: Props) {
  const { data: stats, isLoading } = useStats();

  const kpis = [
    {
      label: "Today's Study",
      value: isLoading
        ? "--"
        : formatMinutes(Number(stats?.totalStudyMinutes ?? 0)),
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Completed Lectures",
      value: isLoading ? "--" : String(Number(stats?.completedLectures ?? 0)),
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Pending Tasks",
      value: isLoading ? "--" : String(Number(stats?.pendingTasks ?? 0)),
      icon: ListTodo,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  const quickActions = [
    {
      label: "Add Lecture",
      icon: BookOpen,
      page: "lectures" as Page,
      className: "teal-gradient border-0 text-primary-foreground",
    },
    {
      label: "Start Timer",
      icon: Timer,
      page: "timer" as Page,
      className: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
    {
      label: "Open Planner",
      icon: CheckSquare,
      page: "tasks" as Page,
      className: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    },
  ];

  const moduleCards = [
    {
      title: "Lecture Tracker",
      desc: "Organize subjects, chapters, and lectures with progress tracking.",
      page: "lectures" as Page,
      icon: BookOpen,
      accent: "from-primary/20 to-transparent",
    },
    {
      title: "Study Timer",
      desc: "Track your study sessions with a live timer and manual entry.",
      page: "timer" as Page,
      icon: Timer,
      accent: "from-success/20 to-transparent",
    },
    {
      title: "Task Planner",
      desc: "Daily checklist for lectures, revision, and practice tasks.",
      page: "tasks" as Page,
      icon: CheckSquare,
      accent: "from-chart-4/20 to-transparent",
    },
    {
      title: "Telegram Locator",
      desc: "Find exact lecture locations on your Telegram channel.",
      page: "telegram" as Page,
      icon: Search,
      accent: "from-chart-5/20 to-transparent",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Today's Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                data-ocid={`dashboard.kpi.${i + 1}.card`}
                className="card-surface p-5 flex items-center gap-4"
              >
                <div className={`p-3 rounded-xl ${kpi.bg} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {kpi.label}
                  </p>
                  {isLoading ? (
                    <Loader2
                      className="w-5 h-5 animate-spin text-muted-foreground"
                      data-ocid="dashboard.stats.loading_state"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {kpi.value}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                data-ocid={`dashboard.${action.page}.primary_button`}
                onClick={() => onNavigate(action.page)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium ${action.className}`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.title}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                data-ocid={`dashboard.module.${i + 1}.card`}
                onClick={() => onNavigate(card.page)}
                className="card-surface p-5 text-left group hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.accent} border border-border flex items-center justify-center mb-3`}
                >
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
