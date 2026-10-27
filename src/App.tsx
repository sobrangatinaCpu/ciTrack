import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from './lib/supabase'
import {loginFaculty, registerFaculty,} from "./lib/auth"
type IconName = "home" | "calendar" | "book" | "chart" | "user" | "bell" | "search" | "play" | "arrow" | "clock" | "users" | "check" | "clipboard" | "scan" | "more" | "chevron" | "plus" | "minus" | "wifi" | "wifiOff" | "edit" | "logout" | "eye" | "eyeOff"
const formatDatabaseTime = (value: string) => {
  const [hoursValue, minutesValue] = value.split(":")
  const hours = Number(hoursValue)
  const minutes = Number(minutesValue ?? 0)
  const meridiem = hours >= 12 ? "PM" : "AM"

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${meridiem}`
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23.5zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5a3.5 3.5 0 0 1 3.5 3.5z" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    play: <path d="m9 7 9 5-9 5z" />,
    arrow: (
      <>
        <path d="m5 12 14 0m-5-5 5 5-5 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V2h6v2m-7 6h8m-8 4h6" />
      </>
    ),
    scan: (
      <>
        <path d="M4 8V4h4m8 0h4v4M4 16v4h4m8 0h4v-4" />
        <path d="M8 12h8" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    wifi: (
      <>
        <path d="M4.5 9.5a11 11 0 0 1 15 0M7.5 12.5a7 7 0 0 1 9 0M10.5 15.5a3 3 0 0 1 3 0" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </>
    ),
    wifiOff: (
      <>
        <path d="m3 3 18 18M4.5 9.5a11 11 0 0 1 4-2.3M19.5 9.5a11 11 0 0 0-8.9-2.1M7.5 12.5a7 7 0 0 1 2.9-1.5M16.5 12.5a7 7 0 0 0-2.5-1.4M10.5 15.5a3 3 0 0 1 .9-.4" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="m15 16 4-4-4-4M19 12H9" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.8" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17.7 17.7 0 0 1-3.1 3.8M6.2 6.2A17.7 17.7 0 0 0 2.5 12S6 19 12 19c1.3 0 2.5-.3 3.6-.8" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const classes = [
  {
    id: 1,
    subject: "Computer Systems Servicing",
    code: "BIT-CT 3A",
    time: "8:00 – 10:00 AM",
    room: "Lab 2",
    color: "#10a37f",
    status: "Next class",
    attendance: 32,
    semesterStart: "2026-06-06",
    semesterEnd: "2026-11-07",
    meetingDays: ["MON", "SAT"],
  },
  {
    id: 2,
    subject: "Networking Fundamentals",
    code: "BIT-CT 2B",
    time: "1:00 – 3:00 PM",
    room: "Lab 1",
    color: "#3677f5",
    status: "Later today",
    attendance: 28,
    semesterStart: "2026-06-06",
    semesterEnd: "2026-11-07",
    meetingDays: ["MON", "SAT"],
  },
]
type ClassSchedule = {
  id: string
  meetingDays: string[]
  startTime: string
  endTime: string
  room: string
}
type ClassItem = {
  id: string
  subject: string
  code: string
  time: string
  room: string
  color: string
  status: string
  attendance: number
  semesterStart: string
  semesterEnd: string
  meetingDays: string[]
  accessCode?: string
  schedules?: ClassSchedule[]
}

const meetingDayOptions = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
]

const formatSemesterDate = (value: string) => {
  if (!value) return "Date to be set"
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return "Date to be set"
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date)
}

const hasSemesterEnded = (item: ClassItem) => {
  const semesterEnd = new Date(`${item.semesterEnd}T23:59:59`)
  return !Number.isNaN(semesterEnd.getTime()) && semesterEnd < new Date()
}

const formatMeetingDays = (days: string[]) =>
  days
    .map(
      (day) => meetingDayOptions.find((option) => option.value === day)?.label,
    )
    .filter(Boolean)
    .join(" & ")
const mapDatabaseClass = (item: any): ClassItem => {
  const schedules: ClassSchedule[] = (item.class_schedules ?? []).map(
    (schedule: any) => ({
      id: schedule.id,
      meetingDays: schedule.meeting_days ?? [],
      startTime: schedule.start_time ?? "",
      endTime: schedule.end_time ?? "",
      room: schedule.room ?? "",
    }),
  )
  const firstSchedule = schedules[0]
  return {
    id: item.id,
    subject: item.subject ?? "",
    code: item.code ?? "",
    time:
      firstSchedule?.startTime && firstSchedule?.endTime
        ? `${formatDatabaseTime(firstSchedule.startTime)} - ${formatDatabaseTime(firstSchedule.endTime)}`
        : item.start_time && item.end_time
          ? `${formatDatabaseTime(item.start_time)} - ${formatDatabaseTime(item.end_time)}`
          : "",
    room: firstSchedule?.room || item.room || "To be confirmed",
    color: item.color ?? "#7a62d3",
    status: item.status ?? "Scheduled",
    attendance: item.capacity ?? 0,
    semesterStart: item.semester_start ?? "",
    semesterEnd: item.semester_end ?? "",
    meetingDays: firstSchedule?.meetingDays ?? item.meeting_days ?? [],
    accessCode: item.access_code ?? "",
    schedules,
  }
}

type ActivityGroup = {
  id: string
  name: string
  studentIds: string[]
}

type ActivityItem = {
  classId: number
  date: string
  title: string
  type: string
  startTime: string
  endTime: string
  participation: string
  groups: ActivityGroup[]
}

const dashboardDate = "2026-10-23"

const initialActivities: ActivityItem[] = [
  {
    classId: 1,
    date: dashboardDate,
    title: "Quiz 3",
    type: "Quiz",
    startTime: "10:00",
    endTime: "11:00",
    participation: "Individual",
    groups: [],
  },
  {
    classId: 2,
    date: "2026-10-29",
    title: "Network Configuration",
    type: "Hands-on activity",
    startTime: "13:00",
    endTime: "15:00",
    participation: "Group",
    groups: [
      {
        id: "network-group-a",
        name: "Group A",
        studentIds: ["2026-0025", "2026-0026"],
      },
    ],
  },
  {
    classId: 1,
    date: "2026-11-05",
    title: "Laboratory Project",
    type: "Class activity",
    startTime: "09:00",
    endTime: "11:00",
    participation: "Individual",
    groups: [],
  },
]

const createActivityDraft = (): ActivityItem => ({
  classId: 1,
  title: "",
  type: "Quiz",
  date: "2026-10-30",
  startTime: "09:00",
  endTime: "10:00",
  participation: "Individual",
  groups: [],
})

const formatActivityTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number)
  const meridiem = hours >= 12 ? "PM" : "AM"
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${meridiem}`
}

const students = [
  {
    name: "Dela Cruz, Juan",
    id: "2026-0025",
    score: 88,
    attendance: "Present",
  },
  { name: "Reyes, Ana", id: "2026-0026", score: 91, attendance: "Present" },
  { name: "Santos, Mark", id: "2026-0027", score: 76, attendance: "Late" },
  {
    name: "Villanueva, Bea",
    id: "2026-0028",
    score: 94,
    attendance: "Present",
  },
  { name: "Garcia, Luis", id: "2026-0029", score: 84, attendance: "Pending" },
]

type StudentConcern = {
  id: string
  studentId: string
  category: string
  message: string
  section: string
  submittedAt: string
  status: "Open" | "Accepted" | "Denied"
}

const initialStudentConcerns: StudentConcern[] = [
  {
    id: "concern-ana-quiz",
    studentId: "2026-0026",
    category: "Academic petition",
    message:
      "May I take Quiz 2 during consultation hours because of a required campus appointment?",
    section: "BIT-CT 3A",
    submittedAt: "Today · 8:15 AM",
    status: "Open",
  },
  {
    id: "concern-mark-absence",
    studentId: "2026-0027",
    category: "Attendance concern",
    message:
      "I am requesting an excused absence for the hands-on activity and will submit the medical note.",
    section: "BIT-CT 2B",
    submittedAt: "Yesterday · 4:40 PM",
    status: "Open",
  },
]

const recordSections = [
  {
    id: "css-3a",
    subject: "Computer Systems Servicing",
    code: "BIT-CT 3A",
    schedule: "Mon & Sat · 8:00 – 10:00 AM",
    students: 32,
    assessmentCount: 6,
  },
  {
    id: "css-3b",
    subject: "Computer Systems Servicing",
    code: "BIT-CT 3B",
    schedule: "Tue & Thu · 10:00 AM – 12:00 PM",
    students: 30,
    assessmentCount: 5,
  },
  {
    id: "networking-2b",
    subject: "Networking Fundamentals",
    code: "BIT-CT 2B",
    schedule: "Mon & Sat · 1:00 – 3:00 PM",
    students: 28,
    assessmentCount: 4,
  },
]

type RecordAssessmentColumn = {
  id: string
  label: string
  type: "Quiz" | "Hands On" | "Activities" | "Exam" | "Attendance" | "Recitation"
  term?: "Midterm" | "Final"
}

const initialRecordAssessmentColumns: RecordAssessmentColumn[] = [
  { id: "quiz-1", label: "Midterm Quiz 1", type: "Quiz", term: "Midterm" },
  { id: "quiz-2", label: "Midterm Quiz 2", type: "Quiz", term: "Midterm" },
  {
    id: "midterm-project-1",
    label: "Midterm Project 1",
    type: "Hands On",
    term: "Midterm",
  },
  {
    id: "final-project-1",
    label: "Final Project 1",
    type: "Hands On",
    term: "Final",
  },
  {
    id: "midterm-recitation-1",
    label: "Midterm Recitation 1",
    type: "Recitation",
    term: "Midterm",
  },
  {
    id: "final-recitation-1",
    label: "Final Recitation 1",
    type: "Recitation",
    term: "Final",
  },
  {
    id: "midterm-attendance-1",
    label: "Midterm Attendance 1",
    type: "Attendance",
    term: "Midterm",
  },
  {
    id: "final-attendance-1",
    label: "Final Attendance 1",
    type: "Attendance",
    term: "Final",
  },
]

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "classes", label: "Classes", icon: "book" },
  { id: "records", label: "Records", icon: "chart" },
  { id: "activities", label: "Activities", icon: "calendar" },
  { id: "profile", label: "Profile", icon: "user" },
]

const professorPhoto =
  "https://images.unsplash.com/photo-1573497161161-c3e73707e25c?auto=format&fit=crop&w=240&q=85"

function Header({
  title = "Dashboard",
  onNotify,
  onProfile,
}: {
  title?: string
  onNotify: () => void
  onProfile?: () => void
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Wednesday, October 23</p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <button
          className="icon-button notification-button"
          aria-label="Open notifications"
          onClick={onNotify}
        >
          <Icon name="bell" />
          <span />
        </button>
        <button
          className="avatar-menu"
          onClick={onProfile}
          aria-label="Open Prof. Maria Santos profile"
        >
          <img className="mini-avatar" src={professorPhoto} alt="" />
          <span className="avatar-tooltip">
            <strong>Prof. Maria Santos</strong>
            <small>CIT Department</small>
          </span>
        </button>
      </div>
    </header>
  )
}

function Sidebar({
  page,
  setPage,
  onLogout,
}: {
  page: string
  setPage: (page: string) => void
  onLogout: () => void
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <img
              src="/cit.png"
              alt="CIT Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
        </div>
        <span>
          CIT<span> Portal</span>
        </span>
      </div>
      <nav className="side-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => setPage(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <button
        className="sidebar-logout"
        aria-label="Log out"
        title="Log out"
        onClick={onLogout}
      >
        <Icon name="logout" size={19} />
        <span>Log out</span>
      </button>
    </aside>
  )
}

function BottomNav({
  page,
  setPage,
}: {
  page: string
  setPage: (page: string) => void
}) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={page === item.id ? "active" : ""}
          onClick={() => setPage(item.id)}
        >
          <Icon name={item.icon} size={19} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function ConnectionNotice({
  online,
  onToggle,
}: {
  online: boolean
  onToggle: () => void
}) {
  return (
    <button
      className={`connection-notice ${online ? "online" : "offline"}`}
      onClick={onToggle}
      aria-label={`Switch to ${online ? "offline" : "online"} mode`}
    >
      <Icon name={online ? "wifi" : "wifiOff"} size={16} />
      <span>
        {online
          ? "Online · changes are synced"
          : "Offline · changes will update when you’re back online"}
      </span>
    </button>
  )
}
const dayCodeFromDate = (date: Date) =>
  ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()]

const minutesFromTime = (value: string) => {
  const [hoursValue, minutesValue] = value.split(":")
  const hours = Number(hoursValue)
  const minutes = Number(minutesValue ?? 0)
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : -1
}

