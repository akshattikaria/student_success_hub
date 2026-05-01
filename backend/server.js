const express = require("express");
const cors    = require("cors");
const crypto  = require("crypto");
const fs      = require("fs");
const path    = require("path");

const app  = express();
const PORT = 5000;

// ── Write queue (prevents concurrent JSON file corruption) ────────────────────
const _queue = [];
let _running = false;
function enqueue(fn) {
  return new Promise((resolve, reject) => {
    _queue.push(() => Promise.resolve().then(fn).then(resolve).catch(reject));
    if (!_running) runQueue();
  });
}
function runQueue() {
  if (!_queue.length) { _running = false; return; }
  _running = true;
  _queue.shift()().finally(runQueue);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:8080", credentials: true }));
app.use(express.json());

// ── File paths ────────────────────────────────────────────────────────────────
const DATA         = path.join(__dirname, "data");
const USERS_FILE   = path.join(DATA, "users.json");
const STUDENTS_FILE= path.join(DATA, "students.json");
const SESSIONS_FILE= path.join(DATA, "sessions.json");

// ── File helpers ──────────────────────────────────────────────────────────────
function readUsers()    { return JSON.parse(fs.readFileSync(USERS_FILE,    "utf8")); }
function readStudents() { return JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf8")); }
function readSessions() { try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8")); } catch { return {}; } }
function writeSessions(s) { try { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(s, null, 2)); } catch {} }

// ── Session store ─────────────────────────────────────────────────────────────
const sessions = readSessions();
function generateToken() { return crypto.randomBytes(32).toString("hex"); }

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!token || !sessions[token]) return res.status(401).json({ error: "Unauthorised." });
  req.sessionUser = sessions[token];
  next();
}

// ── Risk / grade helpers ──────────────────────────────────────────────────────
function gradeOf(m) {
  if (m >= 90) return "A+"; if (m >= 80) return "A"; if (m >= 75) return "B+";
  if (m >= 70) return "B";  if (m >= 60) return "C"; if (m >= 50) return "D";
  return "F";
}
function avgMarks(subjects) {
  if (!subjects.length) return 0;
  return subjects.reduce((s, x) => s + x.marks, 0) / subjects.length;
}
function computeRiskScore(att, avg) {
  return Math.round((100 - avg) * 0.55 + (100 - att) * 0.45);
}
function computeRiskLevel(att, avg) {
  if (att < 75 && avg < 65) return "High";
  if (att >= 85 && avg >= 75) return "Low";
  return "Medium";
}
function computeGpa(avg) {
  return +Math.min(4, Math.max(0, 2.0 + (avg - 50) / 50 * 2)).toFixed(2);
}

// Recompute risk fields on a student record in-place (no file write)
function applyRisk(rec) {
  const avg    = avgMarks(rec.subjects);
  rec.gpa      = computeGpa(avg);
  rec.riskScore= computeRiskScore(rec.attendance, avg);
  rec.riskLevel= computeRiskLevel(rec.attendance, avg);
  return rec;
}

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const users = readUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!found)                      return res.status(401).json({ error: "No account found for this email." });
  if (found.status === "inactive") return res.status(403).json({ error: "This account has been deactivated." });
  if (found.password && found.password !== password) return res.status(401).json({ error: "Incorrect password." });
  if (!found.password && password.length < 6)        return res.status(401).json({ error: "Password must be at least 6 characters." });
  const token = generateToken();
  const { password: _pw, ...safe } = found;
  sessions[token] = safe;
  writeSessions(sessions);
  return res.json({ token, user: safe });
});

app.get("/api/auth/me", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!token || !sessions[token]) return res.status(401).json({ error: "Invalid or expired session." });
  const users = readUsers();
  const fresh = users.find((u) => u.id === sessions[token].id);
  if (!fresh || fresh.status === "inactive") {
    delete sessions[token]; writeSessions(sessions);
    return res.status(401).json({ error: "Account no longer active." });
  }
  const { password: _pw, ...safe } = fresh;
  sessions[token] = safe; writeSessions(sessions);
  return res.json({ user: safe });
});

