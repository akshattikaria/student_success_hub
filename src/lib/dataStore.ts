/**
 * Central data layer for the EduAnalytics app.
 *
 * - Persists everything to localStorage
 * - Single source of truth for users + student academic data
 * - Pure helpers for risk, alerts and suggestions
 *
 * All pages must read/write through this module instead of importing
 * the legacy mockData arrays directly.
 */

import type { Role } from "./auth";

/* -------------------------------------------------------------------------- */
/*  Backend config — declared here so all functions below can reference it    */
/* -------------------------------------------------------------------------- */
const API_BASE = "http://localhost:5000";
const AUTH_TOKEN_KEY = "edu_auth_token";

function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type RiskLevel = "Low" | "Medium" | "High";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  joined: string;
  avatar: string;
  title?: string;
  /** Optional password — when missing, any password is accepted (demo mode). */
  password?: string;
}

export interface SubjectMark {
  subject: string;
  short: string;       // short code for charts
  marks: number;
  grade: string;
  trend: "up" | "down";
  attendance: number;  // 0-100
}

export interface StudentRecord {
  userId: string;          // references StoredUser.id
  program: string;
  year: string;
  credits: number;
  rank: number;
  attendance: number;      // overall %
  gpa: number;
  subjects: SubjectMark[];
  performanceTrend: { month: string; score: number; average: number }[];
  riskTrend: { week: string; score: number }[];
  /** Counseling notes added by an advisor for this student. */
  notes: { id: string; date: string; advisorId: string; advisorName: string; text: string }[];
}

export interface CounselingSession {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: "scheduled" | "completed" | "follow-up";
  notes: string;
}

export interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  type: "Tutoring" | "Counseling" | "Mentoring" | "Study Plan";
  startDate: string;
  status: "active" | "completed" | "paused";
  progress: number;
}

interface DataShape {
  users: StoredUser[];
  students: Record<string, StudentRecord>; // keyed by userId
  counseling: CounselingSession[];
  interventions: Intervention[];
  dismissedAlerts: string[];
}

/* -------------------------------------------------------------------------- */
/*  Risk logic — single source of truth                                       */
/* -------------------------------------------------------------------------- */

/** Compute a 0-100 risk score. Higher = riskier. */
export function computeRiskScore(attendance: number, avgMarks: number): number {
  const att = clamp(attendance, 0, 100);
  const marks = clamp(avgMarks, 0, 100);
  const marksRisk = 100 - marks;
  const attRisk = 100 - att;
  return Math.round(marksRisk * 0.55 + attRisk * 0.45);
}

/** Map score → level using rubric:
 *  High  → attendance < 75 AND marks low (<65)
 *  Low   → attendance ≥ 85 AND marks ≥ 75
 *  else  → Medium
 */
export function computeRiskLevel(attendance: number, avgMarks: number): RiskLevel {
  if (attendance < 75 && avgMarks < 65) return "High";
  if (attendance >= 85 && avgMarks >= 75) return "Low";
  return "Medium";
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  attendance: number;
  avgMarks: number;
}

export function assessRisk(attendance: number, avgMarks: number): RiskAssessment {
  return {
    score: computeRiskScore(attendance, avgMarks),
    level: computeRiskLevel(attendance, avgMarks),
    attendance,
    avgMarks,
  };
}

export function avgMarksOf(rec: Pick<StudentRecord, "subjects">): number {
  if (!rec.subjects.length) return 0;
  return rec.subjects.reduce((s, x) => s + x.marks, 0) / rec.subjects.length;
}

export function getRiskColor(level: RiskLevel): "success" | "warning" | "danger" {
  return level === "Low" ? "success" : level === "Medium" ? "warning" : "danger";
}

/* -------------------------------------------------------------------------- */
/*  Seed data                                                                 */
/* -------------------------------------------------------------------------- */