const isClassScheduledNow = (item: ClassItem, now: Date) => {
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")

  if (item.semesterStart && localDate < item.semesterStart) return false
  if (item.semesterEnd && localDate > item.semesterEnd) return false

  const today = dayCodeFromDate(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const schedules = item.schedules?.length
    ? item.schedules
    : []

  return schedules.some((schedule) => {
    const startMinutes = minutesFromTime(schedule.startTime)
    const endMinutes = minutesFromTime(schedule.endTime)
    return (
      schedule.meetingDays.includes(today) &&
      startMinutes >= 0 &&
      endMinutes >= 0 &&
      currentMinutes >= startMinutes &&
      currentMinutes <= endMinutes
    )
  })
}

function ClassCard({
  item,
  onStart,
  ended,
  onEdit,
  onDelete,
  activity,
}: {
  item: ClassItem
  onStart: (item: ClassItem) => void
  ended: boolean
  onEdit?: (item: ClassItem) => void
  onDelete?: (item: ClassItem) => void
  activity?: ActivityItem
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const semesterEnded = hasSemesterEnded(item)
  const isEnded = ended || semesterEnded
  const canStartNow = !isEnded && isClassScheduledNow(item, now)
  return (
    <article className="class-card">
      <div className="class-accent" style={{ background: item.color }} />
      <div className="class-card-top">
        <span
          className="status-pill"
          style={{
            color: isEnded ? "#667587" : item.color,
            background: isEnded ? "#edf1f4" : `${item.color}12`,
          }}
        >
          {isEnded
            ? ended
              ? "Class Ended"
              : "Semester ended"
            : canStartNow
              ? "In session"
              : item.status}
        </span>
{onEdit ? (
  <div className="class-card-actions">
    <button
      type="button"
      className="class-card-edit"
      aria-label={`Edit ${item.subject}`}
      onClick={() => onEdit(item)}
    >
      <Icon name="edit" size={15} />
      <span>Edit</span>
    </button>

    {onDelete && (
      <button
        type="button"
        className="class-card-delete"
        aria-label={`Delete ${item.subject}`}
        onClick={() => onDelete(item)}
      >
        Delete
      </button>
    )}
  </div>
) : (
          <button aria-label={`More options for ${item.subject}`}>
            <Icon name="more" />
          </button>
        )}
      </div>
      <h3>{item.subject}</h3>
      <p className="class-code">{item.code}</p>
      <div className="class-meta">
        <span>
          <Icon name="clock" size={16} />
          {item.time}
        </span>
        <span>
          <Icon name="home" size={16} />
          {item.room}
        </span>
      </div>
      <div
        className="class-schedule-overview"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginTop: 16,
          padding: "14px 16px",
          border: "1px solid #e4ebf3",
          borderRadius: 12,
          background: "#f8fbff",
        }}
      >
        <div
          className="class-schedule-list"
          style={{
            display: "grid",
            gap: 10,
            minWidth: 0,
            flex: "1 1 360px",
          }}
        >
          {(item.schedules?.length
            ? item.schedules
            : [
                {
                  id: `legacy-${item.id}`,
                  meetingDays: item.meetingDays,
                  startTime: "",
                  endTime: "",
                  room: item.room,
                },
              ]
          ).map((schedule, index) => {
            const scheduleTime =
              schedule.startTime && schedule.endTime
                ? `${formatDatabaseTime(schedule.startTime)} - ${formatDatabaseTime(schedule.endTime)}`
                : index === 0
                  ? item.time
                  : "Time to be set"

            return (
              <div
                key={schedule.id}
                className="class-schedule-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 0.9fr) minmax(160px, 1.2fr) minmax(110px, 1fr)",
                  alignItems: "center",
                  gap: 12,
                  color: "#334155",
                  fontSize: 13,
                }}
              >
                <strong
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: "#0f4f8a",
                    fontWeight: 700,
                  }}
                >
                  <Icon name="calendar" size={15} />
                  {formatMeetingDays(schedule.meetingDays) || "Days to be set"}
                </strong>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <Icon name="clock" size={15} />
                  {scheduleTime}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <Icon name="home" size={15} />
                  {schedule.room || "To be confirmed"}
                </span>
              </div>
            )
          })}
        </div>

        <div
          className="class-semester-range"
          style={{
            marginLeft: "auto",
            flex: "0 0 auto",
            textAlign: "right",
            paddingLeft: 14,
            borderLeft: "1px solid #dbe5ef",
          }}
        >
          <small
            style={{
              display: "block",
              marginBottom: 4,
              color: "#64748b",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            Semester
          </small>
          <strong style={{ color: "#334155", fontSize: 12, whiteSpace: "nowrap" }}>
            {formatSemesterDate(item.semesterStart)} - {formatSemesterDate(item.semesterEnd)}
          </strong>
        </div>
      </div>
      {activity && (
        <div className="class-activity">
          <span>
            <Icon name="clipboard" size={15} />
            Today’s activity
          </span>
          <strong>{activity.title}</strong>
          <small>
            {formatActivityTime(activity.startTime)} –{" "}
            {formatActivityTime(activity.endTime)}
          </small>
        </div>
      )}
      <div className="class-footer">
        <div
          className="student-stack"
          aria-label={`${item.attendance} enrolled students`}
        >
          <span>JD</span>
          <span>AR</span>
          <span>+{item.attendance - 2}</span>
        </div>
        <button
          className={
            canStartNow
              ? "primary-button compact"
              : "secondary-button compact class-view-button"
          }
          onClick={() => onStart(item)}
        >
          {canStartNow ? <Icon name="play" size={16} /> : null}
          {canStartNow ? "Start class" : "View class"}
        </button>
      </div>
    </article>
  )
}