app.post("/api/auth/logout", (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (token) { delete sessions[token]; writeSessions(sessions); }
  return res.json({ ok: true });
});

// ── Student dashboard ─────────────────────────────────────────────────────────
app.get("/api/student/:id/dashboard", requireAuth, (req, res) => {
  const { id } = req.params;
  if (req.sessionUser.role === "student" && req.sessionUser.id !== id)
    return res.status(403).json({ error: "Forbidden." });
  const rec = readStudents()[id];
  if (!rec) return res.status(404).json({ error: "No academic record found." });
  return res.json(rec);
});

// ── Write API: PUT /api/attendance/:studentId ─────────────────────────────────
// body: { percentage: number }
app.put("/api/attendance/:studentId", requireAuth, async (req, res) => {
  if (!["teacher", "admin"].includes(req.sessionUser.role))
    return res.status(403).json({ error: "Forbidden." });

  const { studentId } = req.params;
  const pct = parseFloat(req.body.percentage);
  if (req.body.percentage === undefined || isNaN(pct) || pct < 0 || pct > 100)
    return res.status(400).json({ error: "percentage must be 0–100." });

  try {
    let updated;
    await enqueue(() => {
      const students = readStudents();
      if (!students[studentId])
        throw Object.assign(new Error("Student not found."), { status: 404 });
      students[studentId].attendance = Math.round(pct);
      applyRisk(students[studentId]);
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
      updated = students[studentId];
    });
    return res.json({ ok: true, record: updated });
  } catch (err) {
    console.warn("[attendance PUT]", err.message);
    return res.status(err.status || 500).json({ error: err.message || "Server error." });
  }
});

// ── Write API: POST /api/assessment/:studentId ────────────────────────────────
// body: { subject, short?, marks, examType? }
app.post("/api/assessment/:studentId", requireAuth, async (req, res) => {
  if (!["teacher", "admin"].includes(req.sessionUser.role))
    return res.status(403).json({ error: "Forbidden." });

  const { studentId } = req.params;
  const { subject, short, marks, examType } = req.body;
  if (!subject || marks === undefined) return res.status(400).json({ error: "subject and marks are required." });
  const m = parseFloat(marks);
  if (isNaN(m) || m < 0 || m > 100) return res.status(400).json({ error: "marks must be 0–100." });

  try {
    let updated;
    await enqueue(() => {
      const students = readStudents();
      if (!students[studentId])
        throw Object.assign(new Error("Student not found."), { status: 404 });

      const rec      = students[studentId];
      const grade    = gradeOf(m);
      const shortVal = short || subject.substring(0, 2).toUpperCase();
      const existing = rec.subjects.findIndex((s) => s.subject === subject);

      if (existing >= 0) {
        const prev = rec.subjects[existing].marks;
        rec.subjects[existing] = {
          ...rec.subjects[existing],
          marks: m, grade,
          trend: m > prev ? "up" : "down",
          ...(examType ? { examType } : {}),
        };
      } else {
        rec.subjects.push({
          subject, short: shortVal, marks: m, grade,
          attendance: rec.attendance,
          trend: "up",
          examType: examType || "Internal",
        });
      }

      applyRisk(rec);
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
      updated = rec;
    });
    return res.json({ ok: true, record: updated });
  } catch (err) {
    console.warn("[assessment POST]", err.message);
    return res.status(err.status || 500).json({ error: err.message || "Server error." });
  }
});

