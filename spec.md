# StudyHub

## Current State
New project — no existing app code.

## Requested Changes (Diff)

### Add
- Dashboard with stats: today's study time, completed lectures, pending tasks
- Lecture Tracker: manage subjects, chapters, and lectures with Telegram links and done/pending status
- Study Timer: start/stop timer, manual time entry, daily study sessions stored
- Tick-Mark Planner: daily tasks with categories (Lecture, Revision, Practice), checkbox completion
- Telegram Lecture Locator: search lectures by subject/chapter/name, show clickable Telegram links
- Analytics: weekly study time bar chart, chapter-wise completion chart, streak tracking

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- Subject: id, name
- Chapter: id, subjectId, name
- Lecture: id, chapterId, name, duration (minutes), telegramLink, status (done/pending)
- StudySession: id, date (YYYYMMDD), duration (minutes)
- Task: id, title, category (lecture/revision/practice), completed, date
- CRUD for all entities
- Query: getLecturesByChapter, getSessionsByDate, getTasksByDate, getStats

### Frontend
- Sidebar navigation: Dashboard, Lecture Tracker, Study Timer, Tasks, Telegram Locator, Analytics
- Dashboard: KPI cards + quick action buttons
- Lecture Tracker: Subject/Chapter/Lecture hierarchy with progress bars
- Study Timer: live timer with start/stop, manual entry, session history
- Task Planner: daily task list with checkboxes and category filters
- Telegram Locator: search panel + results list with clickable links
- Analytics: recharts bar + line charts for study time and progress
