import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Chapter {
    id: string;
    owner: Principal;
    name: string;
    subjectId: string;
}
export interface Task {
    id: string;
    title: string;
    owner: Principal;
    date: string;
    completed: boolean;
    category: string;
}
export interface StudySession {
    id: string;
    duration: bigint;
    owner: Principal;
    date: string;
}
export interface Stats {
    totalStudyMinutes: bigint;
    completedLectures: bigint;
    pendingTasks: bigint;
}
export interface Subject {
    id: string;
    owner: Principal;
    name: string;
}
export interface UserProfile {
    name: string;
}
export interface Lecture {
    id: string;
    status: string;
    duration: bigint;
    owner: Principal;
    telegramLink: string;
    name: string;
    chapterId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStudySession(date: string, duration: bigint): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChapter(name: string, subjectId: string): Promise<string>;
    createLecture(name: string, duration: bigint, telegramLink: string, chapterId: string): Promise<string>;
    createSubject(name: string): Promise<string>;
    createTask(title: string, category: string, date: string): Promise<string>;
    deleteChapter(id: string): Promise<void>;
    deleteLecture(id: string): Promise<void>;
    deleteSubject(id: string): Promise<void>;
    deleteTask(id: string): Promise<void>;
    getAllSubjects(): Promise<Array<Subject>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChapter(id: string): Promise<Chapter>;
    getChaptersBySubject(subjectId: string): Promise<Array<Chapter>>;
    getLecture(id: string): Promise<Lecture>;
    getLecturesByChapter(chapterId: string): Promise<Array<Lecture>>;
    getStats(_date: string): Promise<Stats>;
    getStreak(user: Principal): Promise<bigint>;
    getStudySession(id: string): Promise<StudySession>;
    getStudySessionsByDate(date: string): Promise<Array<StudySession>>;
    getSubject(id: string): Promise<Subject>;
    getTask(id: string): Promise<Task>;
    getTasksByDate(date: string): Promise<Array<Task>>;
    getTotalMinutesForDate(date: string): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markLectureDone(id: string): Promise<void>;
    markTaskComplete(id: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateStreak(): Promise<bigint>;
}
