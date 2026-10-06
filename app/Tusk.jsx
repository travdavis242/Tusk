"use client";
import {SyncStrip, SyncButton, SyncCenter} from "../components/sync/SyncControls";
import {openSync} from "../lib/sync/service";
import { LifeNav, LifeWorkspace, LIFE_VIEWS } from "../components/life/LifeWorkspace";
import { storage, initializeStorage, retrySaves, startDemo, isDemo } from "./storage";
import { AI_CONFIGS as AI_PROFILES } from "../lib/ai/configs";
import { CoachPanel } from "../components/tusk/CoachPanel";
import { runCoach } from "../lib/ai/framework";
import { DEMO_RECORDS } from "../lib/ai/demo-data";
import { useState, useEffect, useRef } from "react";
import {
  Home, BookOpen, Calendar as CalendarIcon, Target, BarChart3, Bot,
  Settings as SettingsIcon, RefreshCw, Plus, Check, ChevronRight, ChevronLeft,
  Mail, Link as LinkIcon, X, Clock, AlertCircle, AlertTriangle, Send, Play, Pause,
  Filter, LayoutGrid, List as ListIcon, Loader2, GraduationCap, Brain,
  MapPin, Pencil, RotateCcw, Lock, CheckCircle2, History, Trash2,
  Image as ImageIcon, Upload, RotateCw, Sparkles,
  Briefcase, Activity, HeartPulse, DollarSign, TrendingUp, Dumbbell, Moon, Trophy, ShieldCheck, Wallet, Award,
} from "lucide-react";

const THEME = {
  ink: "#182234",
  inkSoft: "#3C4A66",
  paper: "#F4F2EC",
  paperDeep: "#EBE8DF",
  line: "#DAD5C8",
  brass: "#B8862E",
  brassSoft: "#EADFC4",
};

const TEST_BLUE = "#3B82F6";

const STATUS_COLOR = {
  completed: { bg: "bg-green-500", text: "text-green-700", ring: "ring-green-200", soft: "bg-green-50", label: "Done" },
  in_progress: { bg: "bg-orange-500", text: "text-orange-700", ring: "ring-orange-200", soft: "bg-orange-50", label: "In progress" },
  overdue: { bg: "bg-red-500", text: "text-red-700", ring: "ring-red-200", soft: "bg-red-50", label: "Overdue" },
  upcoming: { bg: "bg-yellow-500", text: "text-yellow-700", ring: "ring-yellow-200", soft: "bg-yellow-50", label: "Upcoming" },
};

// Course subjects, from Travis's Lyford Cay International School timetable
const SUBJECTS = [
  "Marine Science SL",
  "Mathematics: Applications and Interpretation",
  "Spanish",
  "Business Management",
  "Geography",
  "English",
  "Theory of Knowledge",
];

const ROTATION_DAY_NUMS = [1, 2, 3, 4, 5, 6, 7, 8];

// Fixed 8-day rotation timetable, transcribed from the uploaded PDF (Aug 2026 - Jun 2027)
const TIMETABLE = {
  1: [
    { period: 1, start: "08:00", end: "09:10", subject: "Marine Science SL", teacher: "Delreco Bonaby", room: "121" },
    { period: 2, start: "09:15", end: "10:25", subject: "Mathematics: Applications and Interpretation", teacher: "Mike Mubiru", room: "122" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Business Management", teacher: "Joseph Finnin", room: "222" },
    { period: 5, start: "12:00", end: "12:35", subject: "Business Management", teacher: "Joseph Finnin", room: "222" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "English", teacher: "Liza Bethel", room: "221" },
  ],
  2: [
    { period: 1, start: "08:00", end: "09:10", subject: "Marine Science SL", teacher: "Delreco Bonaby", room: "110" },
    { period: 2, start: "09:15", end: "10:25", subject: "Spanish", teacher: "Rosio Pinto" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Geography", teacher: "Joshua Purcell", room: "103" },
    { period: 5, start: "12:00", end: "12:35", subject: "English", teacher: "Liza Bethel", room: "221" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "Business Management", teacher: "Joseph Finnin", room: "222" },
  ],
  3: [
    { period: 1, start: "08:00", end: "09:10", subject: "Theory of Knowledge", teacher: "Avinash Kashyap", room: "211" },
    { period: 2, start: "09:15", end: "10:25", subject: "Business Management", teacher: "Joseph Finnin", room: "222" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Geography", teacher: "Joshua Purcell", room: "103" },
    { period: 5, start: "12:00", end: "12:35", subject: "Mathematics: Applications and Interpretation", teacher: "Mike Mubiru", room: "122" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "English", teacher: "Liza Bethel", room: "221" },
  ],
  4: [
    { period: 1, start: "08:00", end: "09:10", subject: "English", teacher: "Liza Bethel", room: "221" },
    { period: 2, start: "09:15", end: "10:25", subject: "Mathematics: Applications and Interpretation", teacher: "Mike Mubiru", room: "122" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Spanish", teacher: "Rosio Pinto" },
    { period: 5, start: "12:00", end: "12:35", subject: "Spanish", teacher: "Rosio Pinto" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "Marine Science SL", teacher: "Delreco Bonaby", room: "121" },
  ],
  5: [
    { period: 1, start: "08:00", end: "09:10", subject: "Business Management", teacher: "Joseph Finnin", room: "222" },
    { period: 2, start: "09:15", end: "10:25", subject: "Theory of Knowledge", teacher: "Avinash Kashyap", room: "211" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Geography", teacher: "Joshua Purcell", room: "103" },
    { period: 5, start: "12:00", end: "12:35", subject: "Open Time", teacher: "Graham Garde", room: "110" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "Marine Science SL", teacher: "Delreco Bonaby", room: "121" },
  ],
  6: [
    { period: 1, start: "08:00", end: "09:10", subject: "Spanish", teacher: "Rosio Pinto" },
    { period: 2, start: "09:15", end: "10:25", subject: "English", teacher: "Liza Bethel", room: "221" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Geography", teacher: "Joshua Purcell", room: "103" },
    { period: 5, start: "12:00", end: "12:35", subject: "Marine Science SL", teacher: "Delreco Bonaby", room: "110" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "Mathematics: Applications and Interpretation", teacher: "Mike Mubiru", room: "122" },
  ],
  7: [
    { period: 1, start: "08:00", end: "09:10", subject: "Spanish", teacher: "Rosio Pinto" },
    { period: 2, start: "09:15", end: "10:25", subject: "Mathematics: Applications and Interpretation", teacher: "Mike Mubiru", room: "122" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Marine Science SL", teacher: "Delreco Bonaby", room: "110" },
    { period: 5, start: "12:00", end: "12:35", subject: "Marine Science SL", teacher: "Delreco Bonaby", room: "110" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "Business Management", teacher: "Joseph Finnin", room: "222" },
  ],
  8: [
    { period: 1, start: "08:00", end: "09:10", subject: "Mathematics: Applications and Interpretation", teacher: "Mike Mubiru", room: "122" },
    { period: 2, start: "09:15", end: "10:25", subject: "Spanish", teacher: "Rosio Pinto" },
    { period: "R", start: "10:25", end: "10:45", subject: "Recess" },
    { period: 4, start: "10:45", end: "11:55", subject: "Geography", teacher: "Joshua Purcell", room: "103" },
    { period: 5, start: "12:00", end: "12:35", subject: "Geography", teacher: "Joshua Purcell", room: "103" },
    { period: "L", start: "12:40", end: "13:20", subject: "Lunch" },
    { period: 7, start: "13:20", end: "13:50", subject: "E+G" },
    { period: 8, start: "13:55", end: "15:05", subject: "English", teacher: "Liza Bethel", room: "221" },
  ],
};

const NON_CLASS_LABELS = ["Recess", "Lunch", "E+G", "Open Time"];

// Fields that count as "content" a student can manually lock against Gmail sync
const ASSIGNMENT_OVERRIDABLE = ["title", "due_date", "due_time", "priority", "status", "description"];
const TEST_OVERRIDABLE = ["title", "date", "time", "location", "topics", "description", "priority", "assessment_type"];

const ASSESSMENT_TYPE_META = {
  formative: { emoji: "🔵", label: "FORMATIVE", color: "#3B82F6" },
  summative: { emoji: "🟣", label: "SUMMATIVE", color: "#8B5CF6" },
};

function uid(prefix = "a") {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Shared modal-close safety net: Escape key always closes, regardless of what else is going on.
function useEscapeToClose(onClose) {
  useEffect(() => {
    function handler(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
}

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fmtDue(dateStr, timeStr) {
  if (!dateStr) return "No date";
  const d = new Date(dateStr + "T" + (timeStr || "23:59") + ":00");
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startDue - startToday) / 86400000);
  const timeLabel = timeStr ? formatTime(timeStr) : "";
  if (diffDays === 0) return "Today" + (timeLabel ? ", " + timeLabel : "");
  if (diffDays === 1) return "Tomorrow" + (timeLabel ? ", " + timeLabel : "");
  if (diffDays < 0) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " (overdue)";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" }) + (timeLabel ? ", " + timeLabel : "");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function hoursRemaining(dateStr, timeStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T" + (timeStr || "23:59") + ":00");
  return (d - new Date()) / 3600000;
}

function daysUntil(dateStr, timeStr) {
  const hrs = hoursRemaining(dateStr, timeStr);
  if (hrs === null) return null;
  return hrs / 24;
}

function computeDerivedStatus(a) {
  if (a.status === "completed") return "completed";
  if (a.status === "in_progress") return "in_progress";
  const hrs = hoursRemaining(a.due_date, a.due_time);
  if (a.due_date && hrs !== null && hrs < 0) return "overdue";
  return "upcoming";
}

function priorityRank(a) {
  const hrs = hoursRemaining(a.due_date, a.due_time);
  const overdue = hrs !== null && hrs < 0;
  const statusW = a.status === "completed" ? 999 : a.status === "in_progress" ? -1 : 0;
  const priorityW = { urgent: -3, high: -2, medium: -1, low: 0 }[a.priority || "medium"] || 0;
  const dueW = a.due_date ? hrs : 999999;
  return (overdue ? -10000 : 0) + statusW * 100 + dueW + priorityW * 10;
}

async function callClaude() {
  const message = "Use the sector assistant to continue with ChatGPT. Gmail and Calendar sync now runs through your connected ChatGPT plugins.";
  window.dispatchEvent(new CustomEvent("tusk-notice", {detail: message}));
  throw new Error(message);
}

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const objStart = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  let s = objStart;
  if (s === -1 || (arrStart !== -1 && arrStart < s)) s = arrStart;
  if (s === -1) return null;
  for (let e = cleaned.length; e > s; e--) {
    try {
      return JSON.parse(cleaned.slice(s, e));
    } catch (err) { /* keep shrinking */ }
  }
  return null;
}

// Best-effort salvage of whatever complete "items" objects exist in a truncated/malformed response
function extractPartialItems(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "");
  const idx = cleaned.indexOf('"items"');
  if (idx === -1) return [];
  const arrStart = cleaned.indexOf("[", idx);
  if (arrStart === -1) return [];
  let depth = 0, objStart = -1;
  const items = [];
  for (let i = arrStart; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "{") { if (depth === 0) objStart = i; depth++; }
    else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try { items.push(JSON.parse(cleaned.slice(objStart, i + 1))); } catch (e) { /* skip broken fragment */ }
        objStart = -1;
      }
    } else if (ch === "]" && depth === 0) break;
  }
  return items;
}

function extractNumberField(text, field) {
  const m = text.match(new RegExp('"' + field + '"\\s*:\\s*(\\d+)'));
  return m ? Number(m[1]) : null;
}

// Scans MCP tool results for signs that Gmail/Calendar tool calls themselves failed
// (auth expired, permission revoked, etc.) even when the overall API call succeeded.
function detectMcpError(mcpResults) {
  for (const r of mcpResults || []) {
    const t = (r.content && r.content[0] && r.content[0].text) || "";
    if (/unauthor|invalid_grant|re-?authenticate|401|token.*expired|permission.*(denied|revoked)|403|forbidden|access.*denied/i.test(t)) {
      return t.slice(0, 300);
    }
  }
  return null;
}

// Turns a raw error/message into a human-readable category with what/why/what-to-do copy.
function classifySyncError(raw) {
  const msg = typeof raw === "string" ? raw : (raw && raw.message) || String(raw);
  const rules = [
    {
      test: /unauthor|invalid_grant|token.*expired|401|re-?authenticate/i,
      category: "auth", icon: "🔐", title: "Gmail connection expired",
      reason: "Your Gmail authorization is no longer valid.",
      meaning: "Tusk couldn't access your Gmail account to search for new assignments and tests.",
      action: "Reconnect your Gmail account and try again.",
    },
    {
      test: /permission.*(denied|revoked)|403|forbidden|scope|access.*denied/i,
      category: "access", icon: "📧", title: "Gmail access denied",
      reason: "A required Gmail permission is missing or was revoked.",
      meaning: "Tusk doesn't currently have permission to search your inbox for schoolwork emails.",
      action: "Reconnect Gmail and make sure the requested permissions are granted.",
    },
    {
      test: /calendar/i,
      category: "calendar", icon: "📅", title: "Google Calendar connection failed",
      reason: "Tusk could not reach Google Calendar, or a calendar event couldn't be created or updated.",
      meaning: "Any schoolwork found in Gmail may not have a calendar event yet.",
      action: "Try again — if it keeps happening, check your Calendar connection.",
    },
    {
      test: /timeout|timed out|abort/i,
      category: "connection", icon: "🌐", title: "Request timed out",
      reason: "Gmail took too long to respond.",
      meaning: "The sync stopped before it could finish scanning your inbox.",
      action: "Try again — this is usually temporary.",
    },
    {
      test: /network|fetch failed|failed to fetch|offline|ENOTFOUND|ECONNREFUSED|no internet/i,
      category: "connection", icon: "🌐", title: "Couldn't reach Gmail",
      reason: "There was a network problem connecting to Gmail.",
      meaning: "This is usually a temporary connectivity issue on one end or the other.",
      action: "Check your internet connection and try again.",
    },
    {
      test: /50\d|server error|temporarily unavailable|overloaded/i,
      category: "connection", icon: "🌐", title: "Temporary server error",
      reason: "Gmail's or Claude's servers had a temporary issue.",
      meaning: "This isn't something wrong with your account or your edits.",
      action: "Wait a moment and try again.",
    },
    {
      test: /parse|json|extraction|could not parse|incomplete|unreadable/i,
      category: "ai", icon: "🤖", title: "Email information was incomplete or unreadable",
      reason: "The AI couldn't reliably extract schoolwork details from what it found.",
      meaning: "Some emails may not have been processed this time.",
      action: "Try again — you can always add anything it missed manually.",
    },
  ];
  const match = rules.find((r) => r.test.test(msg));
  const base = match || {
    category: "system", icon: "⚙️", title: "Unexpected sync error",
    reason: "Something went wrong during the sync process.",
    meaning: "The sync stopped before it could finish.",
    action: "Try again. If this keeps happening, it may be worth reporting.",
  };
  return { ...base, technical: msg };
}

const GMAIL_MCP = { type: "url", url: "https://gmailmcp.googleapis.com/mcp/v1", name: "gmail" };
const CAL_MCP = { type: "url", url: "https://calendarmcp.googleapis.com/mcp/v1", name: "google-calendar" };

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const [prefix, data] = r.result.split(",");
      const mediaType = (prefix.match(/data:(.*);base64/) || [])[1] || file.type || "image/png";
      resolve({ base64: data, mediaType, dataUrl: r.result });
    };
    r.onerror = () => reject(new Error("Could not read image"));
    r.readAsDataURL(file);
  });
}

const ASSIGNMENT_SHOT_FIELDS = ["title", "subject", "teacher", "description", "due_date", "due_time", "priority", "estimated_minutes", "submission_info", "instructions", "links"];
const TEST_SHOT_FIELDS = ["title", "subject", "teacher", "description", "date", "time", "location", "topics", "priority", "assessment_type", "instructions", "links"];

const ASSESSMENT_TYPE_GUIDANCE =
  'For assessment_type, decide whether this is "formative" (checking understanding and progress during learning — e.g. a class quiz, practice test, topic check, short assessment, in-class knowledge check) ' +
  'or "summative" (evaluating learning after a unit/topic/period of instruction — e.g. a unit test, end-of-unit exam, final assessment, major graded test, end-of-term exam). ' +
  'The value must be exactly "formative" or "summative". If you cannot confidently tell which one it is from the wording, still give your best guess as the value but set confidence to "medium" or "low" and explain your uncertainty in the note so the student can confirm it themselves. ';

async function analyzeScreenshots(screenshots, kind, subjects) {
  const fields = kind === "test" ? TEST_SHOT_FIELDS : ASSIGNMENT_SHOT_FIELDS;
  const shape = {};
  fields.forEach((f) => { shape[f] = { value: f === "topics" || f === "links" ? [] : "", confidence: "low", note: "" }; });
  const content = [
    ...screenshots.map((s) => ({ type: "image", source: { type: "base64", media_type: s.mediaType, data: s.base64 } })),
    {
      type: "text",
      text:
        `These are one or more screenshots of a ManageBac page, assignment/test announcement, email, or school portal, describing a ${kind === "test" ? "test/quiz/exam" : "homework assignment or project"}. ` +
        `Use OCR and image understanding to extract: ${fields.join(", ")}. My known subjects are: ${subjects.join(", ")} — match to one of these if it's clearly the same course, otherwise use what's written. ` +
        (kind === "test" ? ASSESSMENT_TYPE_GUIDANCE : "") +
        "For every field, report your confidence: \"high\" if clearly and unambiguously shown, \"medium\" if you found something but it's partially unclear, cut off, or you had to interpret it, \"low\" if you could not find it at all in the screenshots. " +
        "Never guess silently — if something is ambiguous, use \"medium\" or \"low\" confidence and briefly explain why in the note field (e.g. \"date is partially cut off, appears to be Sept 22\"). " +
        "If multiple screenshots were provided, combine information from all of them into one set of answers. " +
        "Respond with ONLY this JSON, no other text, no markdown fences: " +
        `{"fields":${JSON.stringify(shape)}}`,
    },
  ];
  const { text } = await callClaude({ messages: [{ role: "user", content }], maxTokens: 900 });
  const parsed = extractJson(text);
  if (!parsed || !parsed.fields) throw new Error("Could not read the screenshot(s) — try re-analyzing or enter the details manually.");
  return parsed.fields;
}

// ---------- Manual-override merge helpers ----------
// Applies a user edit: any content field the student touches gets locked against future sync overwrites.
function applyManualEdit(existing, patch, overridableFields) {
  const overrides = { ...(existing.manual_overrides || {}) };
  let touched = false;
  Object.keys(patch).forEach((k) => {
    if (overridableFields.includes(k) && JSON.stringify(existing[k] ?? "") !== JSON.stringify(patch[k] ?? "")) {
      overrides[k] = true;
      touched = true;
    }
  });
  return {
    ...existing,
    ...patch,
    manual_overrides: overrides,
    manually_modified: touched ? true : existing.manually_modified || false,
    updated_at: new Date().toISOString(),
  };
}