const SEED_USERS: StoredUser[] = [
  { id: "U-2024-0871", name: "Aarav Sharma",   email: "aarav.sharma@university.edu",  role: "student", status: "active",   joined: "2022-08-15", avatar: "AS", title: "B.Sc. Computer Science · Year 3" },
  { id: "U-2024-0312", name: "Maya Patel",     email: "maya.p@university.edu",        role: "student", status: "active",   joined: "2022-08-15", avatar: "MP", title: "B.Sc. Computer Science · Year 3" },
  { id: "U-2024-0455", name: "Liam Chen",      email: "liam.c@university.edu",        role: "student", status: "active",   joined: "2022-08-15", avatar: "LC", title: "B.Sc. Computer Science · Year 3" },
  { id: "U-2024-0119", name: "Sofia Rossi",    email: "sofia.r@university.edu",       role: "student", status: "active",   joined: "2023-08-15", avatar: "SR", title: "B.Sc. Computer Science · Year 2" },
  { id: "U-2024-0623", name: "Noah Kim",       email: "noah.k@university.edu",        role: "student", status: "active",   joined: "2023-08-15", avatar: "NK", title: "B.Sc. Computer Science · Year 2" },
  { id: "U-2024-0788", name: "Emma Müller",    email: "emma.m@university.edu",        role: "student", status: "active",   joined: "2023-08-15", avatar: "EM", title: "B.Sc. Computer Science · Year 2" },
  { id: "U-2024-0901", name: "Yusuf Ali",      email: "yusuf.a@university.edu",       role: "student", status: "active",   joined: "2024-08-15", avatar: "YA", title: "B.Sc. Computer Science · Year 1" },
  { id: "T-2019-044",  name: "Dr. Priya Nair", email: "priya.nair@university.edu",    role: "teacher", status: "active",   joined: "2019-07-01", avatar: "PN", title: "Asst. Professor · CS Dept." },
  { id: "T-2018-022",  name: "Dr. Arjun Mehta",email: "arjun.mehta@university.edu",   role: "teacher", status: "active",   joined: "2018-07-01", avatar: "AM", title: "Assoc. Professor · CS Dept." },
  { id: "T-2020-061",  name: "Dr. Kavya Reddy",email: "kavya.reddy@university.edu",   role: "teacher", status: "inactive", joined: "2020-07-01", avatar: "KR", title: "Asst. Professor · CS Dept." },
  { id: "A-2021-009",  name: "Rahul Verma",    email: "rahul.verma@university.edu",   role: "advisor", status: "active",   joined: "2021-01-10", avatar: "RV", title: "Academic Advisor · CS" },
  { id: "A-2022-014",  name: "Sneha Kapoor",   email: "sneha.k@university.edu",       role: "advisor", status: "active",   joined: "2022-01-10", avatar: "SK", title: "Academic Advisor · CS" },
  { id: "H-2015-001",  name: "Prof. Meera Iyer",email:"meera.iyer@university.edu",    role: "admin",   status: "active",   joined: "2015-06-01", avatar: "MI", title: "HOD · Computer Science" },
];

const PERFORMANCE_MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
const RISK_WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

function seedSubjects(profile: "strong" | "average" | "weak"): SubjectMark[] {
  // Slight randomness per profile so charts don't all look identical
  const base =
    profile === "strong" ? 82 :
    profile === "weak"   ? 58 : 72;
  const subs = [
    { subject: "Data Structures",     short: "DS" },
    { subject: "Operating Systems",   short: "OS" },
    { subject: "Database Systems",    short: "DB" },
    { subject: "Machine Learning",    short: "ML" },
    { subject: "Computer Networks",   short: "CN" },
    { subject: "Software Engineering",short: "SE" },
  ];
  return subs.map((s, i) => {
    const m = clamp(base + ((i * 7) % 17) - 8, 35, 99);
    const att = clamp(base + ((i * 11) % 23) - 10, 35, 99);
    return {
      ...s,
      marks: m,
      attendance: att,
      grade: gradeOf(m),
      trend: (i % 2 === 0 ? "up" : "down") as "up" | "down",
    };
  });
}

function gradeOf(m: number): string {
  if (m >= 90) return "A+";
  if (m >= 80) return "A";
  if (m >= 75) return "B+";
  if (m >= 70) return "B";
  if (m >= 60) return "C";
  if (m >= 50) return "D";
  return "F";
}

function seedPerformanceTrend(target: number) {
  return PERFORMANCE_MONTHS.map((month, i) => {
    const score = clamp(target + ((i * 5) % 13) - 6, 30, 99);
    return { month, score, average: clamp(target - 4 + ((i * 3) % 7) - 3, 30, 99) };
  });
}

function seedRiskTrend(finalScore: number) {
  return RISK_WEEKS.map((week, i) => ({
    week,
    score: clamp(Math.round(finalScore - (RISK_WEEKS.length - 1 - i) * 4 + ((i * 5) % 11) - 5), 0, 100),
  }));
}

