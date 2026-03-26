import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useActor } from "../hooks/useActor";
import type { Chapter, Lecture, Subject } from "../hooks/useQueries";

type FullLecture = Lecture & { chapterName: string; subjectName: string };

function useAllLectures() {
  const { actor, isFetching } = useActor();
  return useQuery<FullLecture[]>({
    queryKey: ["all-lectures"],
    queryFn: async () => {
      if (!actor) return [];
      const subjects: Subject[] = await actor.getAllSubjects();
      const results: FullLecture[] = [];
      await Promise.all(
        subjects.map(async (sub) => {
          const chapters: Chapter[] = await actor.getChaptersBySubject(sub.id);
          await Promise.all(
            chapters.map(async (ch) => {
              const lecs: Lecture[] = await actor.getLecturesByChapter(ch.id);
              for (const l of lecs) {
                results.push({
                  ...l,
                  chapterName: ch.name,
                  subjectName: sub.name,
                });
              }
            }),
          );
        }),
      );
      return results;
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

type TreeSubject = Subject & {
  chapters: (Chapter & { lectures: FullLecture[] })[];
};

function useAllLecturesTree() {
  const { actor, isFetching } = useActor();
  return useQuery<TreeSubject[]>({
    queryKey: ["all-lectures-tree"],
    queryFn: async () => {
      if (!actor) return [];
      const subjects: Subject[] = await actor.getAllSubjects();
      return Promise.all(
        subjects.map(async (sub) => {
          const chapters: Chapter[] = await actor.getChaptersBySubject(sub.id);
          const chaptersWithLectures = await Promise.all(
            chapters.map(async (ch) => {
              const lecs: Lecture[] = await actor.getLecturesByChapter(ch.id);
              const fullLecs = lecs.map((l) => ({
                ...l,
                chapterName: ch.name,
                subjectName: sub.name,
              }));
              return { ...ch, lectures: fullLecs };
            }),
          );
          return { ...sub, chapters: chaptersWithLectures };
        }),
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export default function TelegramLocator() {
  const [query, setQuery] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(),
  );

  const { data: allLectures = [], isLoading } = useAllLectures();
  const { data: tree = [] } = useAllLecturesTree();

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allLectures.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.chapterName.toLowerCase().includes(q) ||
        l.subjectName.toLowerCase().includes(q),
    );
  }, [query, allLectures]);

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-xl font-bold text-foreground">
        Telegram Lecture Locator
      </h2>

      {/* Search */}
      <div className="card-surface p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="telegram.search_input"
            placeholder="Search by lecture name, chapter, or subject..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-muted/50 border-0"
          />
        </div>

        {isLoading && (
          <div
            className="flex justify-center py-4"
            data-ocid="telegram.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {query.trim() && (
          <div className="mt-3 space-y-2">
            {filtered.length === 0 ? (
              <p
                className="text-sm text-muted-foreground text-center py-4"
                data-ocid="telegram.results.empty_state"
              >
                No lectures found for &quot;{query}&quot;
              </p>
            ) : (
              filtered.map((l, i) => (
                <div
                  key={l.id}
                  data-ocid={`telegram.result.item.${i + 1}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {l.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.subjectName} &rsaquo; {l.chapterName}
                    </p>
                  </div>
                  {l.telegramLink ? (
                    <a
                      href={l.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="teal-gradient border-0 text-primary-foreground text-xs flex-shrink-0"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> Open in
                        Telegram
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      No link
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Browse tree */}
      <div className="card-surface p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Browse All Lectures
        </h3>
        {tree.length === 0 && !isLoading ? (
          <p
            className="text-xs text-muted-foreground text-center py-4"
            data-ocid="telegram.browse.empty_state"
          >
            No subjects added yet
          </p>
        ) : (
          tree.map((sub, si) => (
            <div
              key={sub.id}
              data-ocid={`telegram.subject.item.${si + 1}`}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-sm font-semibold text-foreground"
                onClick={() => toggleSubject(sub.id)}
              >
                <span>{sub.name}</span>
                {expandedSubjects.has(sub.id) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedSubjects.has(sub.id) && (
                <div className="px-4 py-2 space-y-3">
                  {sub.chapters.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No chapters
                    </p>
                  ) : (
                    sub.chapters.map((ch) => (
                      <div key={ch.id}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                          {ch.name}
                        </p>
                        {ch.lectures.length === 0 ? (
                          <p className="text-xs text-muted-foreground pl-3">
                            No lectures
                          </p>
                        ) : (
                          <ul className="space-y-1.5 pl-3">
                            {ch.lectures.map((l, li) => (
                              <li
                                key={l.id}
                                data-ocid={`telegram.lecture.item.${li + 1}`}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-foreground truncate">
                                  {l.name}
                                </span>
                                {l.telegramLink && (
                                  <a
                                    href={l.telegramLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-xs flex items-center gap-0.5 hover:underline flex-shrink-0 ml-2"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Open
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