// Merges a freshly-synced record into an existing one, skipping any field the student has locked.
function applySyncedUpdate(existing, incoming, overridableFields) {
  const overrides = existing.manual_overrides || {};
  const patch = {};
  overridableFields.forEach((k) => {
    if (incoming[k] !== undefined && incoming[k] !== null && incoming[k] !== "" && !overrides[k]) {
      patch[k] = incoming[k];
    }
  });
  const snapshot = { ...(existing.synced_snapshot || {}) };
  overridableFields.forEach((k) => {
    if (incoming[k] !== undefined && incoming[k] !== null && incoming[k] !== "") snapshot[k] = incoming[k];
  });
  const changed = Object.keys(patch).length > 0;
  return { next: { ...existing, ...patch, synced_snapshot: snapshot, updated_at: new Date().toISOString() }, changed };
}

function resetToSynced(item, overridableFields) {
  const snap = item.synced_snapshot || {};
  const overrides = { ...(item.manual_overrides || {}) };
  const patch = {};
  overridableFields.forEach((k) => {
    if (snap[k] !== undefined) {
      patch[k] = snap[k];
      overrides[k] = false;
    }
  });
  const stillModified = Object.values(overrides).some(Boolean);
  return { ...item, ...patch, manual_overrides: overrides, manually_modified: stillModified, updated_at: new Date().toISOString() };
}

function SchoolSector({ onBack }) {
  const [ready, setReady] = useState(false);
  const [studentName, setStudentName] = useState("Travis");
  const [timezone, setTimezone] = useState("America/Nassau");
  const [subjects] = useState(SUBJECTS);
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [rotationDays, setRotationDays] = useState([]); // [{date:'YYYY-MM-DD', day:1}]
  const [view, setView] = useState("dashboard");
  const [assignmentsSubView, setAssignmentsSubView] = useState("list");
  const [filters, setFilters] = useState({ subject: "all", status: "all", priority: "all" });
  const [testTypeFilter, setTestTypeFilter] = useState("all"); // all | formative | summative
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | success | partial | error
  const syncing = syncState === "syncing";
  const [syncError, setSyncError] = useState(null);
  const [syncErrorInfo, setSyncErrorInfo] = useState(null); // classified error for the modal
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [pendingReview, setPendingReview] = useState([]); // [{tempId, type, needs_review, data}]
  const [lastSyncResults, setLastSyncResults] = useState(null); // {emails_scanned, ignored_count, already_count, updated, addedIds}
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState(null);
  const [chat, setChat] = useState([
    { role: "assistant", content: "Hi! Ask me things like \"what's due tomorrow?\" or \"what should I work on first?\"" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const dataLoaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("tusk-data");
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setStudentName(parsed.studentName || "Travis");
          setTimezone(parsed.timezone || "America/Nassau");
          setAssignments(parsed.assignments || []);
          setTests(parsed.tests || []);
          setAutomationLogs(parsed.automationLogs || []);
          setRotationDays(parsed.rotationDays || []);
          setPendingReview(parsed.pendingReview || []);
          setLastSyncResults(parsed.lastSyncResults || null);
        }
      } catch (e) { /* first run, nothing stored yet */ }
      dataLoaded.current = true;
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!dataLoaded.current) return;
    const payload = JSON.stringify({ studentName, timezone, assignments, tests, automationLogs, rotationDays, pendingReview, lastSyncResults });
    storage.set("tusk-data", payload).catch(() => {});
  }, [studentName, timezone, assignments, tests, automationLogs, rotationDays, pendingReview, lastSyncResults]);

  // ---------- Assignment actions ----------
  function updateAssignment(id, patch) {
    setAssignments((prev) => prev.map((a) => (a.id === id ? applyManualEdit(a, patch, ASSIGNMENT_OVERRIDABLE) : a)));
  }
  function deleteAssignment(id) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }
  function addAssignment(a) {
    const assignment = {
      id: uid(), source: "manual", status: "upcoming", priority: "medium", progress_percentage: 0,
      manually_modified: true, manual_overrides: {}, synced_snapshot: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...a,
    };
    setAssignments((prev) => [...prev, assignment]);
    if (assignment.due_date) syncAssignmentCalendarEvent(assignment);
  }
  function resetAssignmentToEmail(id) {
    setAssignments((prev) => prev.map((a) => (a.id === id ? resetToSynced(a, ASSIGNMENT_OVERRIDABLE) : a)));
  }

  // ---------- Test actions ----------
  function addTest(t) {
    const test = {
      id: uid("t"), source: "manual", priority: "medium", assessment_type: null,
      manually_modified: true, manual_overrides: {}, synced_snapshot: null,
      calendar_event_id: null, questionLog: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...t,
    };
    setTests((prev) => [...prev, test]);
    if (test.date) syncTestCalendarEvent(test);
  }
  function updateTest(id, patch) {
    setTests((prev) => prev.map((t) => (t.id === id ? applyManualEdit(t, patch, TEST_OVERRIDABLE) : t)));
  }
  function deleteTest(id) {
    setTests((prev) => prev.filter((t) => t.id !== id));
  }
  function resetTestToEmail(id) {
    setTests((prev) => prev.map((t) => (t.id === id ? resetToSynced(t, TEST_OVERRIDABLE) : t)));
  }
  function recordQuestionResult(testId, entry) {
    setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, questionLog: [...(t.questionLog || []), entry] } : t)));
  }

  async function syncTestCalendarEvent(test) {
    setTests(prev=>prev.map(t=>t.id===test.id?{...t,calendar_sync_error:"Saved in Tusk. Google Calendar connection is required; open School sync for calendar import."}:t));
  }

  // ---------- Assignment calendar sync (mirrors the test version) ----------
  async function syncAssignmentCalendarEvent(a) {
    setAssignments(prev=>prev.map(x=>x.id===a.id?{...x,calendar_sync_error:"Saved in Tusk. Google Calendar connection is required; open School sync for calendar import."}:x));
  }


  function buildCandidatesAndUpdates(items, kind) {
    const existingList = kind === "test" ? tests : assignments;
    const overridable = kind === "test" ? TEST_OVERRIDABLE : ASSIGNMENT_OVERRIDABLE;
    const newOnes = [];
    const updates = [];
    let alreadyCount = 0;
    items.forEach((f) => {
      if (!f.title) return;
      const idx = existingList.findIndex(
        (x) =>
          (f.source_message_id && x.source_message_id === f.source_message_id) ||
          (x.title?.toLowerCase() === f.title?.toLowerCase() && (x.subject || "").toLowerCase() === (f.subject || "").toLowerCase())
      );
      if (idx >= 0) {
        const existing = existingList[idx];
        const incoming =
          kind === "test"
            ? { title: f.title, subject: f.subject, teacher: f.teacher, date: f.due_date, time: f.due_time, description: f.description, priority: f.priority, topics: f.topics || [], assessment_type: f.assessment_type }
            : { title: f.title, subject: f.subject, teacher: f.teacher, due_date: f.due_date, due_time: f.due_time, description: f.description, priority: f.priority };
        const overrides = existing.manual_overrides || {};
        const changes = [];
        overridable.forEach((field) => {
          const newVal = incoming[field];
          if (newVal === undefined || newVal === null || newVal === "") return;
          if (Array.isArray(newVal) && newVal.length === 0) return;
          if (overrides[field]) return; // locked by a manual edit — never overwrite
          const oldVal = existing[field];
          const same = Array.isArray(newVal) ? JSON.stringify(newVal) === JSON.stringify(oldVal) : newVal === oldVal;
          if (!same) changes.push({ field, from: oldVal, to: newVal });
        });
        if (changes.length > 0) updates.push({ id: existing.id, kind, title: existing.title, subject: existing.subject, changes, incoming });
        else alreadyCount++;
      } else {
        newOnes.push({ tempId: uid("cand"), type: kind, needs_review: !!f.needs_review, data: f });
      }
    });
    return { newOnes, updates, alreadyCount };
  }

  function applyUpdates(updates, kind) {
    if (updates.length === 0) return;
    const overridable = kind === "test" ? TEST_OVERRIDABLE : ASSIGNMENT_OVERRIDABLE;
    const setFn = kind === "test" ? setTests : setAssignments;
    const existingList = kind === "test" ? tests : assignments;
    setFn((prev) =>
      prev.map((item) => {
        const u = updates.find((x) => x.id === item.id);
        if (!u) return item;
        const { next } = applySyncedUpdate(item, u.incoming, overridable);
        return next;
      })
    );
    const dateField = kind === "test" ? "date" : "due_date";
    const timeField = kind === "test" ? "time" : "due_time";
    updates.forEach((u) => {
      if (u.changes.some((c) => c.field === dateField || c.field === timeField)) {
        const existingItem = existingList.find((x) => x.id === u.id) || {};
        const merged = { ...existingItem, ...u.incoming };
        if (kind === "test") syncTestCalendarEvent(merged);
        else syncAssignmentCalendarEvent(merged);
      }
    });
  }

  function confirmAddCandidate(candidate) {
    const data = candidate.data;
    if (candidate.type === "test") {
      const test = {
        id: uid("t"), title: data.title, subject: data.subject || "General", teacher: data.teacher || "",
        date: data.due_date || data.date || "", time: data.due_time || data.time || "", location: data.location || "",
        topics: data.topics || [], description: data.description || "", priority: data.priority || "medium",
        assessment_type: data.assessment_type === "formative" || data.assessment_type === "summative" ? data.assessment_type : null,
        reminder: "1 day before", study_plan: data.study_plan || "", source: "gmail", source_message_id: data.source_message_id || null,
        calendar_event_id: null, manually_modified: false, manual_overrides: {},
        synced_snapshot: { title: data.title, date: data.due_date || data.date, time: data.due_time || data.time, description: data.description, priority: data.priority, topics: data.topics || [], assessment_type: data.assessment_type },
        questionLog: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      setTests((prev) => [...prev, test]);
      if (test.date) syncTestCalendarEvent(test);
    } else {
      const a = {
        id: uid(), title: data.title, subject: data.subject || "General", teacher: data.teacher || "", description: data.description || "",
        due_date: data.due_date || "", due_time: data.due_time || "", status: "upcoming", priority: data.priority || "medium", progress_percentage: 0,
        estimated_minutes: data.estimated_minutes || null, source: "gmail", source_message_id: data.source_message_id || null,
        source_url: data.managebac_link || data.assignment_url || null, submission_info: data.submission_info || "", instructions: data.instructions || "",
        calendar_event_id: null, manually_modified: false, manual_overrides: {},
        synced_snapshot: { title: data.title, due_date: data.due_date, due_time: data.due_time, priority: data.priority, description: data.description },
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      setAssignments((prev) => [...prev, a]);
      syncAssignmentCalendarEvent(a);
    }
    setPendingReview((prev) => prev.filter((c) => c.tempId !== candidate.tempId));
  }

  function ignoreCandidate(tempId) {
    setPendingReview((prev) => prev.filter((c) => c.tempId !== tempId));
  }
  function addAllCandidates(list) {
    list.forEach((c) => confirmAddCandidate(c));
  }
  function ignoreAllCandidates(list) {
    const ids = list.map((c) => c.tempId);
    setPendingReview((prev) => prev.filter((c) => !ids.includes(c.tempId)));
  }
  function saveEditedCandidate(tempId, formData) {
    setPendingReview((prev) => prev.map((c) => (c.tempId === tempId ? {
      ...c,
      data: {
        ...c.data,
        ...formData,
        ...(c.type === "test" ? { due_date: formData.date, due_time: formData.time } : {}),
      },
    } : c)));
    setEditingCandidate(null);
  }

  async function runSync() {openSync("school");}

  function handleReconnectGmail() {
    window.dispatchEvent(new CustomEvent("tusk-notice", {detail:"Gmail connection setup is not available in this version. You can still add assignments manually."}));
  }
  function handleRetrySync() {
    setSyncErrorInfo(null);
    runSync();
  }
  function handleCloseErrorModal() {
    setSyncErrorInfo(null);
    setSyncState("idle");
  }
  function handleViewResultsFromError() {
    setSyncErrorInfo(null);
    setView("syncResults");
  }
  function handleViewDetailsFromError() {
    setSyncErrorInfo(null);
    setShowSyncHistory(true);
  }

  const withDerived = assignments.map((a) => ({ ...a, derivedStatus: computeDerivedStatus(a) }));
  const dueToday = withDerived.filter((a) => a.due_date && fmtDue(a.due_date, a.due_time).startsWith("Today") && a.status !== "completed");
  const dueSoon = withDerived.filter((a) => {
    if (!a.due_date || a.status === "completed") return false;
    const hrs = hoursRemaining(a.due_date, a.due_time);
    return hrs !== null && hrs > 24 && hrs <= 72;
  });
  const inProgress = withDerived.filter((a) => a.status === "in_progress");
  const completedRecent = withDerived.filter((a) => a.status === "completed");
  const priorityList = withDerived.filter((a) => a.status !== "completed").sort((a, b) => priorityRank(a) - priorityRank(b)).slice(0, 5);
  const filteredAssignments = withDerived.filter((a) => {
    if (filters.subject !== "all" && a.subject !== filters.subject) return false;
    if (filters.status !== "all" && a.status !== filters.status) return false;
    if (filters.priority !== "all" && (a.priority || "medium") !== filters.priority) return false;
    return true;
  });
  const focusTask = withDerived.find((a) => a.id === focusTaskId && a.status !== "completed") || priorityList[0];

  const todayStr = localDateString();
  const todayRotation = rotationDays.find((r) => r.date === todayStr);
  const todayDayNumber = todayRotation ? todayRotation.day : null;
  const todayPeriods = todayDayNumber ? TIMETABLE[todayDayNumber] || [] : [];

  const upcomingTests = tests.filter((t) => t.date && t.date >= todayStr && (testTypeFilter === "all" || t.assessment_type === testTypeFilter)).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const nextTest = upcomingTests[0] || null;

  const resultsAdded = lastSyncResults ? pendingReview.filter((c) => lastSyncResults.addedIds.includes(c.tempId)) : [];
  const lastLog = automationLogs[0] || null;

  if (!ready) {
    return (
      <div style={{ background: THEME.paper }} className="w-full h-full min-h-[600px] flex items-center justify-center">
        <Loader2 className="animate-spin" color={THEME.inkSoft} size={28} />
      </div>
    );
  }

  return (
    <div style={{ background: THEME.paper, color: THEME.ink }} className="w-full min-h-[700px] flex text-sm relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .tusk-serif { font-family: 'Zilla Slab', Georgia, serif; }
        .tusk-sans { font-family: 'Inter', system-ui, sans-serif; }
        .tusk-hamburger { display: none; }
        .tusk-mobile-backdrop { display: none; }
        .tusk-sidebar { width: 220px; flex-shrink: 0; }
        @media (max-width: 820px) {
          .tusk-sidebar {
            position: fixed !important; top: 0; left: 0; height: 100%; width: 78% !important;
            max-width: 280px; z-index: 60; transform: translateX(-105%); transition: transform 0.2s ease;
          }
          .tusk-sidebar.tusk-open { transform: translateX(0); }
          .tusk-hamburger { display: flex !important; }
          .tusk-mobile-backdrop.tusk-open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 55; }
          .tusk-main { padding: 16px !important; }
        }
      `}</style>
      <div className={`tusk-mobile-backdrop ${mobileMenuOpen ? "tusk-open" : ""}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={mobileMenuOpen ? "tusk-sidebar tusk-open" : "tusk-sidebar"}>
        <Sidebar view={view} setView={(v) => { setView(v); setMobileMenuOpen(false); }} studentName={studentName} syncState={syncState} onSync={()=>openSync("school")} pendingCount={pendingReview.length} onBack={onBack} onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>
      <main className="tusk-main flex-1 min-h-0 tusk-sans p-8 overflow-y-auto" style={{ maxHeight: 800 }}>
        <button onClick={() => setMobileMenuOpen(true)} className="tusk-hamburger items-center gap-2 text-xs px-3 py-2 rounded-md border mb-4" style={{ borderColor: THEME.line }}>
          <LayoutGrid size={14} /> Menu
        </button>
        {syncError && (
          <div className="mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-red-700" style={{ background: "#FDECEC", border: "1px solid #F5C6C6" }}>
            <AlertCircle size={16} /> <span>{syncError}</span>
            <button onClick={() => setSyncError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
        {view === "dashboard" && (
          <Dashboard
            studentName={studentName} dueToday={dueToday} dueSoon={dueSoon} inProgress={inProgress} completedRecent={completedRecent}
            priorityList={priorityList} onStart={(id) => { updateAssignment(id, { status: "in_progress" }); setFocusTaskId(id); setView("focus"); }}
            onOpenFocus={(id) => { setFocusTaskId(id); setView("focus"); }} lastLog={lastLog} onSync={()=>openSync("school")} syncing={syncing}
            todayDayNumber={todayDayNumber} todayPeriods={todayPeriods} upcomingTests={upcomingTests}
            nextTest={nextTest} onRecordQuestion={recordQuestionResult} onGoToTests={() => setView("tests")}
            pendingCount={pendingReview.length} onReviewPending={() => setView("syncResults")}
            testTypeFilter={testTypeFilter} setTestTypeFilter={setTestTypeFilter}
          />
        )}
        {view === "assignments" && (
          <AssignmentsView
            assignments={filteredAssignments} subjects={subjects} filters={filters} setFilters={setFilters}
            subView={assignmentsSubView} setSubView={setAssignmentsSubView} onUpdate={updateAssignment} onDelete={deleteAssignment}
            onAdd={() => setShowAddModal(true)} onEdit={(a) => setEditAssignment(a)} onFocus={(id) => { setFocusTaskId(id); setView("focus"); }}
            onResetToEmail={resetAssignmentToEmail}
          />
        )}
        {view === "tests" && (
          <TestsView
            tests={tests} subjects={subjects} onAdd={() => setShowAddTestModal(true)} onEdit={(t) => setEditTest(t)}
            onDelete={deleteTest} onResetToEmail={resetTestToEmail} onResyncCalendar={()=>openSync("school")}
            onSetAssessmentType={(id, type) => updateTest(id, { assessment_type: type })}
            typeFilter={testTypeFilter} setTypeFilter={setTestTypeFilter}
          />
        )}
        {view === "syncResults" && (
          <SyncResultsView
            results={lastSyncResults}
            added={resultsAdded}
            onAdd={confirmAddCandidate}
            onEdit={(c) => setEditingCandidate(c)}
            onIgnore={ignoreCandidate}
            onAddAll={addAllCandidates}
            onIgnoreAll={ignoreAllCandidates}
            onGoDashboard={() => setView("dashboard")}
            onViewAdded={() => setView("assignments")}
          />
        )}
        {view === "calendar" && <CalendarView assignments={withDerived} tests={tests} rotationDays={rotationDays} typeFilter={testTypeFilter} setTypeFilter={setTestTypeFilter} />}
        {view === "focus" && (
          <FocusView key={focusTask?.id || "empty"} task={focusTask} assignments={priorityList} onSelect={setFocusTaskId}
            onComplete={(id) => updateAssignment(id, { status: "completed", completed_at: new Date().toISOString(), progress_percentage: 100 })}
          />
        )}
        {view === "progress" && <ProgressView assignments={withDerived} subjects={subjects} />}
        {view === "assistant" && <CoachPanel config={AI_PROFILES.school}/>}
        {view === "settings" && (
          <SettingsView studentName={studentName} setStudentName={setStudentName} timezone={timezone} setTimezone={setTimezone}
            automationLogs={automationLogs} onSync={()=>openSync("school")} syncing={syncing} todayDayNumber={todayDayNumber}
            onOpenHistory={() => setShowSyncHistory(true)} pendingCount={pendingReview.length} onReviewPending={() => setView("syncResults")}
          />
        )}
      </main>
      {showSyncHistory && <SyncHistoryModal logs={automationLogs} onClose={() => setShowSyncHistory(false)} />}
      {syncErrorInfo && (
        <SyncErrorModal
          info={syncErrorInfo}
          repeated={consecutiveFailures >= 2 && !syncErrorInfo.isPartial}
          onRetry={handleRetrySync}
          onClose={handleCloseErrorModal}
          onReconnect={handleReconnectGmail}
          onViewResults={handleViewResultsFromError}
          onViewDetails={handleViewDetailsFromError}
        />
      )}
      {editingCandidate && editingCandidate.type === "test" && (
        <AddTestModal subjects={subjects} initial={{ ...editingCandidate.data, date: editingCandidate.data.due_date || editingCandidate.data.date, time: editingCandidate.data.due_time || editingCandidate.data.time }} isEdit
          onClose={() => setEditingCandidate(null)} onSave={(formData) => saveEditedCandidate(editingCandidate.tempId, formData)} />
      )}
      {editingCandidate && editingCandidate.type !== "test" && (
        <AddAssignmentModal subjects={subjects} initial={editingCandidate.data} isEdit
          onClose={() => setEditingCandidate(null)} onSave={(formData) => saveEditedCandidate(editingCandidate.tempId, formData)} />
      )}
      {showAddModal && (
        <AddAssignmentModal
          subjects={subjects} existingItems={assignments}
          onClose={() => setShowAddModal(false)} onSave={(a) => { addAssignment(a); setShowAddModal(false); }}
          onUpdateExisting={(id, patch) => { updateAssignment(id, patch); setShowAddModal(false); }}
        />
      )}
      {editAssignment && (
        <AddAssignmentModal
          subjects={subjects} initial={editAssignment} isEdit
          onClose={() => setEditAssignment(null)}
          onSave={(patch) => { updateAssignment(editAssignment.id, patch); setEditAssignment(null); }}
        />
      )}
      {showAddTestModal && (
        <AddTestModal
          subjects={subjects} existingItems={tests}
          onClose={() => setShowAddTestModal(false)} onSave={(t) => { addTest(t); setShowAddTestModal(false); }}
          onUpdateExisting={(id, patch) => { updateTest(id, patch); setShowAddTestModal(false); }}
        />
      )}
      {editTest && (
        <AddTestModal
          subjects={subjects} initial={editTest} isEdit
          onClose={() => setEditTest(null)}
          onSave={(patch) => { updateTest(editTest.id, patch); setEditTest(null); }}
        />
      )}
    </div>
  );
}

function Sidebar({ view, setView, studentName, syncState, onSync, pendingCount, onBack, onCloseMobile }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "assignments", label: "Assignments", icon: BookOpen },
    { id: "tests", label: "Tests", icon: GraduationCap },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "focus", label: "Focus", icon: Target },
    { id: "progress", label: "Progress", icon: BarChart3 },
    { id: "assistant", label: "AI Assistant", icon: Bot },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];
  const syncBtn = {
    idle: { icon: RefreshCw, label: "Sync", bg: THEME.brass, fg: "#1a1200", spin: false },
    syncing: { icon: RefreshCw, label: "Syncing Gmail...", bg: THEME.brass, fg: "#1a1200", spin: true },
    success: { icon: CheckCircle2, label: "Sync Complete", bg: "#22C55E", fg: "white", spin: false },
    partial: { icon: AlertTriangle, label: "Sync Partially Complete", bg: "#F59E0B", fg: "white", spin: false },
    error: { icon: AlertTriangle, label: "Sync Failed", bg: "#EF4444", fg: "white", spin: false },
  }[syncState] || { icon: RefreshCw, label: "Sync", bg: THEME.brass, fg: "#1a1200", spin: false };
  const SyncIcon = syncBtn.icon;
  return (
    <aside style={{ background: THEME.ink, color: "#EDE9DD" }} className="tusk-sans flex-shrink-0 flex flex-col py-6 px-4 w-full h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1 text-xs px-1" style={{ color: "#9A957F" }}>
            <ChevronLeft size={12} /> Tusk Home
          </button>
        )}
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="tusk-hamburger items-center p-1"><X size={16} color="#9A957F" /></button>
        )}
      </div>
      <div className="flex items-center gap-2 px-2 mb-8">
        <div style={{ background: THEME.brass }} className="w-8 h-8 rounded flex items-center justify-center tusk-serif font-bold text-white">T</div>
        <span className="tusk-serif text-lg font-semibold tracking-tight">School</span>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button key={it.id} onClick={() => setView(it.id)} className="flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors relative"
              style={{ background: active ? "rgba(184,134,46,0.18)" : "transparent", color: active ? "#F3E4C2" : "#C9C4B4" }}>
              <Icon size={16} /><span>{it.label}</span>
              {it.id === "assignments" && pendingCount > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: THEME.brass, color: "#1a1200" }}>{pendingCount}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <button onClick={onSync} disabled={syncState === "syncing"} className="w-full flex items-center justify-center gap-2 rounded-md py-2 mb-4 font-medium" style={{ background: syncBtn.bg, color: syncBtn.fg }}>
          <SyncIcon size={14} className={syncBtn.spin ? "animate-spin" : ""} /> Sync School
        </button>
        <div className="text-xs px-1 space-y-1" style={{ color: "#9A957F" }}>
          <div className="flex items-center gap-2"><Mail size={12} /> Gmail not connected</div>
          <div className="flex items-center gap-2"><CalendarIcon size={12} /> Calendar not connected</div>
        </div>
        <div className="mt-4 text-xs px-1" style={{ color: "#7D7968" }}>{studentName}</div>
      </div>
    </aside>
  );
}