export function buildStudentRecord(
  userId: string,
  opts: { program?: string; year?: string; profile?: "strong" | "average" | "weak" } = {},
): StudentRecord {
  const profile = opts.profile ?? "average";
  const subjects = seedSubjects(profile);
  const overallAtt = Math.round(subjects.reduce((s, x) => s + x.attendance, 0) / subjects.length);
  const avg = avgMarksOf({ subjects });
  const gpa = +(2.0 + (avg - 50) / 50 * 2).toFixed(2);
  const risk = computeRiskScore(overallAtt, avg);
  return {
    userId,
    program: opts.program ?? "B.Sc. Computer Science",
    year: opts.year ?? "Year 1",
    credits: profile === "strong" ? 110 : profile === "weak" ? 60 : 90,
    rank: Math.floor(Math.random() * 40) + 1,
    attendance: overallAtt,
    gpa: clamp(gpa, 0, 4),
    subjects,
    performanceTrend: seedPerformanceTrend(Math.round(avg)),
    riskTrend: seedRiskTrend(risk),
    notes: [],
  };
}

const SEED_STUDENTS: Record<string, StudentRecord> = {};
function seedStudents() {
  const profiles: Record<string, "strong" | "average" | "weak"> = {
    "U-2024-0871": "average",
    "U-2024-0312": "weak",
    "U-2024-0455": "weak",
    "U-2024-0119": "average",
    "U-2024-0623": "average",
    "U-2024-0788": "average",
    "U-2024-0901": "strong",
  };
  Object.entries(profiles).forEach(([id, profile]) => {
    const u = SEED_USERS.find((x) => x.id === id);
    if (!u) return;
    const year =
      u.title?.includes("Year 1") ? "Year 1" :
      u.title?.includes("Year 2") ? "Year 2" : "Year 3";
    SEED_STUDENTS[id] = buildStudentRecord(id, {
      program: "B.Sc. Computer Science",
      year,
      profile,
    });
    // Make sure the named "high risk" students really are high risk
    if (profile === "weak") {
      SEED_STUDENTS[id].attendance = 60 + Math.floor(Math.random() * 8);
    }
  });
}
seedStudents();

const SEED_COUNSELING: CounselingSession[] = [
  { id: "C-001", studentId: "U-2024-0312", studentName: "Maya Patel",   date: "2025-04-20", status: "completed", notes: "Discussed time-management; weekly check-ins agreed." },
  { id: "C-002", studentId: "U-2024-0455", studentName: "Liam Chen",    date: "2025-04-22", status: "follow-up", notes: "Referred to ML tutor; revisit in 2 weeks." },
  { id: "C-003", studentId: "U-2024-0871", studentName: "Aarav Sharma", date: "2025-04-25", status: "scheduled", notes: "Initial consultation pending." },
];

const SEED_INTERVENTIONS: Intervention[] = [
  { id: "I-001", studentId: "U-2024-0312", studentName: "Maya Patel",   type: "Tutoring",   startDate: "2025-03-15", status: "active",    progress: 60 },
  { id: "I-002", studentId: "U-2024-0455", studentName: "Liam Chen",    type: "Counseling", startDate: "2025-03-22", status: "active",    progress: 45 },
  { id: "I-003", studentId: "U-2024-0871", studentName: "Aarav Sharma", type: "Study Plan", startDate: "2025-04-01", status: "active",    progress: 30 },
  { id: "I-004", studentId: "U-2024-0119", studentName: "Sofia Rossi",  type: "Mentoring",  startDate: "2025-02-10", status: "completed", progress: 100 },
];

const DEFAULT_DATA: DataShape = {
  users: SEED_USERS,
  students: SEED_STUDENTS,
  counseling: SEED_COUNSELING,
  interventions: SEED_INTERVENTIONS,
  dismissedAlerts: [],
};

/* -------------------------------------------------------------------------- */
/*  Persistence + pub/sub                                                     */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "edu_data_v1";

function loadFromStorage(): DataShape {
  if (typeof window === "undefined") return clone(DEFAULT_DATA);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as Partial<DataShape>;
    return {
      users:           Array.isArray(parsed.users) && parsed.users.length ? parsed.users : DEFAULT_DATA.users,
      students:        parsed.students && typeof parsed.students === "object" ? parsed.students : DEFAULT_DATA.students,
      counseling:      Array.isArray(parsed.counseling) ? parsed.counseling : DEFAULT_DATA.counseling,
      interventions:   Array.isArray(parsed.interventions) ? parsed.interventions : DEFAULT_DATA.interventions,
      dismissedAlerts: Array.isArray(parsed.dismissedAlerts) ? parsed.dismissedAlerts : [],
    };
  } catch {
    return clone(DEFAULT_DATA);
  }
}

