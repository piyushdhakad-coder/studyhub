import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, Play, Plus, Square } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useAddStudySession, useStudySessions } from "../hooks/useQueries";

const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, "");

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function StudyTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [manualMinutes, setManualMinutes] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: sessions = [], isLoading } = useStudySessions();
  const addSession = useAddStudySession();
  const { actor } = useActor();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStop = async () => {
    setIsRunning(false);
    if (elapsed < 60) {
      toast.info("Session too short (< 1 min), not saved");
      setElapsed(0);
      return;
    }
    const minutes = BigInt(Math.floor(elapsed / 60));
    try {
      await addSession.mutateAsync({ date: today(), duration: minutes });
      if (actor) await actor.updateStreak();
      toast.success(`Session saved: ${Number(minutes)} min`);
    } catch {
      toast.error("Failed to save session");
    }
    setElapsed(0);
  };

  const handleManualSave = async () => {
    const mins = Number(manualMinutes);
    if (!mins || mins <= 0) return;
    try {
      await addSession.mutateAsync({ date: today(), duration: BigInt(mins) });
      if (actor) await actor.updateStreak();
      setManualMinutes("");
      toast.success(`Manual session saved: ${mins} min`);
    } catch {
      toast.error("Failed to save");
    }
  };

  const totalToday = sessions.reduce((sum, s) => sum + Number(s.duration), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-foreground">Study Timer</h2>

      {/* Timer display */}
      <motion.div
        className="card-surface p-8 flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center">
          <motion.p
            data-ocid="timer.display"
            className="timer-font text-6xl font-extrabold text-foreground tabular-nums"
            animate={{ color: isRunning ? "oklch(0.78 0.12 192)" : undefined }}
            transition={{ duration: 0.3 }}
          >
            {formatTime(elapsed)}
          </motion.p>
          <p className="text-sm text-muted-foreground mt-2">
            {isRunning ? "Session in progress..." : "Ready to study"}
          </p>
        </div>

        <div className="flex gap-3">
          {!isRunning ? (
            <Button
              data-ocid="timer.start.primary_button"
              onClick={() => setIsRunning(true)}
              className="teal-gradient border-0 text-primary-foreground font-semibold px-8 py-6 text-base rounded-xl shadow-glow"
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> START
            </Button>
          ) : (
            <Button
              data-ocid="timer.stop.primary_button"
              onClick={handleStop}
              disabled={addSession.isPending}
              className="bg-secondary text-secondary-foreground font-semibold px-8 py-6 text-base rounded-xl hover:bg-secondary/80"
            >
              {addSession.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Square className="w-5 h-5 mr-2 fill-current" />
              )}
              STOP
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Today's total:{" "}
          <span className="text-foreground font-semibold">
            {totalToday} min
          </span>
        </div>
      </motion.div>

      {/* Manual entry */}
      <div className="card-surface p-5 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Manual Entry
        </h3>
        <div className="flex gap-2">
          <Input
            data-ocid="timer.manual.input"
            placeholder="Minutes studied"
            type="number"
            value={manualMinutes}
            onChange={(e) => setManualMinutes(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSave()}
            className="bg-muted/50 border-0"
          />
          <Button
            data-ocid="timer.manual.save_button"
            onClick={handleManualSave}
            disabled={addSession.isPending}
            className="teal-gradient border-0 text-primary-foreground flex-shrink-0"
          >
            {addSession.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Sessions list */}
      <div className="card-surface p-5 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Sessions
        </h3>
        {isLoading ? (
          <div
            className="flex justify-center py-4"
            data-ocid="timer.sessions.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p
            className="text-xs text-muted-foreground text-center py-4"
            data-ocid="timer.sessions.empty_state"
          >
            No sessions recorded today
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s, i) => (
              <li
                key={s.id}
                data-ocid={`timer.session.item.${i + 1}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm"
              >
                <span className="text-muted-foreground">Session {i + 1}</span>
                <span className="font-semibold text-foreground">
                  {Number(s.duration)} min
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
