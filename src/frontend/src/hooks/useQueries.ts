import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Chapter,
  Lecture,
  Stats,
  StudySession,
  Subject,
  Task,
} from "../backend";
import { useActor } from "./useActor";

export type { Subject, Chapter, Lecture, Task, StudySession, Stats };

const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, "");

export function useStats() {
  const { actor, isFetching } = useActor();
  return useQuery<Stats>({
    queryKey: ["stats", today()],
    queryFn: async () => {
      if (!actor)
        return {
          totalStudyMinutes: 0n,
          completedLectures: 0n,
          pendingTasks: 0n,
        };
      return actor.getStats(today());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubjects() {
  const { actor, isFetching } = useActor();
  return useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useChapters(subjectId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Chapter[]>({
    queryKey: ["chapters", subjectId],
    queryFn: async () => {
      if (!actor || !subjectId) return [];
      return actor.getChaptersBySubject(subjectId);
    },
    enabled: !!actor && !isFetching && !!subjectId,
  });
}

export function useLectures(chapterId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Lecture[]>({
    queryKey: ["lectures", chapterId],
    queryFn: async () => {
      if (!actor || !chapterId) return [];
      return actor.getLecturesByChapter(chapterId);
    },
    enabled: !!actor && !isFetching && !!chapterId,
  });
}

export function useTasks(date?: string) {
  const { actor, isFetching } = useActor();
  const d = date || today();
  return useQuery<Task[]>({
    queryKey: ["tasks", d],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasksByDate(d);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStudySessions(date?: string) {
  const { actor, isFetching } = useActor();
  const d = date || today();
  return useQuery<StudySession[]>({
    queryKey: ["sessions", d],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudySessionsByDate(d);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTotalMinutes(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["minutes", date],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getTotalMinutesForDate(date);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSubject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => actor!.createSubject(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actor!.deleteSubject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useCreateChapter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, subjectId }: { name: string; subjectId: string }) =>
      actor!.createChapter(name, subjectId),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["chapters", vars.subjectId] }),
  });
}

export function useDeleteChapter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; subjectId: string }) =>
      actor!.deleteChapter(vars.id),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["chapters", vars.subjectId] }),
  });
}

export function useCreateLecture() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      duration,
      telegramLink,
      chapterId,
    }: {
      name: string;
      duration: bigint;
      telegramLink: string;
      chapterId: string;
    }) => actor!.createLecture(name, duration, telegramLink, chapterId),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["lectures", vars.chapterId] }),
  });
}

export function useMarkLectureDone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; chapterId: string }) =>
      actor!.markLectureDone(vars.id),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["lectures", vars.chapterId] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteLecture() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; chapterId: string }) =>
      actor!.deleteLecture(vars.id),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["lectures", vars.chapterId] }),
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, category }: { title: string; category: string }) =>
      actor!.createTask(title, category, today()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useMarkTaskComplete() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actor!.markTaskComplete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actor!.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useAddStudySession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, duration }: { date: string; duration: bigint }) =>
      actor!.addStudySession(date, duration),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["minutes"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
