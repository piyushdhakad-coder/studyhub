import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useChapters,
  useCreateChapter,
  useCreateLecture,
  useCreateSubject,
  useDeleteChapter,
  useDeleteLecture,
  useDeleteSubject,
  useLectures,
  useMarkLectureDone,
  useSubjects,
} from "../hooks/useQueries";
import type { Chapter, Subject } from "../hooks/useQueries";

export default function LectureTracker() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newChapter, setNewChapter] = useState("");
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newLecture, setNewLecture] = useState({
    name: "",
    duration: "",
    telegramLink: "",
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: chapters = [] } = useChapters(selectedSubject?.id ?? null);
  const { data: lectures = [], isLoading: loadingLectures } = useLectures(
    selectedChapter?.id ?? null,
  );

  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createChapter = useCreateChapter();
  const deleteChapter = useDeleteChapter();
  const createLecture = useCreateLecture();
  const markDone = useMarkLectureDone();
  const deleteLecture = useDeleteLecture();

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      await createSubject.mutateAsync(newSubject.trim());
      setNewSubject("");
      setShowAddSubject(false);
      toast.success("Subject added");
    } catch {
      toast.error("Failed to add subject");
    }
  };

  const handleAddChapter = async () => {
    if (!newChapter.trim() || !selectedSubject) return;
    try {
      await createChapter.mutateAsync({
        name: newChapter.trim(),
        subjectId: selectedSubject.id,
      });
      setNewChapter("");
      setShowAddChapter(false);
      toast.success("Chapter added");
    } catch {
      toast.error("Failed to add chapter");
    }
  };

  const handleAddLecture = async () => {
    if (!newLecture.name.trim() || !selectedChapter) return;
    try {
      await createLecture.mutateAsync({
        name: newLecture.name.trim(),
        duration: BigInt(Number(newLecture.duration) || 0),
        telegramLink: newLecture.telegramLink.trim(),
        chapterId: selectedChapter.id,
      });
      setNewLecture({ name: "", duration: "", telegramLink: "" });
      toast.success("Lecture added");
    } catch {
      toast.error("Failed to add lecture");
    }
  };

  const doneLectures = lectures.filter((l) => l.status === "done").length;
  const progressPct =
    lectures.length > 0
      ? Math.round((doneLectures / lectures.length) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Lecture Tracker</h2>
        {selectedChapter && lectures.length > 0 && (
          <span className="text-sm font-semibold text-primary">
            {doneLectures}/{lectures.length} done
          </span>
        )}
      </div>

      {/* Selectors Row */}
      <div className="card-surface p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Subject selector */}
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Subject
            </p>
            <div className="flex gap-2">
              {loadingSubjects ? (
                <div
                  className="flex-1 h-9 rounded-lg bg-muted/50 flex items-center px-3"
                  data-ocid="lecture.subjects.loading_state"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select
                  value={selectedSubject?.id ?? ""}
                  onValueChange={(val) => {
                    const sub = subjects.find((s) => s.id === val) ?? null;
                    setSelectedSubject(sub);
                    setSelectedChapter(null);
                  }}
                >
                  <SelectTrigger
                    data-ocid="lecture.subject.select"
                    className="flex-1 bg-muted/50 border-0"
                  >
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 && (
                      <div
                        className="px-3 py-2 text-sm text-muted-foreground"
                        data-ocid="lecture.subjects.empty_state"
                      >
                        No subjects yet
                      </div>
                    )}
                    {subjects.map((sub, i) => (
                      <SelectItem
                        key={sub.id}
                        value={sub.id}
                        data-ocid={`lecture.subject.item.${i + 1}`}
                      >
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                data-ocid="lecture.subject.add_button"
                size="icon"
                variant="ghost"
                className="flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                onClick={() => setShowAddSubject((v) => !v)}
                title="Add subject"
              >
                <Plus className="w-4 h-4" />
              </Button>
              {selectedSubject && (
                <Button
                  data-ocid="lecture.subject.delete_button.1"
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    deleteSubject.mutate(selectedSubject.id);
                    setSelectedSubject(null);
                    setSelectedChapter(null);
                  }}
                  title="Delete subject"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {showAddSubject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mt-1"
              >
                <Input
                  data-ocid="lecture.subject.input"
                  placeholder="New subject name"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                  className="bg-muted/50 border-0 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddSubject}
                  disabled={createSubject.isPending}
                  className="teal-gradient border-0 text-primary-foreground"
                >
                  {createSubject.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Chapter selector */}
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chapter
            </p>
            <div className="flex gap-2">
              <Select
                value={selectedChapter?.id ?? ""}
                onValueChange={(val) => {
                  const ch = chapters.find((c) => c.id === val) ?? null;
                  setSelectedChapter(ch);
                }}
                disabled={!selectedSubject}
              >
                <SelectTrigger
                  data-ocid="lecture.chapter.select"
                  className="flex-1 bg-muted/50 border-0"
                >
                  <SelectValue
                    placeholder={
                      selectedSubject
                        ? "Select chapter..."
                        : "Select subject first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {chapters.length === 0 && (
                    <div
                      className="px-3 py-2 text-sm text-muted-foreground"
                      data-ocid="lecture.chapters.empty_state"
                    >
                      No chapters yet
                    </div>
                  )}
                  {chapters.map((ch, i) => (
                    <SelectItem
                      key={ch.id}
                      value={ch.id}
                      data-ocid={`lecture.chapter.item.${i + 1}`}
                    >
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                data-ocid="lecture.chapter.add_button"
                size="icon"
                variant="ghost"
                className="flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                onClick={() => setShowAddChapter((v) => !v)}
                disabled={!selectedSubject}
                title="Add chapter"
              >
                <Plus className="w-4 h-4" />
              </Button>
              {selectedChapter && (
                <Button
                  data-ocid="lecture.chapter.delete_button.1"
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (!selectedSubject) return;
                    deleteChapter.mutate({
                      id: selectedChapter.id,
                      subjectId: selectedSubject.id,
                    });
                    setSelectedChapter(null);
                  }}
                  title="Delete chapter"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {showAddChapter && selectedSubject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mt-1"
              >
                <Input
                  data-ocid="lecture.chapter.input"
                  placeholder="New chapter name"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                  className="bg-muted/50 border-0 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleAddChapter}
                  disabled={createChapter.isPending}
                  className="teal-gradient border-0 text-primary-foreground"
                >
                  {createChapter.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Lecture Add Form + List */}
      {selectedChapter ? (
        <div className="card-surface p-0 overflow-hidden">
          {/* Add Lecture inline row */}
          <div className="p-4 border-b border-border/40 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Add Lecture to{" "}
              <span className="text-primary">{selectedChapter.name}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                data-ocid="lecture.lecture.input"
                placeholder="Lecture name"
                value={newLecture.name}
                onChange={(e) =>
                  setNewLecture((p) => ({ ...p, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddLecture()}
                className="bg-muted/50 border-0 text-sm flex-1 min-w-0"
              />
              <Input
                placeholder="Duration (min)"
                type="number"
                value={newLecture.duration}
                onChange={(e) =>
                  setNewLecture((p) => ({ ...p, duration: e.target.value }))
                }
                className="bg-muted/50 border-0 text-sm w-full sm:w-28"
              />
              <Input
                data-ocid="lecture.telegram.input"
                placeholder="t.me/... Telegram link"
                value={newLecture.telegramLink}
                onChange={(e) =>
                  setNewLecture((p) => ({ ...p, telegramLink: e.target.value }))
                }
                className="bg-muted/50 border-0 text-sm flex-1 min-w-0"
              />
              <Button
                data-ocid="lecture.lecture.add_button"
                onClick={handleAddLecture}
                disabled={createLecture.isPending || !newLecture.name.trim()}
                className="teal-gradient border-0 text-primary-foreground text-sm flex-shrink-0"
              >
                {createLecture.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Plus className="w-4 h-4 mr-1.5" />
                )}
                Add
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {lectures.length > 0 && (
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
              <Progress value={progressPct} className="flex-1 h-2 bg-muted" />
              <span className="text-xs font-semibold text-primary whitespace-nowrap">
                {progressPct}% complete
              </span>
            </div>
          )}

          {/* Lecture Table */}
          {loadingLectures ? (
            <div
              className="flex justify-center py-10"
              data-ocid="lecture.list.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : lectures.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-ocid="lecture.list.empty_state"
            >
              <Play className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No lectures yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add your first lecture above
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-10 text-muted-foreground text-xs">
                    #
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Lecture
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs w-24">
                    Duration
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs w-24">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs w-36">
                    Telegram Video
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs w-20 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {lectures.map((lec, i) => (
                    <motion.tr
                      key={lec.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.18, delay: i * 0.04 }}
                      data-ocid={`lecture.item.${i + 1}`}
                      className="border-border/30 hover:bg-muted/20 transition-colors group"
                    >
                      <TableCell className="text-muted-foreground text-xs font-mono py-3">
                        {i + 1}
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`text-sm font-medium ${
                            lec.status === "done"
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {lec.name}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        {Number(lec.duration) > 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {Number(lec.duration)} min
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={
                            lec.status === "done" ? "default" : "secondary"
                          }
                          className={`text-[10px] px-2 py-0.5 ${
                            lec.status === "done"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0"
                              : "bg-muted text-muted-foreground border-0"
                          }`}
                        >
                          {lec.status === "done" ? "Done" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        {lec.telegramLink ? (
                          <a
                            href={lec.telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg teal-gradient text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Watch
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/40 italic">
                            No link
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {lec.status !== "done" && (
                            <Button
                              data-ocid={`lecture.done.toggle.${i + 1}`}
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 hover:text-emerald-500 hover:bg-emerald-500/10 text-muted-foreground"
                              onClick={() =>
                                markDone.mutate({
                                  id: lec.id,
                                  chapterId: lec.chapterId,
                                })
                              }
                              title="Mark done"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            data-ocid={`lecture.delete_button.${i + 1}`}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 hover:text-destructive hover:bg-destructive/10 text-muted-foreground"
                            onClick={() =>
                              deleteLecture.mutate({
                                id: lec.id,
                                chapterId: lec.chapterId,
                              })
                            }
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        <div className="card-surface flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {selectedSubject
              ? "Select a chapter to view lectures"
              : "Select a subject to get started"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedSubject
              ? "Choose a chapter from the dropdown above"
              : "Choose a subject from the dropdown above"}
          </p>
        </div>
      )}
    </div>
  );
}