let data: DataShape = loadFromStorage();
let version = 0;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota or disabled storage — silently ignore so app stays usable */
  }
}

function emit() {
  version += 1;
  persist();
  listeners.forEach((fn) => {
    try { fn(); } catch { /* swallow listener errors */ }
  });
}

export function getVersion(): number {
  return version;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function resetStore() {
  data = clone(DEFAULT_DATA);
  // Clear fetch flags so next login re-fetches fresh data from backend
  _usersFetched = false;
  _rankedFetched = false;
  _fetchedStudents.clear();
  emit();
}

/* -------------------------------------------------------------------------- */
/*  Public API — Users                                                        */
/* -------------------------------------------------------------------------- */

let _usersFetched = false;

async function _fetchUsersFromBackend(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const users: StoredUser[] = await res.json();
    data.users = users;
    emit();
  } catch (e) {
    console.warn("[dataStore] _fetchUsersFromBackend failed:", e);
  }
}

export function getUsers(): StoredUser[] {
  if (!_usersFetched) {
    _usersFetched = true;
    _fetchUsersFromBackend();
  }
  return [...data.users];
}

export function getUserByEmail(email: string): StoredUser | undefined {
  const e = email.trim().toLowerCase();
  return data.users.find((u) => u.email.toLowerCase() === e);
}

export function getUserById(id: string): StoredUser | undefined {
  return data.users.find((u) => u.id === id);
}

export interface NewUserInput {
  name: string;
  email: string;
  role: Role;
  password?: string;
}

export function addUser(input: NewUserInput): StoredUser {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim()) throw new Error("Name is required");
  if (!email.includes("@")) throw new Error("A valid email is required");
  if (getUserByEmail(email)) throw new Error("A user with this email already exists");

  const prefix =
    input.role === "student" ? "U" :
    input.role === "teacher" ? "T" :
    input.role === "advisor" ? "A" : "H";
  const year = new Date().getFullYear();
  const seq = String(data.users.length + 1).padStart(4, "0");
  const id = `${prefix}-${year}-${seq}`;
  const initials = input.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";

  const user: StoredUser = {
    id,
    name: input.name.trim(),
    email,
    role: input.role,
    status: "active",
    joined: new Date().toISOString().slice(0, 10),
    avatar: initials,
    password: input.password,
    title:
      input.role === "student" ? "B.Sc. Computer Science · Year 1" :
      input.role === "teacher" ? "Faculty · CS Dept." :
      input.role === "advisor" ? "Academic Advisor · CS" : "Admin · CS Dept.",
  };
  // Optimistic update — UI reflects change immediately
  data.users = [user, ...data.users];
  if (input.role === "student") {
    data.students = { ...data.students, [id]: buildStudentRecord(id, { profile: "average" }) };
  }
  emit();

  // Background sync to backend
  const token = getAuthToken();
  if (token) {
    fetch(`${API_BASE}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    }).catch((e) => console.warn("[dataStore] addUser sync failed:", e));
  }

  return user;
}

export function updateUser(id: string, patch: Partial<Omit<StoredUser, "id">>): StoredUser | undefined {
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx < 0) return undefined;
  const next = { ...data.users[idx], ...patch };
  data.users = [...data.users.slice(0, idx), next, ...data.users.slice(idx + 1)];
  emit(); // optimistic update

  // Background sync to backend
  const token = getAuthToken();
  if (token) {
    fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(patch),
    }).catch((e) => console.warn("[dataStore] updateUser sync failed:", e));
  }

  return next;
}

export function setUserStatus(id: string, status: "active" | "inactive") {
  return updateUser(id, { status });
}

/* -------------------------------------------------------------------------- */
/*  Public API — Students                                                     */
/* -------------------------------------------------------------------------- */

export function getStudents(): StudentRecord[] {
  return Object.values(data.students);
}

// ── Backend integration ─────────────────────────────────────────────────────
const _fetchedStudents = new Set<string>();

async function _fetchStudentFromBackend(userId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/student/${userId}/dashboard`, {
      headers: authHeaders(),
    });
    if (!res.ok) { console.warn(`[dataStore] student dashboard ${userId} → ${res.status}`); return; }
    const record: StudentRecord = await res.json();
    data.students = { ...data.students, [userId]: record };
    emit();
  } catch (e) {
    console.warn("[dataStore] _fetchStudentFromBackend failed:", e);
  }
}