function SummaryCard({ label, value, dotClass }) {
  return (
    <div style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg px-4 py-3 flex-1 min-w-[120px]">
      <div className="flex items-center gap-2 mb-1">
        {dotClass && <span className={`w-2 h-2 rounded-full ${dotClass}`} />}
        <span className="text-xs uppercase tracking-wide" style={{ color: THEME.inkSoft }}>{label}</span>
      </div>
      <div className="tusk-serif text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ModifiedBadge() {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: THEME.brassSoft, color: "#5A4318" }}>
      <Pencil size={9} /> Edited
    </span>
  );
}

function AssignmentCard({ a, onUpdate, onDelete, onFocus, onEdit, onResetToEmail, compact }) {
  const sc = STATUS_COLOR[a.derivedStatus] || STATUS_COLOR.upcoming;
  const hrs = hoursRemaining(a.due_date, a.due_time);
  return (
    <div style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="tusk-serif font-semibold text-base leading-snug flex items-center gap-2">
            {a.title}
            {a.manually_modified && <ModifiedBadge />}
          </div>
          <div className="text-xs mt-0.5" style={{ color: THEME.inkSoft }}>{a.subject}{a.teacher ? ` · ${a.teacher}` : ""}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.soft} ${sc.text} flex items-center gap-1 flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.bg}`} />{sc.label}
        </span>
      </div>
      {a.description && !compact && <p className="text-xs mt-2 line-clamp-2" style={{ color: THEME.inkSoft }}>{a.description}</p>}
      <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: THEME.inkSoft }}>
        <span className="flex items-center gap-1"><Clock size={12} /> {fmtDue(a.due_date, a.due_time)}</span>
        {hrs !== null && hrs > 0 && hrs < 48 && <span>{Math.round(hrs)}h remaining</span>}
        {a.source === "gmail" && <span className="flex items-center gap-1"><Mail size={12} /> Gmail</span>}
        {a.source_url && <a href={a.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline"><LinkIcon size={12} /> Link</a>}
      </div>
      {!compact && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {a.status !== "completed" && a.status !== "in_progress" && (
            <button onClick={() => onUpdate(a.id, { status: "in_progress" })} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>Start working</button>
          )}
          {a.status === "in_progress" && (
            <button onClick={() => onFocus(a.id)} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>Continue working</button>
          )}
          {a.status !== "completed" && (
            <button onClick={() => onUpdate(a.id, { status: "completed", completed_at: new Date().toISOString(), progress_percentage: 100 })} className="text-xs px-3 py-1.5 rounded-md font-medium border flex items-center gap-1" style={{ borderColor: THEME.line }}>
              <Check size={12} /> Mark done
            </button>
          )}
          <button onClick={() => onEdit(a)} className="text-xs px-2 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: THEME.line }}><Pencil size={11} /> Edit</button>
          {a.source === "gmail" && a.manually_modified && (
            <button onClick={() => onResetToEmail(a.id)} className="text-xs px-2 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: THEME.line, color: THEME.inkSoft }}>
              <RotateCcw size={11} /> Reset to email info
            </button>
          )}
          <button onClick={() => onDelete(a.id)} className="text-xs px-2 py-1.5 rounded-md ml-auto" style={{ color: "#B04A4A" }}>Remove</button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ studentName, dueToday, dueSoon, inProgress, completedRecent, priorityList, onStart, onOpenFocus, lastLog, onSync, syncing, todayDayNumber, todayPeriods, upcomingTests, nextTest, onRecordQuestion, onGoToTests, pendingCount, onReviewPending, testTypeFilter, setTestTypeFilter }) {
  const today = new Date();
  const nowMin = today.getHours() * 60 + today.getMinutes();
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="tusk-serif text-3xl font-semibold">Good {greeting()}, {studentName}</h1>
          <div className="mt-1" style={{ color: THEME.inkSoft }}>{today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
        <button onClick={onSync} disabled={syncing} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line, color: THEME.ink }}>
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sync Gmail & Calendar"}
        </button>
      </div>

      <div className="mt-4 rounded-lg p-4" style={{ background: THEME.ink, color: "#EDE9DD" }}>
        {todayDayNumber ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="tusk-serif text-2xl font-semibold" style={{ color: THEME.brass }}>Day {todayDayNumber}</div>
              <div className="text-xs" style={{ color: "#B9B4A2" }}>of the 8-day rotation</div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {todayPeriods.map((p, i) => {
                const isBreak = NON_CLASS_LABELS.includes(p.subject);
                const startM = timeToMinutes(p.start), endM = timeToMinutes(p.end);
                const isNow = nowMin >= startM && nowMin < endM;
                const isPast = nowMin >= endM;
                return (
                  <div key={i} className="flex-shrink-0 rounded-md px-3 py-2 text-xs"
                    style={{
                      background: isNow ? THEME.brass : "rgba(255,255,255,0.06)",
                      color: isNow ? "#1a1200" : isPast ? "#7D7968" : "#EDE9DD",
                      minWidth: 130,
                    }}>
                    <div className="font-medium" style={{ opacity: isBreak ? 0.7 : 1 }}>{p.subject}</div>
                    <div style={{ opacity: 0.8 }}>{formatTime(p.start)}–{formatTime(p.end)}</div>
                    {!isBreak && p.room && <div style={{ opacity: 0.7 }}>{p.teacher} · Rm {p.room}</div>}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-xs" style={{ color: "#B9B4A2" }}>Sync Gmail &amp; Calendar to pull in today's rotation day.</div>
        )}
      </div>

      {nextTest && (
        <QuickTestPrep test={nextTest} onRecord={onRecordQuestion} onGoToTests={onGoToTests} />
      )}

      {pendingCount > 0 && (
        <button onClick={onReviewPending} className="mt-4 text-sm rounded-md px-3 py-2 flex items-center gap-2 w-full text-left" style={{ background: "#FEF3C7", color: "#92400E" }}>
          <AlertCircle size={14} /> {pendingCount} item{pendingCount > 1 ? "s" : ""} found from your last sync still need review — tap to look them over.
        </button>
      )}

      {dueToday.length > 0 && (
        <p className="mt-4 text-sm rounded-md px-3 py-2 inline-block" style={{ background: THEME.brassSoft, color: "#5A4318" }}>
          You have {dueToday.length} assignment{dueToday.length > 1 ? "s" : ""} due today. {priorityList[0] ? `Top priority: ${priorityList[0].title}.` : ""}
        </p>
      )}
      {lastLog && (
        <div className="mt-3 text-xs" style={{ color: THEME.inkSoft }}>
          Last sync: {lastLog.emails_scanned} emails scanned, {lastLog.new_assignments || 0} new assignments, {lastLog.new_tests || 0} new tests.
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 flex-wrap">
        <SummaryCard label="Due today" value={dueToday.length} dotClass="bg-red-500" />
        <SummaryCard label="Due soon" value={dueSoon.length} dotClass="bg-yellow-500" />
        <SummaryCard label="In progress" value={inProgress.length} dotClass="bg-orange-500" />
        <SummaryCard label="Completed" value={completedRecent.length} dotClass="bg-green-500" />
        <SummaryCard label="Upcoming tests" value={upcomingTests.length} dotClass="bg-blue-500" />
      </div>
      {setTestTypeFilter && (
        <div className="mt-3"><TypeFilterPills value={testTypeFilter} onChange={setTestTypeFilter} /></div>
      )}

      <div className="mt-8">
        <h2 className="tusk-serif text-lg font-semibold mb-3">What should I work on?</h2>
        {priorityList.length === 0 && <p className="text-sm" style={{ color: THEME.inkSoft }}>Nothing on your plate. Add an assignment or sync Gmail to pull in new ones.</p>}
        <div className="space-y-3">
          {priorityList.map((a, i) => {
            const sc = STATUS_COLOR[a.derivedStatus] || STATUS_COLOR.upcoming;
            return (
              <div key={a.id} style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg p-4 flex items-center gap-4">
                <span className={`w-2.5 h-2.5 rounded-full ${sc.bg} flex-shrink-0`} />
                <div className="flex-1">
                  <div className="tusk-serif font-semibold">{i + 1}. {a.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: THEME.inkSoft }}>{a.subject} · {fmtDue(a.due_date, a.due_time)}</div>
                </div>
                <button onClick={() => (a.status === "in_progress" ? onOpenFocus(a.id) : onStart(a.id))} className="text-xs px-3 py-1.5 rounded-md font-medium flex-shrink-0" style={{ background: THEME.ink, color: "white" }}>
                  {a.status === "in_progress" ? "Continue" : "Start working"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ---------- Quick Test Prep (adaptive quiz) ----------
function topicStats(test) {
  const stats = {};
  (test.topics || []).forEach((t) => { stats[t] = { asked: 0, correct: 0 }; });
  (test.questionLog || []).forEach((q) => {
    if (!stats[q.topic]) stats[q.topic] = { asked: 0, correct: 0 };
    if (q.correct !== null) {
      stats[q.topic].asked++;
      if (q.correct) stats[q.topic].correct++;
    }
  });
  return stats;
}

function QuickTestPrep({ test, onRecord, onGoToTests }) {
  const [question, setQuestion] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedFor = useRef(null);

  useEffect(() => {
    if (fetchedFor.current !== test.id) {
      fetchedFor.current = test.id;
      setQuestion(null);
      setRevealed(false);
      generate();
    }
    // eslint-disable-next-line
  }, [test.id]);

  async function generate() {
    if (!test.topics || test.topics.length === 0) {
      setError("Add topics to this test to enable quick prep questions.");
      return;
    }
    setLoading(true);
    setError(null);
    setRevealed(false);
    try {
      const stats = topicStats(test);
      const weighted = Object.entries(stats).map(([topic, s]) => ({
        topic, accuracy: s.asked > 0 ? s.correct / s.asked : null, asked: s.asked,
      }));
      const prevQs = (test.questionLog || []).slice(-8).map((q) => q.question);
      const dUntil = daysUntil(test.date, test.time);
      const { text } = await callClaude({
        maxTokens: 400,
        messages: [
          {
            role: "user",
            content:
              `Test: "${test.title}" (${test.subject}). Days until test: ${dUntil !== null ? Math.max(0, Math.round(dUntil)) : "unknown"}. ` +
              `Topics and performance so far (null accuracy = not yet tested): ${JSON.stringify(weighted)}. ` +
              `Test description for grounding: ${test.description || "none provided"}. ` +
              `Previous questions already asked (do not repeat these): ${JSON.stringify(prevQs)}. ` +
              "Pick ONE topic from the list above, favoring topics with low accuracy or that haven't been asked yet. " +
              "Write one short, specific quiz question about that topic and its correct answer. Ground it only in the topic name and the test description — do not invent facts, dates, or details not implied by them. " +
              'Respond with ONLY this JSON, no other text: {"topic":"","question":"","answer":""}',
          },
        ],
      });
      const parsed = extractJson(text);
      if (!parsed || !parsed.question) throw new Error("bad response");
      setQuestion(parsed);
    } catch (e) {
      setError("Couldn't generate a question right now.");
    } finally {
      setLoading(false);
    }
  }

  function answer(correct) {
    onRecord(test.id, { id: uid("q"), topic: question.topic, question: question.question, answer: question.answer, correct, asked_at: new Date().toISOString() });
  }

  const dUntil = daysUntil(test.date, test.time);
  const whenLabel = dUntil === null ? "" : dUntil < 1 ? "today" : dUntil < 2 ? "tomorrow" : `in ${Math.round(dUntil)} days`;

  return (
    <div className="mt-4 rounded-lg p-4" style={{ background: "#EFF6FF", border: `1px solid #BFDBFE` }}>
      <div className="flex items-center gap-2 mb-2">
        <Brain size={16} color={TEST_BLUE} />
        <span className="tusk-serif font-semibold" style={{ color: "#1E3A8A" }}>Quick test prep</span>
        <span className="text-xs" style={{ color: "#3B5A9A" }}>{test.subject} Test {test.title ? `— ${test.title}` : ""} · {whenLabel}</span>
        <button onClick={onGoToTests} className="ml-auto text-xs underline" style={{ color: "#3B5A9A" }}>View tests</button>
      </div>
      {error && <p className="text-xs" style={{ color: "#3B5A9A" }}>{error}</p>}
      {loading && <p className="text-xs" style={{ color: "#3B5A9A" }}>Thinking of a question…</p>}
      {!loading && question && (
        <div className="rounded-md bg-white p-3">
          <div className="text-xs mb-1 font-medium" style={{ color: TEST_BLUE }}>{question.topic}</div>
          <div className="text-sm mb-2">{question.question}</div>
          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="text-xs px-3 py-1.5 rounded-md font-medium text-white" style={{ background: TEST_BLUE }}>Reveal answer</button>
          ) : (
            <>
              <div className="text-sm mb-2 p-2 rounded" style={{ background: "#EFF6FF" }}><b>Answer:</b> {question.answer}</div>
              <div className="text-xs mb-1">Did you get it right?</div>
              <div className="flex gap-2">
                <button onClick={() => answer(true)} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: "#22C55E", color: "white" }}>✓ Yes</button>
                <button onClick={() => answer(false)} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: "#EF4444", color: "white" }}>✗ No</button>
              </div>
            </>
          )}
        </div>
      )}
      {!loading && !question && !error && (
        <button onClick={generate} className="text-xs px-3 py-1.5 rounded-md font-medium text-white" style={{ background: TEST_BLUE }}>Get a question</button>
      )}
      {revealed === false && question && null}
      {question && (
        <button onClick={generate} className="mt-2 text-xs underline" style={{ color: "#3B5A9A" }}>Skip / next question</button>
      )}
    </div>
  );
}

