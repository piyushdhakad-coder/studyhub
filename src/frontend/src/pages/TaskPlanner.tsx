import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateTask,
  useDeleteTask,
  useMarkTaskComplete,
  useTasks,
} from "../hooks/useQueries";

const CATEGORIES = ["Lecture", "Revision", "Practice"];

const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "bg-primary/20 text-primary",
  Revision: "bg-chart-4/20 text-chart-4",
  Practice: "bg-success/20 text-success",
};

export default function TaskPlanner() {
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Lecture");

  const { data: tasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const markComplete = useMarkTaskComplete();
  const deleteTask = useDeleteTask();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: newTitle.trim(),
        category: newCategory,
      });
      setNewTitle("");
      toast.success("Task added");
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    if (completed) return;
    try {
      await markComplete.mutateAsync(id);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const filterTasks = (category: string) =>
    category === "all"
      ? tasks
      : tasks.filter(
          (t) => t.category.toLowerCase() === category.toLowerCase(),
        );

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Task Planner</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      {/* Add task */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            data-ocid="tasks.input"
            placeholder="Add a new task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="bg-muted/50 border-0"
          />
          <Select value={newCategory} onValueChange={setNewCategory}>
            <SelectTrigger
              data-ocid="tasks.category.select"
              className="w-32 bg-muted/50 border-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            data-ocid="tasks.add_button"
            onClick={handleAdd}
            disabled={createTask.isPending}
            className="teal-gradient border-0 text-primary-foreground flex-shrink-0"
          >
            {createTask.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Task list with tabs */}
      <div className="card-surface p-4">
        <Tabs defaultValue="all">
          <TabsList className="bg-muted/50 mb-4">
            <TabsTrigger data-ocid="tasks.all.tab" value="all">
              All ({tasks.length})
            </TabsTrigger>
            {CATEGORIES.map((c) => (
              <TabsTrigger
                data-ocid={`tasks.${c.toLowerCase()}.tab`}
                key={c}
                value={c.toLowerCase()}
              >
                {c} (
                {
                  tasks.filter(
                    (t) => t.category.toLowerCase() === c.toLowerCase(),
                  ).length
                }
                )
              </TabsTrigger>
            ))}
          </TabsList>

          {["all", ...CATEGORIES.map((c) => c.toLowerCase())].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div
                  className="flex justify-center py-6"
                  data-ocid="tasks.list.loading_state"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filterTasks(tab).length === 0 ? (
                <div
                  className="flex flex-col items-center py-8 gap-2"
                  data-ocid="tasks.list.empty_state"
                >
                  <CheckSquare className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No tasks for this category
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence>
                    {filterTasks(tab).map((task, i) => (
                      <motion.li
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        data-ocid={`tasks.item.${i + 1}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 group"
                      >
                        <Checkbox
                          data-ocid={`tasks.checkbox.${i + 1}`}
                          checked={task.completed}
                          onCheckedChange={() =>
                            handleToggle(task.id, task.completed)
                          }
                          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            task.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 border-0 ${
                            CATEGORY_COLORS[task.category] ||
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.category}
                        </Badge>
                        <button
                          type="button"
                          data-ocid={`tasks.delete_button.${i + 1}`}
                          onClick={() => deleteTask.mutate(task.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
