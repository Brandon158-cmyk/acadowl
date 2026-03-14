# Sprint 01 — Full Audit: Built vs Required

A complete gap analysis of Sprint 01 (Core Academic Foundation) — 44 issues across 12 epics — against the current AcadOwl codebase.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented (backend + frontend) |
| 🟡 | Partially implemented (some code exists, gaps remain) |
| ❌ | Not implemented at all |
| 🔧 | Schema/infrastructure only (table exists but no logic) |

---

## Critical Infrastructure Gap (Blocker)

**There is no `createStaff` mutation anywhere in the codebase.** Sprint 00 ISSUE-030 (`createUser`) creates a `users` record only — it does NOT create a corresponding `staff` record. The entire staff ecosystem (assignments, attendance, leave) depends on `staff` records existing, but there is no way to create them. This is the single biggest gap.

| Missing Item | Impact |
|---|---|
| `createStaff` mutation | Cannot add teachers/staff to the system |
| `updateStaff` mutation | Cannot edit staff professional details |
| Staff profile page (`/staff/[id]`) | No way to view individual staff details |
| "Add User" button in `/settings/users` is non-functional | No dialog/form wired to the button |
| Staff onboarding flow (user + staff record together) | Workflow gap — creating a user doesn't create a staff record |

---

## Epic 1 — Academic Year & Term Management

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-041 | Academic Year CRUD & Activation | ✅ | `convex/schools/academicYears.ts` + `settings/academic-year/page.tsx` |
| ISSUE-042 | Term Management & Active Term | ✅ | `convex/schools/terms.ts` + terms UI in academic year page |
| ISSUE-043 | Academic Calendar & School Events | ✅ | `convex/schools/schoolEvents.ts` + `settings/calendar/page.tsx` |

**Epic 1 verdict: Complete** ✅

---

## Epic 2 — Subject & Curriculum Management

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-044 | Subject Registry & MoE Mapping | ✅ | `convex/academics/subjects.ts` + `academics/subjects/page.tsx` |
| ISSUE-045 | Grade Configuration | ✅ | `convex/academics/grades.ts` + `academics/grades/page.tsx` |
| ISSUE-046 | Lesson Plans & Syllabus Tracker | ✅ | `convex/academics/lessonPlans.ts` + `academics/lesson-plans/` pages |
| ISSUE-047 | Homework Assignment System | ✅ | `convex/academics/homework.ts` + `academics/homework/` pages |

**Epic 2 verdict: Complete** ✅

---

## Epic 3 — Student Enrolment & Profile Management

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-048 | Student Enrolment Form | ✅ | `convex/students/mutations.ts` + `students/enrol/page.tsx` |
| ISSUE-049 | Student Profile View & Edit | 🟡 | `students/[id]/page.tsx` exists — needs audit for all tabs (Medical, Documents, History) |
| ISSUE-050 | Student List — Search, Filter, Bulk | 🟡 | `students/page.tsx` exists — bulk actions (CSV export, bulk SMS, bulk section change) likely missing |
| ISSUE-051 | Student ID Card Generation | 🟡 | `convex/students/idCards.ts` exists — needs audit for PDF generation |
| ISSUE-052 | Student Document Management | 🟡 | `convex/students/documents.ts` exists — needs frontend audit |
| ISSUE-053 | Student Transfer System | 🟡 | `convex/students/transfers.ts` exists — needs frontend audit (Transfer Out modal etc.) |
| ISSUE-054 | Year-End Promotion Engine | 🟡 | `convex/students/promotions.ts` + `students/promotion/page.tsx` — has TS errors |

**Epic 3 verdict: Mostly built, needs detailed audit** 🟡

### Missing details:
- `sectionHistory` table NOT in schema (required by ISSUE-056 but referenced by Epic 3)
- TS errors in `students/enrol/page.tsx` and `students/promotion/page.tsx` (Select component issues)

---

## Epic 4 — Class Sections & Student Placement

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-055 | Section Management | ✅ | `convex/academics/sections.ts` + `academics/sections/page.tsx` |
| ISSUE-056 | Student-Section History & Audit Trail | ❌ | **`sectionHistory` table missing from schema entirely** |
| ISSUE-057 | Inter-Section Student Transfer | ❌ | No `transferBetweenSections` mutation found |
| ISSUE-058 | Class Teacher Section Dashboard | ❌ | No `/(teacher)/my-class/page.tsx` — only `teacher/dashboard/page.tsx` exists |

**Epic 4 verdict: 1 of 4 done** 🟡