// ---------- Tests view ----------
function AssessmentTypeBadge({ type }) {
  if (!type || !ASSESSMENT_TYPE_META[type]) return null;
  const m = ASSESSMENT_TYPE_META[type];
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 flex-shrink-0" style={{ background: m.color, color: "white" }}>
      {m.emoji} {m.label}
    </span>
  );
}

function TestCard({ t, onEdit, onDelete, onResetToEmail, onResyncCalendar, onSetAssessmentType }) {
  const dUntil = daysUntil(t.date, t.time);
  const whenLabel = t.date ? fmtDue(t.date, t.time) : "No date set";
  return (
    <div className="rounded-lg p-4" style={{ background: "white", border: `1px solid #BFDBFE` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {t.assessment_type ? <AssessmentTypeBadge type={t.assessment_type} /> : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: "#FEF3C7", color: "#92400E" }}>⚠️ Needs Review</span>
            )}
          </div>
          <div className="tusk-serif font-semibold text-base leading-snug flex items-center gap-2">
            {t.title} {t.manually_modified && <ModifiedBadge />}
          </div>
          <div className="text-xs mt-0.5" style={{ color: THEME.inkSoft }}>{t.subject}{t.teacher ? ` · ${t.teacher}` : ""}</div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0" style={{ background: "#DBEAFE", color: "#1E40AF" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: TEST_BLUE }} /> Test
        </span>
      </div>
      {!t.assessment_type && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px]" style={{ color: THEME.inkSoft }}>Select assessment type:</span>
          <button onClick={() => onSetAssessmentType(t.id, "formative")} className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: ASSESSMENT_TYPE_META.formative.color, color: "white" }}>🔵 Formative</button>
          <button onClick={() => onSetAssessmentType(t.id, "summative")} className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ background: ASSESSMENT_TYPE_META.summative.color, color: "white" }}>🟣 Summative</button>
        </div>
      )}
      <div className="flex items-center gap-3 mt-3 text-xs flex-wrap" style={{ color: THEME.inkSoft }}>
        <span className="flex items-center gap-1"><Clock size={12} /> {whenLabel}</span>
        {t.location && <span className="flex items-center gap-1"><MapPin size={12} /> {t.location}</span>}
        {t.source === "gmail" && <span className="flex items-center gap-1"><Mail size={12} /> Gmail</span>}
      </div>
      {t.topics && t.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {t.topics.map((top, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#1E40AF" }}>{top}</span>)}
        </div>
      )}
      {t.description && <p className="text-xs mt-2" style={{ color: THEME.inkSoft }}>{t.description}</p>}
      {t.study_plan && <p className="text-xs mt-2 italic" style={{ color: THEME.inkSoft }}>Study plan: {t.study_plan}</p>}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {t.calendar_event_id ? (
          <span className="text-xs flex items-center gap-1" style={{ color: "#1E7A34" }}><Check size={12} /> On calendar</span>
        ) : (
          <button onClick={() => onResyncCalendar(t)} className="text-xs px-2 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: THEME.line }}><CalendarIcon size={11} /> Add to calendar</button>
        )}
        {t.calendar_sync_error && <button onClick={() => onResyncCalendar(t)} className="text-xs" style={{ color: "#B04A4A" }}>{t.calendar_sync_error}</button>}
        <button onClick={() => onEdit(t)} className="text-xs px-2 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: THEME.line }}><Pencil size={11} /> Edit</button>
        {t.source === "gmail" && t.manually_modified && (
          <button onClick={() => onResetToEmail(t.id)} className="text-xs px-2 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: THEME.line, color: THEME.inkSoft }}><RotateCcw size={11} /> Reset to email info</button>
        )}
        <button onClick={() => onDelete(t.id)} className="text-xs px-2 py-1.5 rounded-md ml-auto" style={{ color: "#B04A4A" }}>Remove</button>
      </div>
    </div>
  );
}

function TestsView({ tests, onAdd, onEdit, onDelete, onResetToEmail, onResyncCalendar, onSetAssessmentType, typeFilter, setTypeFilter }) {
  const filtered = typeFilter === "all" ? tests : tests.filter((t) => t.assessment_type === typeFilter);
  const sorted = [...filtered].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="tusk-serif text-2xl font-semibold">Tests</h1>
        <button onClick={onAdd} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: TEST_BLUE }}>
          <Plus size={14} /> Add test
        </button>
      </div>
      <TypeFilterPills value={typeFilter} onChange={setTypeFilter} />
      {sorted.length === 0 && <p className="text-sm mt-3" style={{ color: THEME.inkSoft }}>No tests match this filter.</p>}
      <div className="space-y-3 mt-3">
        {sorted.map((t) => <TestCard key={t.id} t={t} onEdit={onEdit} onDelete={onDelete} onResetToEmail={onResetToEmail} onResyncCalendar={onResyncCalendar} onSetAssessmentType={onSetAssessmentType} />)}
      </div>
    </div>
  );
}