// ── Teacher / at-risk ─────────────────────────────────────────────────────────
app.get("/api/teacher/atrisk", requireAuth, (req, res) => {
  if (!["teacher", "advisor", "admin"].includes(req.sessionUser.role))
    return res.status(403).json({ error: "Forbidden." });

  const students = readStudents();
  const users    = readUsers();

  const ranked = Object.values(students)
    .map((rec) => {
      const user = users.find((u) => u.id === rec.userId);
      if (!user) return null;
      const avg = avgMarks(rec.subjects);
      const att = rec.attendance;
      const { password: _pw, ...safeUser } = user;
      return {
        user: safeUser, record: rec,
        score:      computeRiskScore(att, avg),
        level:      computeRiskLevel(att, avg),
        attendance: att,
        avgMarks:   avg,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return res.json(ranked);
});

// ── Admin user management ─────────────────────────────────────────────────────
app.get("/api/admin/users", requireAuth, (req, res) => {
  if (req.sessionUser.role !== "admin") return res.status(403).json({ error: "Forbidden." });
  return res.json(readUsers().map(({ password: _pw, ...u }) => u));
});

app.post("/api/admin/users", requireAuth, async (req, res) => {
  if (req.sessionUser.role !== "admin") return res.status(403).json({ error: "Forbidden." });
  const { name, email, role, password } = req.body;
  if (!name || !email || !role) return res.status(400).json({ error: "name, email and role are required." });

  try {
    let newUser;
    await enqueue(() => {
      const users = readUsers();
      if (users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
        throw Object.assign(new Error("A user with this email already exists."), { status: 409 });

      const prefix   = role === "student" ? "U" : role === "teacher" ? "T" : role === "advisor" ? "A" : "H";
      const year     = new Date().getFullYear();
      const seq      = String(users.length + 1).padStart(4, "0");
      const id       = `${prefix}-${year}-${seq}`;
      const initials = name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";
      const titleMap = {
        student: "B.Sc. Computer Science · Year 1", teacher: "Faculty · CS Dept.",
        advisor: "Academic Advisor · CS",           admin:   "Admin · CS Dept.",
      };

      newUser = {
        id, name: name.trim(), email: email.trim().toLowerCase(),
        role, status: "active", joined: new Date().toISOString().slice(0, 10),
        avatar: initials, title: titleMap[role] || "",
        password: password || undefined,
      };
      users.unshift(newUser);
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

      // Clean student baseline — no dummy data, no hardcoded subjects
      if (role === "student") {
        const students = readStudents();
        students[id] = {
          userId: id, program: "B.Sc. Computer Science", year: "Year 1",
          credits: 0, rank: users.length, attendance: 0, gpa: 0,
          riskScore: 0, riskLevel: "Low",
          subjects: [], performanceTrend: [], riskTrend: [], notes: [],
        };
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
      }
    });

    const { password: _pw, ...safe } = newUser;
    return res.status(201).json(safe);
  } catch (err) {
    console.warn("[admin/users POST]", err.message);
    return res.status(err.status || 500).json({ error: err.message || "Server error." });
  }
});

app.put("/api/admin/users/:id", requireAuth, async (req, res) => {
  if (req.sessionUser.role !== "admin") return res.status(403).json({ error: "Forbidden." });
  const { id } = req.params;
  const allowed = ["name", "email", "role", "status", "title", "password"];

  try {
    let updated;
    await enqueue(() => {
      const users = readUsers();
      const idx   = users.findIndex((u) => u.id === id);
      if (idx < 0) throw Object.assign(new Error("User not found."), { status: 404 });
      const patch = {};
      for (const key of allowed) { if (req.body[key] !== undefined) patch[key] = req.body[key]; }
      users[idx] = { ...users[idx], ...patch };
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      updated = users[idx];
    });
    const { password: _pw, ...safe } = updated;
    return res.json(safe);
  } catch (err) {
    console.warn("[admin/users PUT]", err.message);
    return res.status(err.status || 500).json({ error: err.message || "Server error." });
  }
});

// ── Interventions Subsystem (State Machine Testing Target) ────────────────────
const INTERVENTIONS_FILE = path.join(DATA, "interventions.json");
function readInterventions() {
  if (!fs.existsSync(INTERVENTIONS_FILE)) return [];
  return JSON.parse(fs.readFileSync(INTERVENTIONS_FILE, "utf8"));
}

app.post("/api/interventions", requireAuth, async (req, res) => {
  const { studentId, name, description } = req.body;
  if (!studentId || !name) return res.status(400).json({ error: "Missing fields" });

  try {
    let newIntervention;
    await enqueue(() => {
      const interventions = readInterventions();
      newIntervention = {
        id: crypto.randomBytes(8).toString("hex"),
        studentId,
        name,
        description: description || "",
        status: "Active",
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      interventions.push(newIntervention);
      fs.writeFileSync(INTERVENTIONS_FILE, JSON.stringify(interventions, null, 2));
    });
    return res.status(201).json(newIntervention);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/interventions/:id/status", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    let updated;
    await enqueue(() => {
      const interventions = readInterventions();
      const idx = interventions.findIndex(i => i.id === id);
      if (idx < 0) throw Object.assign(new Error("Not found"), { status: 404 });
      
      // EXPLICIT TESTABLE RULE FROM EXP 8B:
      if (interventions[idx].status === "Completed" && status === "Active") {
        throw Object.assign(new Error("Forbidden: Completed is immutable."), { status: 422 });
      }

      interventions[idx].status = status;
      fs.writeFileSync(INTERVENTIONS_FILE, JSON.stringify(interventions, null, 2));
      updated = interventions[idx];
    });
    return res.json(updated);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

// ── Counseling Subsystem ──────────────────────────────────────────────────────
const COUNSELING_FILE = path.join(DATA, "counseling.json");
function readCounseling() {
  if (!fs.existsSync(COUNSELING_FILE)) return [];
  return JSON.parse(fs.readFileSync(COUNSELING_FILE, "utf8"));
}

// Fetch records for a specific student
app.get("/api/counseling/:studentId", requireAuth, (req, res) => {
  const records = readCounseling().filter(r => r.studentId === req.params.studentId);
  return res.json(records);
});

// Create a new counseling record
app.post("/api/counseling", requireAuth, async (req, res) => {
  // Enforce RBAC: Only Advisors and Admins can record sessions
  if (req.sessionUser.role !== "advisor" && req.sessionUser.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Advisors only." });
  }

  const { studentId, date, advisorName, notes } = req.body;
  if (!studentId || !date || !advisorName || !notes) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    let newRecord;
    await enqueue(() => {
      const records = readCounseling();
      newRecord = {
        id: crypto.randomBytes(8).toString("hex"),
        studentId,
        date,
        advisorName,
        notes,
        createdAt: new Date().toISOString()
      };
      records.push(newRecord);
      fs.writeFileSync(COUNSELING_FILE, JSON.stringify(records, null, 2));
    });
    return res.status(201).json(newRecord);
  } catch (err) {
    return res.status(500).json({ error: "Server error saving counseling record." });
  }
});

// ── HOD overview ──────────────────────────────────────────────────────────────
// GET /api/hod/overview — department-wide risk summary
app.get("/api/hod/overview", requireAuth, (req, res) => {
  // FIX: Allow both HOD and Admin to view this data
  if (!["admin", "hod"].includes(req.sessionUser.role))
    return res.status(403).json({ error: "Forbidden." });

  const students = readStudents();
  const records  = Object.values(students);

  if (!records.length) {
    return res.json({ total: 0, high: 0, medium: 0, low: 0, avgRiskScore: 0 });
  }

  let high = 0, medium = 0, low = 0, scoreSum = 0;

  for (const rec of records) {
    const avg = avgMarks(rec.subjects);
    const att = rec.attendance;
    const level = computeRiskLevel(att, avg);
    const score = computeRiskScore(att, avg);
    if (level === "High")        high++;
    else if (level === "Medium") medium++;
    else                         low++;
    scoreSum += score;
  }

  return res.json({
    total:        records.length,
    high,
    medium,
    low,
    avgRiskScore: Math.round(scoreSum / records.length),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`USILAS backend running on http://localhost:${PORT}`));