---

## Epic 5 — Staff & Subject Assignment

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-059 | Staff Subject & Section Assignment | 🟡 | Backend ✅ — Frontend built at `/staff/assignments` (global page), sprint spec says `staff/[id]/assignments` (per-teacher) |
| ISSUE-060 | Staff Attendance Register | 🟡 | Backend ✅ — Frontend ✅ — Missing: "Assign Substitute" button, monthly report UI |
| ISSUE-061 | Leave Management | 🟡 | Backend ✅ — Frontend ✅ — Missing: leave balance tracking, staff self-service from profile |

**Epic 5 verdict: Backend done, frontend functional but missing features** 🟡

### Gaps in Epic 5:
1. **No `createStaff` mutation** — prerequisite for all of Epic 5
2. **No staff profile page** — ISSUE-059 spec says assignments should be a tab on staff profile
3. **No "Assign Substitute" button** when marking teacher absent (ISSUE-060)
4. **No leave balance tracking** — annual entitlement per school (ISSUE-061)
5. **No staff self-service** — staff submitting leave from their own profile

---

## Epic 6 — Timetable Builder

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-062 | Timetable Slot Management | ❌ | No `convex/academics/timetable.ts` — directory doesn't have this file |
| ISSUE-063 | Timetable Builder UI — Drag & Drop | ❌ | No `academics/timetable/page.tsx` |
| ISSUE-064 | Period Timetable Configuration | ❌ | `periodConfig` field missing from schools schema |
| ISSUE-065 | Student & Parent Timetable View | ❌ | No `/(student)/timetable/page.tsx` |

**Epic 6 verdict: Not started** ❌

---

## Epic 7 — Attendance System (Offline-First)

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-066 | Attendance Register — Backend | ❌ | `convex/attendance/` dir exists but is **empty** |
| ISSUE-067 | Offline-First PWA Register | ❌ | No `/(teacher)/register/page.tsx` |
| ISSUE-068 | Boarding Night Prep Attendance | ❌ | — |
| ISSUE-069 | Period-by-Period Attendance | ❌ | — |
| ISSUE-070 | Chronic Absenteeism Detection | ❌ | — |
| ISSUE-071 | Attendance Reports | ❌ | — |

**Epic 7 verdict: Not started** ❌

---

## Epic 8 — SMS & Notification Integration

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-072 | SMS Provider Integration | ❌ | No `convex/notifications/sms.ts` |
| ISSUE-073 | Absence SMS Alert System | ❌ | No `convex/notifications/absenceAlerts.ts` |
| ISSUE-074 | Broadcast SMS | ❌ | No broadcast mutation or compose page |
| ISSUE-075 | In-App Notification Centre | 🟡 | `convex/notifications/queries.ts` exists (basic queries) — missing `createNotification`, `markAsRead` |

**Epic 8 verdict: Not started (only basic query scaffolding)** ❌

---

## Epic 9 — Exams & Mark Entry

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-076 | Exam Session Management | ❌ | `convex/exams/` dir exists but is **empty** |
| ISSUE-077 | Mark Entry Interface | ❌ | No `/(teacher)/marks/` pages |
| ISSUE-078 | Admin Mark Entry Override | ❌ | `markAuditLog` table missing from schema |
| ISSUE-079 | ECZ Mock Exam Tracking | ❌ | `eczMockTargets` table missing from schema |
| ISSUE-080 | Exam Seating Plan Generator | ❌ | `examSeatingPlans` table missing from schema |

**Epic 9 verdict: Not started** ❌

---

## Epic 10 — Grading Engine

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-081 | Grading Scale Configuration | ❌ | `gradingScales` field missing from schools schema |
| ISSUE-082 | Automatic Grade Computation | ❌ | `termAggregates` table missing from schema |
| ISSUE-083 | Teacher Remarks & Sign-Off | ❌ | — |

**Epic 10 verdict: Not started** ❌

---

## Epic 11 — Report Card Generation

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-084 | Report Card PDF Engine | ❌ | — |
| ISSUE-085 | Report Card Template Customisation | ❌ | `reportCardConfig` missing from schools schema |
| ISSUE-086 | Bulk Generation & Release | ❌ | — |
| ISSUE-087 | Report Card Download | ❌ | — |

**Epic 11 verdict: Not started** ❌

---

## Epic 12 — Student & Academic Analytics

| Issue | Title | Status | Notes |
|-------|-------|--------|-------|
| ISSUE-088 | Student Performance Dashboard | ❌ | — |
| ISSUE-089 | Section & Grade Analytics | ❌ | — |
| ISSUE-090 | MoE Reporting Scaffolding | ❌ | No `convex/reports/` directory |

