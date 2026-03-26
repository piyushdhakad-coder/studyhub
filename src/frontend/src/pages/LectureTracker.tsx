import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
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
  const [newChapter, setNewChapter] = useState("");
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
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-xl font-bold text-foreground">Lecture Tracker</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subjects */}
        <div className="card-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Subjects
          </h3>
          <div className="flex gap-2">
            <Input
              data-ocid="lecture.subject.input"
              placeholder="Add subject..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              className="bg-muted/50 border-0 text-sm"
            />
            <Button
              data-ocid="lecture.subject.add_button"
              size="icon"
              onClick={handleAddSubject}
              disabled={createSubject.isPending}
              className="teal-gradient border-0 text-primary-foreground flex-shrink-0"
            >
              {createSubject.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
          {loadingSubjects ? (
            <div
              className="flex justify-center py-4"
              data-ocid="lecture.subjects.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : subjects.length === 0 ? (
            <p
              className="text-xs text-muted-foreground text-center py-4"
              data-ocid="lecture.subjects.empty_state"
            >
              No subjects yet
            </p>
          ) : (
            <ul className="space-y-1">
              {subjects.map((sub, i) => (
                <li key={sub.id} data-ocid={`lecture.subject.item.${i + 1}`}>
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm group ${
                      selectedSubject?.id === sub.id
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                    onClick={() => {
                      setSelectedSubject(sub);
                      setSelectedChapter(null);
                    }}
                  >
                    <span className="font-medium truncate">{sub.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        data-ocid={`lecture.subject.delete_button.${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject.mutate(sub.id);
                        }}
                        className="p-1 hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chapters */}
        <div className="card-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Chapters{" "}
            {selectedSubject && (
              <span className="text-primary ml-1">
                · {selectedSubject.name}
              </span>
            )}
          </h3>
          {selectedSubject ? (
            <>
              <div className="flex gap-2">
                <Input
                  data-ocid="lecture.chapter.input"
                  placeholder="Add chapter..."
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                  className="bg-muted/50 border-0 text-sm"
                />
                <Button
                  data-ocid="lecture.chapter.add_button"
                  size="icon"
                  onClick={handleAddChapter}
                  disabled={createChapter.isPending}
                  className="teal-gradient border-0 text-primary-foreground flex-shrink-0"
                >
                  {createChapter.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {chapters.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  data-ocid="lecture.chapters.empty_state"
                >
                  No chapters yet
                </p>
              ) : (
                <ul className="space-y-1">
                  {chapters.map((ch, i) => (
                    <li key={ch.id} data-ocid={`lecture.chapter.item.${i + 1}`}>
                      <button
                        type="button"
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm group ${
                          selectedChapter?.id === ch.id
                            ? "bg-primary/15 text-primary"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                        onClick={() => setSelectedChapter(ch)}
                      >
                        <span className="font-medium truncate">{ch.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            data-ocid={`lecture.chapter.delete_button.${i + 1}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChapter.mutate({
                                id: ch.id,
                                subjectId: selectedSubject.id,
                              });
                            }}
                            className="p-1 hover:text-destructive text-muted-foreground"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Select a subject first
            </p>
          )}
        </div>

        {/* Lectures */}
        <div className="card-surface p-4 space-y-3 md:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Lectures{" "}
              {selectedChapter && (
                <span className="text-primary ml-1">
                  · {selectedChapter.name}
                </span>
              )}
            </h3>
            {lectures.length > 0 && (
              <span className="text-xs text-primary font-semibold">
                {progressPct}%
              </span>
            )}
          </div>
          {selectedChapter && lectures.length > 0 && (
            <Progress value={progressPct} className="h-1.5 bg-muted" />
          )}
          {selectedChapter ? (
            <>
              {/* Add lecture form */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/30">
                <Input
                  data-ocid="lecture.lecture.input"
                  placeholder="Lecture name"
                  value={newLecture.name}
                  onChange={(e) =>
                    setNewLecture((p) => ({ ...p, name: e.target.value }))
                  }
                  className="bg-muted/50 border-0 text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Duration (min)"
                    type="number"
                    value={newLecture.duration}
                    onChange={(e) =>
                      setNewLecture((p) => ({
                        ...p,
                        duration: e.target.value,
                      }))
                    }
                    className="bg-muted/50 border-0 text-sm"
                  />
                  <Input
                    placeholder="Telegram link"
                    value={newLecture.telegramLink}
                    onChange={(e) =>
                      setNewLecture((p) => ({
                        ...p,
                        telegramLink: e.target.value,
                      }))
                    }
                    className="bg-muted/50 border-0 text-sm"
                  />
                </div>
                <Button
                  data-ocid="lecture.lecture.add_button"
                  onClick={handleAddLecture}
                  disabled={createLecture.isPending}
                  className="w-full teal-gradient border-0 text-primary-foreground text-sm"
                >
                  {createLecture.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Lecture
                </Button>
              </div>

              {loadingLectures ? (
                <div
                  className="flex justify-center py-4"
                  data-ocid="lecture.list.loading_state"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : lectures.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  data-ocid="lecture.list.empty_state"
                >
                  No lectures yet
                </p>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence>
                    {lectures.map((lec, i) => (
                      <motion.li
                        key={lec.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        data-ocid={`lecture.item.${i + 1}`}
                        className="p-3 rounded-xl bg-muted/30 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium ${
                              lec.status === "done"
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {lec.name}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {lec.status !== "done" && (
                              <button
                                type="button"
                                data-ocid={`lecture.done.toggle.${i + 1}`}
                                onClick={() =>
                                  markDone.mutate({
                                    id: lec.id,
                                    chapterId: lec.chapterId,
                                  })
                                }
                                className="p-1 hover:text-success text-muted-foreground transition-colors"
                                title="Mark done"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              data-ocid={`lecture.delete_button.${i + 1}`}
                              onClick={() =>
                                deleteLecture.mutate({
                                  id: lec.id,
                                  chapterId: lec.chapterId,
                                })
                              }
                              className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              lec.status === "done" ? "default" : "secondary"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {lec.status === "done" ? "Done" : "Pending"}
                          </Badge>
                          {Number(lec.duration) > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              {Number(lec.duration)} min
                            </span>
                          )}
                          {lec.telegramLink && (
                            <a
                              href={lec.telegramLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> Telegram
                            </a>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Select a chapter first
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