export function getStudentData(userId: string): StudentRecord | undefined {
  // Fire background fetch the first time this userId is requested
  if (!_fetchedStudents.has(userId)) {
    _fetchedStudents.add(userId);
    _fetchStudentFromBackend(userId);
  }
  return data.students[userId];
}

export function updateStudentData(userId: string, patch: Partial<StudentRecord>): StudentRecord | undefined {
  const cur = data.students[userId];
  if (!cur) return undefined;
  const next = { ...cur, ...patch };
  data.students = { ...data.students, [userId]: next };
  emit();
  return next;
}

export interface RankedStudent extends RiskAssessment {
  user: StoredUser;
  record: StudentRecord;
}

let _rankedFetched = false;

async function _fetchRankedFromBackend(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/teacher/atrisk`, {
      headers: authHeaders(),
    });
    if (!res.ok) { console.warn(`[dataStore] teacher/atrisk → ${res.status}`); return; }
    const ranked: RankedStudent[] = await res.json();
    // Hydrate students cache; merge users without overwriting existing entries
    ranked.forEach(({ user, record }) => {
      data.students = { ...data.students, [record.userId]: record };
      const exists = data.users.find((u) => u.id === user.id);
      if (exists) {
        // Update in place to pick up any admin changes (status, role)
        data.users = data.users.map((u) => u.id === user.id ? { ...u, ...user as StoredUser } : u);
      } else {
        data.users = [...data.users, user as StoredUser];
      }
    });
    emit();
  } catch (e) {
    console.warn("[dataStore] _fetchRankedFromBackend failed:", e);
  }
}

/** Returns every student decorated with their current risk assessment. */
export function getRankedStudents(): RankedStudent[] {
  if (!_rankedFetched) {
    _rankedFetched = true;
    _fetchRankedFromBackend();
  }
  return getStudents()
    .map((rec) => {
      const user = getUserById(rec.userId);
      if (!user) return null;
      const avg = avgMarksOf(rec);
      return {
        user,
        record: rec,
        ...assessRisk(rec.attendance, avg),
      };
    })
    .filter((x): x is RankedStudent => !!x)
    .sort((a, b) => b.score - a.score);
}

export function getAtRiskStudents(): RankedStudent[] {
  return getRankedStudents().filter((s) => s.level !== "Low");
}

export function addStudentNote(userId: string, advisor: { id: string; name: string }, text: string) {
  const rec = data.students[userId];
  if (!rec) return;
  const note = {
    id: `N-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    advisorId: advisor.id,
    advisorName: advisor.name,
    text,
  };
  updateStudentData(userId, { notes: [note, ...rec.notes] });
}

/* -------------------------------------------------------------------------- */
/*  Public API — Counseling & Interventions                                   */
/* -------------------------------------------------------------------------- */

export function getCounselingSessions(): CounselingSession[] {
  return [...data.counseling];
}

export function addCounselingSession(s: Omit<CounselingSession, "id">): CounselingSession {
  const id = `C-${String(data.counseling.length + 1).padStart(3, "0")}`;
  const next = { id, ...s };
  data.counseling = [next, ...data.counseling];
  emit();
  return next;
}

export function updateCounselingSession(id: string, patch: Partial<CounselingSession>) {
  data.counseling = data.counseling.map((c) => (c.id === id ? { ...c, ...patch } : c));
  emit();
}

export function getInterventions(): Intervention[] {
  return [...data.interventions];
}

export function addIntervention(i: Omit<Intervention, "id" | "studentName" | "startDate" | "progress" | "status"> & {
  startDate?: string;
  status?: Intervention["status"];
  progress?: number;
  notes?: string;
}): Intervention | undefined {
  const student = getUserById(i.studentId);
  if (!student) return undefined;
  const id = `I-${String(data.interventions.length + 1).padStart(3, "0")}`;
  const next: Intervention = {
    id,
    studentId: i.studentId,
    studentName: student.name,
    type: i.type,
    startDate: i.startDate ?? new Date().toISOString().slice(0, 10),
    status: i.status ?? "active",
    progress: i.progress ?? 0,
  };
  data.interventions = [next, ...data.interventions];
  emit();
  return next;
}