**Epic 12 verdict: Not started** ❌

---

## Missing Schema Items (additions specified in Sprint 01)

| Table / Field | Issue | Status |
|---|---|---|
| `schoolEvents` | ISSUE-043 | ✅ exists |
| `lessonPlans` | ISSUE-046 | ✅ exists |
| `counters` | ISSUE-048 | ✅ exists |
| `studentDocuments` | ISSUE-052 | ✅ exists |
| `transfers` | ISSUE-053 | ✅ exists |
| `sectionHistory` | ISSUE-056 | ❌ **missing** |
| `staffSubjectAssignments` | ISSUE-059 | ✅ exists |
| `staffAttendance` | ISSUE-060 | ✅ exists |
| `leaveRequests` | ISSUE-061 | ✅ exists |
| `markAuditLog` | ISSUE-078 | ❌ **missing** |
| `eczMockTargets` | ISSUE-079 | ❌ **missing** |
| `examSeatingPlans` | ISSUE-080 | ❌ **missing** |
| `termAggregates` | ISSUE-082 | ❌ **missing** |
| `schools.periodConfig` | ISSUE-064 | ❌ **missing** |
| `schools.smsTemplates` | ISSUE-073 | ❌ **missing** |
| `schools.gradingScales` | ISSUE-081 | ❌ **missing** |
| `schools.reportCardConfig` | ISSUE-085 | ❌ **missing** |
| `timetableSlots.isPublished` | ISSUE-062 | ❌ **missing** |
| `timetableSlots.week` | ISSUE-062 | ❌ **missing** |
| `timetableSlots.notes` | ISSUE-062 | ❌ **missing** |
| `notifications.*` provider fields | ISSUE-072 | ❌ **missing** |

---

## Summary Scorecard

| Epic | Issues | Done | Partial | Not Started |
|------|--------|------|---------|-------------|
| 1 — Academic Year & Terms | 3 | 3 | 0 | 0 |
| 2 — Subject & Curriculum | 4 | 4 | 0 | 0 |
| 3 — Student Enrolment | 7 | 1 | 6 | 0 |
| 4 — Sections & Placement | 4 | 1 | 0 | 3 |
| 5 — Staff & Assignment | 3 | 0 | 3 | 0 |
| 6 — Timetable Builder | 4 | 0 | 0 | 4 |
| 7 — Attendance (Offline) | 6 | 0 | 0 | 6 |
| 8 — SMS & Notifications | 4 | 0 | 1 | 3 |
| 9 — Exams & Mark Entry | 5 | 0 | 0 | 5 |
| 10 — Grading Engine | 3 | 0 | 0 | 3 |
| 11 — Report Cards | 4 | 0 | 0 | 4 |
| 12 — Analytics | 3 | 0 | 0 | 3 |
| **TOTAL** | **50*** | **9** | **10** | **31** |

*Includes ISSUE-030 (User Management) from Sprint 00 which is a prerequisite.

**Overall: ~18% complete** (9 fully done + 10 partial out of 50 items)

---

## Recommended Implementation Order

Based on the dependency graph and critical gaps:

### Phase 1 — Staff Infrastructure (Unblocks Epic 5 fully)
1. `createStaff` + `updateStaff` mutations
2. Staff profile page (`/staff/[id]`)
3. Wire "Add User" button in `/settings/users` to also create staff record
4. Fix TS errors in `students/` pages (Select component)

### Phase 2 — Finish Epic 3 & 4 (Foundation for everything else)
5. `sectionHistory` schema + backend (ISSUE-056)
6. Inter-Section Transfer (ISSUE-057)
7. Class Teacher Dashboard (ISSUE-058)
8. Audit Epic 3 for completeness (ISSUE-049/050/051/052/053)

### Phase 3 — Timetable (ISSUE-062 → 065)
9. Depends on Epic 5 staff assignments being solid

### Phase 4 — Attendance (ISSUE-066 → 071)
10. The most used feature — offline-first PWA

### Phase 5 — SMS (ISSUE-072 → 075)
11. Unblocks absence alerts and all notifications

### Phase 6 — Exams & Grading (ISSUE-076 → 083)
12. Depends on attendance and timetable

### Phase 7 — Report Cards (ISSUE-084 → 087)
13. Depends on grading engine

### Phase 8 — Analytics & MoE (ISSUE-088 → 090)
14. Depends on exams and grading