function Dashboard({
  onStart,
  setPage,
  endedClassIds,
  activities,
}: {
  onStart: (item: ClassItem) => void
  setPage: (page: string) => void
  endedClassIds: Array<string | number>
  activities: ActivityItem[]
}) {
  const [dashboardClasses, setDashboardClasses] = useState<ClassItem[]>([])

  useEffect(() => {
    async function loadDashboardClasses() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        if (userError) console.error("Unable to get signed-in faculty:", userError)
        setDashboardClasses([])
        return
      }

      const { data, error } = await supabase
        .from("classes")
        .select("*, class_schedules(id, meeting_days, start_time, end_time, room)")
        .eq("faculty_id", user.id)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Unable to load dashboard classes:", error)
        return
      }

      setDashboardClasses((data ?? []).map(mapDatabaseClass))
    }
    loadDashboardClasses()
  }, [])

  const todayActivities = activities.filter(
    (activity) => activity.date === dashboardDate,
  )
  const focusActivity = todayActivities[0]
  return (
    <>
      <Header
        onNotify={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
      />
      <section className="welcome">
        <div className="welcome-main">
          <div className="welcome-copy">
            <p className="eyebrow welcome-greeting">Good morning</p>
            <h2>Ready for today, Prof. Maria?</h2>
            <p className="welcome-status-message">
              <span className="fg-inline-bold" data-fge-id="fge-361">
                You have 2 classes and 3 records waiting for review.
              </span>
            </p>
          </div>
          <button
            className="day-activity"
            onClick={() => setPage("activities")}
            aria-label={
              focusActivity
                ? `Open today’s activity, ${focusActivity.title} at ${formatActivityTime(focusActivity.startTime)}`
                : "Open activities"
            }
          >
            <span className="day-activity-label">Today’s focus</span>
            <strong>{focusActivity?.title ?? "No activity yet"}</strong>
            <small>
              <Icon name="clock" size={13} />{" "}
              {focusActivity
                ? `${formatActivityTime(focusActivity.startTime)} · ${dashboardClasses.find((item) => String(item.id) === String(focusActivity.classId))?.code ?? "Class"}`
                : "Add an activity for today"}
            </small>
            <span className="day-activity-people" aria-hidden="true">
              <i>JD</i>
              <i>AR</i>
              <i>MS</i>
              <b>+29</b>
            </span>
            <span className="day-activity-shapes" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
        <div className="date-tile">
          <strong>23</strong>
          <span>OCT</span>
        </div>
        <div className="day-strip" aria-label="This week’s dates">
          {[
            { day: "MON", date: "21", status: "reminder" },
            { day: "TUE", date: "22", status: "free" },
            { day: "WED", date: "23", status: "reminder" },
            { day: "THU", date: "24", status: "reminder" },
            { day: "FRI", date: "25", status: "free" },
            { day: "SAT", date: "26", status: "free" },
            { day: "SUN", date: "27", status: "free" },
          ].map(({ day, date, status }) => (
            <button
              key={date}
              className={date === "23" ? "active" : ""}
              onClick={() => setPage("activities")}
              aria-label={`View activities for ${day} ${date} — ${
                status === "free"
                  ? "no activities scheduled"
                  : "activity reminder"
              }`}
            >
              <span>{day}</span>
              <strong>{date}</strong>
              <i className={`day-status-dot ${status}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section
        className="quick-summary section"
        aria-labelledby="quick-summary-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">At a glance</p>
            <h2 id="quick-summary-title">Quick summary</h2>
          </div>
        </div>
        <div className="summary-grid">
          <button onClick={() => setPage("classes")}>
            <span className="summary-icon green">
              <Icon name="calendar" />
            </span>
            <span>
              <strong>{dashboardClasses.length} {dashboardClasses.length === 1 ? "class" : "classes"}</strong>
              <small>Scheduled today</small>
            </span>
          </button>
          <button onClick={() => setPage("records")}>
            <span className="summary-icon amber">
              <Icon name="clipboard" />
            </span>
            <span>
              <strong>4 drafts</strong>
              <small>Records to finish</small>
            </span>
          </button>
          <button onClick={() => setPage("activities")}>
            <span className="summary-icon blue">
              <Icon name="users" />
            </span>
            <span>
              <strong>2 concerns</strong>
              <small>Need your attention</small>
            </span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your schedule</p>
            <h2>Today’s classes</h2>
          </div>
          <button onClick={() => setPage("classes")}>
            See all <Icon name="arrow" size={16} />
          </button>
        </div>
<div className="class-grid">
          {dashboardClasses.map((item) => (
            <ClassCard
              key={item.id}
              item={item}
              onStart={onStart}
              ended={endedClassIds.map(String).includes(String(item.id))}
              activity={todayActivities.find(
                (activity) => String(activity.classId) === String(item.id),
              )}
            />
          ))}
        </div>
      </section>
    </>
  )
}

function QuickActionsFab({
  setPage,
  onScanAnswer,
}: {
  setPage: (page: string) => void
  onScanAnswer: () => void
}) {
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [quickActionsPosition, setQuickActionsPosition] = useState({
    x: 0,
    y: 0,
  })
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    position: { x: number; y: number };
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    moved: boolean;
  } | null>(null)
  const suppressNextFabClick = useRef(false)
  const openQuickAction = (page: string) => {
    setQuickActionsOpen(false)
    setPage(page)
  }
  const startDragging = (event: React.PointerEvent<HTMLButtonElement>) => {
    const fabRect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      position: quickActionsPosition,
      minX: -(fabRect.left - quickActionsPosition.x),
      maxX: window.innerWidth - (fabRect.right - quickActionsPosition.x),
      minY: -(fabRect.top - quickActionsPosition.y),
      maxY: window.innerHeight - (fabRect.bottom - quickActionsPosition.y),
      moved: false,
    }
  }
  const drag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const activeDrag = dragState.current
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return
    const deltaX = event.clientX - activeDrag.startX
    const deltaY = event.clientY - activeDrag.startY
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) activeDrag.moved = true
    setQuickActionsPosition({
      x: Math.min(
        activeDrag.maxX,
        Math.max(activeDrag.minX, activeDrag.position.x + deltaX),
      ),
      y: Math.min(
        activeDrag.maxY,
        Math.max(activeDrag.minY, activeDrag.position.y + deltaY),
      ),
    })
  }
  const stopDragging = (event: React.PointerEvent<HTMLButtonElement>) => {
    const activeDrag = dragState.current
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return
    suppressNextFabClick.current = activeDrag.moved
    dragState.current = null
  }

  return (
    <div
      className={`summary-speed-dial ${quickActionsOpen ? "open" : ""}`}
      style={{
        transform: `translate(${quickActionsPosition.x}px, ${quickActionsPosition.y}px)`,
      }}
    >
      <div
        id="quick-actions-menu"
        className="summary-menu"
        role="menu"
        aria-label="Quick actions"
      >
        <div className="summary-menu-heading">
          <span className="summary-menu-eyebrow">Tools</span>
          <strong className="summary-menu-title">Quick actions</strong>
        </div>
        <button role="menuitem" onClick={() => openQuickAction("classes")}>
          <span className="summary-icon green">
            <Icon name="plus" />
          </span>
          <span>
            <strong className="summary-action-title">Create section</strong>
            <small className="summary-action-description">
              Add a class section
            </small>
          </span>
        </button>
        <button
          role="menuitem"
          onClick={() => {
            setQuickActionsOpen(false)
            onScanAnswer()
          }}
        >
          <span className="summary-icon amber">
            <Icon name="scan" />
          </span>
          <span>
            <strong className="summary-action-title">Scan answer</strong>
            <small className="summary-action-description">
              Open the OMR scanner
            </small>
          </span>
        </button>
        <button role="menuitem" onClick={() => openQuickAction("records")}>
          <span className="summary-icon blue">
            <Icon name="chart" />
          </span>
          <span>
            <strong className="summary-action-title">Open grade book</strong>
            <small className="summary-action-description">
              Review class records
            </small>
          </span>
        </button>
      </div>
      <button
        className="summary-fab"
        onPointerDown={startDragging}
        onPointerMove={drag}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onClick={() => {
          if (suppressNextFabClick.current) {
            suppressNextFabClick.current = false
            return
          }
          setQuickActionsOpen((open) => !open)
        }}
        aria-expanded={quickActionsOpen}
        aria-controls="quick-actions-menu"
        aria-label={
          quickActionsOpen ? "Close quick actions" : "Open quick actions"
        }
        title="Drag to move or click to open quick actions"
      >
        <Icon name="plus" size={25} />
      </button>
    </div>
  )
}

function OmrScannerModal({
  onClose,
  onSaveDraft,
}: {
  onClose: () => void
  onSaveDraft: (studentId: string, assessmentId: string, score: number) => void
}) {
  const assessmentOptions = initialRecordAssessmentColumns.filter(
    (assessment) => assessment.type === "Quiz" || assessment.type === "Exam",
  )
  const answerKeyAssessmentIds = ["quiz-1", "quiz-2", "midterm-exam"]
  const [step, setStep] = useState<"setup" | "scanner" | "review" | "saved">(
    "setup",
  )
  const [sectionId, setSectionId] = useState(recordSections[0].id)
  const [assessmentId, setAssessmentId] = useState(assessmentOptions[0].id)
  const [scanIndex, setScanIndex] = useState(0)
  const selectedSection =
    recordSections.find((section) => section.id === sectionId) ??
    recordSections[0]
  const selectedAssessment =
    assessmentOptions.find((assessment) => assessment.id === assessmentId) ??
    assessmentOptions[0]
  const answerKeyAvailable = answerKeyAssessmentIds.includes(assessmentId)
  const scannedStudent = students[scanIndex % students.length]
  const proposedScore = [92, 86, 78, 95, 84][scanIndex % students.length]
  const saveDraft = () => {
    onSaveDraft(scannedStudent.id, selectedAssessment.id, proposedScore)
    setStep("saved")
  }
  const scanNextPaper = () => {
    setScanIndex((index) => index + 1)
    setStep("scanner")
  }

  return (
    <div
      className="modal-backdrop omr-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="omr-scanner-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="omr-scanner-title"
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close scanner"
        >
          ×
        </button>
        <div className="omr-modal-heading">
          <span className="omr-modal-icon">
            <Icon name="scan" size={22} />
          </span>
          <div>
            <p className="eyebrow">OMR grading</p>
            <h2 id="omr-scanner-title">Scan answer sheet</h2>
            <p>Capture, review, and save each result as a gradebook draft.</p>
          </div>
        </div>

        <ol className="omr-steps" aria-label="Scanner progress">
          {["Set up", "Scan", "Review"].map((label, index) => {
            const activeStep =
              step === "saved"
                ? 2
                : step === "review"
                  ? 2
                  : step === "scanner"
                    ? 1
                    : 0
            return (
              <li
                key={label}
                className={index <= activeStep ? "active" : ""}
                aria-current={index === activeStep ? "step" : undefined}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            )
          })}
        </ol>

        {step === "setup" && (
          <div className="omr-step-content">
            <div className="omr-setup-grid">
              <label>
                Class section
                <select
                  value={sectionId}
                  onChange={(event) => setSectionId(event.target.value)}
                >
                  {recordSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.code} · {section.subject}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quiz or examination
                <select
                  value={assessmentId}
                  onChange={(event) => setAssessmentId(event.target.value)}
                >
                  {assessmentOptions.map((assessment) => (
                    <option key={assessment.id} value={assessment.id}>
                      {assessment.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div
              className={`omr-answer-key ${
                answerKeyAvailable ? "ready" : "missing"
              }`}
              role="status"
            >
              <span>
                <Icon name={answerKeyAvailable ? "check" : "more"} size={18} />
              </span>
              <div>
                <strong>
                  {answerKeyAvailable
                    ? "Answer key ready"
                    : "Answer key needed"}
                </strong>
                <small>
                  {answerKeyAvailable
                    ? `${selectedAssessment.label} has a verified answer key for ${selectedSection.code}.`
                    : `Add an answer key for ${selectedAssessment.label} before scanning.`}
                </small>
              </div>
            </div>
            <button
              className="primary-button omr-primary-action"
              type="button"
              disabled={!answerKeyAvailable}
              onClick={() => setStep("scanner")}
            >
              <Icon name="scan" size={17} /> Open OMR scanner
            </button>
          </div>
        )}

        {step === "scanner" && (
          <div className="omr-step-content">
            <div className="omr-scan-preview" aria-label="OMR scanner ready">
              <span className="omr-scan-corner top-left" />
              <span className="omr-scan-corner top-right" />
              <span className="omr-scan-corner bottom-left" />
              <span className="omr-scan-corner bottom-right" />
              <div className="omr-paper">
                <span className="omr-paper-id">Student number</span>
                <strong>{scannedStudent.id}</strong>
                <div className="omr-bubble-grid" aria-hidden="true">
                  {Array.from({ length: 25 }, (_, index) => (
                    <i
                      key={index}
                      className={index % 5 === 1 ? "filled" : ""}
                    />
                  ))}
                </div>
              </div>
              <div className="omr-scan-line" />
            </div>
            <div className="omr-scan-status">
              <span>
                <i /> Scanner ready
              </span>
              <small>Place the next answer sheet inside the scan frame.</small>
            </div>
            <button
              className="primary-button omr-primary-action"
              type="button"
              onClick={() => setStep("review")}
            >
              <Icon name="scan" size={17} /> Scan answer sheet
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="omr-step-content">
            <div className="omr-result-card">
              <span className="omr-result-label">Proposed score</span>
              <strong>
                {proposedScore}
                <small>/ 100</small>
              </strong>
              <span className="status-pill">Ready to review</span>
            </div>
            <div className="omr-review-row">
              <span className="summary-icon blue">
                <Icon name="user" size={19} />
              </span>
              <div>
                <strong>{scannedStudent.name}</strong>
                <small>
                  {scannedStudent.id} · {selectedSection.code} ·{" "}
                  {selectedAssessment.label}
                </small>
              </div>
              <span className="omr-match">25 / 25 fields read</span>
            </div>
            <div className="omr-review-note">
              <Icon name="check" size={16} />
              Review the detected student number and score before confirming.
            </div>
            <div className="omr-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setStep("scanner")}
              >
                Rescan
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={saveDraft}
              >
                <Icon name="check" size={16} /> Confirm as Draft
              </button>
            </div>
          </div>
        )}

        {step === "saved" && (
          <div className="omr-step-content omr-saved-state">
            <span className="omr-saved-icon">
              <Icon name="check" size={25} />
            </span>
            <h3>Score saved as Draft</h3>
            <p>
              {scannedStudent.name}'s {proposedScore}/100 for{" "}
              {selectedAssessment.label} is ready in the gradebook for final
              review.
            </p>
            <button
              className="primary-button omr-primary-action"
              type="button"
              onClick={scanNextPaper}
            >
              <Icon name="scan" size={17} /> Scan next paper
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

const generateStudentAccessCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const values = crypto.getRandomValues(new Uint32Array(8))
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("")
}

function AddClassModal({
  onClose,
  onSave,
  initialClass,
}: {
  onClose: () => void
  onSave: (newClass: ClassItem) => void
  initialClass?: ClassItem | null
}) {
  const isEditing = Boolean(initialClass)
  const makeSchedule = (schedule?: Partial<ClassSchedule>): ClassSchedule => ({
    id: schedule?.id ?? crypto.randomUUID(),
    meetingDays: schedule?.meetingDays ?? [],
    startTime: schedule?.startTime ?? "",
    endTime: schedule?.endTime ?? "",
    room: schedule?.room ?? "",
  })
  const legacySchedule = initialClass
    ? makeSchedule({
        meetingDays: initialClass.meetingDays,
        startTime: "",
        endTime: "",
        room: initialClass.room === "To be confirmed" ? "" : initialClass.room,
      })
    : makeSchedule()
  const [form, setForm] = useState({
    subject: initialClass?.subject ?? "",
    code: initialClass?.code ?? "",
    semesterStart: initialClass?.semesterStart ?? "2026-06-06",
    semesterEnd: initialClass?.semesterEnd ?? "2026-11-07",
    attendance: initialClass ? String(initialClass.attendance) : "",
    requirements: "",
  })
  const [schedules, setSchedules] = useState<ClassSchedule[]>(
    initialClass?.schedules?.length ? initialClass.schedules : [legacySchedule],
  )
  const [saving, setSaving] = useState(false)
  const [studentAccessCode] = useState(
    () => initialClass?.accessCode || generateStudentAccessCode(),
  )
  const updateForm = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))
  const addSchedule = () =>
    setSchedules((current) => [...current, makeSchedule()])
  const removeSchedule = (scheduleId: string) =>
    setSchedules((current) =>
      current.length === 1
        ? current
        : current.filter((schedule) => schedule.id !== scheduleId),
    )
  const updateSchedule = (
    scheduleId: string,
    changes: Partial<ClassSchedule>,
  ) =>
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, ...changes } : schedule,
      ),
    )
  const toggleScheduleDay = (scheduleId: string, day: string) =>
    setSchedules((current) =>
      current.map((schedule) => {
        if (schedule.id !== scheduleId) return schedule
        const selected = schedule.meetingDays.includes(day)
        return {
          ...schedule,
          meetingDays: selected
            ? schedule.meetingDays.filter((value) => value !== day)
            : [...schedule.meetingDays, day],
        }
      }),
    )

  const submitClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const schedulesAreValid = schedules.every(
      (schedule) =>
        schedule.meetingDays.length > 0 &&
        schedule.startTime &&
        schedule.endTime &&
        schedule.endTime > schedule.startTime,
    )
    if (
      !form.subject.trim() ||
      !form.code.trim() ||
      !form.attendance ||
      Number(form.attendance) <= 0 ||
      !form.semesterStart ||
      !form.semesterEnd ||
      form.semesterEnd < form.semesterStart ||
      !schedulesAreValid
    ) {
      alert("Complete all required class and schedule information. Each schedule needs at least one day and a valid start and end time.")
      return
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      alert("Please sign in before creating or editing a class.")
      return
    }
    setSaving(true)
    const classValues = {
      faculty_id: user.id,
      subject: form.subject.trim(),
      code: form.code.trim(),
      section: form.code.trim(),
      capacity: Number(form.attendance),
      semester_start: form.semesterStart,
      semester_end: form.semesterEnd,
      requirements: form.requirements.trim() || null,
      access_code: studentAccessCode,
      color: initialClass?.color ?? "#7a62d3",
      status: initialClass?.status ?? "Scheduled",
    }
    let savedClass: any
    if (initialClass) {
      const { data, error } = await supabase
        .from("classes")
        .update(classValues)
        .eq("id", initialClass.id)
        .select()
        .maybeSingle()
      if (error || !data) {
        setSaving(false)
        alert(`Unable to update class: ${error?.message ?? "Class not found"}`)
        return
      }
      savedClass = data
      const { error: deleteError } = await supabase
        .from("class_schedules")
        .delete()
        .eq("class_id", initialClass.id)
      if (deleteError) {
        setSaving(false)
        alert(`Unable to replace schedules: ${deleteError.message}`)
        return
      }
    } else {
      const { data, error } = await supabase
        .from("classes")
        .insert(classValues)
        .select()
        .single()
      if (error) {
        setSaving(false)
        alert(`Unable to create class: ${error.message}`)
        return
      }
      savedClass = data
    }
    const scheduleRows = schedules.map((schedule) => ({
      class_id: savedClass.id,
      meeting_days: schedule.meetingDays,
      start_time: schedule.startTime,
      end_time: schedule.endTime,
      room: schedule.room.trim() || null,
    }))
    const { data: savedScheduleRows, error: scheduleError } = await supabase
      .from("class_schedules")
      .insert(scheduleRows)
      .select()
    if (scheduleError) {
      setSaving(false)
      alert(`Unable to save schedules: ${scheduleError.message}`)
      return
    }
    const savedSchedules: ClassSchedule[] = (savedScheduleRows ?? []).map(
      (schedule: any) => ({
        id: schedule.id,
        meetingDays: schedule.meeting_days ?? [],
        startTime: schedule.start_time ?? "",
        endTime: schedule.end_time ?? "",
        room: schedule.room ?? "",
      }),
    )
    const firstSchedule = savedSchedules[0] ?? schedules[0]
    onSave({
      id: savedClass.id,
      subject: savedClass.subject,
      code: savedClass.code,
      time: `${formatDatabaseTime(firstSchedule.startTime)} - ${formatDatabaseTime(firstSchedule.endTime)}`,
      room: firstSchedule.room || "To be confirmed",
      color: savedClass.color ?? "#7a62d3",
      status: savedClass.status ?? "Scheduled",
      attendance: savedClass.capacity ?? Number(form.attendance),
      semesterStart: savedClass.semester_start ?? form.semesterStart,
      semesterEnd: savedClass.semester_end ?? form.semesterEnd,
      meetingDays: firstSchedule.meetingDays,
      accessCode: savedClass.access_code ?? studentAccessCode,
      schedules: savedSchedules,
    })
    setSaving(false)
    if (!initialClass) {
      alert(`Class created. Student access code: ${savedClass.access_code ?? studentAccessCode}`)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="class-form-modal" role="dialog" aria-modal="true" aria-labelledby="add-class-title" style={{ fontFamily: "inherit" }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">Class setup</p>
        <h2 id="add-class-title">{isEditing ? "Edit class" : "Add a class"}</h2>
        <p>{isEditing ? "Update the section details and schedules." : "Create a section and define how students can join."}</p>
        <form className="class-form" onSubmit={submitClass}>
          <div className="form-section-title">Class details</div>
          <label>Subject name <em>Required</em>
            <input autoFocus value={form.subject} onChange={(event) => updateForm("subject", event.target.value)} placeholder="e.g. Web Development Fundamentals" required />
          </label>
          <div className="class-form-grid">
            <label>Course code / section <em>Required</em>
              <input value={form.code} onChange={(event) => updateForm("code", event.target.value)} placeholder="e.g. BIT-CT 3B" required />
            </label>
            <label>Student capacity <em>Required</em>
              <input type="number" min="1" max="200" value={form.attendance} onChange={(event) => updateForm("attendance", event.target.value)} required />
            </label>
          </div>
          <div className="form-section-title">Semester schedule & access</div>
          <div className="class-form-grid">
            <label>Semester start <em>Required</em>
              <input type="date" value={form.semesterStart} onChange={(event) => updateForm("semesterStart", event.target.value)} required />
            </label>
            <label>Semester end <em>Required</em>
              <input type="date" min={form.semesterStart} value={form.semesterEnd} onChange={(event) => updateForm("semesterEnd", event.target.value)} required />
            </label>
          </div>
          <div className="form-section-title">Class schedules</div>
          <p>Add another schedule when the same subject meets at a different time or room.</p>
          <div className="schedule-list">
            {schedules.map((schedule, index) => (
              <section className="schedule-form-card" key={schedule.id} style={{ border: "1px solid #dbe6f0", borderRadius: 12, padding: 16, marginBottom: 14, fontFamily: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <strong>Schedule {index + 1}</strong>
                  {schedules.length > 1 && <button type="button" className="class-card-delete" style={{ fontFamily: "inherit" }} onClick={() => removeSchedule(schedule.id)}>Remove</button>}
                </div>
                <fieldset className="meeting-days">
                  <legend>Class days <em>Required</em></legend>
                  <div className="meeting-day-options">
                    {meetingDayOptions.map((day) => {
                      const selected = schedule.meetingDays.includes(day.value)
                      return (
                        <label key={day.value} className={selected ? "selected" : ""}>
                          <input type="checkbox" checked={selected} onChange={() => toggleScheduleDay(schedule.id, day.value)} />
                          <span>{day.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
                <div className="class-form-grid class-time-fields">
                  <label>Start time <em>Required</em>
                    <input type="time" value={schedule.startTime} onChange={(event) => updateSchedule(schedule.id, { startTime: event.target.value })} required />
                  </label>
                  <label>End time <em>Required</em>
                    <input type="time" min={schedule.startTime} value={schedule.endTime} onChange={(event) => updateSchedule(schedule.id, { endTime: event.target.value })} required />
                  </label>
                  <label>Room / virtual space
                    <input value={schedule.room} onChange={(event) => updateSchedule(schedule.id, { room: event.target.value })} placeholder="e.g. Lab 3" />
                  </label>
                </div>
              </section>
            ))}
          </div>
          <button type="button" className="secondary-button" style={{ fontFamily: "inherit" }} onClick={addSchedule}><Icon name="plus" size={16} /> Add another schedule</button>
          <label>Student access code
            <input type="text" value={studentAccessCode} readOnly />
            <small>This unique code is generated automatically. Students use it to join the class.</small>
          </label>
          <label>Required materials or prerequisites
            <textarea value={form.requirements} onChange={(event) => updateForm("requirements", event.target.value)} placeholder="e.g. Laptop, network cable, and completed safety orientation" />
          </label>
          <div className="class-form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>
              <Icon name={isEditing ? "edit" : "plus"} size={16} />
              {saving ? "Saving..." : isEditing ? "Save changes" : "Add class"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ClassesPage({
  onStart,
  setPage,
  endedClassIds,
}: {
  onStart: (item: ClassItem) => void
  setPage: (page: string) => void
  endedClassIds: string[]
}) {
  const [classList, setClassList] = useState<ClassItem[]>([])
 const deleteClass = async (classId: string) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this class?",
  )

  if (!confirmed) return

  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId)

  if (error) {
    console.error("Unable to delete class:", error)
    alert(`Unable to delete class: ${error.message}`)
    return
  }

  setClassList((current) =>
    current.filter(
      (classItem) => String(classItem.id) !== classId,
    ),
  )
}
useEffect(() => {
  async function loadClasses() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Unable to get signed-in faculty:", userError)
      setClassList([])
      return
    }

    if (!user) {
      console.log("No faculty account is currently signed in.")
      setClassList([])
      return
    }

    const { data, error } = await supabase
      .from("classes")
      .select("*, class_schedules(id, meeting_days, start_time, end_time, room)")
      .eq("faculty_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Unable to load classes:", error)
      return
    }

    const loadedClasses: ClassItem[] = (data ?? []).map(mapDatabaseClass)

    setClassList(loadedClasses)
  }

  loadClasses()
}, [])
  const [isAddingClass, setIsAddingClass] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)

  return (
    <>
      <Header
        title="My classes"
        onNotify={() => {}}
        onProfile={() => setPage("profile")}
      />
      <div className="page-intro">
        <div>
          <p className="eyebrow">Academic year 2026–27</p>
          <h2>Class schedule</h2>
          <p>Manage sessions, attendance, and learning activities.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setEditingClass(null)
            setIsAddingClass(true)
          }}
        >
          <Icon name="plus" size={17} /> Add class
        </button>
      </div>
      <div className="class-grid page-grid">
        {classList.map((item) => (
      <ClassCard
  key={item.id}
  item={item}
  onStart={onStart}
  ended={endedClassIds.includes(String(item.id))}
  onEdit={(classToEdit) => {
    setEditingClass(classToEdit)
    setIsAddingClass(true)
  }}
  onDelete={(classToDelete) => {
    deleteClass(String(classToDelete.id))
  }}
/>
        ))}
      </div>
      <div className="empty-prompt">
        <span>
          <Icon name="calendar" />
        </span>
        <h3>Your afternoon is clear</h3>
        <p>No more scheduled classes after 3:00 PM.</p>
      </div>
      {isAddingClass && (
        <AddClassModal
          initialClass={editingClass}
          onClose={() => {
            setIsAddingClass(false)
            setEditingClass(null)
          }}
          onSave={(savedClass) => {
            setClassList((current) =>
              editingClass
                ? current.map((item) =>
                    item.id === savedClass.id ? savedClass : item,
                  )
                : [...current, savedClass],
            )
            setIsAddingClass(false)
            setEditingClass(null)
          }}
        />
      )}
    </>
  )
}

function RecordsPage({
  setPage,
  omrDraftScores,
}: {
  setPage: (page: string) => void
  omrDraftScores: Record<string, number>
}) {
  const [query, setQuery] = useState("")
  const [recordDate, setRecordDate] = useState("2026-10-23")
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date("2026-10-01T12:00:00"),
  )
  const [assessmentColumns, setAssessmentColumns] = useState(
    initialRecordAssessmentColumns,
  )
  const [assessmentMenuOpen, setAssessmentMenuOpen] = useState(false)
  const [gradebookView, setGradebookView] = useState<"summary" | "daily">(
    "daily",
  )
  const [dailyRemarks, setDailyRemarks] = useState<Record<string, string>>({})
  const [dailySessions, setDailySessions] = useState<Record<string, {
    attendanceId: string
    recitationId: string
  }>>({
    "2026-10-23": {
      attendanceId: "midterm-attendance-1",
      recitationId: "midterm-recitation-1",
    },
  })
  const [recordValues, setRecordValues] =
    useState<Record<string, Record<string, number | "">>>({})
  const [studentStatuses, setStudentStatuses] =
    useState<Record<string, string>>({})
  const [selectedSectionId, setSelectedSectionId] = useState(
    recordSections[0].id,
  )
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false)

  useEffect(() => {
    if (dailySessions[recordDate]) return
    const term = recordDate <= "2026-10-31" ? "Midterm" : "Final"
    const attendanceId = `daily-${recordDate}-attendance`
    const recitationId = `daily-${recordDate}-recitation`
    setDailySessions((sessions) => ({
      ...sessions,
      [recordDate]: { attendanceId, recitationId },
    }))
    setAssessmentColumns((columns) => {
      const attendanceCount = columns.filter(
        (column) => column.type === "Attendance" && column.term === term,
      ).length
      const recitationCount = columns.filter(
        (column) => column.type === "Recitation" && column.term === term,
      ).length
      return [
        ...columns,
        {
          id: attendanceId,
          label: `${term} Attendance ${attendanceCount + 1}`,
          type: "Attendance",
          term,
        },
        {
          id: recitationId,
          label: `${term} Recitation ${recitationCount + 1}`,
          type: "Recitation",
          term,
        },
      ]
    })
  }, [dailySessions, recordDate])

  const selectedSection =
    recordSections.find((section) => section.id === selectedSectionId) ??
    recordSections[0]
  const dailySession = dailySessions[recordDate]
  const dailySessionTerm = recordDate <= "2026-10-31" ? "Midterm" : "Final"
  const dailySessionNumber = Math.max(
    1,
    assessmentColumns
      .filter(
        (column) =>
          column.type === "Attendance" && column.term === dailySessionTerm,
      )
      .findIndex((column) => column.id === dailySession?.attendanceId) + 1,
  )
  const dailySessionLabel = `${
    dailySessionTerm === "Final" ? "Finals" : dailySessionTerm
  } Session ${dailySessionNumber}`

  const switchDailySessionTerm = (term: "Midterm" | "Final") => {
    const day = Math.min(Number(recordDate.slice(-2)), 30)
      .toString()
      .padStart(2, "0")
    setRecordDate(`${term === "Midterm" ? "2026-10" : "2026-11"}-${day}`)
  }

  const filtered = useMemo(
    () =>
      students.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )
  const selectedRecordDate = new Date(`${recordDate}T12:00:00`)
  const calendarDays = Array.from(
    {
      length:
        new Date(
          calendarMonth.getFullYear(),
          calendarMonth.getMonth() + 1,
          0,
        ).getDate() +
        new Date(
          calendarMonth.getFullYear(),
          calendarMonth.getMonth(),
          1,
        ).getDay(),
    },
    (_, index) => {
      const firstDayOffset = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        1,
      ).getDay()
      return index < firstDayOffset
        ? null
        : new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth(),
            index - firstDayOffset + 1,
          )
    },
  )

  const selectRecordDate = (date: Date) => {
    setRecordDate(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    )
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setDatePickerOpen(false)
  }

  const quizColumns = assessmentColumns.filter(
    (column) => column.type === "Quiz",
  )
  const midtermQuizColumns = quizColumns.filter(
    (column) => column.term === "Midterm",
  )
  const finalQuizColumns = quizColumns.filter(
    (column) => column.term === "Final",
  )
  const midtermQuizCount = midtermQuizColumns.length
  const finalQuizCount = finalQuizColumns.length
  const midtermProjectColumns = assessmentColumns.filter(
    (column) => column.type === "Hands On" && column.term === "Midterm",
  )
  const finalProjectColumns = assessmentColumns.filter(
    (column) => column.type === "Hands On" && column.term === "Final",
  )
  const midtermRecitationColumns = assessmentColumns.filter(
    (column) => column.type === "Recitation" && column.term === "Midterm",
  )
  const finalRecitationColumns = assessmentColumns.filter(
    (column) => column.type === "Recitation" && column.term === "Final",
  )
  const midtermAttendanceColumns = assessmentColumns.filter(
    (column) => column.type === "Attendance" && column.term === "Midterm",
  )
  const finalAttendanceColumns = assessmentColumns.filter(
    (column) => column.type === "Attendance" && column.term === "Final",
  )

  const addAssessmentColumn = (
    type: "Quiz" | "Hands On" | "Recitation" | "Attendance",
    term: "Midterm" | "Final",
  ) => {
    const existingCount = assessmentColumns.filter(
      (column) => column.type === type && column.term === term,
    ).length
    const maximum =
      type === "Quiz"
        ? 8
        : type === "Hands On"
          ? term === "Midterm"
            ? 10
            : 12
          : term === "Midterm"
            ? 20
            : 15
    if (existingCount >= maximum) return
    const label = `${term} ${
      type === "Quiz" ? "Quiz" : type === "Hands On" ? "Project" : type
    } ${existingCount + 1}`

    setAssessmentColumns((columns) => {
      const lastMatchingIndex = columns.reduce(
        (lastIndex, column, index) =>
          column.type === type && column.term === term ? index : lastIndex,
        -1,
      )
      const insertAt =
        lastMatchingIndex === -1 ? columns.length : lastMatchingIndex + 1
      const newColumn = {
        id: `${term.toLowerCase()}-${type.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`,
        label,
        type,
        term,
      }
      return [
        ...columns.slice(0, insertAt),
        newColumn,
        ...columns.slice(insertAt),
      ]
    })
    setAssessmentMenuOpen(false)
  }

  const assessmentScore = (
    _studentScore: number,
    _column: RecordAssessmentColumn,
    _index: number,
  ) => 0

  const recordValue = (
    student: typeof students[number],
    columnId: string,
    fallback: number,
  ) =>
    recordValues[student.id]?.[columnId] ??
    omrDraftScores[`${student.id}:${columnId}`] ??
    fallback

  const assessmentPoints = (
    student: typeof students[number],
    columns: RecordAssessmentColumn[],
  ) =>
    columns.reduce((total, column) => {
      const columnIndex = assessmentColumns.findIndex(
        (item) => item.id === column.id,
      )
      const value = recordValue(
        student,
        column.id,
        assessmentScore(student.score, column, columnIndex),
      )
      return total + (typeof value === "number" ? value : 0)
    }, 0)

  const percentageFromColumns = (
    student: typeof students[number],
    columns: RecordAssessmentColumn[],
  ) =>
    columns.length
      ? (assessmentPoints(student, columns) /
          columns.reduce(
            (total, column) =>
              total +
              (column.type === "Attendance" || column.type === "Recitation"
                ? 10
                : 100),
            0,
          )) *
        100
      : 0

  const percentageFromScores = (scores: number[]) =>
    scores.reduce((total, score) => total + score, 0) / scores.length

  const examSubtotal = (
    student: typeof students[number],
    term: "midterm" | "final",
  ) => {
    const written = Number(recordValue(student, `${term}-written`, 0))
    const actual = Number(recordValue(student, `${term}-actual`, 0))
    return written ? (actual / written) * 100 : 0
  }

  const finalGrade = (student: typeof students[number]) => {
    const examPercentage = percentageFromScores([
      examSubtotal(student, "midterm"),
      examSubtotal(student, "final"),
    ])
    const recitationPercentage = percentageFromColumns(student, [
      ...midtermRecitationColumns,
      ...finalRecitationColumns,
    ])
    const attendancePercentage = percentageFromColumns(student, [
      ...midtermAttendanceColumns,
      ...finalAttendanceColumns,
    ])
    return (
      examPercentage * 0.25 +
      percentageFromColumns(student, quizColumns) * 0.2 +
      percentageFromColumns(student, [
        ...midtermProjectColumns,
        ...finalProjectColumns,
      ]) *
        0.25 +
      recitationPercentage * 0.2 +
      attendancePercentage * 0.1
    )
  }

  const renderAssessmentScore = (
    student: typeof students[number],
    column: RecordAssessmentColumn,
  ) => {
    const columnIndex = assessmentColumns.findIndex(
      (item) => item.id === column.id,
    )
    return (
      <td key={column.id}>
        <input
          className="record-score-input"
          type="number"
          min="0"
          max={
            column.type === "Attendance" || column.type === "Recitation"
              ? "10"
              : "100"
          }
          value={recordValue(
            student,
            column.id,
            assessmentScore(student.score, column, columnIndex),
          )}
          onChange={(event) =>
            updateRecordValue(
              student.id,
              column.id,
              event.target.value,
              column.type === "Attendance" || column.type === "Recitation"
                ? 10
                : 100,
            )
          }
          aria-label={`Edit ${column.label} score for ${student.name}`}
        />
      </td>
    )
  }

  const updateRecordValue = (
    studentId: string,
    columnId: string,
    value: string,
    maximum = 100,
  ) => {
    const nextValue =
      value === "" ? "" : Math.min(maximum, Math.max(0, Number(value)))
    setRecordValues((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [columnId]: nextValue,
      },
    }))
  }

  return (
    <>
      <Header
        title="Class records"
        onNotify={() => {}}
        onProfile={() => setPage("profile")}
      />
      <section className="records-section-manager" aria-label="Section manager">
        <div className="records-section-summary">
          <span className="records-section-icon">
            <Icon name="book" size={20} />
          </span>
          <div>
            <p className="eyebrow">Teaching load</p>
            <strong>{recordSections.length} active sections</strong>
            <small>Switch subjects without leaving your gradebook.</small>
          </div>
        </div>
        <div className="section-switcher">
          <button
            className="section-switcher-trigger"
            onClick={() => setSectionMenuOpen((open) => !open)}
            aria-expanded={sectionMenuOpen}
            aria-controls="records-section-menu"
          >
            <span>
              <small>Currently managing</small>
              <strong>{selectedSection.code}</strong>
            </span>
            <Icon name="chevron" size={17} />
          </button>
          {sectionMenuOpen && (
            <div
              id="records-section-menu"
              className="section-switcher-menu"
              role="menu"
            >
              <div className="section-switcher-menu-heading">
                <span>Choose a section</span>
                <small>{recordSections.length} active this term</small>
              </div>
              {recordSections.map((section) => (
                <button
                  key={section.id}
                  className={section.id === selectedSection.id ? "active" : ""}
                  role="menuitem"
                  onClick={() => {
                    setSelectedSectionId(section.id)
                    setSectionMenuOpen(false)
                    setQuery("")
                  }}
                >
                  <span className="section-menu-code">{section.code}</span>
                  <span className="section-menu-copy">
                    <strong>{section.subject}</strong>
                    <small>{section.schedule}</small>
                  </span>
                  <span className="section-menu-students">
                    {section.students} students
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="page-intro records-course-identity">
        <div>
          <p className="eyebrow">AY 2026–2027</p>
          <h2>
            {selectedSection.code}: {selectedSection.subject}
          </h2>
          <p>
            BSCS 1st Year · Section A-1 · {selectedSection.students} students
          </p>
        </div>
        <label className="records-file-import">
          <input type="file" accept=".csv,text/csv" />
          <Icon name="clipboard" size={15} /> Import CSV
        </label>
      </div>
      <div
        className={`records-card ${
          gradebookView === "summary" ? "master" : "daily"
        }`}
      >
        <div
          className="records-view-tabs"
          role="tablist"
          aria-label="Gradebook views"
        >
          <button
            className={gradebookView === "daily" ? "active" : ""}
            role="tab"
            aria-selected={gradebookView === "daily"}
            onClick={() => setGradebookView("daily")}
          >
            <Icon name="calendar" size={14} /> Daily Tracker
          </button>
          <button
            className={gradebookView === "summary" ? "active" : ""}
            role="tab"
            aria-selected={gradebookView === "summary"}
            onClick={() => setGradebookView("summary")}
          >
            <Icon name="book" size={14} /> Gradebook (Summary)
          </button>
        </div>
        <div className="records-tools">
          <label>
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students..."
            />
          </label>
          <div className="records-date-picker">
            {datePickerOpen && (
              <section
                id="records-date-calendar"
                className="records-date-calendar"
                role="dialog"
                aria-label="Choose a record date"
              >
                <div className="records-calendar-header">
                  <button
                    className="records-calendar-nav previous"
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (month) =>
                          new Date(
                            month.getFullYear(),
                            month.getMonth() - 1,
                            1,
                          ),
                      )
                    }
                    aria-label="Previous month"
                  >
                    <Icon name="chevron" size={14} />
                  </button>
                  <strong>
                    {new Intl.DateTimeFormat("en", {
                      month: "long",
                      year: "numeric",
                    }).format(calendarMonth)}
                  </strong>
                  <button
                    className="records-calendar-nav"
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        (month) =>
                          new Date(
                            month.getFullYear(),
                            month.getMonth() + 1,
                            1,
                          ),
                      )
                    }
                    aria-label="Next month"
                  >
                    <Icon name="chevron" size={14} />
                  </button>
                </div>
                <div className="records-calendar-weekdays" aria-hidden="true">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="records-calendar-days">
                  {calendarDays.map((date, index) =>
                    date ? (
                      <button
                        key={date.toISOString()}
                        className={
                          date.toDateString() ===
                          selectedRecordDate.toDateString()
                            ? "selected"
                            : ""
                        }
                        type="button"
                        onClick={() => selectRecordDate(date)}
                        aria-label={new Intl.DateTimeFormat("en", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }).format(date)}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <span key={`blank-${index}`} />
                    ),
                  )}
                </div>
              </section>
            )}
          </div>
          <div className="record-publication-control">
            <span>Record status</span>
            <select
              className="record-publication-select"
              defaultValue="Draft"
              aria-label="Set record publication status"
            >
              <option>Pending</option>
              <option>Draft</option>
              <option>Published</option>
            </select>
          </div>
          <div className="records-assessment-actions">
            <button
              className="primary-button compact records-add-assessment"
              type="button"
              onClick={() => setAssessmentMenuOpen((open) => !open)}
              aria-expanded={assessmentMenuOpen}
              aria-controls="add-assessment-menu"
            >
              <Icon name="plus" size={15} /> Add assessment
            </button>
            {assessmentMenuOpen && (
              <div
                id="add-assessment-menu"
                className="add-assessment-menu"
                role="menu"
                aria-label="Add assessment column"
              >
                <p>Add a record column</p>
                <p className="quiz-limit-title">Quizzes · maximum 8 per term</p>
                {([
                  {
                    term: "Midterm" as const,
                    type: "Quiz" as const,
                    count: midtermQuizCount,
                    maximum: 8,
                  },
                  {
                    term: "Final" as const,
                    type: "Quiz" as const,
                    count: finalQuizCount,
                    maximum: 8,
                  },
                  {
                    term: "Midterm" as const,
                    type: "Hands On" as const,
                    count: midtermProjectColumns.length,
                    maximum: 10,
                  },
                  {
                    term: "Final" as const,
                    type: "Hands On" as const,
                    count: finalProjectColumns.length,
                    maximum: 12,
                  },
                  {
                    term: "Midterm" as const,
                    type: "Recitation" as const,
                    count: midtermRecitationColumns.length,
                    maximum: 20,
                  },
                  {
                    term: "Final" as const,
                    type: "Recitation" as const,
                    count: finalRecitationColumns.length,
                    maximum: 15,
                  },
                  {
                    term: "Midterm" as const,
                    type: "Attendance" as const,
                    count: midtermAttendanceColumns.length,
                    maximum: 20,
                  },
                  {
                    term: "Final" as const,
                    type: "Attendance" as const,
                    count: finalAttendanceColumns.length,
                    maximum: 15,
                  },
                ] as const).map(({ term, type, count, maximum }) => {
                  const limitReached = count >= maximum
                  const isQuiz = type === "Quiz"
                  const isProject = type === "Hands On"
                  const label = isQuiz
                    ? "quiz"
                    : isProject
                      ? "project"
                      : type.toLowerCase()
                  return (
                    <button
                      className={
                        isQuiz
                          ? "add-quiz-term"
                          : isProject
                            ? "add-project-term"
                            : "add-session-term"
                      }
                      key={`${term}-${type}`}
                      type="button"
                      role="menuitem"
                      disabled={limitReached}
                      onClick={() => addAssessmentColumn(type, term)}
                    >
                      <span>
                        <Icon
                          name={
                            isQuiz
                              ? "clipboard"
                              : isProject
                                ? "scan"
                                : type === "Attendance"
                                  ? "check"
                                  : "users"
                          }
                          size={15}
                        />
                      </span>
                      <span>
                        <strong>
                          Add {term} {label}
                        </strong>
                        <small>
                          {limitReached
                            ? `${term} ${label} limit reached`
                            : `${count} of ${maximum} ${label} sessions added`}
                        </small>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col" rowSpan={2}>
                  Student
                </th>
                <th scope="col" rowSpan={2}>
                  Status
                </th>
                <th scope="colgroup" colSpan={3}>
                  Midterm Exam · 25%
                </th>
                <th scope="colgroup" colSpan={3}>
                  Final Exam · 25%
                </th>
                <th scope="colgroup" colSpan={midtermQuizCount + 1}>
                  Midterm Quizzes · 20%
                </th>
                <th scope="colgroup" colSpan={finalQuizCount + 1}>
                  Final Quizzes · 20%
                </th>
                <th scope="colgroup" colSpan={midtermProjectColumns.length + 1}>
                  Midterm{"\u00a0\u00a0"}ACTIVITIES/Projects · 25%
                </th>
                <th scope="colgroup" colSpan={finalProjectColumns.length + 1}>
                  Final{"\u00a0\u00a0"}ACTIVITIES/Projects · 25%
                </th>
                <th
                  scope="colgroup"
                  colSpan={midtermRecitationColumns.length + 1}
                >
                  Midterm Recitation · 20%
                </th>
                <th
                  scope="colgroup"
                  colSpan={finalRecitationColumns.length + 1}
                >
                  Final Recitation · 20%
                </th>
                <th
                  scope="colgroup"
                  colSpan={midtermAttendanceColumns.length + 1}
                >
                  Midterm Attendance · 10%
                </th>
                <th
                  scope="colgroup"
                  colSpan={finalAttendanceColumns.length + 1}
                >
                  Final Attendance · 10%
                </th>
                <th scope="col" rowSpan={2} className="final-grade-heading">
                  Final Grade
                </th>
              </tr>
              <tr>
                {[
                  "Written",
                  "Actual",
                  "Subtotal",
                  "Written",
                  "Actual",
                  "Subtotal",
                ].map((label, index) => (
                  <th
                    scope="col"
                    key={`${label}-${index}`}
                    className={
                      label === "Written" ? "exam-written-heading" : undefined
                    }
                  >
                    {label}
                  </th>
                ))}
                {midtermQuizColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Midterm ", "").replace("Final ", "")}
                  </th>
                ))}
                <th scope="col">Total</th>
                {finalQuizColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Midterm ", "").replace("Final ", "")}
                  </th>
                ))}
                <th scope="col">Total</th>
                {midtermProjectColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Midterm ", "").replace("Final ", "")}
                  </th>
                ))}
                <th scope="col">Total</th>
                {finalProjectColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Midterm ", "").replace("Final ", "")}
                  </th>
                ))}
                <th scope="col">Total</th>
                {midtermRecitationColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Midterm Recitation ", "R")}
                  </th>
                ))}
                <th scope="col">Total</th>
                {finalRecitationColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Final Recitation ", "R")}
                  </th>
                ))}
                <th scope="col">Total</th>
                {midtermAttendanceColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Midterm Attendance ", "A")}
                  </th>
                ))}
                <th scope="col">Total</th>
                {finalAttendanceColumns.map((column) => (
                  <th scope="col" key={column.id}>
                    {column.label.replace("Final Attendance ", "A")}
                  </th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-name">
                      <span>
                        {student.name
                          .split(/[ ,]/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{student.name}</strong>
                        <small>{student.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className={`status-select attendance ${(studentStatuses[student.id] ?? student.attendance).toLowerCase()}`}
                      value={studentStatuses[student.id] ?? student.attendance}
                      onChange={(event) =>
                        setStudentStatuses((current) => ({
                          ...current,
                          [student.id]: event.target.value,
                        }))
                      }
                      aria-label={`Set attendance status for ${student.name}`}
                    >
                      <option>Present</option>
                      <option>Late</option>
                      <option>Absent</option>
                      <option>Excused</option>
                    </select>
                  </td>
                  {[
                    ["midterm-written", 0, "Midterm written"],
                    ["midterm-actual", 0, "Midterm actual"],
                  ].map(([id, fallback, label]) => (
                    <td key={id}>
                      <input
                        className="record-score-input"
                        type="number"
                        min="0"
                        max="100"
                        value={recordValue(student, String(id), Number(fallback))}
                        onChange={(event) =>
                          updateRecordValue(student.id, String(id), event.target.value)
                        }
                        aria-label={`Edit ${label} score for ${student.name}`}
                      />
                    </td>
                  ))}
                  <td className="term-total-cell">
                    <output>
                      {examSubtotal(student, "midterm").toFixed(2)}%
                    </output>
                  </td>
                  {[
                    ["final-written", 0, "Final written"],
                    ["final-actual", 0, "Final actual"],
                  ].map(([id, fallback, label]) => (
                    <td key={id}>
                      <input
                        className="record-score-input"
                        type="number"
                        min="0"
                        max="100"
                        value={recordValue(student, String(id), Number(fallback))}
                        onChange={(event) =>
                          updateRecordValue(student.id, String(id), event.target.value)
                        }
                        aria-label={`Edit ${label} score for ${student.name}`}
                      />
                    </td>
                  ))}
                  <td className="term-total-cell">
                    <output>
                      {examSubtotal(student, "final").toFixed(2)}%
                    </output>
                  </td>
                  {midtermQuizColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(student, midtermQuizColumns).toFixed(0)}{" "}
                      / {midtermQuizColumns.length * 100}
                    </output>
                  </td>
                  {finalQuizColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(student, finalQuizColumns).toFixed(0)} /{" "}
                      {finalQuizColumns.length * 100}
                    </output>
                  </td>
                  {midtermProjectColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(student, midtermProjectColumns).toFixed(
                        0,
                      )}{" "}
                      / {midtermProjectColumns.length * 100}
                    </output>
                  </td>
                  {finalProjectColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(student, finalProjectColumns).toFixed(
                        0,
                      )}{" "}
                      / {finalProjectColumns.length * 100}
                    </output>
                  </td>
                  {midtermRecitationColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(
                        student,
                        midtermRecitationColumns,
                      ).toFixed(0)}{" "}
                      / {midtermRecitationColumns.length * 10}
                    </output>
                  </td>
                  {finalRecitationColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(
                        student,
                        finalRecitationColumns,
                      ).toFixed(0)}{" "}
                      / {finalRecitationColumns.length * 10}
                    </output>
                  </td>
                  {midtermAttendanceColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(
                        student,
                        midtermAttendanceColumns,
                      ).toFixed(0)}{" "}
                      / {midtermAttendanceColumns.length * 10}
                    </output>
                  </td>
                  {finalAttendanceColumns.map((column) =>
                    renderAssessmentScore(student, column),
                  )}
                  <td className="term-total-cell">
                    <output>
                      {assessmentPoints(
                        student,
                        finalAttendanceColumns,
                      ).toFixed(0)}{" "}
                      / {finalAttendanceColumns.length * 10}
                    </output>
                  </td>
                  <td
                    className={`final-grade-cell ${
                      finalGrade(student) >= 75 ? "pass" : "fail"
                    }`}
                  >
                    <output>
                      <strong>{finalGrade(student).toFixed(2)}</strong>
                      <small>
                        {finalGrade(student) >= 75 ? "Pass · 3.00" : "Fail"}
                      </small>
                    </output>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="daily-tracker-panel" aria-label="Daily tracker">
          <div className="daily-session-bar">
            <div className="daily-session-controls">
              <label>
                <span>Session date</span>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(event) => setRecordDate(event.target.value)}
                />
                <span
                  className="daily-session-badge"
                  aria-label={dailySessionLabel}
                >
                  <Icon name="clipboard" size={12} />
                  {dailySessionLabel}
                </span>
              </label>
              <div
                className="daily-term-switcher"
                role="group"
                aria-label="Select grading term"
              >
                <button
                  className={dailySessionTerm === "Midterm" ? "active" : ""}
                  type="button"
                  onClick={() => switchDailySessionTerm("Midterm")}
                >
                  Midterm
                </button>
                <button
                  className={dailySessionTerm === "Final" ? "active" : ""}
                  type="button"
                  onClick={() => switchDailySessionTerm("Final")}
                >
                  Finals
                </button>
              </div>
            </div>
          </div>
          <div className="daily-table-wrap">
            <table className="daily-tracker-table">
              <thead>
                <tr>
                  <th>Student name</th>
                  <th>Attendance status</th>
                  <th>Daily recitation score (max 10)</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name}</strong>
                      <small>{student.id}</small>
                    </td>
                    <td>
                      <select
                        className={`status-select attendance ${(studentStatuses[student.id] ?? student.attendance).toLowerCase()}${
                          student.id === "2026-0025"
                            ? " selected-attendance-background"
                            : ""
                        }`}
                        value={
                          studentStatuses[student.id] ?? student.attendance
                        }
                        onChange={(event) => {
                          const status = event.target.value
                          setStudentStatuses((current) => ({
                            ...current,
                            [student.id]: status,
                          }))
                          updateRecordValue(
                            student.id,
                            dailySession?.attendanceId ??
                              "midterm-attendance-1",
                            String(
                              status === "Present" || status === "Excused"
                                ? 10
                                : status === "Late"
                                  ? 7
                                  : 0,
                            ),
                            10,
                          )
                        }}
                      >
                        <option>Present</option>
                        <option>Late</option>
                        <option>Absent</option>
                        <option>Excused</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="record-score-input"
                        type="number"
                        min="0"
                        max="10"
                        value={recordValue(
                          student,
                          dailySession?.recitationId ?? "midterm-recitation-1",
                          0,
                        )}
                        onChange={(event) =>
                          updateRecordValue(
                            student.id,
                            dailySession?.recitationId ??
                              "midterm-recitation-1",
                            event.target.value,
                            10,
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="daily-remarks-input"
                        value={
                          dailyRemarks[`${recordDate}:${student.id}`] ?? ""
                        }
                        onChange={(event) =>
                          setDailyRemarks((remarks) => ({
                            ...remarks,
                            [`${recordDate}:${student.id}`]: event.target.value,
                          }))
                        }
                        placeholder="Add a note"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}

function ActivitiesPage({
  setPage,
  reminders,
  setReminders,
}: {
  setPage: (page: string) => void
  reminders: ActivityItem[]
  setReminders: React.Dispatch<React.SetStateAction<ActivityItem[]>>
}) {
  const activityTypes = ["Quiz", "Exam", "Class activity", "Hands-on activity"]
  const reminderDate = (value: string) => new Date(`${value}T12:00:00`)
  const formatReminderDay = (value: string) => {
    if (!value) return "--"
    return new Intl.DateTimeFormat("en", { day: "2-digit" }).format(
      reminderDate(value),
    )
  }
  const formatReminderMonth = (value: string) => {
    if (!value) return "---"
    return new Intl.DateTimeFormat("en", { month: "short" })
      .format(reminderDate(value))
      .toUpperCase()
  }
  const formatReminderDateLong = (value: string) => {
    if (!value) return "Select a date"
    return new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(reminderDate(value))
  }
  const [editing, setEditing] = useState<number | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ActivityItem>(createActivityDraft)
  const [studentConcerns, setStudentConcerns] = useState(initialStudentConcerns)
  const [expandedConcernId, setExpandedConcernId] = useState<string | null>(
    null,
  )
  const [concernDecisions, setConcernDecisions] =
    useState<Record<string, "Accepted" | "Denied">>({})
  const [concernReplies, setConcernReplies] = useState<Record<string, string>>(
    {},
  )
  const [sentReviewNotice, setSentReviewNotice] = useState("")
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    if (!sentReviewNotice) return
    const timeout = window.setTimeout(() => setSentReviewNotice(""), 4000)
    return () => window.clearTimeout(timeout)
  }, [sentReviewNotice])

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentTime(Date.now()),
      15_000,
    )
    return () => window.clearInterval(interval)
  }, [])

  const getActivityStatus = (activity: ActivityItem, index: number) => {
    const startAt = new Date(`${activity.date}T${activity.startTime}`).getTime()
    const endAt = new Date(`${activity.date}T${activity.endTime}`).getTime()
    if (!Number.isNaN(endAt) && currentTime >= endAt) return "Finished"
    if (!Number.isNaN(startAt) && currentTime >= startAt) return "In progress"
    return index === 0 ? "Next up" : "Scheduled"
  }

  const openNewReminder = () => {
    setDraft(createActivityDraft())
    setActiveGroupId(null)
    setEditing(-1)
  }

  const addGroup = () => {
    const id = `group-${Date.now()}`
    setDraft((current) => ({
      ...current,
      groups: [
        ...current.groups,
        { id, name: `Group ${current.groups.length + 1}`, studentIds: [] },
      ],
    }))
    setActiveGroupId(id)
  }

  const updateGroupName = (groupId: string, name: string) =>
    setDraft((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, name } : group,
      ),
    }))

  const removeGroup = (groupId: string) => {
    setDraft((current) => ({
      ...current,
      groups: current.groups.filter((group) => group.id !== groupId),
    }))
    setActiveGroupId((activeId) => (activeId === groupId ? null : activeId))
  }

  const toggleStudentInGroup = (groupId: string, studentId: string) =>
    setDraft((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        const isTarget = group.id === groupId
        const isAlreadyAssigned = group.studentIds.includes(studentId)
        if (isTarget)
          return {
            ...group,
            studentIds: isAlreadyAssigned
              ? group.studentIds.filter((id) => id !== studentId)
              : [...group.studentIds, studentId],
          }
        return {
          ...group,
          studentIds: group.studentIds.filter((id) => id !== studentId),
        }
      }),
    }))

  const saveReminder = () => {
    if (
      !draft.title.trim() ||
      !draft.date ||
      !draft.startTime ||
      !draft.endTime ||
      draft.endTime <= draft.startTime ||
      (draft.participation === "Group" && draft.groups.length === 0)
    )
      return
    if (editing === -1) setReminders((items) => [...items, draft])
    else if (editing !== null)
      setReminders((items) =>
        items.map((item, index) => (index === editing ? draft : item)),
      )
    setEditing(null)
  }

  return (
    <>
      <Header
        title="Activities"
        onNotify={() => {}}
        onProfile={() => setPage("profile")}
      />
      <div className="page-intro">
        <div>
          <p className="eyebrow">Faculty calendar</p>
          <h2>Assessments & reminders</h2>
          <p>Schedule exams, quizzes, and activities for your classes.</p>
        </div>
        <button className="primary-button" onClick={openNewReminder}>
          <Icon name="plus" /> Add reminder
        </button>
      </div>
      <div className="activities-workspace">
        <section className="concerns-section" aria-labelledby="concerns-title">
          <div className="concerns-heading">
            <div>
              <p className="eyebrow">Student requests</p>
              <h2 id="concerns-title">Concerns & petitions</h2>
            </div>
            <span className="concerns-count">
              {
                studentConcerns.filter((concern) => concern.status === "Open")
                  .length
              }{" "}
              open
            </span>
          </div>
          {sentReviewNotice && (
            <p className="concern-sent-notice" role="status">
              <Icon name="check" size={15} /> {sentReviewNotice}
            </p>
          )}
          <div className="concerns-list">
            {studentConcerns.map((concern) => {
              const student =
                students.find((item) => item.id === concern.studentId) ??
                students[0]
              const decision = concernDecisions[concern.id]
              const isExpanded = expandedConcernId === concern.id
              return (
                <article
                  className={`concern-card${isExpanded ? " expanded" : ""}`}
                  key={concern.id}
                >
                  <span className="concern-avatar" aria-hidden="true">
                    {student.name
                      .split(/[ ,]/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((name) => name[0])
                      .join("")}
                  </span>
                  <div className="concern-copy">
                    <div className="concern-meta">
                      <strong>{student.name}</strong>
                      <span>{concern.category}</span>
                    </div>
                    <p>{concern.message}</p>
                    <small>
                      {concern.section} · {concern.submittedAt}
                    </small>
                  </div>
                  <button
                    className={
                      concern.status === "Open"
                        ? "secondary-button compact concern-review"
                        : `concern-reviewed ${concern.status.toLowerCase()}`
                    }
                    type="button"
                    disabled={concern.status !== "Open"}
                    onClick={() =>
                      setExpandedConcernId((current) =>
                        current === concern.id ? null : concern.id,
                      )
                    }
                  >
                    {concern.status === "Open"
                      ? isExpanded
                        ? "Close review"
                        : "Review request"
                      : concern.status}
                  </button>
                  {isExpanded && (
                    <div className="concern-review-panel">
                      <div className="concern-review-heading">
                        <div>
                          <strong>Review request</strong>
                          <small>
                            Select a decision and send a reply to {student.name}
                            .
                          </small>
                        </div>
                        <span className="status-pill">Awaiting decision</span>
                      </div>
                      <div
                        className="concern-decision-buttons"
                        role="group"
                        aria-label={`Decision for ${student.name}'s request`}
                      >
                        <button
                          className={
                            decision === "Accepted"
                              ? "selected accept"
                              : "accept"
                          }
                          type="button"
                          onClick={() =>
                            setConcernDecisions((decisions) => ({
                              ...decisions,
                              [concern.id]: "Accepted",
                            }))
                          }
                          aria-pressed={decision === "Accepted"}
                        >
                          <Icon name="check" size={15} /> Accept request
                        </button>
                        <button
                          className={
                            decision === "Denied" ? "selected deny" : "deny"
                          }
                          type="button"
                          onClick={() =>
                            setConcernDecisions((decisions) => ({
                              ...decisions,
                              [concern.id]: "Denied",
                            }))
                          }
                          aria-pressed={decision === "Denied"}
                        >
                          <Icon name="minus" size={15} /> Deny request
                        </button>
                      </div>
                      <label className="concern-reply-field">
                        Reply to student
                        <textarea
                          value={concernReplies[concern.id] ?? ""}
                          onChange={(event) =>
                            setConcernReplies((replies) => ({
                              ...replies,
                              [concern.id]: event.target.value,
                            }))
                          }
                          placeholder="Write a clear, respectful response to the student..."
                        />
                      </label>
                      <div className="concern-review-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => setExpandedConcernId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="primary-button"
                          type="button"
                          disabled={
                            !decision || !concernReplies[concern.id]?.trim()
                          }
                          onClick={() => {
                            if (!decision) return
                            setStudentConcerns((concerns) =>
                              concerns.map((item) =>
                                item.id === concern.id
                                  ? { ...item, status: decision }
                                  : item,
                              ),
                            )
                            setSentReviewNotice(
                              `Review sent to ${student.name}. Request ${decision.toLowerCase()}.`,
                            )
                            setExpandedConcernId(null)
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
        <div className="timeline">
          {reminders.map((a, i) => (
            <article key={`${a.title}-${i}`}>
              {(() => {
                const status = getActivityStatus(a, i)
                return (
                  <>
                    <div className="timeline-date">
                      <strong>{formatReminderDay(a.date)}</strong>
                      <span>{formatReminderMonth(a.date)}</span>
                    </div>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <span
                        className={`status-pill activity-status ${status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {status}
                      </span>
                      <h3>{a.title}</h3>
                      <p>
                        {a.type} ·{" "}
                        {classes.find((item) => item.id === a.classId)?.code ??
                          "Unassigned class"}
                      </p>
                      <small>
                        <Icon name="clock" size={15} />
                        {formatActivityTime(a.startTime)} –{" "}
                        {formatActivityTime(a.endTime)}
                      </small>
                      {a.participation === "Group" && (
                        <small className="group-activity-note">
                          <Icon name="users" size={15} />
                          Group activity · {a.groups.length}{" "}
                          {a.groups.length === 1 ? "group" : "groups"}
                        </small>
                      )}
                    </div>
                    <button
                      aria-label={`Edit ${a.title}`}
                      onClick={() => {
                        setDraft(a)
                        setActiveGroupId(null)
                        setEditing(i)
                      }}
                    >
                      <Icon name="edit" />
                    </button>
                  </>
                )
              })()}
            </article>
          ))}
        </div>
      </div>
      {editing !== null && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <section
            className="reminder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reminder-title"
          >
            <button
              className="modal-close"
              onClick={() => setEditing(null)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="eyebrow">Faculty calendar</p>
            <h2 id="reminder-title">
              {editing === -1 ? "Add a reminder" : "Edit reminder"}
            </h2>
            <p>Create a scheduled exam, quiz, or class activity.</p>
            <label>
              Title
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Midterm examination"
              />
            </label>
            <label>
              Activity type
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              >
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Class
              <select
                value={draft.classId}
                onChange={(e) =>
                  setDraft({ ...draft, classId: Number(e.target.value) })
                }
              >
                {classes.map((item)=> (
                  <option key={item.id} value={item.id}>
                    {item.subject} · {item.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Participation
              <select
                value={draft.participation}
                onChange={(e) => {
                  const participation = e.target.value
                  setDraft({
                    ...draft,
                    participation,
                    groups: participation === "Group" ? draft.groups : [],
                  })
                  setActiveGroupId(null)
                }}
              >
                <option value="Individual">Individual</option>
                <option value="Group">Group</option>
              </select>
            </label>
            {draft.participation === "Group" && (
              <section
                className="group-setup"
                aria-labelledby="group-setup-title"
              >
                <div className="group-setup-heading">
                  <div>
                    <p className="eyebrow">Participation · Group</p>
                    <h3 id="group-setup-title">Group setup</h3>
                  </div>
                  <button
                    type="button"
                    className="secondary-button compact"
                    onClick={addGroup}
                  >
                    <Icon name="plus" size={15} /> Add group
                  </button>
                </div>
                {draft.groups.length === 0 ? (
                  <p className="group-empty">
                    Add a group, then choose the students who will work
                    together.
                  </p>
                ) : (
                  <div className="group-list">
                    {draft.groups.map((group) => (
                      <section className="group-card" key={group.id}>
                        <div className="group-card-heading">
                          <input
                            value={group.name}
                            onChange={(e) =>
                              updateGroupName(group.id, e.target.value)
                            }
                            aria-label="Group name"
                          />
                          <button
                            type="button"
                            className="group-remove"
                            onClick={() => removeGroup(group.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="group-card-actions">
                          <span>
                            {group.studentIds.length}{" "}
                            {group.studentIds.length === 1
                              ? "student"
                              : "students"}
                          </span>
                          <button
                            type="button"
                            className="group-student-trigger"
                            onClick={() =>
                              setActiveGroupId((activeId) =>
                                activeId === group.id ? null : group.id,
                              )
                            }
                          >
                            <Icon name="plus" size={14} />
                            {activeGroupId === group.id
                              ? "Hide students"
                              : "Add students"}
                          </button>
                        </div>
                        {activeGroupId === group.id && (
                          <div className="group-students">
                            {students.map((student) => (
                              <label key={student.id}>
                                <input
                                  type="checkbox"
                                  checked={group.studentIds.includes(
                                    student.id,
                                  )}
                                  onChange={() =>
                                    toggleStudentInGroup(group.id, student.id)
                                  }
                                />
                                <span>
                                  <strong>{student.name}</strong>
                                  <small>{student.id}</small>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </section>
            )}
            <label>
              Date
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                required
              />
              <small className="reminder-date-preview">
                {formatReminderDateLong(draft.date)}
              </small>
            </label>
            <div className="reminder-fields">
              <label>
                Start time
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(e) =>
                    setDraft({ ...draft, startTime: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                End time
                <input
                  type="time"
                  min={draft.startTime}
                  value={draft.endTime}
                  onChange={(e) =>
                    setDraft({ ...draft, endTime: e.target.value })
                  }
                  required
                />
              </label>
            </div>
            <button className="primary-button" onClick={saveReminder}>
              Save reminder
            </button>
          </section>
        </div>
      )}
    </>
  )
}

function ProfilePage({
  setPage,
  onLogout,
}: {
  setPage: (page: string) => void
  onLogout: () => void
}) {
  const [profile, setProfile] = useState({
    name: "Prof. Maria Santos",
    department: "College of Information Technology",
    facultyNumber: "FAC-0015",
    email: "maria.santos@classtrack.edu",
  })
  const [draftProfile, setDraftProfile] = useState(profile)
  const [editingProfile, setEditingProfile] = useState(false)
  const openProfileEditor = () => {
    setDraftProfile(profile)
    setEditingProfile(true)
  }
  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfile({
      name: draftProfile.name.trim(),
      department: draftProfile.department.trim(),
      facultyNumber: draftProfile.facultyNumber.trim(),
      email: draftProfile.email.trim(),
    })
    setEditingProfile(false)
  }

  return (
    <>
      <Header
        title="Profile"
        onNotify={() => {}}
        onProfile={() => setPage("profile")}
      />
      <section className="profile-hero">
        <img src={professorPhoto} alt={profile.name} />
        <div>
          <span className="status-pill">Faculty</span>
          <h2>{profile.name}</h2>
          <p>{profile.department}</p>
          <small>Faculty No. {profile.facultyNumber}</small>
        </div>
        <button className="secondary-button" onClick={openProfileEditor}>
          Edit profile
        </button>
      </section>
      <div className="profile-grid">
        <section className="profile-panel">
          <p className="eyebrow">Account</p>
          <h3>Personal settings</h3>
          {[
            "Profile information",
            "Notification preferences",
            "Privacy & security",
          ].map((x) => (
            <button key={x}>
              {x}
              <Icon name="chevron" />
            </button>
          ))}
        </section>
        <section className="profile-panel">
          <p className="eyebrow">Teaching</p>
          <h3>Class management</h3>
          {[
            "Class records export",
            "Assessment templates",
            "Attendance settings",
          ].map((x) => (
            <button key={x}>
              {x}
              <Icon name="chevron" />
            </button>
          ))}
        </section>
      </div>
      <button className="profile-mobile-logout" onClick={onLogout}>
        <Icon name="logout" size={18} />
        Log out
      </button>
      {editingProfile && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditingProfile(false)
          }
        >
          <section
            className="profile-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <button
              className="modal-close"
              onClick={() => setEditingProfile(false)}
              aria-label="Close edit profile"
            >
              ×
            </button>
            <p className="eyebrow">Faculty profile</p>
            <h2 id="edit-profile-title">Edit profile</h2>
            <p>Keep your ClassTrack faculty information up to date.</p>
            <form onSubmit={saveProfile}>
              <div className="profile-photo-summary">
                <img src={professorPhoto} alt="" />
                <div>
                  <strong>{profile.name}</strong>
                  <small>
                    Your profile photo is managed by your institution.
                  </small>
                </div>
              </div>
              <div className="profile-form-fields">
                <label>
                  Full name <em>Required</em>
                  <input
                    value={draftProfile.name}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  University email <em>Required</em>
                  <input
                    type="email"
                    value={draftProfile.email}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  College or department <em>Required</em>
                  <input
                    value={draftProfile.department}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        department: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Faculty number <em>Required</em>
                  <input
                    value={draftProfile.facultyNumber}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        facultyNumber: event.target.value,
                      })
                    }
                    required
                  />
                </label>
              </div>
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

function ActiveClass({
  item,
  onClose,
  onEnd,
  onMinimize,
  initialStarted = false,
  initialStartedAt,
  viewOnly = false,
}: {
  item: ClassItem
  onClose: () => void
  onEnd: () => void
  onMinimize: (startedAt: number) => void
  initialStarted?: boolean
  initialStartedAt?: number
  viewOnly?: boolean
}) {
  const [started, setStarted] = useState(initialStarted)
  const [startedAt, setStartedAt] = useState(initialStartedAt)
  const [scannerMode, setScannerMode] = useState<"attendance" | "performance">(
    "attendance",
  )
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false)
  const [manualAttendance, setManualAttendance] = useState<Record<string, boolean>>(
    {},
  )
  const liveRoster = [
    { name: "Dela Cruz, Juan", id: "2026-0025", time: "8:01 AM", status: "Present", method: "NFC card" },
    { name: "Reyes, Ana", id: "2026-0026", time: "8:03 AM", status: "Present", method: "NFC card" },
    { name: "Santos, Mark", id: "2026-0027", time: "8:05 AM", status: "Present", method: "QR code" },
    { name: "Villanueva, Bea", id: "2026-0028", time: "8:12 AM", status: "Late", method: "NFC card" },
    { name: "Garcia, Luis", id: "2026-0029", time: "—", status: "Not recorded", method: "—" },
  ]
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) =>
        e.target === e.currentTarget &&
        (started && startedAt ? onMinimize(startedAt) : onClose())
      }
    >
      <section
        className="session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-title"
      >
        {started && (
          <button
            className="session-minimize"
            onClick={() => startedAt && onMinimize(startedAt)}
            aria-label="Minimize live session"
            title="Minimize live session"
          >
            <Icon name="minus" size={19} />
          </button>
        )}
        <div className="live-badge">
          <span />{" "}
          {viewOnly
            ? "Class ended"
            : started
              ? "Live session"
              : "Ready to begin"}
        </div>
        <p className="eyebrow">Today · {item.time}</p>
        <h2 id="session-title">{item.subject}</h2>
        <p>
          {item.code} · {item.room}
        </p>
        {started && (
          <div className="session-attendance-stats" aria-label="Session attendance summary">
            <div>
              <strong>24</strong>
              <small>Present</small>
            </div>
            <div>
              <strong>3</strong>
              <small>Late</small>
            </div>
            <div>
              <strong>5</strong>
              <small>Not recorded</small>
            </div>
            <div>
              <strong>{item.attendance}</strong>
              <small>Enrolled</small>
            </div>
          </div>
        )}
        {!started ? (
          <div className="session-setup">
            <div>
              <span>
                <Icon name={viewOnly ? "check" : "clock"} />
              </span>
              <strong>{viewOnly ? "Closed" : "15 min"}</strong>
              <small>{viewOnly ? "Class session" : "Attendance window"}</small>
            </div>
            <div>
              <span>
                <Icon name={viewOnly ? "users" : "scan"} />
              </span>
              <strong>
                {viewOnly ? `24 of ${item.attendance}` : "60 sec"}
              </strong>
              <small>{viewOnly ? "Students joined" : "QR refresh"}</small>
            </div>
            <div>
              <span>
                <Icon name={viewOnly ? "chart" : "users"} />
              </span>
              <strong>{viewOnly ? "Saved" : item.attendance}</strong>
              <small>{viewOnly ? "Class records" : "Enrolled students"}</small>
            </div>
          </div>
        ) : (
          <>
            <div className="session-live-layout">
              <div className="session-checkin-stack">
            <section
              className="nfc-scanner-card"
              aria-labelledby="nfc-scanner-title"
            >
              <div className="nfc-scanner-heading">
                <span className="nfc-scanner-icon">
                  <Icon name="scan" size={20} />
                </span>
                <div>
                  <span className="nfc-scanner-label">NFC scanner</span>
                  <strong id="nfc-scanner-title">
                    Active <i aria-hidden="true" />
                  </strong>
                  <small>Ready for a student card tap</small>
                </div>
                <span className="session-online-status">
                  <i aria-hidden="true" /> Online
                </span>
              </div>
              <div
                className="nfc-mode-picker"
                role="group"
                aria-label="NFC recording mode"
              >
                <button
                  className={scannerMode === "attendance" ? "active" : ""}
                  onClick={() => setScannerMode("attendance")}
                  aria-pressed={scannerMode === "attendance"}
                >
                  <Icon name="check" size={14} /> Attendance
                </button>
                <button
                  className={scannerMode === "performance" ? "active" : ""}
                  onClick={() => setScannerMode("performance")}
                  aria-pressed={scannerMode === "performance"}
                >
                  <Icon name="chart" size={14} /> Performance
                </button>
              </div>
              <div className="nfc-tap-prompt">
                <span>
                  <Icon name="scan" size={22} />
                </span>
                <div>
                  <strong>Tap a card to record {scannerMode}</strong>
                  <small>
                    {scannerMode === "attendance"
                      ? "Each tap marks the student present."
                      : "Each tap opens the student performance record."}
                  </small>
                </div>
              </div>
            </section>
            {scannerMode === "attendance" ? (
              <section className="qr-card" aria-labelledby="qr-check-in-title">
              <div className="qr-card-heading">
                <div>
                  <span>Alternative check-in</span>
                  <strong id="qr-check-in-title">Student QR code</strong>
                </div>
                <Icon name="scan" size={18} />
              </div>
              <div className="qr-pattern" aria-label="Student QR check-in code">
                <span />
                <span />
                <span />
                <i />
                <i />
                <i />
                <b />
                <b />
                <b />
              </div>
              <p>Students can scan this code to join the session.</p>
              <div className="progress-label">
                <span>Joined students</span>
                <strong>24 of {item.attendance}</strong>
              </div>
              <div className="progress">
                <span style={{ width: "75%" }} />
              </div>
              </section>
            ) : (
              <section className="performance-mode-card" aria-label="Performance mode">
                <span><Icon name="chart" size={20} /></span>
                <div>
                  <small>Performance mode</small>
                  <strong>Ready to log performance</strong>
                  <p>Tap a student NFC card to open their performance record.</p>
                </div>
              </section>
            )}
              </div>
              <section className="session-attendance-roster" aria-labelledby="session-roster-title">
                <div className="session-roster-heading">
                  <div>
                    <span>Live attendance</span>
                    <strong id="session-roster-title">Attendance roster</strong>
                  </div>
                  {scannerMode === "attendance" && (
                    <button
                      className={manualAttendanceOpen ? "manual-roster-toggle active" : "manual-roster-toggle"}
                      type="button"
                      onClick={() => setManualAttendanceOpen((open) => !open)}
                      aria-pressed={manualAttendanceOpen}
                    >
                      <Icon name="check" size={12} /> Manual mark
                    </button>
                  )}
                </div>
                <div className="session-roster-table" role="table" aria-label="Live attendance roster">
                  <div className="session-roster-row session-roster-labels" role="row">
                    <span>Student</span>
                    <span>Time</span>
                    <span>Status</span>
                  </div>
                  {liveRoster.map((student) => {
                    const manuallyMarked = manualAttendance[student.id] ?? false
                    const status = manuallyMarked ? "Present" : student.status
                    const time =
                      manuallyMarked && student.status !== "Present"
                        ? "Manual"
                        : student.time
                    const method = manuallyMarked ? "Manual" : student.method
                    return (
                    <div className="session-roster-row" role="row" key={student.id}>
                      <span className="session-roster-student">
                        {scannerMode === "attendance" && manualAttendanceOpen && (
                          <input
                            type="checkbox"
                            checked={manualAttendance[student.id] ?? false}
                            onChange={(event) =>
                              setManualAttendance((current) => ({
                                ...current,
                                [student.id]: event.target.checked,
                              }))
                            }
                            aria-label={`Mark ${student.name} present manually`}
                          />
                        )}
                        <span>
                          <strong>{student.name}</strong>
                          <small>{student.id} · {method}</small>
                        </span>
                      </span>
                      <span>{time}</span>
                      <span className={status.toLowerCase().replace(" ", "-")}>
                        {status}
                      </span>
                    </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </>
        )}
        <button
          className={
            viewOnly
              ? "secondary-button session-button"
              : started
                ? "danger-button"
                : "primary-button session-button"
          }
          onClick={() => {
            if (viewOnly) onClose()
            else if (started) onEnd()
            else {
              setStartedAt(Date.now())
              setScannerMode("attendance")
              setStarted(true)
            }
          }}
        >
          {viewOnly ? (
            "Close overview"
          ) : started ? (
            "End class"
          ) : (
            <>
              <Icon name="play" /> Start class session
            </>
          )}
        </button>
      </section>
    </div>
  )
}

function formatSessionDuration(startedAt: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return `${
    hours ? `${String(hours).padStart(2, "0")}:` : ""
  }${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
}

function MinimizedSession({
  item,
  startedAt,
  onRestore,
  className = "",
  position,
  onPositionChange,
}: {
  item: ClassItem
  startedAt: number
  onRestore: () => void
  className?: string
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const trayRef = useRef<HTMLElement>(null)
  const dragState = useRef<{
    pointerId: number
    startX: number
    startY: number
    position: { x: number; y: number }
    minX: number
    maxX: number
    minY: number
    maxY: number
  } | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const startDragging = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = trayRef.current?.getBoundingClientRect()
    if (!rect) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      position,
      minX: -(rect.left - position.x),
      maxX: window.innerWidth - (rect.right - position.x),
      minY: -(rect.top - position.y),
      maxY: window.innerHeight - (rect.bottom - position.y),
    }
  }
  const drag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const activeDrag = dragState.current
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return
    onPositionChange({
      x: Math.min(
        activeDrag.maxX,
        Math.max(
          activeDrag.minX,
          activeDrag.position.x + event.clientX - activeDrag.startX,
        ),
      ),
      y: Math.min(
        activeDrag.maxY,
        Math.max(
          activeDrag.minY,
          activeDrag.position.y + event.clientY - activeDrag.startY,
        ),
      ),
    })
  }
  const stopDragging = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragState.current?.pointerId !== event.pointerId) return
    dragState.current = null
  }

  return (
    <aside
      ref={trayRef}
      className={`live-session-tray live-session-tray-larger ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      aria-label={`Live class: ${item.subject}`}
    >
      <button className="live-tray-resume" type="button" onClick={onRestore}>
        <span className="live-tray-status live-tray-status-custom">
          <i /> Live class
        </span>
        <span className="live-tray-details">
          <strong className="live-tray-subject-custom">{item.subject}</strong>
          <small className="live-tray-duration-custom">
            <Icon name="clock" size={13} />{" "}
            {formatSessionDuration(startedAt, now)} elapsed
          </small>
        </span>
        <span className="live-tray-expand live-tray-expand-custom">
          Resume <Icon name="arrow" size={15} />
        </span>
      </button>
      <button
        className="live-tray-drag-handle"
        type="button"
        onPointerDown={startDragging}
        onPointerMove={drag}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        aria-label="Drag live class"
        title="Drag to move"
      >
        <Icon name="more" size={16} />
      </button>
    </aside>
  )
}

function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const isSignUp = authMode === "signUp"

  return (
    <main className="landing-page">
      {/* Left Intro Panel with Background Image & Bleeding Vignette Effect */}
      <section
        className="landing-intro"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(7, 44, 82, 0.92) 0%, rgba(10, 71, 120, 0.82) 100%), url('/citbuild.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          boxShadow: "inset -30px 0 40px -15px rgba(7, 44, 82, 0.95)",
          position: "relative",
        }}
      >
        <div className="landing-brand">
          <span
            className="landing-logo-placeholder"
            aria-hidden="true"
            style={{ width: "100px", height: "100px", display: "flex" }}
          >
            <img
              src="/cit.png"
              alt="CIT Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </span>
          <span className="landing-brand-name">
            <small style={{ fontSize: "12px" }}>
              College of Industrial Technology
            </small>
          </span>
        </div>
        <div className="landing-copy">
          <h1>Make every class hour count.</h1>
          <p>
            Plan your sessions, record attendance, and keep every student moving
            forward from one focused workspace.
          </p>
        </div>
      </section>

      {/* Right Authentication Panel with Dynamic Header */}
{/* Right Authentication Panel */}
<section
  className="landing-auth-container"
  style={{
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}
>
  {/* 1. Header Placed At The Top */}
  <div className="auth-header" style={{ marginBottom: "5px" }}>
    <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#072c52", marginBottom: "6px" }}>
      {isSignUp ? "Create account" : "Welcome back"}
    </h2>
    <p style={{ fontSize: "14px", color: "#667587" }}>
      {isSignUp
        ? "Set up your faculty credentials to get started."
        : "Sign in to continue to your teaching workspace."}
    </p>
  </div>

  {/* 2. Tab Switcher Below Header */}
  <div
    className="auth-mode-switch"
    role="tablist"
    aria-label="Account access"
    style={{ marginBottom: "5px" }}
  >
    <button
      className={!isSignUp ? "active" : ""}
      role="tab"
      aria-selected={!isSignUp}
      onClick={() => setAuthMode("signIn")}
    >
      Sign in
    </button>
    <button
      className={isSignUp ? "active" : ""}
      role="tab"
      aria-selected={isSignUp}
      onClick={() => setAuthMode("signUp")}
    >
      Create account
    </button>
  </div>

  {/* 3. Form Fields */}
  <form
    className="sign-in-form"
    onSubmit={async (event) => {
  event.preventDefault()

  const formData = new FormData(event.currentTarget)

  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  try {
    if (isSignUp) {
      const fullName = String(formData.get("fullName") ?? "")
      const facultyNumber = String(
        formData.get("facultyNumber") ?? ""
      )
      const department = String(
        formData.get("department") ?? ""
      )

      await registerFaculty({
        email,
        password,
        fullName,
        facultyNumber,
        department,
      })

      alert(
        "Faculty account created. Check your email and confirm your account before signing in."
      )
    } else {
      await loginFaculty(email, password)
      onSignIn()
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Authentication failed."

    console.error("Faculty authentication error:", error)
    alert(message)
  }
}}
  >
    {isSignUp && (
      <label>
        Full name
        <input
          type="text"
          name="fullName"
          placeholder="Prof. Maria Santos"
          autoComplete="name"
          required
        />
      </label>
    )}
    <label>
      University email
      <input
        type="email"
        name="email"
        placeholder="name@university.edu"
        autoComplete="email"
        required
      />
    </label>
    <label>
      Password
      <span className="password-field">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Enter your password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
        </button>
      </span>
    </label>
    {isSignUp ? (
      <>
        <label>
          Confirm password
          <span className="password-field">
            <input
              type={showConfirmation ? "text" : "password"}
              name="passwordConfirmation"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((visible) => !visible)}
              aria-label={
                showConfirmation
                  ? "Hide password confirmation"
                  : "Show password confirmation"
              }
            >
              <Icon
                name={showConfirmation ? "eyeOff" : "eye"}
                size={17}
              />
            </button>
          </span>
        </label>
        <label className="terms-agreement">
          <input type="checkbox" required />
          <span>
            I agree to the <button type="button">terms of use</button> and{" "}
            <button type="button">privacy policy</button>.
          </span>
        </label>
      </>
    ) : (
      <button className="landing-forgot-password" type="button">
        Forgot password?
      </button>
    )}
    <button className="primary-button landing-sign-in" type="submit">
      {isSignUp ? "Create account" : "Sign in"}{" "}
      <Icon name="arrow" size={17} />
    </button>
  </form>

  <div className="sign-in-help">
    <span>
      <Icon name="user" size={17} />
    </span>
    <p>
      <strong>
        {isSignUp ? "Joining a faculty team?" : "Need access?"}
      </strong>
      <small>
        {isSignUp
          ? "Your institution administrator will confirm your faculty access."
          : "Your institution administrator can add you to ClassTrack."}
      </small>
    </p>
  </div>
</section>
    </main>
  )
}

export default function App() {
  const [page, setPage] = useState("home")
  const [signedIn, setSignedIn] = useState(false)
  const [activities, setActivities] =
    useState<ActivityItem[]>(initialActivities)
  const [activeClass, setActiveClass] = useState<ClassItem | null>(null)
  const [activeSessionStartedAt, setActiveSessionStartedAt] =
    useState<number | null>(null)
  const [minimizedSession, setMinimizedSession] = useState<{
    item: ClassItem
    startedAt: number
  } | null>(null)
  const [liveSessionPosition, setLiveSessionPosition] = useState({
    x: 0,
    y: 0,
  })
  const [omrScannerOpen, setOmrScannerOpen] = useState(false)
  const [omrDraftScores, setOmrDraftScores] = useState<Record<string, number>>(
    {},
  )
  const [endedClassIds, setEndedClassIds] = useState<string[]>([])
  const [online, setOnline] = useState(true)

  const logout = () => {
    setSignedIn(false)
    setPage("home")
    setActiveClass(null)
    setActiveSessionStartedAt(null)
    setMinimizedSession(null)
    setEndedClassIds([])
    setOmrScannerOpen(false)
    setOmrDraftScores({})
  }

  const openClass = (item: ClassItem) => {
    if (minimizedSession) {
      setActiveClass(minimizedSession.item)
      setMinimizedSession(null)
      return
    }
    setActiveSessionStartedAt(null)
    setActiveClass(item)
  }

  const restoreMinimizedSession = () => {
    if (!minimizedSession) return
    setActiveClass(minimizedSession.item)
    setMinimizedSession(null)
  }
  const renderPage = () => {
    if (page === "classes")
      return (
        <ClassesPage
          onStart={openClass}
  setPage={setPage}
  endedClassIds={endedClassIds}
/>
      )
    if (page === "records")
      return <RecordsPage setPage={setPage} omrDraftScores={omrDraftScores} />
    if (page === "activities")
      return (
        <ActivitiesPage
          setPage={setPage}
          reminders={activities}
          setReminders={setActivities}
        />
      )
    if (page === "profile")
      return <ProfilePage setPage={setPage} onLogout={logout} />
    if (page === "notifications")
      return (
        <>
          <Header
            title="Notifications"
            onNotify={() => {}}
            onProfile={() => setPage("profile")}
          />
          <div className="empty-prompt">
            <span>
              <Icon name="bell" />
            </span>
            <h3>You’re all caught up</h3>
            <p>New class and student updates will appear here.</p>
          </div>
        </>
      )
    return (
<Dashboard
        onStart={openClass}
  setPage={setPage}
  endedClassIds={endedClassIds}
  activities={activities}
/>
    )
  }

  if (!signedIn) return <LandingPage onSignIn={() => setSignedIn(true)} />

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} onLogout={logout} />
      <main className="main-content">
        <ConnectionNotice
          online={online}
          onToggle={() => setOnline((state) => !state)}
        />
        {renderPage()}
      </main>
      <BottomNav page={page} setPage={setPage} />
      <QuickActionsFab
        setPage={setPage}
        onScanAnswer={() => setOmrScannerOpen(true)}
      />
      {omrScannerOpen && (
        <OmrScannerModal
          onClose={() => setOmrScannerOpen(false)}
          onSaveDraft={(studentId, assessmentId, score) =>
            setOmrDraftScores((scores) => ({
              ...scores,
              [`${studentId}:${assessmentId}`]: score,
            }))
          }
        />
      )}
      {minimizedSession && !activeClass && (
        <MinimizedSession
          {...minimizedSession}
          className="live-session-tray-global"
          onRestore={restoreMinimizedSession}
          position={liveSessionPosition}
          onPositionChange={setLiveSessionPosition}
        />
      )}
      {activeClass && (
        <ActiveClass
          item={activeClass}
          viewOnly={
            endedClassIds.includes(activeClass.id) ||
            hasSemesterEnded(activeClass)
          }
          initialStarted={activeSessionStartedAt !== null}
          initialStartedAt={activeSessionStartedAt ?? undefined}
          onClose={() => {
            setActiveClass(null)
            setActiveSessionStartedAt(null)
          }}
          onEnd={() => {
            setActiveClass(null)
            setActiveSessionStartedAt(null)
            setEndedClassIds((ids) =>
              ids.includes(activeClass.id) ? ids : [...ids, activeClass.id],
            )
          }}
          onMinimize={(startedAt) => {
            setMinimizedSession({ item: activeClass, startedAt })
            setLiveSessionPosition({ x: 0, y: 0 })
            setActiveSessionStartedAt(startedAt)
            setActiveClass(null)
          }}
        />
      )}
    </div>
  )
}