export function updateIntervention(id: string, patch: Partial<Intervention>) {
  data.interventions = data.interventions.map((i) => (i.id === id ? { ...i, ...patch } : i));
  emit();
}

/* -------------------------------------------------------------------------- */
/*  Public API — Alerts & Suggestions (derived)                               */
/* -------------------------------------------------------------------------- */

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  date: string;
  severity: "high" | "medium" | "low" | "info";
  category: string;
}

export interface SuggestionItem {
  id: number;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  icon: string;
  estimate: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Deterministic alert ID — stable across renders for the same student + cause. */
function alertId(studentId: string, kind: string, key = ""): string {
  return key ? `${studentId}:${kind}:${key}` : `${studentId}:${kind}`;
}

export function generateAlertsFor(rec: StudentRecord | undefined): AlertItem[] {
  if (!rec) return [];
  const list: AlertItem[] = [];
  const avg = avgMarksOf(rec);
  const risk = assessRisk(rec.attendance, avg);

  rec.subjects.forEach((s) => {
    if (s.attendance < 70) {
      list.push({
        id: alertId(rec.userId, "attendance", s.short),
        title: `Low attendance in ${s.subject}`,
        description: `Attendance is ${s.attendance}%. Minimum required is 75%.`,
        date: today(),
        severity: s.attendance < 60 ? "high" : "medium",
        category: "Attendance",
      });
    }
    if (s.marks < 65) {
      list.push({
        id: alertId(rec.userId, "performance", s.short),
        title: `${s.subject} performance dropping`,
        description: `Recent marks are ${s.marks}. Consider extra study sessions.`,
        date: today(),
        severity: s.marks < 50 ? "high" : "medium",
        category: "Performance",
      });
    }
  });

  if (risk.level === "High") {
    list.push({
      id: alertId(rec.userId, "risk", "high"),
      title: "High risk student",
      description: `Combined risk score is ${risk.score}. Schedule a counseling session this week.`,
      date: today(),
      severity: "high",
      category: "Risk",
    });
  } else if (risk.level === "Medium") {
    list.push({
      id: alertId(rec.userId, "risk", "medium"),
      title: "Medium risk — keep monitoring",
      description: `Risk score is ${risk.score}. Small actions now will prevent escalation.`,
      date: today(),
      severity: "medium",
      category: "Risk",
    });
  }

  if (rec.subjects.length) {
    const top = rec.subjects.reduce((best, s) => (s.marks > best.marks ? s : best), rec.subjects[0]);
    list.push({
      id: alertId(rec.userId, "achievement", top.short),
      title: "Excellent performance",
      description: `${top.subject} shows strong results — keep it up!`,
      date: today(),
      severity: "info",
      category: "Achievement",
    });
  }

  return list;
}

export function generateSuggestionsFor(rec: StudentRecord | undefined): SuggestionItem[] {
  if (!rec) return [];
  const list: SuggestionItem[] = [];
  let id = 1;
  const avg = avgMarksOf(rec);
  const risk = assessRisk(rec.attendance, avg);

  const lowAtt = rec.subjects.filter((s) => s.attendance < 75);
  if (lowAtt.length) {
    list.push({
      id: id++,
      title: `Improve attendance in ${lowAtt.map((s) => s.short).join(", ")}`,
      description: `Aim for 90%+ attendance for the next 4 weeks to recover above the 75% threshold.`,
      priority: "High",
      icon: "calendar",
      estimate: "4 weeks",
    });
  }
  const weak = rec.subjects.filter((s) => s.marks < 70);
  if (weak.length) {
    list.push({
      id: id++,
      title: `Focus on weak subjects: ${weak.map((s) => s.subject).join(", ")}`,
      description: `Schedule 6 hours/week revising fundamentals — these subjects are pulling your GPA down.`,
      priority: "High",
      icon: "target",
      estimate: "Ongoing",
    });
  }
  if (risk.level === "High") {
    list.push({
      id: id++,
      title: "Schedule counseling session",
      description: "Your risk score is high. A meeting with your advisor can help build a recovery plan.",
      priority: "High",
      icon: "user-check",
      estimate: "30 min",
    });
  }
  list.push(
    {
      id: id++,
      title: "Join study group",
      description: "Connect with peers — collaborative study improves outcomes by 23% on average.",
      priority: "Medium",
      icon: "users",
      estimate: "This week",
    },
    {
      id: id++,
      title: "Use the tutoring center",
      description: "Free peer tutoring is available Mon–Thu 4–7pm at the Knowledge Commons.",
      priority: "Low",
      icon: "book-open",
      estimate: "Drop-in",
    },
    {
      id: id++,
      title: "Track daily study with planner",
      description: "Use the Pomodoro technique with 4 sessions per day for focused work.",
      priority: "Low",
      icon: "clock",
      estimate: "Daily",
    },
  );
  return list;
}

export function getDismissedAlerts(): string[] {
  return [...data.dismissedAlerts];
}
export function dismissAlert(id: string) {
  if (!data.dismissedAlerts.includes(id)) {
    data.dismissedAlerts = [...data.dismissedAlerts, id];
    emit();
  }
}
export function clearDismissedAlerts() {
  data.dismissedAlerts = [];
  emit();
}

/* -------------------------------------------------------------------------- */
/*  Aggregates for Teacher / Admin                                            */
/* -------------------------------------------------------------------------- */

export function getClassSummary() {
  const ranked = getRankedStudents();
  const total = ranked.length || 1;
  const avgMarks = Math.round(ranked.reduce((s, r) => s + r.avgMarks, 0) / total);
  const avgAtt = Math.round(ranked.reduce((s, r) => s + r.attendance, 0) / total);
  const atRisk = ranked.filter((r) => r.level !== "Low").length;
  return {
    className: "CS-301 · Spring 2025",
    totalStudents: ranked.length,
    average: avgMarks,
    attendanceAvg: avgAtt,
    atRisk,
    passRate: Math.round((ranked.filter((r) => r.avgMarks >= 50).length / total) * 100),
  };
}

export function getScoreDistribution() {
  const buckets = [
    { range: "0–40",    min: 0,  max: 40,  students: 0 },
    { range: "41–55",   min: 41, max: 55,  students: 0 },
    { range: "56–70",   min: 56, max: 70,  students: 0 },
    { range: "71–80",   min: 71, max: 80,  students: 0 },
    { range: "81–90",   min: 81, max: 90,  students: 0 },
    { range: "91–100",  min: 91, max: 100, students: 0 },
  ];
  getRankedStudents().forEach((r) => {
    const b = buckets.find((b) => r.avgMarks >= b.min && r.avgMarks <= b.max);
    if (b) b.students += 1;
  });
  return buckets.map(({ range, students }) => ({ range, students }));
}

export function getDepartmentSummary() {
  const users = getUsers();
  const ranked = getRankedStudents();
  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalFaculty  = users.filter((u) => u.role === "teacher").length;
  const totalAdvisors = users.filter((u) => u.role === "advisor").length;
  const totalAdmins   = users.filter((u) => u.role === "admin").length;
  const avgGpa = ranked.length ? +(ranked.reduce((s, r) => s + r.record.gpa, 0) / ranked.length).toFixed(2) : 0;
  const passRate = ranked.length
    ? Math.round((ranked.filter((r) => r.avgMarks >= 50).length / ranked.length) * 100)
    : 0;
  const atRiskRate = ranked.length
    ? Math.round((ranked.filter((r) => r.level !== "Low").length / ranked.length) * 100)
    : 0;
  return {
    name: "Computer Science",
    totalStudents,
    totalFaculty,
    totalAdvisors,
    totalAdmins,
    totalCourses: 18,
    avgGpa,
    passRate,
    atRiskRate,
    totalUsers: users.length,
  };
}

/* -------------------------------------------------------------------------- */
/*  Misc helpers                                                              */
/* -------------------------------------------------------------------------- */

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function downloadCSV<T extends object>(filename: string, rows: T[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0] as object);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const updateStudentAttendance = async (studentId: string, percentage: number) => {
  const response = await fetch(`http://localhost:5000/api/attendance/${studentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("edu_auth_token")}`
    },
    body: JSON.stringify({ percentage }),
  });
  
  if (!response.ok) throw new Error("Failed to update attendance");
  return response.json();
};

export const addStudentAssessment = async (studentId: string, subject: string, marks: number, grade: string) => {
  const response = await fetch(`http://localhost:5000/api/assessment/${studentId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("edu_auth_token")}`
    },
    body: JSON.stringify({ subject, marks, grade }),
  });
  
  if (!response.ok) throw new Error("Failed to add assessment");
  return response.json();
};