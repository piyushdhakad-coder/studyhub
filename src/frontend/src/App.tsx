import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  BarChart2,
  Bell,
  BookOpen,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogIn,
  Menu,
  Search,
  Timer,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import LectureTracker from "./pages/LectureTracker";
import StudyTimer from "./pages/StudyTimer";
import TaskPlanner from "./pages/TaskPlanner";
import TelegramLocator from "./pages/TelegramLocator";

type Page =
  | "dashboard"
  | "lectures"
  | "timer"
  | "tasks"
  | "telegram"
  | "analytics";

const NAV_ITEMS: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "lectures", label: "Lecture Tracker", icon: BookOpen },
  { id: "timer", label: "Study Timer", icon: Timer },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "telegram", label: "Telegram Locator", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface p-10 flex flex-col items-center gap-6 w-full max-w-md"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl teal-gradient">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            STUDYHUB
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Welcome to StudyHub
          </h2>
          <p className="text-muted-foreground text-sm">
            Your all-in-one study planner. Track lectures, manage time, and stay
            on top of your goals.
          </p>
        </div>
        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          className="w-full teal-gradient text-primary-foreground font-semibold py-6 text-base rounded-xl border-0 hover:opacity-90 transition-opacity"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" /> Sign In to Continue
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "lectures":
        return <LectureTracker />;
      case "timer":
        return <StudyTimer />;
      case "tasks":
        return <TaskPlanner />;
      case "telegram":
        return <TelegramLocator />;
      case "analytics":
        return <Analytics />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex-shrink-0 h-full bg-sidebar border-r border-sidebar-border overflow-hidden flex flex-col"
      >
        <div className="flex flex-col h-full w-[220px]">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
            <div className="p-1.5 rounded-lg teal-gradient flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight text-sidebar-foreground">
              STUDYHUB
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  data-ocid={`nav.${item.id}.link`}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User mini */}
          <div className="px-3 pb-4">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50">
              <div className="w-7 h-7 rounded-full teal-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  S
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  Student
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              data-ocid="nav.sidebar.toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back!
              </h1>
              <p className="text-sm text-muted-foreground">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </Button>
            <div className="w-8 h-8 rounded-full teal-gradient flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                S
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-border text-center text-xs text-muted-foreground flex-shrink-0">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
