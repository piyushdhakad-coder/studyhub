import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types with ownership
  module Subject {
    public func compare(subject1 : Subject, subject2 : Subject) : Order.Order {
      Text.compare(subject1.name, subject2.name);
    };
  };
  type Subject = { id : Text; name : Text; owner : Principal };

  module Chapter {
    public func compare(chapter1 : Chapter, chapter2 : Chapter) : Order.Order {
      Text.compare(chapter1.name, chapter2.name);
    };
  };
  type Chapter = { id : Text; name : Text; subjectId : Text; owner : Principal };

  module Lecture {
    public func compare(lecture1 : Lecture, lecture2 : Lecture) : Order.Order {
      Text.compare(lecture1.name, lecture2.name);
    };
  };
  type Lecture = {
    id : Text;
    name : Text;
    duration : Nat;
    telegramLink : Text;
    status : Text;
    chapterId : Text;
    owner : Principal;
  };

  module StudySession {
    public func compare(studySession1 : StudySession, studySession2 : StudySession) : Order.Order {
      Text.compare(studySession1.date, studySession2.date);
    };
  };
  type StudySession = { id : Text; date : Text; duration : Nat; owner : Principal };

  module Task {
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Text.compare(task1.title, task2.title);
    };
  };
  type Task = {
    id : Text;
    title : Text;
    category : Text;
    date : Text;
    completed : Bool;
    owner : Principal;
  };

  module Stats {
    public func compare(stats1 : Stats, stats2 : Stats) : Order.Order {
      Nat.compare(stats1.totalStudyMinutes, stats2.totalStudyMinutes);
    };
  };
  type Stats = {
    totalStudyMinutes : Nat;
    completedLectures : Nat;
    pendingTasks : Nat;
  };

  module Streak {
    public func compare(streak1 : Streak, streak2 : Streak) : Order.Order {
      Nat.compare(streak1.currentStreak, streak2.currentStreak);
    };
  };
  type Streak = { user : Principal; currentStreak : Nat };

  // Storage
  let subjects = Map.empty<Text, Subject>();
  let chapters = Map.empty<Text, Chapter>();
  let lectures = Map.empty<Text, Lecture>();
  let studySessions = Map.empty<Text, StudySession>();
  let tasks = Map.empty<Text, Task>();
  let streaks = Map.empty<Principal, Streak>();

  // Helper functions to check ownership
  func checkOwnership(owner : Principal, caller : Principal) {
    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only access your own data");
    };
  };

  func getSubjectInternal(id : Text) : Subject {
    switch (subjects.get(id)) {
      case (null) { Runtime.trap("Subject does not exist") };
      case (?subject) { subject };
    };
  };

  func getChapterInternal(id : Text) : Chapter {
    switch (chapters.get(id)) {
      case (null) { Runtime.trap("Chapter does not exist") };
      case (?chapter) { chapter };
    };
  };

  func getLectureInternal(id : Text) : Lecture {
    switch (lectures.get(id)) {
      case (null) { Runtime.trap("Lecture does not exist") };
      case (?lecture) { lecture };
    };
  };

  func getStudySessionInternal(id : Text) : StudySession {
    switch (studySessions.get(id)) {
      case (null) { Runtime.trap("StudySession does not exist") };
      case (?studySession) { studySession };
    };
  };

  func getTaskInternal(id : Text) : Task {
    switch (tasks.get(id)) {
      case (null) { Runtime.trap("Task does not exist") };
      case (?task) { task };
    };
  };

  func getStreakInternal(user : Principal) : Streak {
    switch (streaks.get(user)) {
      case (null) { Runtime.trap("Streak does not exist") };
      case (?streak) { streak };
    };
  };

  // Subjects
  public shared ({ caller }) func createSubject(name : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create subjects");
    };
    
    // Check if user already has a subject with this name
    let userSubjects = subjects.values().toArray().filter(func(subject) { 
      subject.owner == caller and subject.name == name 
    });
    if (userSubjects.size() > 0) {
      Runtime.trap("You already have a subject with this name");
    };
    
    let id = name # caller.toText() # Time.now().toText();
    let subject : Subject = { id; name; owner = caller };
    subjects.add(id, subject);
    id;
  };

  public query ({ caller }) func getSubject(id : Text) : async Subject {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subjects");
    };
    let subject = getSubjectInternal(id);
    checkOwnership(subject.owner, caller);
    subject;
  };

  public query ({ caller }) func getAllSubjects() : async [Subject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subjects");
    };
    
    if (AccessControl.isAdmin(accessControlState, caller)) {
      subjects.values().toArray().sort();
    } else {
      subjects.values().toArray().filter(func(subject) { 
        subject.owner == caller 
      }).sort();
    };
  };

  public shared ({ caller }) func deleteSubject(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete subjects");
    };
    
    let subject = getSubjectInternal(id);
    checkOwnership(subject.owner, caller);
    
    subjects.remove(id);
    
    // Remove related chapters and lectures
    let chapterIdsToRemove = chapters.values().toArray().filter(func(chapter) { 
      chapter.subjectId == id and chapter.owner == caller 
    }).map(func(chapter) { chapter.id });
    
    for (chapterId in chapterIdsToRemove.values()) {
      chapters.remove(chapterId);
      // Remove related lectures
      let lectureIdsToRemove = lectures.values().toArray().filter(func(lecture) { 
        lecture.chapterId == chapterId and lecture.owner == caller 
      }).map(func(lecture) { lecture.id });
      for (lectureId in lectureIdsToRemove.values()) {
        lectures.remove(lectureId);
      };
    };
  };

  // Chapters
  public shared ({ caller }) func createChapter(name : Text, subjectId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create chapters");
    };
    
    let subject = getSubjectInternal(subjectId);
    checkOwnership(subject.owner, caller);
    
    let id = name # caller.toText() # Time.now().toText();
    let chapter : Chapter = { id; name; subjectId; owner = caller };
    chapters.add(id, chapter);
    id;
  };

  public query ({ caller }) func getChapter(id : Text) : async Chapter {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chapters");
    };
    
    let chapter = getChapterInternal(id);
    checkOwnership(chapter.owner, caller);
    chapter;
  };

  public query ({ caller }) func getChaptersBySubject(subjectId : Text) : async [Chapter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chapters");
    };
    
    let subject = getSubjectInternal(subjectId);
    checkOwnership(subject.owner, caller);
    
    chapters.values().toArray().filter(func(chapter) { 
      chapter.subjectId == subjectId and chapter.owner == caller 
    });
  };

  public shared ({ caller }) func deleteChapter(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete chapters");
    };
    
    let chapter = getChapterInternal(id);
    checkOwnership(chapter.owner, caller);
    
    chapters.remove(id);
    
    // Remove related lectures
    let lectureIdsToRemove = lectures.values().toArray().filter(func(lecture) { 
      lecture.chapterId == id and lecture.owner == caller 
    }).map(func(lecture) { lecture.id });
    
    for (lectureId in lectureIdsToRemove.values()) {
      lectures.remove(lectureId);
    };
  };

  // Lectures
  public shared ({ caller }) func createLecture(name : Text, duration : Nat, telegramLink : Text, chapterId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create lectures");
    };
    
    let chapter = getChapterInternal(chapterId);
    checkOwnership(chapter.owner, caller);
    
    let id = name # caller.toText() # Time.now().toText();
    let lecture : Lecture = { id; name; duration; telegramLink; status = "pending"; chapterId; owner = caller };
    lectures.add(id, lecture);
    id;
  };

  public query ({ caller }) func getLecture(id : Text) : async Lecture {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view lectures");
    };
    
    let lecture = getLectureInternal(id);
    checkOwnership(lecture.owner, caller);
    lecture;
  };

  public query ({ caller }) func getLecturesByChapter(chapterId : Text) : async [Lecture] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view lectures");
    };
    
    let chapter = getChapterInternal(chapterId);
    checkOwnership(chapter.owner, caller);
    
    lectures.values().toArray().filter(func(lecture) { 
      lecture.chapterId == chapterId and lecture.owner == caller 
    });
  };

  public shared ({ caller }) func markLectureDone(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark lectures as done");
    };
    
    let lecture = getLectureInternal(id);
    checkOwnership(lecture.owner, caller);
    
    let updatedLecture = {
      lecture with status = "done";
    };
    lectures.add(id, updatedLecture);
  };

  public shared ({ caller }) func deleteLecture(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete lectures");
    };
    
    let lecture = getLectureInternal(id);
    checkOwnership(lecture.owner, caller);
    
    lectures.remove(id);
  };

  // StudySessions
  public shared ({ caller }) func addStudySession(date : Text, duration : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add study sessions");
    };
    
    let id = date # caller.toText() # Time.now().toText();
    let session : StudySession = { id; date; duration; owner = caller };
    studySessions.add(id, session);
    id;
  };

  public query ({ caller }) func getStudySession(id : Text) : async StudySession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view study sessions");
    };
    
    let session = getStudySessionInternal(id);
    checkOwnership(session.owner, caller);
    session;
  };

  public query ({ caller }) func getStudySessionsByDate(date : Text) : async [StudySession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view study sessions");
    };
    
    studySessions.values().toArray().filter(func(session) { 
      session.date == date and session.owner == caller 
    });
  };

  public query ({ caller }) func getTotalMinutesForDate(date : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view study minutes");
    };
    
    var total = 0;
    for (session in studySessions.values()) {
      if (session.date == date and session.owner == caller) {
        total += session.duration;
      };
    };
    total;
  };

  // Tasks
  public shared ({ caller }) func createTask(title : Text, category : Text, date : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };
    
    let id = title # caller.toText() # Time.now().toText();
    let task : Task = { id; title; category; date; completed = false; owner = caller };
    tasks.add(id, task);
    id;
  };

  public query ({ caller }) func getTask(id : Text) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    
    let task = getTaskInternal(id);
    checkOwnership(task.owner, caller);
    task;
  };

  public query ({ caller }) func getTasksByDate(date : Text) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    
    tasks.values().toArray().filter(func(task) { 
      task.date == date and task.owner == caller 
    });
  };

  public shared ({ caller }) func markTaskComplete(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark tasks as complete");
    };
    
    let task = getTaskInternal(id);
    checkOwnership(task.owner, caller);
    
    let updatedTask = {
      task with completed = true;
    };
    tasks.add(id, updatedTask);
  };

  public shared ({ caller }) func deleteTask(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };
    
    let task = getTaskInternal(id);
    checkOwnership(task.owner, caller);
    
    tasks.remove(id);
  };

  // Stats
  public query ({ caller }) func getStats(_date : Text) : async Stats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };
    
    var totalMinutes = 0;
    var lecturesCompleted = 0;
    var pendingTasksCount = 0;
    
    // Calculate total study minutes for the date (user's own sessions)
    for (session in studySessions.values()) {
      if (session.date == _date and session.owner == caller) {
        totalMinutes += session.duration;
      };
    };
    
    // Count completed lectures for the user
    for (lecture in lectures.values()) {
      if (lecture.status == "done" and lecture.owner == caller) {
        lecturesCompleted += 1;
      };
    };
    
    // Count pending tasks for the user on this date
    for (task in tasks.values()) {
      if (task.date == _date and (not task.completed) and task.owner == caller) {
        pendingTasksCount += 1;
      };
    };
    
    {
      totalStudyMinutes = totalMinutes;
      completedLectures = lecturesCompleted;
      pendingTasks = pendingTasksCount;
    };
  };

  // Streaks
  public shared ({ caller }) func updateStreak() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update streaks");
    };
    
    let userSessions = studySessions.values().toArray().filter(func(session) { 
      session.owner == caller 
    });
    
    if (userSessions.size() == 0) { 
      Runtime.trap("No study sessions found") 
    };

    let lastStreak = switch (streaks.get(caller)) {
      case (null) { 0 };
      case (?streak) { streak.currentStreak };
    };

    let newStreak : Streak = { user = caller; currentStreak = lastStreak + 1 };
    streaks.add(caller, newStreak);
    lastStreak + 1;
  };

  public query ({ caller }) func getStreak(user : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view streaks");
    };
    
    // Users can only view their own streak, admins can view any
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own streak");
    };
    
    switch (streaks.get(user)) {
      case (null) { 0 };
      case (?streak) { streak.currentStreak };
    };
  };
};