function TypeFilterPills({ value, onChange }) {
  const options = [
    { id: "all", label: "All" },
    { id: "formative", label: "🔵 Formative" },
    { id: "summative", label: "🟣 Summative" },
  ];
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className="text-xs px-3 py-1.5 rounded-full font-medium border"
          style={{
            background: value === o.id ? THEME.ink : "white",
            color: value === o.id ? "white" : THEME.inkSoft,
            borderColor: value === o.id ? THEME.ink : THEME.line,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AssignmentsView({ assignments, subjects, filters, setFilters, subView, setSubView, onUpdate, onDelete, onAdd, onEdit, onFocus, onResetToEmail }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="tusk-serif text-2xl font-semibold">Assignments</h1>
        <button onClick={onAdd} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>
          <Plus size={14} /> Add assignment
        </button>
      </div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterSelect icon={Filter} value={filters.subject} onChange={(v) => setFilters((f) => ({ ...f, subject: v }))} options={["all", ...subjects]} labelAll="All subjects" />
        <FilterSelect value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} options={["all", "upcoming", "in_progress", "completed"]} labelAll="All statuses" />
        <FilterSelect value={filters.priority} onChange={(v) => setFilters((f) => ({ ...f, priority: v }))} options={["all", "low", "medium", "high", "urgent"]} labelAll="All priorities" />
        <div className="ml-auto flex gap-1 rounded-md p-1" style={{ background: THEME.paperDeep }}>
          <button onClick={() => setSubView("list")} className="p-1.5 rounded" style={{ background: subView === "list" ? "white" : "transparent" }}><ListIcon size={14} /></button>
          <button onClick={() => setSubView("kanban")} className="p-1.5 rounded" style={{ background: subView === "kanban" ? "white" : "transparent" }}><LayoutGrid size={14} /></button>
          <button onClick={() => setSubView("subject")} className="p-1.5 rounded text-xs px-2" style={{ background: subView === "subject" ? "white" : "transparent" }}>By subject</button>
        </div>
      </div>
      {assignments.length === 0 && <p className="text-sm" style={{ color: THEME.inkSoft }}>No assignments match these filters.</p>}
      {subView === "list" && (
        <div className="space-y-3">
          {assignments.sort((a, b) => priorityRank(a) - priorityRank(b)).map((a) => (
            <AssignmentCard key={a.id} a={a} onUpdate={onUpdate} onDelete={onDelete} onFocus={onFocus} onEdit={onEdit} onResetToEmail={onResetToEmail} />
          ))}
        </div>
      )}
      {subView === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["upcoming", "in_progress", "completed"].map((col) => (
            <div key={col}>
              <div className="text-xs uppercase tracking-wide mb-2 font-medium" style={{ color: THEME.inkSoft }}>{col === "upcoming" ? "Upcoming" : col === "in_progress" ? "In progress" : "Done"}</div>
              <div className="space-y-3">
                {assignments.filter((a) => a.status === col).map((a) => (
                  <AssignmentCard key={a.id} a={a} onUpdate={onUpdate} onDelete={onDelete} onFocus={onFocus} onEdit={onEdit} onResetToEmail={onResetToEmail} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {subView === "subject" && (
        <div className="space-y-6">
          {subjects.filter((s) => assignments.some((a) => a.subject === s)).map((s) => (
            <div key={s}>
              <div className="tusk-serif font-semibold mb-2">{s}</div>
              <div className="space-y-3">
                {assignments.filter((a) => a.subject === s).map((a) => (
                  <AssignmentCard key={a.id} a={a} onUpdate={onUpdate} onDelete={onDelete} onFocus={onFocus} onEdit={onEdit} onResetToEmail={onResetToEmail} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ icon: Icon, value, onChange, options, labelAll }) {
  return (
    <div className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs" style={{ background: "white", border: `1px solid ${THEME.line}` }}>
      {Icon && <Icon size={12} />}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none">
        {options.map((o) => <option key={o} value={o}>{o === "all" ? labelAll : o.replace("_", " ")}</option>)}
      </select>
    </div>
  );
}

function CalendarView({ assignments, tests, rotationDays, typeFilter, setTypeFilter }) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const filteredTests = typeFilter && typeFilter !== "all" ? tests.filter((t) => t.assessment_type === typeFilter) : tests;
  const byDate = {};
  assignments.forEach((a) => { if (!a.due_date) return; (byDate[a.due_date] = byDate[a.due_date] || []).push({ ...a, kind: "assignment" }); });
  filteredTests.forEach((t) => { if (!t.date) return; (byDate[t.date] = byDate[t.date] || []).push({ ...t, kind: "test" }); });
  const rotationByDate = {};
  (rotationDays || []).forEach((r) => { rotationByDate[r.date] = r.day; });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="tusk-serif text-2xl font-semibold">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h1>
        <div className="flex gap-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 rounded-md border" style={{ borderColor: THEME.line }}><ChevronLeft size={14} /></button>
          <button onClick={() => setCursor(new Date())} className="text-xs px-2 py-1.5 rounded-md border" style={{ borderColor: THEME.line }}>Today</button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 rounded-md border" style={{ borderColor: THEME.line }}><ChevronRight size={14} /></button>
        </div>
      </div>
      {setTypeFilter && <div className="mb-3"><TypeFilterPills value={typeFilter} onChange={setTypeFilter} /></div>}
      <div className="grid grid-cols-7 gap-2 text-xs mb-1" style={{ color: THEME.inkSoft }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="text-center py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const items = byDate[dateStr] || [];
          const rotDay = rotationByDate[dateStr];
          const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
          return (
            <div key={i} className="rounded-md p-2 min-h-[80px]" style={{ background: "white", border: `1px solid ${isToday ? THEME.brass : THEME.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{d}</span>
                {rotDay && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: THEME.brassSoft, color: "#5A4318" }}>D{rotDay}</span>}
              </div>
              {items.slice(0, 3).map((a, idx) => {
                if (a.kind === "test") {
                  const typeEmoji = a.assessment_type && ASSESSMENT_TYPE_META[a.assessment_type] ? ASSESSMENT_TYPE_META[a.assessment_type].emoji : "🔵";
                  return <div key={idx} className="text-[10px] mb-1 px-1 py-0.5 rounded truncate" style={{ background: "#DBEAFE", color: "#1E40AF" }}>{typeEmoji} {a.title}</div>;
                }
                const sc = STATUS_COLOR[a.derivedStatus] || STATUS_COLOR.upcoming;
                return <div key={idx} className={`text-[10px] mb-1 px-1 py-0.5 rounded ${sc.soft} ${sc.text} truncate`}>{a.title}</div>;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FocusView({ task, assignments, onSelect, onComplete }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) { clearInterval(intervalRef.current); setRunning(false); setFinished(true); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  if (!task) {
    return <div><h1 className="tusk-serif text-2xl font-semibold mb-4">Focus</h1><p className="text-sm" style={{ color: THEME.inkSoft }}>No active assignment. Head to Assignments and start one.</p></div>;
  }
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div>
      <h1 className="tusk-serif text-2xl font-semibold mb-4">Focus</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-lg p-6" style={{ background: "white", border: `1px solid ${THEME.line}` }}>
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: THEME.inkSoft }}>Current task</div>
          <div className="tusk-serif text-xl font-semibold">{task.title}</div>
          <div className="text-sm mt-1" style={{ color: THEME.inkSoft }}>{task.subject} · {fmtDue(task.due_date, task.due_time)}</div>
          {task.estimated_minutes && <div className="text-xs mt-1" style={{ color: THEME.inkSoft }}>Estimated time: {task.estimated_minutes} minutes</div>}
          <div className="mt-8 flex flex-col items-center">
            <div className="tusk-serif text-5xl font-semibold tabular-nums">{mm}:{ss}</div>
            <div className="flex gap-2 mt-4">
              {!finished && (
                <button onClick={() => setRunning((r) => !r)} className="flex items-center gap-2 px-4 py-2 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>
                  {running ? <Pause size={14} /> : <Play size={14} />} {running ? "Pause" : "Start focus session"}
                </button>
              )}
              <button onClick={() => { setSeconds(25 * 60); setRunning(false); setFinished(false); }} className="px-4 py-2 rounded-md border text-xs" style={{ borderColor: THEME.line }}>Reset</button>
            </div>
            {finished && (
              <div className="mt-4 text-center">
                <div className="mb-2 font-medium">Did you finish this assignment?</div>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => onComplete(task.id)} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: THEME.ink, color: "white" }}>Done</button>
                  <button onClick={() => { setSeconds(25 * 60); setFinished(false); }} className="px-3 py-1.5 rounded-md text-xs border" style={{ borderColor: THEME.line }}>Continue</button>
                  <button onClick={() => setFinished(false)} className="px-3 py-1.5 rounded-md text-xs border" style={{ borderColor: THEME.line }}>Pause</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: THEME.inkSoft }}>Switch task</div>
          <div className="space-y-2">
            {assignments.map((a) => (
              <button key={a.id} onClick={() => onSelect(a.id)} className="w-full text-left rounded-md p-3 text-xs" style={{ background: a.id === task.id ? THEME.brassSoft : "white", border: `1px solid ${THEME.line}` }}>
                <div className="font-medium">{a.title}</div>
                <div style={{ color: THEME.inkSoft }}>{a.subject} · {fmtDue(a.due_date, a.due_time)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressView({ assignments, subjects }) {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);
  const completedThisWeek = assignments.filter((a) => a.status === "completed" && a.completed_at && new Date(a.completed_at) >= weekAgo).length;
  const completedThisMonth = assignments.filter((a) => a.status === "completed" && a.completed_at && new Date(a.completed_at) >= monthAgo).length;
  const overdue = assignments.filter((a) => a.derivedStatus === "overdue" && a.status !== "completed").length;
  const total = assignments.length || 1;
  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const completionRate = Math.round((completedCount / total) * 100);
  const bySubject = subjects.map((s) => ({ s, count: assignments.filter((a) => a.subject === s).length })).filter((x) => x.count > 0);
  const maxCount = Math.max(1, ...bySubject.map((x) => x.count));

  return (
    <div>
      <h1 className="tusk-serif text-2xl font-semibold mb-4">Progress</h1>
      <div className="flex gap-3 flex-wrap mb-8">
        <SummaryCard label="Completed this week" value={completedThisWeek} dotClass="bg-green-500" />
        <SummaryCard label="Completed this month" value={completedThisMonth} dotClass="bg-green-500" />
        <SummaryCard label="Overdue" value={overdue} dotClass="bg-red-500" />
        <SummaryCard label="Completion rate" value={`${completionRate}%`} />
      </div>
      <div style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg p-5">
        <div className="tusk-serif font-semibold mb-4">Workload by subject</div>
        <div className="space-y-2">
          {bySubject.map(({ s, count }) => (
            <div key={s} className="flex items-center gap-3">
              <div className="w-40 text-xs truncate" style={{ color: THEME.inkSoft }}>{s}</div>
              <div className="flex-1 rounded-full h-2" style={{ background: THEME.paperDeep }}>
                <div className="h-2 rounded-full" style={{ width: `${(count / maxCount) * 100}%`, background: THEME.brass }} />
              </div>
              <div className="text-xs w-6 text-right">{count}</div>
            </div>
          ))}
          {bySubject.length === 0 && <p className="text-xs" style={{ color: THEME.inkSoft }}>No data yet.</p>}
        </div>
      </div>
    </div>
  );
}


function SettingsView({ studentName, setStudentName, timezone, setTimezone, automationLogs, onSync, syncing, todayDayNumber, onOpenHistory, pendingCount, onReviewPending }) {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="tusk-serif text-2xl font-semibold">Settings</h1>
      <section>
        <div className="tusk-serif font-semibold mb-2">Account</div>
        <div style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg p-4 space-y-3">
          <label className="block text-xs" style={{ color: THEME.inkSoft }}>Name
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 text-sm" style={{ border: `1px solid ${THEME.line}` }} />
          </label>
          <label className="block text-xs" style={{ color: THEME.inkSoft }}>Timezone
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 text-sm" style={{ border: `1px solid ${THEME.line}` }} />
          </label>
        </div>
      </section>
      <section>
        <div className="tusk-serif font-semibold mb-2">Google connections</div>
        <div style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Mail size={14} /> Gmail</span><span className="text-green-700 text-xs">Connected</span></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2"><CalendarIcon size={14} /> Google Calendar</span><span className="text-green-700 text-xs">Connected</span></div>
        </div>
      </section>
      <section>
        <div className="tusk-serif font-semibold mb-2">Sync</div>
        <div style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg p-4">
          <p className="text-xs mb-3" style={{ color: THEME.inkSoft }}>Runs a live check of Gmail for new assignments and tests and keeps your calendar in sync. There's no scheduled background job — run it whenever you want fresh data.</p>
          <div className="flex items-center gap-2">
            <button onClick={onSync} disabled={syncing} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sync now"}
            </button>
            <button onClick={onOpenHistory} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>
              <History size={13} /> View sync history
            </button>
            {pendingCount > 0 && (
              <button onClick={onReviewPending} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line, color: "#92400E" }}>
                {pendingCount} pending review
              </button>
            )}
          </div>
          <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
            {automationLogs.slice(0, 5).map((l) => (
              <div key={l.id} className="text-xs flex items-center justify-between" style={{ color: THEME.inkSoft }}>
                <span>{new Date(l.run_time).toLocaleString()}</span>
                <span>{l.completed ? `${l.new_assignments || 0} assignments, ${l.new_tests || 0} tests new` : "failed"}</span>
              </div>
            ))}
            {automationLogs.length === 0 && <div className="text-xs" style={{ color: THEME.inkSoft }}>No syncs yet.</div>}
          </div>
        </div>
      </section>
      <section>
        <div className="tusk-serif font-semibold mb-2">Your timetable</div>
        <div style={{ background: "white", border: `1px solid ${THEME.line}` }} className="rounded-lg p-4 overflow-x-auto">
          <p className="text-xs mb-3" style={{ color: THEME.inkSoft }}>
            Lyford Cay International School, 8-day rotation. {todayDayNumber && <span>Today is <b>Day {todayDayNumber}</b>.</span>}
          </p>
          <table className="text-xs w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="text-left p-1" style={{ color: THEME.inkSoft }}>Period</th>
                {ROTATION_DAY_NUMS.map((d) => <th key={d} className="text-left p-1" style={{ color: THEME.inkSoft }}>Day {d}</th>)}
              </tr>
            </thead>
            <tbody>
              {(TIMETABLE[1] || []).map((_, rowIdx) => (
                <tr key={rowIdx} style={{ borderTop: `1px solid ${THEME.line}` }}>
                  <td className="p-1 font-medium">{TIMETABLE[1][rowIdx].period}</td>
                  {ROTATION_DAY_NUMS.map((d) => {
                    const p = (TIMETABLE[d] || [])[rowIdx];
                    const isBreak = p && NON_CLASS_LABELS.includes(p.subject);
                    return (
                      <td key={d} className="p-1 align-top">
                        {p && (
                          <div style={{ opacity: isBreak ? 0.55 : 1 }}>
                            <div className="font-medium">{p.subject}</div>
                            {!isBreak && p.room && <div style={{ color: THEME.inkSoft }}>{p.teacher}, Rm {p.room}</div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function fieldLabel(f) {
  return { due_date: "Due date", due_time: "Due time", date: "Date", time: "Time", title: "Title", priority: "Priority", description: "Description", location: "Location", topics: "Topics", status: "Status", subject: "Subject", teacher: "Teacher" }[f] || f;
}

function CandidateRow({ c, onAdd, onEdit, onIgnore }) {
  const d = c.data;
  const isTest = c.type === "test";
  return (
    <div className="rounded-md p-3 flex items-start justify-between gap-3" style={{ background: "white", border: `1px solid ${isTest ? "#BFDBFE" : THEME.line}` }}>
      <div>
        <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isTest ? TEST_BLUE : "#F59E0B" }} />
          {d.subject} — {d.title}
          {c.needs_review && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>Needs review</span>}
        </div>
        <div className="text-xs mt-0.5" style={{ color: THEME.inkSoft }}>
          {d.due_date ? (isTest ? fmtDue(d.due_date, d.due_time) : `Due: ${fmtDue(d.due_date, d.due_time)}`) : "No date found"}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onAdd} className="text-xs px-2 py-1.5 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>✓ Add</button>
        <button onClick={onEdit} className="text-xs px-2 py-1.5 rounded-md border" style={{ borderColor: THEME.line }}>✏️ Edit</button>
        <button onClick={onIgnore} className="text-xs px-2 py-1.5 rounded-md border flex items-center" style={{ borderColor: THEME.line, color: "#B04A4A" }}><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

function SyncResultsView({ results, added, onAdd, onEdit, onIgnore, onAddAll, onIgnoreAll, onGoDashboard, onViewAdded }) {
  if (!results) {
    return (
      <div>
        <h1 className="tusk-serif text-2xl font-semibold mb-2">Sync results</h1>
        <p className="text-sm" style={{ color: THEME.inkSoft }}>No sync has run yet. Hit Sync in the sidebar to scan Gmail.</p>
      </div>
    );
  }
  const { emails_scanned, ignored_count, already_count, updated } = results;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 color="#22C55E" size={22} />
        <h1 className="tusk-serif text-2xl font-semibold">Sync Complete</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: THEME.inkSoft }}>{emails_scanned} emails scanned</p>

      {added.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="tusk-serif font-semibold">Added ({added.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => onAddAll(added)} className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>Add all</button>
              <button onClick={() => onIgnoreAll(added)} className="text-xs px-2 py-1 rounded-md border" style={{ borderColor: THEME.line }}>Ignore all</button>
            </div>
          </div>
          <div className="space-y-2">
            {added.map((c) => <CandidateRow key={c.tempId} c={c} onAdd={() => onAdd(c)} onEdit={() => onEdit(c)} onIgnore={() => onIgnore(c.tempId)} />)}
          </div>
        </section>
      )}

      {updated.length > 0 && (
        <section className="mb-6">
          <h2 className="tusk-serif font-semibold mb-2">Updated ({updated.length})</h2>
          <div className="space-y-2">
            {updated.map((u, i) => (
              <div key={i} className="rounded-md p-3 text-xs" style={{ background: "white", border: `1px solid ${THEME.line}` }}>
                <div className="font-medium flex items-center gap-1"><Pencil size={11} /> {u.subject} — {u.title}</div>
                {u.changes.map((c, ci) => (
                  <div key={ci} style={{ color: THEME.inkSoft }}>{fieldLabel(c.field)} changed from {c.from ? String(c.from) : "(none)"} → {String(c.to)}</div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {added.length === 0 && updated.length === 0 && (
        <p className="text-sm mb-6" style={{ color: THEME.inkSoft }}>Nothing new found this time.</p>
      )}

      <div className="flex gap-8 text-sm mb-6">
        <div><span className="font-semibold">{already_count}</span> already in the system, not duplicated.</div>
        <div><span className="font-semibold">{ignored_count}</span> emails were not related to schoolwork.</div>
      </div>

      <div className="flex gap-2">
        <button onClick={onViewAdded} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>View Added Items</button>
        <button onClick={onGoDashboard} className="text-xs px-3 py-2 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>Go to Dashboard</button>
      </div>
    </div>
  );
}

function SyncErrorModal({ info, repeated, onRetry, onClose, onReconnect, onViewResults, onViewDetails }) {
  if (!info) return null;
  const isPartial = info.isPartial;
  const title = isPartial ? "Sync Partially Completed" : repeated ? "Sync is still failing" : "Sync Failed";
  const iconColor = isPartial ? "#B45309" : "#B04A4A";
  const showReconnect = !isPartial && (repeated || info.category === "auth" || info.category === "access");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.5)" }} onClick={onClose}>
      <div style={{ background: THEME.paper }} className="tusk-sans rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle color={iconColor} size={22} />
          <h2 className="tusk-serif text-lg font-semibold">{title}</h2>
        </div>

        {repeated && !isPartial ? (
          <p className="text-sm mb-4" style={{ color: THEME.inkSoft }}>
            We've tried syncing multiple times but {info.category === "auth" || info.category === "access" ? "Gmail is still unavailable." : "the problem is still happening."}
          </p>
        ) : isPartial ? (
          <div className="text-sm mb-4 space-y-1">
            <p style={{ color: THEME.inkSoft }}>We scanned {info.resultsSummary?.emails_scanned ?? 0} emails before the sync stopped.</p>
            <p>Added: {info.resultsSummary?.added_assignments ?? 0} assignment{info.resultsSummary?.added_assignments === 1 ? "" : "s"}</p>
            <p>Added: {info.resultsSummary?.added_tests ?? 0} test{info.resultsSummary?.added_tests === 1 ? "" : "s"}</p>
            <p>Updated: {info.resultsSummary?.updated ?? 0} item{info.resultsSummary?.updated === 1 ? "" : "s"}</p>
            <p className="pt-1"><span className="font-medium">Problem:</span> <span style={{ color: THEME.inkSoft }}>{info.reason}</span></p>
          </div>
        ) : (
          <div className="text-sm mb-4 space-y-2">
            <div><span className="font-medium">{info.icon} Reason:</span> <span style={{ color: THEME.inkSoft }}>{info.title}. {info.reason}</span></div>
            <div><span className="font-medium">What this means:</span> <span style={{ color: THEME.inkSoft }}>{info.meaning}</span></div>
            <div><span className="font-medium">What to do:</span> <span style={{ color: THEME.inkSoft }}>{info.action}</span></div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap justify-end">
          {showReconnect && <button onClick={onReconnect} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>Reconnect Gmail</button>}
          {isPartial && <button onClick={onViewResults} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>View Results</button>}
          {repeated && !isPartial ? (
            <button onClick={onViewDetails} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>View Sync Details</button>
          ) : (
            <button onClick={onRetry} className="text-xs px-3 py-2 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>Try Again</button>
          )}
          <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>Close</button>
        </div>

        {info.technical && <p className="text-[10px] mt-4" style={{ color: "#9C9484" }}>Saved to sync history for debugging: {info.technical}</p>}
      </div>
    </div>
  );
}

function SyncHistoryModal({ logs, onClose }) {
  const statusDot = { success: "🟢", partial: "🟡", failed: "🔴" };
  const statusLabel = { success: "Sync Complete", partial: "Sync Partially Complete", failed: "Sync Failed" };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.4)" }} onClick={onClose}>
      <div style={{ background: THEME.paper }} className="tusk-sans rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="tusk-serif text-lg font-semibold flex items-center gap-2"><History size={18} /> Sync history</h2>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded-md p-3 text-xs" style={{ background: "white", border: `1px solid ${THEME.line}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{statusDot[l.status] || (l.completed ? "🟢" : "🔴")} {statusLabel[l.status] || (l.completed ? "Sync Complete" : "Sync Failed")}</span>
                <span style={{ color: THEME.inkSoft }}>{new Date(l.run_time).toLocaleString()}</span>
              </div>
              <div style={{ color: THEME.inkSoft }}>
                {l.emails_scanned} emails scanned · {l.new_assignments || 0} new assignments · {l.new_tests || 0} new tests · {l.updates || 0} updated · {l.already || 0} already added · {l.ignored || 0} ignored
              </div>
              {l.error_type && (
                <div className="mt-1" style={{ color: l.status === "failed" ? "#B04A4A" : "#92400E" }}>
                  {l.error_type}{l.error_message ? `: ${l.error_message}` : ""}{l.retry_attempts ? ` (retry #${l.retry_attempts})` : ""}
                </div>
              )}
            </div>
          ))}
          {logs.length === 0 && <p className="text-xs" style={{ color: THEME.inkSoft }}>No syncs yet.</p>}
        </div>
      </div>
    </div>
  );
}

function AssessmentTypeToggle({ value, onChange, meta, error }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs mb-1" style={{ color: THEME.inkSoft }}>
        Assessment Type <span style={{ color: "#B04A4A" }}>*</span> <ConfidenceDot meta={meta} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange("formative")} className="flex-1 text-xs px-3 py-2 rounded-md font-medium border transition-colors"
          style={{ background: value === "formative" ? ASSESSMENT_TYPE_META.formative.color : "white", color: value === "formative" ? "white" : THEME.ink, borderColor: value === "formative" ? ASSESSMENT_TYPE_META.formative.color : THEME.line }}>
          🔵 Formative
        </button>
        <button type="button" onClick={() => onChange("summative")} className="flex-1 text-xs px-3 py-2 rounded-md font-medium border transition-colors"
          style={{ background: value === "summative" ? ASSESSMENT_TYPE_META.summative.color : "white", color: value === "summative" ? "white" : THEME.ink, borderColor: value === "summative" ? ASSESSMENT_TYPE_META.summative.color : THEME.line }}>
          🟣 Summative
        </button>
      </div>
      {meta && meta.confidence && meta.confidence !== "high" && (
        <div className="text-[10px] mt-1" style={{ color: "#92400E" }}>⚠️ Needs review — {meta.note || "confirm Formative or Summative manually."}</div>
      )}
      {error && <div className="text-[10px] mt-1" style={{ color: "#B04A4A" }}>Pick Formative or Summative before saving.</div>}
    </div>
  );
}

function ConfidenceDot({ meta }) {
  if (!meta || !meta.confidence) return null;
  const map = { high: { emoji: "🟢", label: "High confidence" }, medium: { emoji: "🟡", label: "Needs review" }, low: { emoji: "🔴", label: "Missing" } };
  const m = map[meta.confidence];
  if (!m) return null;
  return <span title={m.label}>{m.emoji}</span>;
}

function Field({ label, children, meta }) {
  return (
    <label className="block text-xs" style={{ color: THEME.inkSoft }}>
      <span className="flex items-center gap-1">{label} <ConfidenceDot meta={meta} /></span>
      {children}
      {meta && meta.confidence && meta.confidence !== "high" && meta.note && (
        <div className="text-[10px] mt-0.5" style={{ color: meta.confidence === "low" ? "#B04A4A" : "#92400E" }}>{meta.note}</div>
      )}
    </label>
  );
}

function ScreenshotPanel({ screenshots, setScreenshots, analyzing, onAnalyze, hasAnalyzed, analyzeError }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(screenshots.length > 0);

  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.type && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length) { addFiles(files); setExpanded(true); }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(files) {
    const converted = await Promise.all(
      Array.from(files).map(async (f) => {
        const { base64, mediaType, dataUrl } = await fileToBase64(f);
        return { id: uid("shot"), base64, mediaType, dataUrl };
      })
    );
    setScreenshots((prev) => [...prev, ...converted]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function removeShot(id) {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-lg px-3 py-2 mb-3 flex items-center gap-2 text-xs font-semibold"
        style={{ background: "#F8FAFC", border: `1px dashed ${THEME.line}`, color: THEME.ink }}
      >
        <ImageIcon size={14} color={THEME.brass} /> 📸 Add from screenshot instead
        {screenshots.length > 0 && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: THEME.brassSoft }}>{screenshots.length}</span>}
      </button>
    );
  }

  return (
    <div className="rounded-lg p-3 mb-3" style={{ background: "#F8FAFC", border: `1px dashed ${THEME.line}` }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} color={THEME.brass} />
          <span className="text-xs font-semibold">📸 Add from screenshot</span>
        </div>
        <button onClick={() => setExpanded(false)} className="text-[11px]" style={{ color: THEME.inkSoft }}>Hide</button>
      </div>
      <p className="text-[11px] mb-2" style={{ color: THEME.inkSoft }}>
        Upload a screenshot of ManageBac, an assignment page, a test announcement, an email, or a school portal — Tusk will read it and fill the form.
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="rounded-md p-3 flex flex-col items-center justify-center text-center gap-1 mb-2"
        style={{ background: dragOver ? THEME.brassSoft : "white", border: `1px dashed ${dragOver ? THEME.brass : THEME.line}`, minHeight: 64 }}
      >
        <Upload size={14} color={THEME.inkSoft} />
        <span className="text-[11px]" style={{ color: THEME.inkSoft }}>Drag & drop, paste (Ctrl/Cmd+V), or</span>
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="text-xs px-2 py-1 rounded-md border" style={{ borderColor: THEME.line }}>Upload screenshot</button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {screenshots.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {screenshots.map((s) => (
            <div key={s.id} className="relative">
              <img src={s.dataUrl} alt="uploaded screenshot" className="rounded-md object-cover" style={{ width: 64, height: 64, border: `1px solid ${THEME.line}` }} />
              <button onClick={() => removeShot(s.id)} className="absolute -top-1.5 -right-1.5 rounded-full bg-white flex items-center justify-center" style={{ border: `1px solid ${THEME.line}`, width: 16, height: 16 }}><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {analyzeError && <p className="text-[11px] mb-2" style={{ color: "#B04A4A" }}>{analyzeError}</p>}

      {screenshots.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="text-xs px-2 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: THEME.line }}><Plus size={11} /> Add another screenshot</button>
          <button onClick={onAnalyze} disabled={analyzing} className="text-xs px-2 py-1.5 rounded-md font-medium flex items-center gap-1" style={{ background: THEME.brass, color: "#1a1200" }}>
            {analyzing ? <Loader2 size={12} className="animate-spin" /> : hasAnalyzed ? <RotateCw size={12} /> : <Sparkles size={12} />}
            {analyzing ? "Analyzing screenshot..." : hasAnalyzed ? "Re-analyze screenshot" : "Analyze screenshot"}
          </button>
        </div>
      )}
    </div>
  );
}

function DuplicateWarning({ match, kind, onUpdate, onCreateAnyway, onCancel }) {
  const whenLabel = kind === "test" ? (match.date ? fmtDue(match.date, match.time) : null) : (match.due_date ? fmtDue(match.due_date, match.due_time) : null);
  return (
    <div className="rounded-md p-3 mt-3" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
      <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: "#92400E" }}><AlertTriangle size={12} /> Possible duplicate</div>
      <p className="text-xs mb-2" style={{ color: "#92400E" }}>
        "{match.title}" already exists for {match.subject}{whenLabel ? ` and is due ${whenLabel}` : ""}.
      </p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={onUpdate} className="text-xs px-2 py-1.5 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>Update Existing</button>
        <button onClick={onCreateAnyway} className="text-xs px-2 py-1.5 rounded-md border" style={{ borderColor: THEME.line }}>Create Anyway</button>
        <button onClick={onCancel} className="text-xs px-2 py-1.5 rounded-md border" style={{ borderColor: THEME.line }}>Cancel</button>
      </div>
    </div>
  );
}

function findDuplicateItem(existingItems, title, subject) {
  if (!existingItems || !title) return null;
  return existingItems.find((x) => x.title?.toLowerCase() === title.toLowerCase() && (x.subject || "").toLowerCase() === (subject || "").toLowerCase()) || null;
}

function AddAssignmentModal({ subjects, onClose, onSave, initial, isEdit, existingItems, onUpdateExisting }) {
  const [form, setForm] = useState(
    initial
      ? { title: initial.title || "", subject: initial.subject || subjects[0] || "", teacher: initial.teacher || "", description: initial.description || "", due_date: initial.due_date || "", due_time: initial.due_time || "", priority: initial.priority || "medium", estimated_minutes: initial.estimated_minutes || "", source_url: initial.source_url || initial.managebac_link || "", submission_info: initial.submission_info || "", instructions: initial.instructions || "" }
      : { title: "", subject: subjects[0] || "", teacher: "", description: "", due_date: "", due_time: "", priority: "medium", estimated_minutes: "", source_url: "", submission_info: "", instructions: "" }
  );
  const [screenshots, setScreenshots] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [fieldMeta, setFieldMeta] = useState({});
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [fieldTab, setFieldTab] = useState("details");
  useEscapeToClose(onClose);

  async function handleAnalyze() {
    if (screenshots.length === 0) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const fields = await analyzeScreenshots(screenshots, "assignment", subjects);
      const linkVal = Array.isArray(fields.links?.value) ? fields.links.value[0] : fields.links?.value;
      setForm((prev) => ({
        ...prev,
        title: fields.title?.value || prev.title,
        subject: fields.subject?.value || prev.subject,
        teacher: fields.teacher?.value || prev.teacher,
        description: fields.description?.value || prev.description,
        due_date: fields.due_date?.value || prev.due_date,
        due_time: fields.due_time?.value || prev.due_time,
        priority: fields.priority?.value || prev.priority,
        estimated_minutes: fields.estimated_minutes?.value || prev.estimated_minutes,
        submission_info: fields.submission_info?.value || prev.submission_info,
        instructions: fields.instructions?.value || prev.instructions,
        source_url: linkVal || prev.source_url,
      }));
      setFieldMeta(fields);
      setHasAnalyzed(true);
    } catch (e) {
      setAnalyzeError(e.message || "Couldn't analyze the screenshot — try again or enter details manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  function buildPayload() {
    return { ...form, estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null };
  }
  function handleSaveClick() {
    if (!form.title.trim()) return;
    if (!isEdit && existingItems) {
      const dup = findDuplicateItem(existingItems, form.title, form.subject);
      if (dup) { setDuplicateMatch(dup); return; }
    }
    onSave(buildPayload());
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.4)" }} onClick={onClose}>
      <div style={{ background: THEME.paper }} className="tusk-sans rounded-lg w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.line}`, background: THEME.paper }}>
          <h2 className="tusk-serif text-base font-semibold">{isEdit ? "Edit assignment" : "Add assignment"}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5"><X size={16} /></button>
        </div>
        <div className="px-5 py-3 overflow-y-auto flex-1 min-h-0">
          {isEdit && initial.source === "gmail" && (
            <p className="text-xs mb-3 flex items-center gap-1" style={{ color: THEME.inkSoft }}><Lock size={11} /> Fields you change here will be locked against future Gmail sync updates.</p>
          )}
          <ScreenshotPanel screenshots={screenshots} setScreenshots={setScreenshots} analyzing={analyzing} onAnalyze={handleAnalyze} hasAnalyzed={hasAnalyzed} analyzeError={analyzeError} />
          <div className="flex gap-1 mb-3 rounded-md p-1" style={{ background: THEME.paperDeep }}>
            <button onClick={() => setFieldTab("details")} className="flex-1 text-xs px-2 py-1.5 rounded font-medium" style={{ background: fieldTab === "details" ? "white" : "transparent" }}>Details</button>
            <button onClick={() => setFieldTab("more")} className="flex-1 text-xs px-2 py-1.5 rounded font-medium" style={{ background: fieldTab === "more" ? "white" : "transparent" }}>More info</button>
          </div>
          {fieldTab === "details" && (
            <div className="space-y-2.5">
              <Field label="Title" meta={fieldMeta.title}><input className="tusk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Subject" meta={fieldMeta.subject}>
                <select className="tusk-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Teacher" meta={fieldMeta.teacher}><input className="tusk-input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Due date" meta={fieldMeta.due_date}><input type="date" className="tusk-input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
                <Field label="Due time" meta={fieldMeta.due_time}><input type="time" className="tusk-input" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Priority" meta={fieldMeta.priority}>
                  <select className="tusk-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Est. minutes" meta={fieldMeta.estimated_minutes}><input type="number" className="tusk-input" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} /></Field>
              </div>
            </div>
          )}
          {fieldTab === "more" && (
            <div className="space-y-2.5">
              <Field label="Description" meta={fieldMeta.description}><textarea className="tusk-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Submission info" meta={fieldMeta.submission_info}><input className="tusk-input" value={form.submission_info} onChange={(e) => setForm({ ...form, submission_info: e.target.value })} placeholder="Submit via ManageBac upload" /></Field>
              <Field label="Instructions" meta={fieldMeta.instructions}><textarea className="tusk-input" rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Field>
              <Field label="Link" meta={fieldMeta.links}><input className="tusk-input" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} /></Field>
            </div>
          )}
          <style>{`.tusk-input { width:100%; margin-top:4px; padding:7px 10px; border-radius:6px; border:1px solid ${THEME.line}; font-size:13px; background:white; }`}</style>
        </div>
        <div className="px-5 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${THEME.line}`, background: THEME.paper }}>
          {duplicateMatch ? (
            <DuplicateWarning
              match={duplicateMatch} kind="assignment"
              onUpdate={() => { onUpdateExisting && onUpdateExisting(duplicateMatch.id, buildPayload()); }}
              onCreateAnyway={() => { setDuplicateMatch(null); onSave(buildPayload()); }}
              onCancel={() => setDuplicateMatch(null)}
            />
          ) : (
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>Cancel</button>
              <button onClick={handleSaveClick} className="text-xs px-3 py-2 rounded-md font-medium" style={{ background: THEME.ink, color: "white" }}>
                {isEdit ? "Save changes" : "Save assignment"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddTestModal({ subjects, onClose, onSave, initial, isEdit, existingItems, onUpdateExisting }) {
  const [form, setForm] = useState(
    initial
      ? { title: initial.title || "", subject: initial.subject || subjects[0] || "", teacher: initial.teacher || "", date: initial.date || "", time: initial.time || "", location: initial.location || "", topics: (initial.topics || []).join(", "), description: initial.description || "", priority: initial.priority || "medium", reminder: initial.reminder || "1 day before", study_plan: initial.study_plan || "", instructions: initial.instructions || "", assessment_type: initial.assessment_type || null }
      : { title: "", subject: subjects[0] || "", teacher: "", date: "", time: "", location: "", topics: "", description: "", priority: "medium", reminder: "1 day before", study_plan: "", instructions: "", assessment_type: null }
  );
  const [screenshots, setScreenshots] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [fieldMeta, setFieldMeta] = useState(
    initial && initial.assessment_type_confidence ? { assessment_type: { confidence: initial.assessment_type_confidence, note: initial.assessment_type_note || "" } } : {}
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [typeError, setTypeError] = useState(false);
  const [fieldTab, setFieldTab] = useState("details");
  useEscapeToClose(onClose);

  async function handleAnalyze() {
    if (screenshots.length === 0) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const fields = await analyzeScreenshots(screenshots, "test", subjects);
      const linkVal = Array.isArray(fields.links?.value) ? fields.links.value[0] : fields.links?.value;
      const detectedType = fields.assessment_type?.value === "formative" || fields.assessment_type?.value === "summative" ? fields.assessment_type.value : null;
      setForm((prev) => ({
        ...prev,
        title: fields.title?.value || prev.title,
        subject: fields.subject?.value || prev.subject,
        teacher: fields.teacher?.value || prev.teacher,
        description: fields.description?.value || prev.description,
        date: fields.date?.value || prev.date,
        time: fields.time?.value || prev.time,
        location: fields.location?.value || prev.location,
        topics: Array.isArray(fields.topics?.value) ? fields.topics.value.join(", ") : (fields.topics?.value || prev.topics),
        priority: fields.priority?.value || prev.priority,
        instructions: fields.instructions?.value || prev.instructions,
        assessment_type: detectedType || prev.assessment_type,
        study_plan: linkVal ? `${prev.study_plan ? prev.study_plan + " " : ""}${linkVal}`.trim() : prev.study_plan,
      }));
      setFieldMeta(fields);
      setHasAnalyzed(true);
    } catch (e) {
      setAnalyzeError(e.message || "Couldn't analyze the screenshot — try again or enter details manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  function buildPayload() {
    return { ...form, topics: form.topics.split(",").map((t) => t.trim()).filter(Boolean) };
  }
  function handleSaveClick() {
    if (!form.title.trim()) return;
    if (!form.assessment_type) { setTypeError(true); return; }
    setTypeError(false);
    if (!isEdit && existingItems) {
      const dup = findDuplicateItem(existingItems, form.title, form.subject);
      if (dup) { setDuplicateMatch(dup); return; }
    }
    onSave(buildPayload());
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.4)" }} onClick={onClose}>
      <div style={{ background: THEME.paper }} className="tusk-sans rounded-lg w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.line}`, background: THEME.paper }}>
          <h2 className="tusk-serif text-base font-semibold flex items-center gap-2"><GraduationCap size={17} color={TEST_BLUE} /> {isEdit ? "Edit test" : "Add test"}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5"><X size={16} /></button>
        </div>
        <div className="px-5 py-3 overflow-y-auto flex-1 min-h-0">
          {isEdit && initial.source === "gmail" && (
            <p className="text-xs mb-3 flex items-center gap-1" style={{ color: THEME.inkSoft }}><Lock size={11} /> Fields you change here will be locked against future Gmail sync updates.</p>
          )}
          <ScreenshotPanel screenshots={screenshots} setScreenshots={setScreenshots} analyzing={analyzing} onAnalyze={handleAnalyze} hasAnalyzed={hasAnalyzed} analyzeError={analyzeError} />
          <div className="flex gap-1 mb-3 rounded-md p-1" style={{ background: THEME.paperDeep }}>
            <button onClick={() => setFieldTab("details")} className="flex-1 text-xs px-2 py-1.5 rounded font-medium" style={{ background: fieldTab === "details" ? "white" : "transparent" }}>Details</button>
            <button onClick={() => setFieldTab("more")} className="flex-1 text-xs px-2 py-1.5 rounded font-medium" style={{ background: fieldTab === "more" ? "white" : "transparent" }}>More info</button>
          </div>
          {fieldTab === "details" && (
            <div className="space-y-2.5">
              <Field label="Test name" meta={fieldMeta.title}><input className="tusk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Biology Unit Test" /></Field>
              <AssessmentTypeToggle
                value={form.assessment_type}
                onChange={(v) => { setForm({ ...form, assessment_type: v }); setTypeError(false); }}
                meta={fieldMeta.assessment_type}
                error={typeError}
              />
              <Field label="Subject" meta={fieldMeta.subject}>
                <select className="tusk-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Teacher" meta={fieldMeta.teacher}><input className="tusk-input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Date" meta={fieldMeta.date}><input type="date" className="tusk-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
                <Field label="Time" meta={fieldMeta.time}><input type="time" className="tusk-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
              </div>
              <Field label="Location" meta={fieldMeta.location}><input className="tusk-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room 103" /></Field>
            </div>
          )}
          {fieldTab === "more" && (
            <div className="space-y-2.5">
              <Field label="Topics (comma separated)" meta={fieldMeta.topics}><input className="tusk-input" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} placeholder="Cell structure, transport, enzymes" /></Field>
              <Field label="Description" meta={fieldMeta.description}><textarea className="tusk-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Instructions" meta={fieldMeta.instructions}><textarea className="tusk-input" rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Priority" meta={fieldMeta.priority}>
                  <select className="tusk-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Reminder">
                  <select className="tusk-input" value={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.value })}>
                    {["None", "1 hour before", "1 day before", "2 days before", "1 week before"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Study plan"><textarea className="tusk-input" rows={2} value={form.study_plan} onChange={(e) => setForm({ ...form, study_plan: e.target.value })} placeholder="Review notes Mon, practice problems Tue..." /></Field>
            </div>
          )}
          <style>{`.tusk-input { width:100%; margin-top:4px; padding:7px 10px; border-radius:6px; border:1px solid ${THEME.line}; font-size:13px; background:white; }`}</style>
        </div>
        <div className="px-5 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${THEME.line}`, background: THEME.paper }}>
          {duplicateMatch ? (
            <DuplicateWarning
              match={duplicateMatch} kind="test"
              onUpdate={() => { onUpdateExisting && onUpdateExisting(duplicateMatch.id, buildPayload()); }}
              onCreateAnyway={() => { setDuplicateMatch(null); onSave(buildPayload()); }}
              onCancel={() => setDuplicateMatch(null)}
            />
          ) : (
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: THEME.line }}>Cancel</button>
              <button onClick={handleSaveClick} className="text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: TEST_BLUE }}>
                {isEdit ? "Save changes" : "Save test to Tusk calendar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================================
   TUSK HOME — multi-sector hub. School is untouched above; everything below is new scaffolding
   for Business, Sports, Health & Wellness, and the cross-sector Global AI Assistant.
   ========================================================================================= */

const SECTOR_META = {
  school: { label: "School", icon: GraduationCap, color: "#3B82F6", storageKey: "tusk-data" },
  business: { label: "Business", icon: Briefcase, color: "#F59E0B", storageKey: "tusk-business-data" },
  sports: { label: "Sports", icon: Activity, color: "#10B981", storageKey: "tusk-sports-data" },
  health: { label: "Health & Wellness", icon: HeartPulse, color: "#A855F7", storageKey: "tusk-health-data" },
};

/* ---------------------------- Shared AI architecture ----------------------------
   AIProfile: personality + rules per sector, shared by one AIProvider (callSectorAI).
   PermissionManager: one small cross-sector permission matrix, shared by every AI
   and readable/writable from any sector's privacy panel.
   ------------------------------------------------------------------------------- */


const DEFAULT_PERMISSIONS = {
  schoolToBusiness: false,
  schoolToSports: false,
  schoolToHealth: false,
  sportsToHealth: false,
  businessToHealth: false,
  healthToSchool: false,
  healthToBusiness: false,
  healthToSports: false,
};
const PERMISSIONS_KEY = "tusk-permissions";

async function getPermissions() {
  const data = await readSectorStorage(PERMISSIONS_KEY);
  return { ...DEFAULT_PERMISSIONS, ...(data || {}) };
}
async function setPermission(key, value) {
  const current = await getPermissions();
  const next = { ...current, [key]: value };
  await storage.set(PERMISSIONS_KEY, JSON.stringify(next)).catch(() => {});
  window.dispatchEvent(new Event("tusk-permissions-changed"));
  return next;
}

function PermissionRow({ label, description, value, onToggle, color }) {
  return (
    <div className="rounded-md p-3 flex items-center justify-between gap-3" style={{ background: "white", border: "1px solid #DAD5C8" }}>
      <div>
        <div className="text-sm">{label}</div>
        {description && <div className="text-xs" style={{ color: "#3C4A66" }}>{description}</div>}
      </div>
      <button onClick={onToggle} className="text-xs px-3 py-1 rounded-full font-medium flex-shrink-0" style={{ background: value ? color : "#EBE8DF", color: value ? "white" : "#3C4A66" }}>
        {value ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

async function readSectorStorage(key) {
  try {
    const res = await storage.get(key);
    return res && res.value ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}

function TuskHome({onNavigate}) {
 return <main className="life-workspace"><header className="life-hero"><img src="/tusk-home.png" alt="Ivory tusk sculpture with blue and gold light"/><div><span>YOUR WORLD, IN ONE PLACE</span><h1>Room to grow.</h1><p>School. Ambition. Performance. Wellbeing.</p><button onClick={()=>onNavigate('today')}>Open today</button></div></header><SyncStrip/><div className="life-sector-grid">{Object.entries(SECTOR_META).map(([key,meta])=>{const Icon=meta.icon;return <button key={key} onClick={()=>onNavigate(key)} style={{'--sector-color':meta.color}}><Icon size={30}/><h2>{meta.label}</h2><p>{AI_PROFILES[key].name}</p></button>;})}</div></main>;
}

function SectorShell({ title, color, icon: Icon, onBack, children, tabs, activeTab, setActiveTab, right }) {
  return (
    <div className="w-full min-h-[700px] flex flex-col tusk-sans" style={{ background: "#F4F2EC", color: "#182234" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .tusk-serif { font-family: 'Zilla Slab', Georgia, serif; }
        .tusk-sans { font-family: 'Inter', system-ui, sans-serif; }
        .tusk-shell-tabs { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .tusk-shell-tabs button { flex-shrink: 0; white-space: nowrap; }
        .tusk-shell-body { padding: 24px; }
        @media (max-width: 640px) {
          .tusk-shell-header { padding: 12px 16px !important; flex-direction: column; align-items: flex-start !important; gap: 8px; }
          .tusk-shell-body { padding: 14px !important; }
          .tusk-shell-tabs { padding-left: 12px !important; padding-right: 12px !important; }
        }
      `}</style>
      <div className="tusk-shell-header flex items-center justify-between px-6 py-4 flex-wrap gap-2" style={{ background: color, color: "white" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-xs opacity-90"><ChevronLeft size={14} /> Tusk Home</button>
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.4)" }} />
          <Icon size={18} />
          <span className="tusk-serif text-lg font-semibold">{title}</span>
        </div>
        {right}
      </div>
      {tabs && (
        <div className="tusk-shell-tabs flex gap-1 px-6 pt-3" style={{ background: "white", borderBottom: "1px solid #DAD5C8" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="text-xs px-3 py-2 rounded-t-md font-medium"
              style={{ background: activeTab === t.id ? "#F4F2EC" : "transparent", color: activeTab === t.id ? color : "#3C4A66", borderBottom: activeTab === t.id ? `2px solid ${color}` : "2px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="tusk-shell-body flex-1 min-h-0 overflow-y-auto" >{children}</div>
    </div>
  );
}

function SectorAssistant({profile}) {return <CoachPanel config={profile}/>;}

/* ---------------------------- Business sector ---------------------------- */

const BIZ_TASK_STATUSES = ["Not Started", "In Progress", "Waiting", "Completed", "Archived"];

function BusinessSector({ onBack }) {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [schoolDeadlines, setSchoolDeadlines] = useState([]);
  const [tab, setTab] = useState("overview");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [ideaForm, setIdeaForm] = useState({ title: "", description: "" });
  const [analyzingIdea, setAnalyzingIdea] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const data = await readSectorStorage(SECTOR_META.business.storageKey);
      if (data) { setTasks(data.tasks || []); setTransactions(data.transactions || []); setScorecards(data.scorecards || []); }
      const perms = await getPermissions();
      setPermissions(perms);
      if (perms.schoolToBusiness) {
        const school = await readSectorStorage(SECTOR_META.school.storageKey);
        if (school) {
          const today = localDateString();
          const deadlines = [
            ...(school.assignments || []).filter((a) => a.due_date >= today && a.status !== "completed").map((a) => ({ title: a.title, date: a.due_date, kind: "assignment" })),
            ...(school.tests || []).filter((t) => t.date >= today).map((t) => ({ title: t.title, date: t.date, kind: "test" })),
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
          setSchoolDeadlines(deadlines);
        }
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    storage.set(SECTOR_META.business.storageKey, JSON.stringify({ tasks, transactions, scorecards })).catch(() => {});
  }, [tasks, transactions, scorecards]);

  const revenue = transactions.filter((t) => t.type === "revenue").reduce((s, t) => s + Number(t.amount || 0), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const profit = revenue - expenses;
  const activeTasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Archived");
  const upcomingDeadlines = activeTasks.filter((t) => t.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);

  async function analyzeIdea() {
    if (!ideaForm.title.trim() && !ideaForm.description.trim()) return;
    setAnalyzingIdea(true);
    try {
      const { text } = await callClaude({
        system: AI_PROFILES.business.system,
        messages: [{
          role: "user",
          content: `Analyze this business idea like a real venture, not a school project. Idea: "${ideaForm.title}". Description: ${ideaForm.description || "none given"}. ` +
            "Walk through: problem, customer, market, competition, value proposition, business model, revenue, costs, margins, scalability, risks, competitive advantage, customer acquisition, operations, legal/regulatory considerations, execution difficulty. " +
            "Clearly flag what's an IDEA vs an ASSUMPTION vs EVIDENCE vs a RISK vs a FACT vs an UNKNOWN. Do not simply validate the idea — find real weaknesses and propose ways to test the riskiest assumptions. End with one concrete next challenge.",
        }],
        maxTokens: 900,
      });
      setScorecards((prev) => [{ id: uid("sc"), title: ideaForm.title, description: ideaForm.description, analysis: text, created_at: new Date().toISOString() }, ...prev]);
      setIdeaForm({ title: "", description: "" });
    } catch (e) {
      setScorecards((prev) => [{ id: uid("sc"), title: ideaForm.title, description: ideaForm.description, analysis: "Business Boss couldn't analyze this right now — try again.", created_at: new Date().toISOString() }, ...prev]);
    } finally {
      setAnalyzingIdea(false);
    }
  }

  if (!ready) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  return (
    <SectorShell title="Business" color={SECTOR_META.business.color} icon={Briefcase} onBack={onBack} right={<SyncButton scope="business"/>}
      tabs={[{ id: "overview", label: "Overview" }, { id: "tasks", label: "Tasks" }, { id: "finance", label: "Finance" }, { id: "scorecard", label: "Idea Scorecard" }, { id: "assistant", label: "Business Boss" }]}
      activeTab={tab} setActiveTab={setTab}
    >
      {tab === "overview" && (
        <div>
          <div className="flex gap-3 flex-wrap mb-6">
            <BizCard label="Revenue" value={`$${revenue.toLocaleString()}`} color="#22C55E" />
            <BizCard label="Expenses" value={`$${expenses.toLocaleString()}`} color="#EF4444" />
            <BizCard label="Profit" value={`$${profit.toLocaleString()}`} color={profit >= 0 ? "#22C55E" : "#EF4444"} />
            <BizCard label="Active tasks" value={activeTasks.length} color={SECTOR_META.business.color} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="tusk-serif font-semibold mb-2">Upcoming deadlines</h3>
              <div className="space-y-2">
                {upcomingDeadlines.map((t) => (
                  <div key={t.id} className="rounded-md p-3 text-xs" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                    <div className="font-medium">{t.title}</div>
                    <div style={{ color: "#3C4A66" }}>{t.deadline} · {t.status}</div>
                  </div>
                ))}
                {upcomingDeadlines.length === 0 && <p className="text-xs" style={{ color: "#3C4A66" }}>Nothing upcoming.</p>}
              </div>
            </div>
            <div>
              <h3 className="tusk-serif font-semibold mb-2">Recent activity</h3>
              <div className="space-y-2">
                {[...transactions].slice(-5).reverse().map((t) => (
                  <div key={t.id} className="rounded-md p-3 text-xs flex justify-between" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                    <span>{t.category || t.type}</span>
                    <span style={{ color: t.type === "revenue" ? "#22C55E" : "#EF4444" }}>{t.type === "revenue" ? "+" : "-"}${Number(t.amount).toLocaleString()}</span>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-xs" style={{ color: "#3C4A66" }}>No transactions logged yet.</p>}
              </div>
            </div>
          </div>
          {permissions.schoolToBusiness && schoolDeadlines.length > 0 && (
            <div className="mt-6">
              <h3 className="tusk-serif font-semibold mb-2 flex items-center gap-2"><GraduationCap size={14} color={SECTOR_META.school.color} /> From School (shared)</h3>
              <div className="space-y-1">
                {schoolDeadlines.map((d, i) => (
                  <div key={i} className="text-xs rounded-md p-2" style={{ background: "white", border: "1px solid #DAD5C8" }}>{d.kind === "test" ? "Test" : "Assignment"}: {d.title} — {d.date}</div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs mt-6" style={{ color: "#3C4A66" }}>Marketing and Product modules are scaffolded for a future pass — ask if you'd like either built out.</p>
        </div>
      )}

      {tab === "tasks" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="tusk-serif text-lg font-semibold">Business tasks</h2>
            <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.business.color }}><Plus size={14} /> Add task</button>
          </div>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-md p-3 flex items-center gap-3" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                <div className="flex-1">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs" style={{ color: "#3C4A66" }}>{t.category}{t.deadline ? ` · Due ${t.deadline}` : ""}{t.priority ? ` · ${t.priority}` : ""}</div>
                </div>
                <select value={t.status} onChange={(e) => setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, status: e.target.value } : x))} className="text-xs rounded-md px-2 py-1" style={{ border: "1px solid #DAD5C8" }}>
                  {BIZ_TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))} className="text-xs" style={{ color: "#B04A4A" }}>Remove</button>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm" style={{ color: "#3C4A66" }}>No business tasks yet.</p>}
          </div>
        </div>
      )}

      {tab === "finance" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="tusk-serif text-lg font-semibold">Transactions</h2>
            <button onClick={() => setShowTxnModal(true)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.business.color }}><Plus size={14} /> Add transaction</button>
          </div>
          <div className="flex gap-3 mb-4">
            <BizCard label="Revenue" value={`$${revenue.toLocaleString()}`} color="#22C55E" />
            <BizCard label="Expenses" value={`$${expenses.toLocaleString()}`} color="#EF4444" />
            <BizCard label="Profit" value={`$${profit.toLocaleString()}`} color={profit >= 0 ? "#22C55E" : "#EF4444"} />
          </div>
          <div className="space-y-2">
            {[...transactions].reverse().map((t) => (
              <div key={t.id} className="rounded-md p-3 flex items-center justify-between text-xs" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                <span>{t.date} · {t.category}{t.notes ? ` — ${t.notes}` : ""}</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: t.type === "revenue" ? "#22C55E" : "#EF4444" }}>{t.type === "revenue" ? "+" : "-"}${Number(t.amount).toLocaleString()}</span>
                  <button onClick={() => setTransactions((prev) => prev.filter((x) => x.id !== t.id))} style={{ color: "#B04A4A" }}>Remove</button>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-sm" style={{ color: "#3C4A66" }}>No transactions yet. The AI won't invent numbers — add real ones here.</p>}
          </div>
        </div>
      )}

      {tab === "scorecard" && (
        <div>
          <h2 className="tusk-serif text-lg font-semibold mb-1 flex items-center gap-2"><Award size={16} color={SECTOR_META.business.color} /> Idea Scorecard</h2>
          <p className="text-xs mb-4" style={{ color: "#3C4A66" }}>Business Boss will stress-test the idea rather than just approve it.</p>
          <div className="rounded-lg p-4 mb-4" style={{ background: "white", border: "1px solid #DAD5C8" }}>
            <input value={ideaForm.title} onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })} placeholder="Idea name" className="w-full mb-2 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} />
            <textarea value={ideaForm.description} onChange={(e) => setIdeaForm({ ...ideaForm, description: e.target.value })} placeholder="Describe the idea..." rows={3} className="w-full mb-2 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} />
            <button onClick={analyzeIdea} disabled={analyzingIdea} className="text-xs px-3 py-2 rounded-md font-medium text-white flex items-center gap-2" style={{ background: SECTOR_META.business.color }}>
              {analyzingIdea ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />} {analyzingIdea ? "Business Boss is thinking..." : "Get Business Boss's take"}
            </button>
          </div>
          <div className="space-y-3">
            {scorecards.map((s) => (
              <div key={s.id} className="rounded-lg p-4" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                <div className="text-sm font-medium mb-1">{s.title}</div>
                <div className="text-xs whitespace-pre-wrap" style={{ color: "#182234" }}>{s.analysis}</div>
              </div>
            ))}
            {scorecards.length === 0 && <p className="text-sm" style={{ color: "#3C4A66" }}>No ideas scored yet.</p>}
          </div>
        </div>
      )}

      {tab === "assistant" && (
        <SectorAssistant profile={AI_PROFILES.business} placeholder="What are my current expenses?"
          contextData={{ tasks, transactions, revenue, expenses, profit, school_deadlines_shared: permissions.schoolToBusiness ? schoolDeadlines : "not shared" }}
          crossSectorNote={permissions.schoolToBusiness ? "School deadlines are shared with Business Boss." : "School data isn't shared with Business — enable it in Health & Wellness → Privacy & Permissions if you want it."}
        />
      )}

      {showTaskModal && <BizTaskModal onClose={() => setShowTaskModal(false)} onSave={(t) => { setTasks((prev) => [...prev, { id: uid("biz"), status: "Not Started", ...t }]); setShowTaskModal(false); }} />}
      {showTxnModal && <BizTxnModal onClose={() => setShowTxnModal(false)} onSave={(t) => { setTransactions((prev) => [...prev, { id: uid("txn"), ...t }]); setShowTxnModal(false); }} />}
    </SectorShell>
  );
}

function BizCard({ label, value, color }) {
  return (
    <div className="rounded-lg px-4 py-3 flex-1 min-w-[120px]" style={{ background: "white", border: "1px solid #DAD5C8" }}>
      <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "#3C4A66" }}>{label}</div>
      <div className="tusk-serif text-2xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

function BizTaskModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: "", description: "", category: "", priority: "medium", deadline: "", estimated_time: "", notes: "", related_project: "" });
  useEscapeToClose(onClose);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.4)" }} onClick={onClose}>
      <div className="rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ background: "#F4F2EC" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="tusk-serif text-lg font-semibold">Add business task</h2><button onClick={onClose}><X size={16} /></button></div>
        <div className="space-y-3">
          {["title", "description", "category", "related_project", "notes"].map((f) => (
            <label key={f} className="block text-xs" style={{ color: "#3C4A66" }}>{f.replace("_", " ")}
              <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs" style={{ color: "#3C4A66" }}>Priority
              <select className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block text-xs" style={{ color: "#3C4A66" }}>Deadline
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: "#DAD5C8" }}>Cancel</button>
          <button onClick={() => form.title.trim() && onSave(form)} className="text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.business.color }}>Save task</button>
        </div>
      </div>
    </div>
  );
}

function BizTxnModal({ onClose, onSave }) {
  const [form, setForm] = useState({ type: "revenue", amount: "", category: "", date: localDateString(), notes: "" });
  useEscapeToClose(onClose);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.4)" }} onClick={onClose}>
      <div className="rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ background: "#F4F2EC" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="tusk-serif text-lg font-semibold">Add transaction</h2><button onClick={onClose}><X size={16} /></button></div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setForm({ ...form, type: "revenue" })} className="flex-1 text-xs px-3 py-2 rounded-md font-medium border" style={{ background: form.type === "revenue" ? "#22C55E" : "white", color: form.type === "revenue" ? "white" : "#182234", borderColor: "#DAD5C8" }}>Revenue</button>
            <button onClick={() => setForm({ ...form, type: "expense" })} className="flex-1 text-xs px-3 py-2 rounded-md font-medium border" style={{ background: form.type === "expense" ? "#EF4444" : "white", color: form.type === "expense" ? "white" : "#182234", borderColor: "#DAD5C8" }}>Expense</button>
          </div>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Amount
            <input type="number" className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Category
            <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </label>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Date
            <input type="date" className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Notes
            <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: "#DAD5C8" }}>Cancel</button>
          <button onClick={() => form.amount && onSave(form)} className="text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.business.color }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Sports sector ---------------------------- */

function SportsSector({ onBack }) {
  const [ready, setReady] = useState(false);
  const [sports, setSports] = useState(["Soccer", "Running"]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [schoolDeadlines, setSchoolDeadlines] = useState([]);
  const [healthLatest, setHealthLatest] = useState(null);
  const [tab, setTab] = useState("overview");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(null); // "daily" | "weekly" | null
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const data = await readSectorStorage(SECTOR_META.sports.storageKey);
      if (data) { setSports(data.sports || ["Running"]); setSessions(data.sessions || []); setGoals(data.goals || []); setBriefs(data.briefs || []); }
      const perms = await getPermissions();
      setPermissions(perms);
      if (perms.schoolToSports) {
        const school = await readSectorStorage(SECTOR_META.school.storageKey);
        if (school) {
          const today = localDateString();
          const deadlines = [
            ...(school.assignments || []).filter((a) => a.due_date >= today && a.status !== "completed").map((a) => ({ title: a.title, date: a.due_date, kind: "assignment" })),
            ...(school.tests || []).filter((t) => t.date >= today).map((t) => ({ title: t.title, date: t.date, kind: "test" })),
          ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
          setSchoolDeadlines(deadlines);
        }
      }
      if (perms.sportsToHealth) {
        const health = await readSectorStorage(SECTOR_META.health.storageKey);
        if (health && health.reports && health.reports.length) {
          setHealthLatest([...health.reports].sort((a, b) => (b.date_range_end || "").localeCompare(a.date_range_end || ""))[0]);
        }
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    storage.set(SECTOR_META.sports.storageKey, JSON.stringify({ sports, sessions, goals, briefs })).catch(() => {});
  }, [sports, sessions, goals, briefs]);

  const todayStr = localDateString();
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const upcoming = sessions.filter((s) => s.date > todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const recent = [...sessions].filter((s) => s.date <= todayStr).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const weekAgoDate = new Date();
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgo = localDateString(weekAgoDate);
  const weekSessions = sessions.filter((s) => s.date >= weekAgo && s.date <= todayStr);
  const weekVolume = weekSessions.reduce((sum, s) => sum + Number(s.duration || 0), 0);

  async function generateBrief(kind) {
    setGeneratingBrief(kind);
    try {
      const dataForBrief = kind === "daily"
        ? { today_sessions: todaySessions, upcoming: upcoming.slice(0, 3), recent: recent.slice(0, 3), goals, health: healthLatest, school_deadlines: schoolDeadlines }
        : { week_sessions: weekSessions, week_volume: weekVolume, goals, health: healthLatest, school_deadlines: schoolDeadlines };
      const prompt = kind === "daily"
        ? "Produce a DAILY PERFORMANCE BRIEF from this data: sleep/recovery (if available), recent training, upcoming competition, recent performance, one key trend, the main area to improve, and a suggested focus for today. Keep it tight and concrete."
        : "Produce a WEEKLY PERFORMANCE REVIEW from this data: training volume, performance trends, recovery/sleep trends (if available), goal progress, areas of improvement, and areas requiring attention. Keep it tight and concrete.";
      const result = await runCoach({config:AI_PROFILES.sports,question:prompt,history:[]});
      const text = "DEMO COACH · " + result.text;
      setBriefs((prev) => [{ id: uid("brief"), kind, content: text, created_at: new Date().toISOString() }, ...prev].slice(0, 10));
    } catch (e) {
      setBriefs((prev) => [{ id: uid("brief"), kind, content: "Elite Coach couldn't generate this right now — try again.", created_at: new Date().toISOString() }, ...prev].slice(0, 10));
    } finally {
      setGeneratingBrief(null);
    }
  }

  if (!ready) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  return (
    <SectorShell title="Sports" color={SECTOR_META.sports.color} icon={Activity} onBack={onBack} right={<SyncButton scope="sports"/>}
      tabs={[{ id: "overview", label: "Overview" }, { id: "training", label: "Training" }, { id: "goals", label: "Goals" }, { id: "briefs", label: "Performance Briefs" }, { id: "assistant", label: "Elite Coach" }]}
      activeTab={tab} setActiveTab={setTab}
    >
      {tab === "overview" && (
        <div>
          <div className="flex gap-3 flex-wrap mb-6">
            <BizCard label="Today's sessions" value={todaySessions.length} color={SECTOR_META.sports.color} />
            <BizCard label="This week (min)" value={weekVolume} color={SECTOR_META.sports.color} />
            <BizCard label="Upcoming" value={upcoming.length} color={SECTOR_META.sports.color} />
            <BizCard label="Active goals" value={goals.filter((g) => g.status !== "completed").length} color={SECTOR_META.sports.color} />
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {sports.map((s) => <span key={s} className="text-xs px-3 py-1 rounded-full" style={{ background: "white", border: "1px solid #DAD5C8" }}>{s}</span>)}
            <button onClick={() => { const s = prompt("Add a sport (e.g. Swimming)"); if (s) setSports((prev) => [...prev, s]); }} className="text-xs px-3 py-1 rounded-full border flex items-center gap-1" style={{ borderColor: "#DAD5C8" }}><Plus size={11} /> Add sport</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="tusk-serif font-semibold mb-2">Recent sessions</h3>
              <div className="space-y-2">
                {recent.map((s) => (
                  <div key={s.id} className="rounded-md p-3 text-xs" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                    <div className="font-medium">{s.sport} — {s.type || "Training"}</div>
                    <div style={{ color: "#3C4A66" }}>{s.date} · {s.duration} min{s.distance ? ` · ${s.distance}` : ""}</div>
                  </div>
                ))}
                {recent.length === 0 && <p className="text-xs" style={{ color: "#3C4A66" }}>No sessions logged yet.</p>}
              </div>
            </div>
            <div>
              <h3 className="tusk-serif font-semibold mb-2">Goal progress</h3>
              <div className="space-y-2">
                {goals.map((g) => (
                  <div key={g.id} className="rounded-md p-3 text-xs" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                    <div className="font-medium">{g.name} ({g.sport})</div>
                    <div className="rounded-full h-1.5 mt-1" style={{ background: "#EBE8DF" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (Number(g.current || 0) / Number(g.target || 1)) * 100)}%`, background: SECTOR_META.sports.color }} />
                    </div>
                    <div style={{ color: "#3C4A66" }} className="mt-1">{g.current} / {g.target}{g.deadline ? ` · by ${g.deadline}` : ""}</div>
                  </div>
                ))}
                {goals.length === 0 && <p className="text-xs" style={{ color: "#3C4A66" }}>No goals set yet.</p>}
              </div>
            </div>
          </div>
          {permissions.schoolToSports && schoolDeadlines.length > 0 && (
            <div className="mt-6">
              <h3 className="tusk-serif font-semibold mb-2 flex items-center gap-2"><GraduationCap size={14} color={SECTOR_META.school.color} /> From School (shared)</h3>
              <div className="space-y-1">
                {schoolDeadlines.map((d, i) => <div key={i} className="text-xs rounded-md p-2" style={{ background: "white", border: "1px solid #DAD5C8" }}>{d.kind === "test" ? "Test" : "Assignment"}: {d.title} — {d.date}</div>)}
              </div>
            </div>
          )}
          {permissions.sportsToHealth && healthLatest && (
            <div className="mt-4">
              <h3 className="tusk-serif font-semibold mb-2 flex items-center gap-2"><HeartPulse size={14} color={SECTOR_META.health.color} /> From Health (shared)</h3>
              <div className="text-xs rounded-md p-2" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                {healthLatest.sleep_minutes ? `Sleep: ${Math.floor(healthLatest.sleep_minutes / 60)}h${healthLatest.sleep_minutes % 60}m` : ""}{healthLatest.activity_minutes ? ` · Activity: ${healthLatest.activity_minutes}min` : ""}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "training" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="tusk-serif text-lg font-semibold">Training sessions</h2>
            <button onClick={() => setShowSessionModal(true)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.sports.color }}><Plus size={14} /> Log session</button>
          </div>
          <div className="space-y-2">
            {[...sessions].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
              <div key={s.id} className="rounded-md p-3 flex items-center justify-between" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                <div className="text-xs">
                  <div className="font-medium">{s.sport} — {s.type || "Training"}</div>
                  <div style={{ color: "#3C4A66" }}>{s.date} · {s.duration} min{s.distance ? ` · ${s.distance}` : ""}{s.intensity ? ` · ${s.intensity}` : ""}</div>
                  {s.notes && <div style={{ color: "#3C4A66" }}>{s.notes}</div>}
                </div>
                <button onClick={() => setSessions((prev) => prev.filter((x) => x.id !== s.id))} className="text-xs" style={{ color: "#B04A4A" }}>Remove</button>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm" style={{ color: "#3C4A66" }}>No sessions yet.</p>}
          </div>
        </div>
      )}

      {tab === "goals" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="tusk-serif text-lg font-semibold">Sports goals</h2>
            <button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.sports.color }}><Plus size={14} /> Add goal</button>
          </div>
          <div className="space-y-2">
            {goals.map((g) => (
              <div key={g.id} className="rounded-md p-3" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{g.name} <span className="text-xs" style={{ color: "#3C4A66" }}>({g.sport})</span></div>
                  <button onClick={() => setGoals((prev) => prev.filter((x) => x.id !== g.id))} className="text-xs" style={{ color: "#B04A4A" }}>Remove</button>
                </div>
                <div className="rounded-full h-2 mt-2" style={{ background: "#EBE8DF" }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (Number(g.current || 0) / Number(g.target || 1)) * 100)}%`, background: SECTOR_META.sports.color }} />
                </div>
                <div className="text-xs mt-1" style={{ color: "#3C4A66" }}>{g.current} / {g.target}{g.deadline ? ` · by ${g.deadline}` : ""}</div>
              </div>
            ))}
            {goals.length === 0 && <p className="text-sm" style={{ color: "#3C4A66" }}>No goals yet.</p>}
          </div>
        </div>
      )}

      {tab === "briefs" && (
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button onClick={() => generateBrief("daily")} disabled={!!generatingBrief} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.sports.color }}>
              {generatingBrief === "daily" ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />} Daily Performance Brief
            </button>
            <button onClick={() => generateBrief("weekly")} disabled={!!generatingBrief} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md font-medium border" style={{ borderColor: SECTOR_META.sports.color, color: SECTOR_META.sports.color }}>
              {generatingBrief === "weekly" ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />} Weekly Performance Review
            </button>
          </div>
          <div className="space-y-3">
            {briefs.map((b) => (
              <div key={b.id} className="rounded-lg p-4" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                <div className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: SECTOR_META.sports.color }}>{b.kind === "daily" ? "Daily Performance Brief" : "Weekly Performance Review"} · {new Date(b.created_at).toLocaleDateString()}</div>
                <div className="text-xs whitespace-pre-wrap">{b.content}</div>
              </div>
            ))}
            {briefs.length === 0 && <p className="text-sm" style={{ color: "#3C4A66" }}>No briefs generated yet.</p>}
          </div>
        </div>
      )}

      {tab === "assistant" && (
        <SectorAssistant profile={AI_PROFILES.sports} placeholder="How much have I trained this week?"
          contextData={{ sessions, goals, sports, school_deadlines_shared: permissions.schoolToSports ? schoolDeadlines : "not shared", health_shared: permissions.sportsToHealth ? healthLatest : "not shared" }}
          crossSectorNote={[
            permissions.schoolToSports ? "School deadlines shared." : null,
            permissions.sportsToHealth ? "Health data shared." : "Health data not shared — enable in Health & Wellness → Privacy & Permissions for sleep/recovery-aware coaching.",
          ].filter(Boolean).join(" ")}
        />
      )}

      {showSessionModal && <SportsSessionModal sports={sports} onClose={() => setShowSessionModal(false)} onSave={(s) => { setSessions((prev) => [...prev, { id: uid("sess"), ...s }]); setShowSessionModal(false); }} />}
      {showGoalModal && <SportsGoalModal sports={sports} onClose={() => setShowGoalModal(false)} onSave={(g) => { setGoals((prev) => [...prev, { id: uid("goal"), status: "active", ...g }]); setShowGoalModal(false); }} />}
    </SectorShell>
  );
}

function SportsSessionModal({ sports, onClose, onSave }) {
  const [form, setForm] = useState({ sport: sports[0] || "", date: localDateString(), duration: "", type: "", distance: "", intensity: "medium", notes: "" });
  useEscapeToClose(onClose);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.4)" }} onClick={onClose}>
      <div className="rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ background: "#F4F2EC" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="tusk-serif text-lg font-semibold">Log training session</h2><button onClick={onClose}><X size={16} /></button></div>
        <div className="space-y-3">
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Sport
            <select className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
              {sports.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs" style={{ color: "#3C4A66" }}>Date
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="block text-xs" style={{ color: "#3C4A66" }}>Duration (min)
              <input type="number" className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </label>
          </div>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Type
            <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Interval run, competition, recovery..." />
          </label>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Distance / metrics
            <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} placeholder="5km, 18 holes, etc." />
          </label>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Notes
            <textarea className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: "#DAD5C8" }}>Cancel</button>
          <button onClick={() => form.sport && form.date && onSave(form)} className="text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.sports.color }}>Save session</button>
        </div>
      </div>
    </div>
  );
}

function SportsGoalModal({ sports, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", sport: sports[0] || "", target: "", current: "", deadline: "", notes: "" });
  useEscapeToClose(onClose);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(24,34,52,0.4)" }} onClick={onClose}>
      <div className="rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ background: "#F4F2EC" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="tusk-serif text-lg font-semibold">Add sports goal</h2><button onClick={onClose}><X size={16} /></button></div>
        <div className="space-y-3">
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Goal name
            <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Sport
            <select className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
              {sports.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs" style={{ color: "#3C4A66" }}>Target
              <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </label>
            <label className="block text-xs" style={{ color: "#3C4A66" }}>Current
              <input className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
            </label>
          </div>
          <label className="block text-xs" style={{ color: "#3C4A66" }}>Deadline
            <input type="date" className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid #DAD5C8" }} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border" style={{ borderColor: "#DAD5C8" }}>Cancel</button>
          <button onClick={() => form.name.trim() && onSave(form)} className="text-xs px-3 py-2 rounded-md font-medium text-white" style={{ background: SECTOR_META.sports.color }}>Save goal</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Health & Wellness sector ---------------------------- */

function HealthSector({ onBack }) {
  const [ready, setReady] = useState(false);
  const [reports, setReports] = useState([]);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [tab, setTab] = useState("overview");
  const [syncing, setSyncing] = useState(false);
  const [syncErrorInfo, setSyncErrorInfo] = useState(null);
  const [lastSyncNote, setLastSyncNote] = useState(null);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const data = await readSectorStorage(SECTOR_META.health.storageKey);
      if (data) setReports(data.reports || []);
      const perms = await getPermissions();
      setPermissions(perms);
      loaded.current = true;
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    storage.set(SECTOR_META.health.storageKey, JSON.stringify({ reports })).catch(() => {});
  }, [reports]);

  async function togglePermission(key) {
    const next = await setPermission(key, !permissions[key]);
    setPermissions(next);
  }

  const latest = [...reports].sort((a, b) => (b.date_range_end || "").localeCompare(a.date_range_end || ""))[0] || null;

  async function syncHealthData() {
    setSyncing(true);
    setSyncErrorInfo(null);
    try {
      const { text } = await callClaude({
        mcpServers: [GMAIL_MCP],
        maxTokens: 900,
        messages: [
          {
            role: "user",
            content:
              "Search my Gmail from the last 30 days for weekly health/wellness reports or summaries (e.g. from a fitness tracker, health app, or wellness service). " +
              "Prioritize emails/reports containing terms like: weekly health report, weekly wellness report, health summary, wellness summary, sleep, activity, exercise, fitness, recovery, nutrition, hydration, health data, fitness report. " +
              "Also recognize relevant emails by sender, subject and structure even without those exact words. " +
              "For each report found, extract: date_range_start, date_range_end (YYYY-MM-DD), sleep_minutes (if mentioned), activity_minutes (if mentioned), and any other clearly-stated metrics as a metrics object — never invent a number that isn't actually in the email. " +
              "Respond with ONLY this JSON, no other text: " +
              '{"reports":[{"date_range_start":"","date_range_end":"","sleep_minutes":null,"activity_minutes":null,"metrics":{},"source_message_id":""}],"emails_scanned":0}',
          },
        ],
      });
      const parsed = extractJson(text);
      if (!parsed) throw new Error("Could not parse health sync response");
      const found = parsed.reports || [];
      let added = 0;
      setReports((prev) => {
        const next = [...prev];
        found.forEach((r) => {
          if (!r.date_range_end) return;
          const exists = next.some((x) => x.source_message_id === r.source_message_id || x.date_range_end === r.date_range_end);
          if (!exists) { next.push({ id: uid("health"), ...r, created_at: new Date().toISOString() }); added++; }
        });
        return next;
      });
      setLastSyncNote(`${parsed.emails_scanned || 0} emails scanned, ${added} new report${added === 1 ? "" : "s"} found.`);
    } catch (e) {
      setSyncErrorInfo(classifySyncError(e));
    } finally {
      setSyncing(false);
    }
  }

  if (!ready) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  return (
    <SectorShell title="Health & Wellness" color={SECTOR_META.health.color} icon={HeartPulse} onBack={onBack}
      tabs={[{ id: "overview", label: "Overview" }, { id: "reports", label: "Reports" }, { id: "privacy", label: "Privacy & Permissions" }, { id: "assistant", label: "Wellness Coach" }]}
      activeTab={tab} setActiveTab={setTab}
      right={<SyncButton scope="health"/>}
    >
      {syncErrorInfo && (
        <div className="mb-4 rounded-md p-3 text-xs" style={{ background: "#FDECEC", border: "1px solid #F5C6C6" }}>
          <div className="font-medium mb-1">{syncErrorInfo.icon} {syncErrorInfo.title}</div>
          <div style={{ color: "#3C4A66" }}>{syncErrorInfo.reason} {syncErrorInfo.action}</div>
        </div>
      )}
      {lastSyncNote && !syncErrorInfo && <div className="mb-4 text-xs" style={{ color: "#3C4A66" }}>{lastSyncNote}</div>}

      {tab === "overview" && (
        <div>
          <h2 className="tusk-serif text-lg font-semibold mb-1">Your wellness snapshot</h2>
          {latest ? (
            <div className="grid grid-cols-2 gap-3 mt-3 max-w-md">
              <BizCard label="Sleep" value={latest.sleep_minutes ? `${Math.floor(latest.sleep_minutes / 60)}h ${latest.sleep_minutes % 60}m` : "No data"} color={SECTOR_META.health.color} />
              <BizCard label="Activity" value={latest.activity_minutes ? `${latest.activity_minutes} min` : "No data"} color={SECTOR_META.health.color} />
            </div>
          ) : (
            <p className="text-sm mt-2" style={{ color: "#3C4A66" }}>No health reports imported. Open Sync Health to check Gmail connection setup.</p>
          )}
          <p className="text-xs mt-4" style={{ color: "#3C4A66" }}>Only numbers actually found in your emails are shown here — nothing is estimated or inferred as fact.</p>
        </div>
      )}

      {tab === "reports" && (
        <div>
          <h2 className="tusk-serif text-lg font-semibold mb-3">Imported reports</h2>
          <div className="space-y-2">
            {[...reports].sort((a, b) => (b.date_range_end || "").localeCompare(a.date_range_end || "")).map((r) => (
              <div key={r.id} className="rounded-md p-3 flex items-center justify-between text-xs" style={{ background: "white", border: "1px solid #DAD5C8" }}>
                <span>{r.date_range_start} → {r.date_range_end}{r.sleep_minutes ? ` · Sleep ${Math.floor(r.sleep_minutes / 60)}h${r.sleep_minutes % 60}m` : ""}{r.activity_minutes ? ` · Activity ${r.activity_minutes}min` : ""}</span>
                <button onClick={() => setReports((prev) => prev.filter((x) => x.id !== r.id))} style={{ color: "#B04A4A" }}>Delete</button>
              </div>
            ))}
            {reports.length === 0 && <p className="text-sm" style={{ color: "#3C4A66" }}>No reports imported yet.</p>}
          </div>
        </div>
      )}

      {tab === "privacy" && (
        <div className="max-w-md">
          <h2 className="tusk-serif text-lg font-semibold mb-3 flex items-center gap-2"><ShieldCheck size={16} /> Privacy & Permissions</h2>
          <p className="text-xs mb-4" style={{ color: "#3C4A66" }}>This is the one shared control panel for cross-sector data access — used by every sector's AI, not just Health. Health data is private by default.</p>

          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#3C4A66" }}>Health sharing out</div>
          <div className="space-y-2 mb-5">
            <PermissionRow label="Share with School" value={permissions.healthToSchool} onToggle={() => togglePermission("healthToSchool")} color={SECTOR_META.health.color} />
            <PermissionRow label="Share with Business" value={permissions.healthToBusiness} onToggle={() => togglePermission("healthToBusiness")} color={SECTOR_META.health.color} />
            <PermissionRow label="Share with Sports" value={permissions.healthToSports} onToggle={() => togglePermission("healthToSports")} color={SECTOR_META.health.color} description="Also controlled below by Sports → Health, since Elite Coach needs both directions to reason about sleep and recovery." />
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#3C4A66" }}>Other sectors requesting Health data</div>
          <div className="space-y-2 mb-5">
            <PermissionRow label="Sports → Health" description="Lets Elite Coach factor in sleep/recovery. Requires authorization — off by default." value={permissions.sportsToHealth} onToggle={() => togglePermission("sportsToHealth")} color={SECTOR_META.health.color} />
            <PermissionRow label="Business → Health" value={permissions.businessToHealth} onToggle={() => togglePermission("businessToHealth")} color={SECTOR_META.health.color} />
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#3C4A66" }}>School sharing out (used by Business Boss / Elite Coach)</div>
          <div className="space-y-2">
            <PermissionRow label="School → Business" value={permissions.schoolToBusiness} onToggle={() => togglePermission("schoolToBusiness")} color={SECTOR_META.school.color} />
            <PermissionRow label="School → Sports" value={permissions.schoolToSports} onToggle={() => togglePermission("schoolToSports")} color={SECTOR_META.school.color} />
          </div>
        </div>
      )}

      {tab === "assistant" && (
        <SectorAssistant profile={AI_PROFILES.health} placeholder="Summarize my health report"
          contextData={{ reports }}
        />
      )}
    </SectorShell>
  );
}

/* ---------------------------- Global AI Assistant ---------------------------- */

function GlobalAssistant({onBack}) {return <SectorShell title="AI Personal Assistant" color="#1E293B" icon={Sparkles} onBack={onBack}><CoachPanel config={AI_PROFILES.global}/></SectorShell>;}

/* ---------------------------- Top-level app ---------------------------- */

function TuskApp() {
  const [sector, setSector] = useState("today");

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    Promise.resolve(context.registerTool({
      name: "navigate_tusk_sector", title: "Open Tusk section",
      description: "Navigate to a section of the Tusk planner.",
      inputSchema: {type:"object",properties:{sector:{type:"string",enum:["today","week","ib","soccer","experiments","reflection","memory","home","school","business","sports","health","assistant"]}},required:["sector"],additionalProperties:false},
      annotations: {readOnlyHint:false},
      async execute(input) {
        if (!input || !["today","week","ib","soccer","experiments","reflection","memory","home","school","business","sports","health","assistant"].includes(input.sector)) throw new Error("Unknown section");
        setSector(input.sector);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return {section:input.sector};
      }
    }, {signal:lifecycle.signal})).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  const navigate = value => {setSector(value);window.scrollTo({top:0,behavior:'instant'});};
  let page;
  if(LIFE_VIEWS.includes(sector)) page=<LifeWorkspace view={sector} navigate={navigate}/>;
  else if(sector==='school')page=<SchoolSector onBack={()=>navigate('home')}/>;
  else if(sector==='business')page=<BusinessSector onBack={()=>navigate('home')}/>;
  else if(sector==='sports')page=<SportsSector onBack={()=>navigate('home')}/>;
  else if(sector==='health')page=<HealthSector onBack={()=>navigate('home')}/>;
  else if(sector==='assistant')page=<GlobalAssistant onBack={()=>navigate('home')}/>;
  else page=<TuskHome onNavigate={navigate}/>;
  return <><LifeNav view={sector} navigate={navigate}/>{page}</>;

}
export default function TuskRuntime() {
  const [ready,setReady]=useState(false);
  const [workspaceKey,setWorkspaceKey]=useState(0);
  const [loadError,setLoadError]=useState("");
  const [notice,setNotice]=useState("");
  const [saveError,setSaveError]=useState("");
  async function load() {setLoadError("");try {await initializeStorage();setReady(true);} catch {setLoadError("Your saved data could not be loaded. Try again before making changes.");}}
  useEffect(()=>{load();const onNotice=e=>setNotice(e.detail);const onSave=e=>setSaveError(e.detail);window.addEventListener("tusk-notice",onNotice);window.addEventListener("tusk-save-error",onSave);return()=>{window.removeEventListener("tusk-notice",onNotice);window.removeEventListener("tusk-save-error",onSave);};},[]);
  useEffect(()=>{const refresh=()=>setWorkspaceKey(k=>k+1);window.addEventListener("tusk-sync-imported",refresh);return()=>window.removeEventListener("tusk-sync-imported",refresh);},[]);
  if(!ready)return <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#05070C] text-white"><h1 className="text-3xl tusk-serif">Tusk</h1><p role="status">{loadError || "Opening your planner…"}</p>{loadError&&<><button className="rounded border px-5 py-2" onClick={load}>Try again</button><button className="rounded border px-5 py-2" onClick={()=>{startDemo(DEMO_RECORDS);setReady(true);}}>Explore sample workspace</button><a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in again</a></>}</main>;
  return <><div className="connection-note">ChatGPT coaches · Sync through your connected ChatGPT plugins · Google Health is not connected. {!isDemo()&&<button className="underline ml-3" onClick={()=>{try{startDemo(DEMO_RECORDS);setWorkspaceKey(k=>k+1);}catch(e){setNotice(e.message);}}}>Explore sample workspace</button>}</div>{saveError&&<div role="alert" className="save-notice">{saveError} <button onClick={retrySaves}>Retry saving</button></div>}{notice&&<div role="status" className="save-notice">{notice} <button onClick={()=>setNotice("")}>Dismiss</button></div>}{isDemo()&&<div className="save-notice">Sample workspace · All records are fictional. Changes last only in this tab. <button onClick={()=>location.reload()}>Return to saved workspace</button></div>}<TuskApp key={workspaceKey}/><SyncCenter/></>;
}
