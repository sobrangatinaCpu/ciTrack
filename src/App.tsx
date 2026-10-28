import { useEffect, useMemo, useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { supabase } from './lib/supabase'
import { useAttendanceQr } from "./useAttendanceQr"
import {loginFaculty, registerFaculty,} from "./lib/auth"
import citLogo from "./assets/cit.png"
import citBuilding from "./assets/citbuild.jpg"
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
const normalizeMeetingDay = (value: unknown) => {
  const day = String(value ?? "").trim().slice(0, 3).toUpperCase()
  const aliases: Record<string, string> = {
    MON: "MON", TUE: "TUE", WED: "WED", THU: "THU",
    FRI: "FRI", SAT: "SAT", SUN: "SUN",
  }
  return aliases[day] ?? day
}

const normalizedMeetingDays = (value: unknown): string[] => {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .replace(/^\s*[\[{]/, "")
          .replace(/[\]}]\s*$/, "")
          .replace(/["']/g, "")
          .split(/[,&/]+/)
      : []

  return [...new Set(values.map(normalizeMeetingDay).filter(Boolean))]
}

const mapDatabaseClass = (item: any): ClassItem => {
  const schedules: ClassSchedule[] = (item.class_schedules ?? []).map(
    (schedule: any) => ({
      id: schedule.id,
      meetingDays: normalizedMeetingDays(schedule.meeting_days),
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
    meetingDays: firstSchedule?.meetingDays?.length
      ? firstSchedule.meetingDays
      : normalizedMeetingDays(item.meeting_days),
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
  id?: string
  classId: string
  date: string
  title: string
  type: string
  startTime: string
  endTime: string
  participation: string
  groups: ActivityGroup[]
}

const dashboardDate = "2026-10-23"

const initialActivities: ActivityItem[] = []

const createActivityDraft = (): ActivityItem => ({
  classId: "",
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

type RecordStudent = {
  name: string
  id: string
  score: number
  attendance: string
}

const students: RecordStudent[] = []

type StudentConcern = {
  id: string
  studentId: string
  studentName: string
  category: string
  message: string
  section: string
  submittedAt: string
  createdAt: string
  status: "Open" | "Accepted" | "Denied"
  facultyReply?: string
}

const initialStudentConcerns: StudentConcern[] = []

type RecordSectionOption = {
  id: string
  subject: string
  code: string
  schedule: string
  students: number
  assessmentCount: number
  academicYear: string
}

const recordSections: RecordSectionOption[] = []

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

type MessageDialogDetail = {
  title?: string
  message: string
  tone?: "error" | "info" | "success"
}

const showMessage = (
  message: string,
  tone: MessageDialogDetail["tone"] = "error",
  title?: string,
) => {
  window.dispatchEvent(
    new CustomEvent<MessageDialogDetail>("classtrack:message", {
      detail: { message, tone, title },
    }),
  )
}

function MessageDialogHost() {
  const [dialog, setDialog] = useState<MessageDialogDetail | null>(null)

  useEffect(() => {
    const handleMessage = (event: Event) => {
      const detail = (event as CustomEvent<MessageDialogDetail>).detail
      if (detail?.message) setDialog(detail)
    }
    window.addEventListener("classtrack:message", handleMessage)
    return () => window.removeEventListener("classtrack:message", handleMessage)
  }, [])

  if (!dialog) return null
  const title = dialog.title ?? (dialog.tone === "success" ? "Success" : dialog.tone === "info" ? "Notice" : "Something went wrong")
  return (
    <div className="modal-backdrop formal-message-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDialog(null)}>
      <section className={`formal-message-dialog ${dialog.tone ?? "error"}`} role="alertdialog" aria-modal="true" aria-labelledby="formal-message-title" aria-describedby="formal-message-description">
        <button type="button" className="formal-message-close" onClick={() => setDialog(null)} aria-label="Close message" title="Close">×</button>
        <div className="formal-message-heading">
          <span className="formal-message-icon" aria-hidden="true"><Icon name={dialog.tone === "success" ? "check" : dialog.tone === "info" ? "bell" : "minus"} size={18} /></span>
          <div className="formal-message-copy">
            <h2 id="formal-message-title">{title}</h2>
            <p id="formal-message-description">{dialog.message}</p>
          </div>
        </div>
        <div className="formal-message-actions">
          <button type="button" className="primary-button" onClick={() => setDialog(null)} autoFocus>Okay</button>
        </div>
      </section>
    </div>
  )
}

type ToastTone = "success" | "error" | "info"
type ToastDetail = { message: string; tone?: ToastTone }

const showToast = (message: string, tone: ToastTone = "success") => {
  window.dispatchEvent(new CustomEvent<ToastDetail>("classtrack:toast", { detail: { message, tone } }))
}

function ToastHost() {
  const [toast, setToast] = useState<(ToastDetail & { id: number }) | null>(null)

  useEffect(() => {
    let timer: number | undefined
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail
      if (!detail?.message) return
      if (timer !== undefined) window.clearTimeout(timer)
      setToast({ id: Date.now(), message: detail.message, tone: detail.tone ?? "success" })
      timer = window.setTimeout(() => setToast(null), 3500)
    }
    window.addEventListener("classtrack:toast", handleToast)
    return () => {
      window.removeEventListener("classtrack:toast", handleToast)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  if (!toast) return null
  return (
    <aside className={`app-toast ${toast.tone ?? "success"}`} role="status" aria-live="polite">
      <span className="app-toast-icon"><Icon name={toast.tone === "error" ? "minus" : "check"} size={16} /></span>
      <span>{toast.message}</span>
      <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
    </aside>
  )
}

type FacultyProfile = {
  name: string
  department: string
  facultyNumber: string
  email: string
  photoUrl: string
}

type FacultyNotification = {
  id: string
  kind: "concern" | "petition" | "request"
  title: string
  message: string
  createdAt: string
}

const emptyFacultyProfile: FacultyProfile = {
  name: "",
  department: "",
  facultyNumber: "",
  email: "",
  photoUrl: professorPhoto,
}

const profileFromUser = (user: any): FacultyProfile => {
  const metadata = user?.user_metadata ?? {}
  return {
    name: String(metadata.full_name ?? metadata.name ?? user?.email?.split("@")[0] ?? emptyFacultyProfile.name),
    department: String(metadata.department ?? emptyFacultyProfile.department),
    facultyNumber: String(metadata.faculty_number ?? metadata.facultyNumber ?? emptyFacultyProfile.facultyNumber),
    email: String(user?.email ?? metadata.email ?? ""),
    photoUrl: String(metadata.avatar_url ?? metadata.photo_url ?? professorPhoto),
  }
}

const normalizeStudentRequestCategory = (value: unknown): "concern" | "petition" | "request" => {
  const category = String(value ?? "request").trim().toLowerCase()
  if (category.includes("petition")) return "petition"
  if (category.includes("concern")) return "concern"
  return "request"
}

const studentRequestCategoryLabel = (value: unknown) => {
  const category = normalizeStudentRequestCategory(value)
  return category === "petition" ? "Petition" : category === "concern" ? "Concern" : "Request"
}

const loadFacultyNotifications = async (): Promise<FacultyNotification[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("student_requests")
    .select("id, faculty_id, student_name, category, message, status, created_at")
    .eq("faculty_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) {
    console.error("Unable to load student request notifications:", error)
    return []
  }

  return (data ?? [])
    .filter((row) => ["open", "pending", "submitted"].includes(String(row.status ?? "open").toLowerCase()))
    .map((row) => {
      const kind = normalizeStudentRequestCategory(row.category)
      const label = studentRequestCategoryLabel(row.category)
      const studentName = String(row.student_name ?? "A student")
      return {
        id: `${kind}-${row.id}`,
        kind,
        title: `${label} from ${studentName}`,
        message: String(row.message ?? `${studentName} submitted a ${label.toLowerCase()}.`),
        createdAt: String(row.created_at ?? new Date().toISOString()),
      }
    })
}

function Header({
  title = "Dashboard",
  onNotify,
  onProfile,
}: {
  title?: string
  onNotify: () => void
  onProfile?: () => void
}) {
  const [headerDate, setHeaderDate] = useState(() => new Date())
  const [profile, setProfile] = useState<FacultyProfile>(emptyFacultyProfile)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    let active = true
    const loadHeader = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (active && user) setProfile(profileFromUser(user))
      const notices = await loadFacultyNotifications()
      if (active) setNotificationCount(notices.length)
    }
    void loadHeader()
    const timer = window.setInterval(loadHeader, 60_000)
    const profileChannel = supabase
      .channel("faculty-header-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, loadHeader)
      .subscribe()
    return () => {
      active = false
      window.clearInterval(timer)
      void supabase.removeChannel(profileChannel)
    }
  }, [])

  useEffect(() => {
    let midnightTimer: number | undefined
    const refresh = () => {
      const current = new Date()
      const next = new Date(current)
      next.setHours(24, 0, 0, 0)
      midnightTimer = window.setTimeout(() => {
        setHeaderDate(new Date())
        refresh()
      }, next.getTime() - current.getTime() + 250)
    }
    refresh()
    return () => { if (midnightTimer !== undefined) window.clearTimeout(midnightTimer) }
  }, [])

  const formattedHeaderDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric",
  }).format(headerDate)

  return (
    <header className="topbar">
      <div><p className="eyebrow">{formattedHeaderDate}</p><h1>{title}</h1></div>
      <div className="top-actions">
        <button className="icon-button notification-button" aria-label={`Open notifications${notificationCount ? `, ${notificationCount} unread` : ""}`} onClick={onNotify}>
          <Icon name="bell" />
          {notificationCount > 0 && <span />}
        </button>
        <button className="avatar-menu" onClick={onProfile} aria-label={profile.name ? `Open ${profile.name} profile` : "Open faculty profile"}>
          <img className="mini-avatar" src={profile.photoUrl} alt="" />
          <span className="avatar-tooltip">
            {profile.name ? (
              <>
                <strong>{profile.name}</strong>
                {profile.department && <small>{profile.department}</small>}
                {profile.facultyNumber && <small>Faculty No. {profile.facultyNumber}</small>}
              </>
            ) : (
              <span className="profile-tooltip-skeleton" aria-label="Loading faculty profile" />
            )}
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
            src={citLogo}
            alt="CIT Logo"
            className="sidebar-cit-logo"
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
  const [dashboardClassesLoading, setDashboardClassesLoading] = useState(true)
  const [dashboardClassesError, setDashboardClassesError] = useState("")
  const [dashboardReminders, setDashboardReminders] = useState<ActivityItem[]>([])
  const [dashboardOpenConcerns, setDashboardOpenConcerns] = useState(0)
  const [dashboardFacultyName, setDashboardFacultyName] = useState("")
  const [dashboardNow, setDashboardNow] = useState(() => new Date())

  const dashboardDisplayName = (() => {
    if (!dashboardFacultyName.trim()) return ""
    const cleanedName = dashboardFacultyName.replace(/^prof\.?\s+/i, "").trim()
    const firstName = cleanedName.split(/\s+/)[0] || ""
    return firstName ? `Prof. ${firstName}` : ""
  })()

  const dashboardGreeting = (() => {
    const hour = dashboardNow.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  })()

  useEffect(() => {
    const timer = window.setInterval(() => setDashboardNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    async function loadDashboardFaculty() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const profile = profileFromUser(user)
      setDashboardFacultyName(profile.name)
    }
    void loadDashboardFaculty()
  }, [])

  useEffect(() => {
    let active = true

    const loadDashboardClasses = async () => {
      setDashboardClassesLoading(true)
      setDashboardClassesError("")

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        if (active) {
          setDashboardClasses([])
          setDashboardClassesLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from("classes")
        .select("*, class_schedules(id, meeting_days, start_time, end_time, room)")
        .eq("faculty_id", user.id)
        .order("created_at", { ascending: true })

      if (!active) return
      if (error) {
        console.error("Unable to load dashboard classes:", error)
        setDashboardClasses([])
        setDashboardClassesError(error.message)
      } else {
        setDashboardClasses((data ?? []).map(mapDatabaseClass))
      }
      setDashboardClassesLoading(false)
    }

    void loadDashboardClasses()

    const classChannel = supabase
      .channel("dashboard-class-schedule-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => void loadDashboardClasses())
      .on("postgres_changes", { event: "*", schema: "public", table: "class_schedules" }, () => void loadDashboardClasses())
      .subscribe()

    const reloadVisibleDashboard = () => {
      if (document.visibilityState === "visible") void loadDashboardClasses()
    }
    const reloadFocusedDashboard = () => void loadDashboardClasses()
    document.addEventListener("visibilitychange", reloadVisibleDashboard)
    window.addEventListener("focus", reloadFocusedDashboard)

    return () => {
      active = false
      document.removeEventListener("visibilitychange", reloadVisibleDashboard)
      window.removeEventListener("focus", reloadFocusedDashboard)
      void supabase.removeChannel(classChannel)
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadDashboardItems = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [remindersResult, concernsResult] = await Promise.all([
        supabase
          .from("faculty_reminders")
          .select("id, class_id, reminder_date, title, activity_type, start_time, end_time, participation, groups")
          .eq("faculty_id", user.id)
          .order("reminder_date", { ascending: true }),
        supabase
          .from("student_requests")
          .select("id", { count: "exact", head: true })
          .eq("faculty_id", user.id)
          .eq("status", "Open"),
      ])
      if (!active) return
      if (!remindersResult.error) {
        setDashboardReminders((remindersResult.data ?? []).map((row: any) => ({
          id: String(row.id),
          classId: String(row.class_id ?? ""),
          date: String(row.reminder_date ?? ""),
          title: String(row.title ?? "Reminder"),
          type: String(row.activity_type ?? "Activity"),
          startTime: String(row.start_time ?? "").slice(0, 5),
          endTime: String(row.end_time ?? "").slice(0, 5),
          participation: String(row.participation ?? "Individual"),
          groups: Array.isArray(row.groups) ? row.groups : [],
        })))
      }
      setDashboardOpenConcerns(concernsResult.error ? 0 : concernsResult.count ?? 0)
    }
    void loadDashboardItems()
    const channel = supabase
      .channel("dashboard-reminders-concerns-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "faculty_reminders" }, () => void loadDashboardItems())
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, () => void loadDashboardItems())
      .subscribe()
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  const toLocalDateKey = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-")

  const [calendarNow, setCalendarNow] = useState(() => new Date())
  const today = calendarNow
  const todayKey = toLocalDateKey(today)
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)

  useEffect(() => {
    let midnightTimer: number | undefined

    const scheduleMidnightRefresh = () => {
      const current = new Date()
      const nextMidnight = new Date(current)
      nextMidnight.setHours(24, 0, 0, 0)
      const delay = nextMidnight.getTime() - current.getTime() + 250

      midnightTimer = window.setTimeout(() => {
        const refreshedDate = new Date()
        setCalendarNow(refreshedDate)
        setSelectedDateKey(toLocalDateKey(refreshedDate))
        scheduleMidnightRefresh()
      }, delay)
    }

    scheduleMidnightRefresh()

    return () => {
      if (midnightTimer !== undefined) {
        window.clearTimeout(midnightTimer)
      }
    }
  }, [])

  const monday = new Date(today)
  const mondayOffset = (today.getDay() + 6) % 7
  monday.setHours(12, 0, 0, 0)
  monday.setDate(today.getDate() - mondayOffset)
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })

  const selectedDate =
    weekDates.find((date) => toLocalDateKey(date) === selectedDateKey) ?? today
  const selectedDayCode = dayCodeFromDate(selectedDate)
  const selectedActivities = dashboardReminders.filter(
    (activity) => activity.date === selectedDateKey,
  )
  const selectedClasses = dashboardClasses.filter((item) => {
    const insideSemester =
      (!item.semesterStart || selectedDateKey >= item.semesterStart) &&
      (!item.semesterEnd || selectedDateKey <= item.semesterEnd)
    if (!insideSemester) return false

    const selectedDay = normalizeMeetingDay(selectedDayCode)
    return schedulesForDashboardClass(item).some((schedule) =>
      normalizedMeetingDays(schedule.meetingDays).includes(selectedDay),
    )
  })
  const selectedConcernCount = selectedDateKey === todayKey
    ? dashboardOpenConcerns
    : 0
  const selectedRecordCount = 0
  function schedulesForDashboardClass(item: ClassItem): ClassSchedule[] {
    const classMeetingDays = normalizedMeetingDays(item.meetingDays)
    const schedules = (item.schedules ?? []).map((schedule) => {
      const scheduleMeetingDays = normalizedMeetingDays(schedule.meetingDays)
      return {
        ...schedule,
        meetingDays: scheduleMeetingDays.length > 0 ? scheduleMeetingDays : classMeetingDays,
      }
    })
    const validSchedules = schedules.filter((schedule) => schedule.meetingDays.length > 0)
    if (validSchedules.length > 0) return validSchedules
    if (classMeetingDays.length === 0) return []

    const timeParts = item.time.split(/\s+-\s+/)
    return [{
      id: `${item.id}-fallback-schedule`,
      meetingDays: classMeetingDays,
      startTime: timeParts[0] ?? "",
      endTime: timeParts[1] ?? "",
      room: item.room || "To be confirmed",
    }]
  }

  const focusActivity = selectedActivities[0]
  const selectedDateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(selectedDate)

  const classOccurrencesForDate = (date: Date) => {
    const dateKey = toLocalDateKey(date)
    const dayCode = dayCodeFromDate(date)
    return dashboardClasses.flatMap((item) => {
      if (item.semesterStart && dateKey < item.semesterStart) return []
      if (item.semesterEnd && dateKey > item.semesterEnd) return []
      return schedulesForDashboardClass(item)
        .filter((schedule) =>
          schedule.meetingDays.map(normalizeMeetingDay).includes(normalizeMeetingDay(dayCode)),
        )
        .map((schedule) => ({ item, schedule }))
    })
  }

  return (
    <>
      <Header
        onNotify={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
      />
      <section className="welcome">
        <div className="welcome-main">
          <div className="welcome-copy">
            <p className="eyebrow welcome-greeting">{dashboardGreeting}</p>
            {dashboardDisplayName ? (
              <h2>Ready for today, {dashboardDisplayName}?</h2>
            ) : (
              <div className="profile-name-skeleton dashboard-name-skeleton" aria-label="Loading faculty profile" />
            )}
            <p className="welcome-status-message">
              <span className="fg-inline-bold" data-fge-id="fge-361">
                You have {selectedClasses.length} {selectedClasses.length === 1 ? "class" : "classes"} and {selectedRecordCount} records waiting for review.
              </span>
            </p>
          </div>
          <button
            className="day-activity"
            onClick={() => setPage("activities")}
            aria-label={
              focusActivity
                ? `Open selected activity, ${focusActivity.title} at ${formatActivityTime(focusActivity.startTime)}`
                : "Open activities"
            }
          >
            <span className="day-activity-label">Selected date</span>
            <strong>{focusActivity?.title ?? "No activity yet"}</strong>
            <small>
              <Icon name="clock" size={13} />{" "}
              {focusActivity
                ? `${formatActivityTime(focusActivity.startTime)} · ${dashboardClasses.find((item) => String(item.id) === String(focusActivity.classId))?.code ?? "Class"}`
                : selectedClasses.length
                  ? `${selectedClasses.length} scheduled ${selectedClasses.length === 1 ? "class" : "classes"}`
                  : "No scheduled items"}
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
        <div className="date-tile" aria-label={selectedDateLabel}>
          <strong>{selectedDate.getDate()}</strong>
          <span>{selectedDate.toLocaleString("en", { month: "short" }).toUpperCase()}</span>
        </div>
        <div className="day-strip" aria-label="This week’s dates">
          {weekDates.map((date) => {
            const dateKey = toLocalDateKey(date)
            const classOccurrences = classOccurrencesForDate(date)
            const dayActivities = activities.filter((activity) => activity.date === dateKey)
            const concernCount = dateKey === todayKey ? selectedConcernCount : 0
            const recordCount = dateKey === todayKey ? selectedRecordCount : 0
            const hasItems =
              classOccurrences.length > 0 ||
              dayActivities.length > 0 ||
              concernCount > 0 ||
              recordCount > 0

            return (
              <div className="day-strip-item" key={dateKey}>
                <button
                  type="button"
                  className={dateKey === selectedDateKey ? "active" : ""}
                  onClick={() => setSelectedDateKey(dateKey)}
                  aria-label={`View schedule for ${new Intl.DateTimeFormat("en", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }).format(date)}`}
                >
                  <span>{date.toLocaleString("en", { weekday: "short" }).toUpperCase()}</span>
                  <strong>{date.getDate()}</strong>
                  {hasItems && (
                    <span className="day-event-dots" aria-hidden="true">
                      {classOccurrences.length > 0 && <i className="class-dot" />}
                      {dayActivities.length > 0 && <i className="activity-dot" />}
                      {recordCount > 0 && <i className="record-dot" />}
                      {concernCount > 0 && <i className="concern-dot" />}
                    </span>
                  )}
                </button>

                <div className="day-hover-card" role="tooltip">
                  <strong>{new Intl.DateTimeFormat("en", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }).format(date)}</strong>

                  {classOccurrences.length > 0 && (
                    <section>
                      <span>Classes</span>
                      {classOccurrences.map(({ item, schedule }: { item: ClassItem; schedule: ClassSchedule }) => (
                        <button
                          type="button"
                          key={`${item.id}-${schedule.id}`}
                          onClick={() => onStart(item)}
                        >
                          <b>{item.subject}</b>
                          <small>
                            {formatDatabaseTime(schedule.startTime)} - {formatDatabaseTime(schedule.endTime)}
                            {schedule.room ? ` · ${schedule.room}` : ""}
                          </small>
                        </button>
                      ))}
                    </section>
                  )}

                  {dayActivities.length > 0 && (
                    <section className="day-hover-reminders">
                      <span>Reminders</span>
                      {dayActivities.map((activity, index) => (
                        <button
                          type="button"
                          key={`${activity.title}-${index}`}
                          onClick={() => setPage("activities")}
                        >
                          <b>{activity.title}</b>
                          <small>{formatActivityTime(activity.startTime)}</small>
                        </button>
                      ))}
                    </section>
                  )}

                  {(recordCount > 0 || concernCount > 0) && (
                    <section className="day-hover-counts">
                      {recordCount > 0 && <span>{recordCount} records to review</span>}
                      {concernCount > 0 && <span>{concernCount} open concerns</span>}
                    </section>
                  )}

                  {!hasItems && <p>No scheduled items</p>}
                </div>
              </div>
            )
          })}
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
              <small>Total active classes</small>
            </span>
          </button>
          <button onClick={() => setPage("records")}>
            <span className="summary-icon amber">
              <Icon name="clipboard" />
            </span>
            <span>
              <strong>0 drafts</strong>
              <small>No records waiting for review</small>
            </span>
          </button>
          <button onClick={() => setPage("activities")}>
            <span className="summary-icon blue">
              <Icon name="users" />
            </span>
            <span>
              <strong>{dashboardOpenConcerns} {dashboardOpenConcerns === 1 ? "concern" : "concerns"}</strong>
              <small>{dashboardOpenConcerns > 0 ? "Need your attention" : "No open concerns"}</small>
            </span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your schedule</p>
            <h2>{selectedDateKey === todayKey ? "Today’s classes" : `${selectedDate.toLocaleString("en", { weekday: "long" })} classes`}</h2>
          </div>
          <button onClick={() => setPage("classes")}>
            See all <Icon name="arrow" size={16} />
          </button>
        </div>
<div className="class-grid">
          {dashboardClassesLoading ? (
            <div className="dashboard-class-empty" role="status">
              <span className="dashboard-class-empty-icon"><Icon name="calendar" size={22} /></span>
              <div><strong>Loading classes...</strong><p>Checking the selected date and class schedules.</p></div>
            </div>
          ) : dashboardClassesError ? (
            <div className="dashboard-class-empty error" role="alert">
              <span className="dashboard-class-empty-icon"><Icon name="minus" size={22} /></span>
              <div><strong>Classes could not be loaded</strong><p>{dashboardClassesError}</p></div>
              <button type="button" className="secondary-button" onClick={() => setPage("classes")}>Open classes</button>
            </div>
          ) : selectedClasses.length > 0 ? (
            selectedClasses.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onStart={onStart}
                ended={endedClassIds.map(String).includes(String(item.id))}
                activity={selectedActivities.find((activity) => String(activity.classId) === String(item.id))}
              />
            ))
          ) : (
            <div className="dashboard-class-empty">
              <span className="dashboard-class-empty-icon"><Icon name="calendar" size={22} /></span>
              <div>
                <strong>No classes scheduled for {selectedDateKey === todayKey ? "today" : selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</strong>
                <p>No active class has a meeting schedule matching {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}. Select another calendar date or open Classes to view all active classes.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setPage("classes")}>View all classes</button>
            </div>
          )}
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
      showMessage("Complete all required class and schedule information. Each schedule needs at least one day and a valid start and end time.")
      return
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      showMessage("Please sign in before creating or editing a class.")
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
        showMessage(`Unable to update class: ${error?.message ?? "Class not found"}`)
        return
      }
      savedClass = data
      const { error: deleteError } = await supabase
        .from("class_schedules")
        .delete()
        .eq("class_id", initialClass.id)
      if (deleteError) {
        setSaving(false)
        showMessage(`Unable to replace schedules: ${deleteError.message}`)
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
        showMessage(`Unable to create class: ${error.message}`)
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
      showMessage(`Unable to save schedules: ${scheduleError.message}`)
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
      showToast(`Class created successfully. Access code: ${savedClass.access_code ?? studentAccessCode}`)
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
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null)
  const [classDeleting, setClassDeleting] = useState(false)

  const deleteClass = async () => {
    if (!classToDelete || classDeleting) return
    setClassDeleting(true)

    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", String(classToDelete.id))

    setClassDeleting(false)
    if (error) {
      console.error("Unable to delete class:", error)
      showMessage(`Unable to delete class: ${error.message}`, "error", "Class was not deleted")
      return
    }

    setClassList((current) =>
      current.filter((classItem) => String(classItem.id) !== String(classToDelete.id)),
    )
    setClassToDelete(null)
    showToast("Class deleted successfully.")
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
  const [classesPageNow, setClassesPageNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setClassesPageNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const todayDayCode = dayCodeFromDate(classesPageNow)
  const currentMinutes = classesPageNow.getHours() * 60 + classesPageNow.getMinutes()
  const todaySchedule = classList
    .flatMap((item) =>
      (item.schedules ?? [])
        .filter((schedule) => schedule.meetingDays.includes(todayDayCode))
        .map((schedule) => ({ item, schedule })),
    )
    .sort(
      (a, b) =>
        minutesFromTime(a.schedule.startTime) -
        minutesFromTime(b.schedule.startTime),
    )
  const activeScheduleToday = todaySchedule.find(({ item, schedule }: { item: ClassItem; schedule: ClassSchedule }) => {
    if (endedClassIds.includes(String(item.id))) return false
    const start = minutesFromTime(schedule.startTime)
    const end = minutesFromTime(schedule.endTime)
    return currentMinutes >= start && currentMinutes < end
  })
  const nextClassToday = todaySchedule.find(({ item, schedule }: { item: ClassItem; schedule: ClassSchedule }) =>
    !endedClassIds.includes(String(item.id)) && minutesFromTime(schedule.startTime) > currentMinutes,
  )
  const endedClassesToday = todaySchedule.filter(({ item }: { item: ClassItem; schedule: ClassSchedule }) => endedClassIds.includes(String(item.id)))
  const lastClassToday = todaySchedule.at(-1)
  const scheduleStatus = activeScheduleToday
    ? {
        title: `${activeScheduleToday.item.subject} is in progress`,
        message: `${formatDatabaseTime(activeScheduleToday.schedule.startTime)} - ${formatDatabaseTime(activeScheduleToday.schedule.endTime)}${activeScheduleToday.schedule.room ? ` · ${activeScheduleToday.schedule.room}` : ""}`,
      }
    : nextClassToday
      ? {
          title: `Next class: ${nextClassToday.item.subject}`,
          message: `${formatDatabaseTime(nextClassToday.schedule.startTime)} - ${formatDatabaseTime(nextClassToday.schedule.endTime)}${nextClassToday.schedule.room ? ` · ${nextClassToday.schedule.room}` : ""}`,
        }
      : endedClassesToday.length > 0
        ? {
            title: endedClassesToday.length === 1 ? "Class ended" : "Classes ended for today",
            message: endedClassesToday.length === 1
              ? `${endedClassesToday[0].item.subject} has ended. Attendance and class records remain available.`
              : `${endedClassesToday.length} classes have ended. Attendance and class records remain available.`,
          }
        : todaySchedule.length === 0
          ? {
              title: "No classes scheduled today",
              message: "Your teaching schedule is clear for today.",
            }
          : {
              title: "Your schedule is clear",
              message: lastClassToday
                ? `Your final class ended at ${formatDatabaseTime(lastClassToday.schedule.endTime)}.`
                : "There are no more scheduled classes today.",
            }

  return (
    <>
      <Header
        title="My classes"
        onNotify={() => setPage("notifications")}
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
    setClassToDelete(classToDelete)
  }}
/>
        ))}
      </div>
      <div className="empty-prompt" aria-live="polite">
        <span>
          <Icon name={activeScheduleToday ? "clock" : endedClassesToday.length > 0 ? "check" : "calendar"} />
        </span>
        <h3>{scheduleStatus.title}</h3>
        <p>{scheduleStatus.message}</p>
      </div>
      {classToDelete && (
        <div className="modal-backdrop class-confirm-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !classDeleting) setClassToDelete(null)
        }}>
          <section className="class-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-class-title" aria-describedby="delete-class-description">
            <button type="button" className="class-confirm-close" onClick={() => setClassToDelete(null)} disabled={classDeleting} aria-label="Close delete class dialog">×</button>
            <div className="class-confirm-header">
              <span className="class-confirm-icon" aria-hidden="true"><Icon name="minus" size={18} /></span>
              <div>
                <h2 id="delete-class-title">Delete class?</h2>
                <p id="delete-class-description"><strong>{classToDelete.subject}</strong> ({classToDelete.code}) will be permanently removed, including connected schedules. This action cannot be undone.</p>
              </div>
            </div>
            <div className="class-confirm-actions">
              <button type="button" className="secondary-button" onClick={() => setClassToDelete(null)} disabled={classDeleting}>Cancel</button>
              <button type="button" className="danger-button" onClick={() => void deleteClass()} disabled={classDeleting}>{classDeleting ? "Deleting..." : "Delete class"}</button>
            </div>
          </section>
        </div>
      )}
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
  const [recordStudents, setRecordStudents] = useState<typeof students>(students)
  const csvInputRef = useRef<HTMLInputElement | null>(null)
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
    "",
  )
  const [recordSectionOptions, setRecordSectionOptions] = useState<RecordSectionOption[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false)

  useEffect(() => {
    let active = true

    const loadRecordSections = async () => {
      setSectionsLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        if (active) {
          setRecordSectionOptions([])
          setSectionsLoading(false)
        }
        return
      }

      const { data: classRows, error: classError } = await supabase
        .from("classes")
        .select("id, subject, code, semester_start, semester_end, class_schedules(meeting_days, start_time, end_time, room)")
        .eq("faculty_id", user.id)
        .order("created_at", { ascending: true })

      if (!active) return
      if (classError) {
        console.error("Unable to load gradebook sections:", classError)
        setRecordSectionOptions([])
        setSectionsLoading(false)
        return
      }

      const classIds = (classRows ?? []).map((item: any) => String(item.id))
      let enrollmentCounts: Record<string, number> = {}
      if (classIds.length > 0) {
        const { data: enrollmentRows, error: enrollmentError } = await supabase
          .from("class_students")
          .select("class_id")
          .in("class_id", classIds)
        if (!enrollmentError) {
          enrollmentCounts = (enrollmentRows ?? []).reduce((counts: Record<string, number>, row: any) => {
            const classId = String(row.class_id ?? "")
            if (classId) counts[classId] = (counts[classId] ?? 0) + 1
            return counts
          }, {})
        }
      }

      const sections = (classRows ?? []).map((item: any) => {
        const schedule = Array.isArray(item.class_schedules) ? item.class_schedules[0] : null
        const days = normalizedMeetingDays(schedule?.meeting_days)
          .map((day) => meetingDayOptions.find((option) => option.value === day)?.label ?? day)
          .join(" & ")
        const start = schedule?.start_time ? formatDatabaseTime(schedule.start_time) : ""
        const end = schedule?.end_time ? formatDatabaseTime(schedule.end_time) : ""
        return {
          id: String(item.id),
          subject: String(item.subject ?? "Untitled class"),
          code: String(item.code ?? "No code"),
          schedule: [days, start && end ? `${start} – ${end}` : ""].filter(Boolean).join(" · ") || "Schedule not set",
          students: enrollmentCounts[String(item.id)] ?? 0,
          assessmentCount: assessmentColumns.length,
          academicYear: (() => {
            const startYear = String(item.semester_start ?? "").slice(0, 4)
            const endYear = String(item.semester_end ?? "").slice(0, 4)
            if (startYear && endYear) return `AY ${startYear}–${endYear}`
            if (startYear) return `AY ${startYear}`
            return "Academic year"
          })(),
        }
      })

      setRecordSectionOptions(sections)
      setSelectedSectionId((current) =>
        sections.some((section) => section.id === current) ? current : sections[0]?.id ?? "",
      )
      setSectionsLoading(false)
    }

    void loadRecordSections()
    const channel = supabase
      .channel("records-sections-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => void loadRecordSections())
      .on("postgres_changes", { event: "*", schema: "public", table: "class_schedules" }, () => void loadRecordSections())
      .on("postgres_changes", { event: "*", schema: "public", table: "class_students" }, () => void loadRecordSections())
      .subscribe()

    const reloadOnFocus = () => void loadRecordSections()
    window.addEventListener("focus", reloadOnFocus)
    return () => {
      active = false
      window.removeEventListener("focus", reloadOnFocus)
      void supabase.removeChannel(channel)
    }
  }, [assessmentColumns.length])

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cit-portal:gradebook")
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.students) && parsed.students.length > 0) setRecordStudents(parsed.students)
      if (parsed.values && typeof parsed.values === "object") setRecordValues(parsed.values)
      if (parsed.statuses && typeof parsed.statuses === "object") setStudentStatuses(parsed.statuses)
      if (Array.isArray(parsed.columns) && parsed.columns.length > 0) setAssessmentColumns(parsed.columns)
      if (parsed.remarks && typeof parsed.remarks === "object") setDailyRemarks(parsed.remarks)
    } catch (error) {
      console.error("Unable to restore gradebook data:", error)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem("cit-portal:gradebook", JSON.stringify({
        students: recordStudents,
        values: recordValues,
        statuses: studentStatuses,
        columns: assessmentColumns,
        remarks: dailyRemarks,
      }))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [recordStudents, recordValues, studentStatuses, assessmentColumns, dailyRemarks])

  const normalizeCsvHeader = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")

  const parseCsv = (text: string) => {
    const rows: string[][] = []
    let row: string[] = []
    let field = ""
    let quoted = false
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index]
      const nextCharacter = text[index + 1]
      if (character === '"' && quoted && nextCharacter === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = !quoted
      } else if (character === "," && !quoted) {
        row.push(field.trim())
        field = ""
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && nextCharacter === "\n") index += 1
        row.push(field.trim())
        if (row.some((cell) => cell !== "")) rows.push(row)
        row = []
        field = ""
      } else {
        field += character
      }
    }
    row.push(field.trim())
    if (row.some((cell) => cell !== "")) rows.push(row)
    return rows
  }

  const importGradebookCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""))
      if (rows.length < 2) {
        showMessage("The CSV must contain a header row and at least one student row.", "error", "CSV could not be imported")
        return
      }
      const headers = rows[0].map(normalizeCsvHeader)
      const findHeader = (...names: string[]) => headers.findIndex((header) => names.includes(header))
      const idIndex = findHeader("student_id", "student_number", "id", "student_no")
      const nameIndex = findHeader("student_name", "name", "full_name")
      const statusIndex = findHeader("status", "attendance_status", "attendance")
      if (idIndex < 0 || nameIndex < 0) {
        showMessage("The CSV needs Student ID and Student Name columns.", "error", "CSV columns are missing")
        return
      }

      const importedStudents: typeof students = []
      const importedValues: Record<string, Record<string, number | "">> = {}
      const importedStatuses: Record<string, string> = {}
      const normalizedColumns = new Map<string, string>()
      assessmentColumns.forEach((column) => {
        normalizedColumns.set(normalizeCsvHeader(column.label), column.id)
        normalizedColumns.set(normalizeCsvHeader(column.id), column.id)
      })
      const fixedScoreHeaders: Record<string, string> = {
        midterm_written: "midterm-written",
        midterm_actual: "midterm-actual",
        final_written: "final-written",
        final_actual: "final-actual",
      }

      rows.slice(1).forEach((cells) => {
        const id = String(cells[idIndex] ?? "").trim()
        const name = String(cells[nameIndex] ?? "").trim()
        if (!id || !name) return
        const status = String(statusIndex >= 0 ? cells[statusIndex] ?? "Present" : "Present").trim() || "Present"
        importedStudents.push({ name, id, score: 0, attendance: status })
        importedStatuses[id] = status
        const values: Record<string, number | ""> = {}
        headers.forEach((header, headerIndex) => {
          const columnId = fixedScoreHeaders[header] ?? normalizedColumns.get(header)
          if (!columnId) return
          const rawValue = String(cells[headerIndex] ?? "").trim()
          if (rawValue === "") values[columnId] = ""
          else {
            const numericValue = Number(rawValue)
            if (Number.isFinite(numericValue)) values[columnId] = Math.max(0, numericValue)
          }
        })
        importedValues[id] = values
      })

      if (importedStudents.length === 0) {
        showMessage("No valid student rows were found in the CSV.", "error", "CSV could not be imported")
        return
      }
      setRecordStudents(importedStudents)
      setRecordValues(importedValues)
      setStudentStatuses(importedStatuses)
      showToast(`${importedStudents.length} students imported successfully.`)
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Unable to read the CSV file.", "error", "CSV import failed")
    }
  }

  const selectedSection =
    recordSectionOptions.find((section) => section.id === selectedSectionId) ??
    recordSectionOptions[0] ?? {
      id: "",
      subject: sectionsLoading ? "Loading classes..." : "No classes available",
      code: sectionsLoading ? "Loading" : "No class",
      schedule: sectionsLoading ? "Loading schedule..." : "Create a class to begin using Records",
      students: 0,
      assessmentCount: assessmentColumns.length,
      academicYear: "Academic year",
    }
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
      recordStudents.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, recordStudents],
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
        id: `${term.toLowerCase()}-${type.toLowerCase().replace(/ /g, "-")}-${Date.now()}`,
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
    scores.length
      ? Math.min(100, Math.max(0, scores.reduce((total, score) => total + score, 0) / scores.length))
      : 0

  const examSubtotal = (
    student: typeof students[number],
    term: "midterm" | "final",
  ) => {
    const written = Number(recordValue(student, `${term}-written`, 0))
    const actual = Number(recordValue(student, `${term}-actual`, 0))
    return written > 0 ? Math.min(100, Math.max(0, (actual / written) * 100)) : 0
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
    return Math.min(100, Math.max(0,
      examPercentage * 0.25 +
      percentageFromColumns(student, quizColumns) * 0.2 +
      percentageFromColumns(student, [
        ...midtermProjectColumns,
        ...finalProjectColumns,
      ]) * 0.25 +
      recitationPercentage * 0.2 +
      attendancePercentage * 0.1,
    ))
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
        onNotify={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
      />
      <section className="records-section-manager" aria-label="Section manager">
        <div className="records-section-summary">
          <span className="records-section-icon">
            <Icon name="book" size={20} />
          </span>
          <div>
            <p className="eyebrow">Teaching load</p>
            <strong>{sectionsLoading ? "Loading sections..." : `${recordSectionOptions.length} active section${recordSectionOptions.length === 1 ? "" : "s"}`}</strong>
            <small>Switch subjects without leaving your gradebook.</small>
          </div>
        </div>
        <div className="section-switcher">
          <button
            className="section-switcher-trigger"
            onClick={() => !sectionsLoading && setSectionMenuOpen((open) => !open)}
            aria-expanded={sectionMenuOpen}
            disabled={sectionsLoading || recordSectionOptions.length === 0}
            aria-controls="records-section-menu"
          >
            <span>
              <small>Currently managing</small>
              <strong>{sectionsLoading ? "Loading…" : selectedSection.code}</strong>
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
                <small>{sectionsLoading ? "Loading" : `${recordSectionOptions.length} active this term`}</small>
              </div>
              {recordSectionOptions.map((section) => (
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
      <div className={`page-intro records-course-identity${sectionsLoading ? " records-course-loading" : ""}`}>
        <div>
          {sectionsLoading ? (
            <div className="records-course-skeleton" aria-label="Loading class information">
              <span />
              <span />
              <span />
            </div>
          ) : recordSectionOptions.length === 0 ? (
            <>
              <p className="eyebrow">Class records</p>
              <h2>No classes created yet</h2>
              <p>Create a class first. Only real classes from the database will appear here.</p>
            </>
          ) : (
            <>
              <p className="eyebrow">{selectedSection.academicYear}</p>
              <h2>{selectedSection.code}: {selectedSection.subject}</h2>
              <p>
                {selectedSection.code} · {selectedSection.schedule} · {selectedSection.students === 0 ? "No enrolled students yet" : `${selectedSection.students} student${selectedSection.students === 1 ? "" : "s"}`}
              </p>
            </>
          )}
        </div>
        <label className="records-file-import" title="Import students and gradebook scores from CSV" aria-disabled={sectionsLoading || recordSectionOptions.length === 0}>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => void importGradebookCsv(event)}
            disabled={sectionsLoading || recordSectionOptions.length === 0}
          />
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
                <div className="add-assessment-menu-header">
                  <div>
                    <p>Add a record column</p>
                    <small>Choose the term and assessment type.</small>
                  </div>
                  <button
                    type="button"
                    className="add-assessment-menu-close"
                    onClick={() => setAssessmentMenuOpen(false)}
                    aria-label="Close add assessment menu"
                  >
                    ×
                  </button>
                </div>
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
  const [remindersLoading, setRemindersLoading] = useState(true)
  const [reminderClasses, setReminderClasses] = useState<Array<{ id: string; subject: string; code: string }>>([])
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderNotice, setReminderNotice] = useState("")
  const [reminderToDelete, setReminderToDelete] = useState<ActivityItem | null>(null)
  const [reminderDeleting, setReminderDeleting] = useState(false)

  const mapReminderRow = (row: any): ActivityItem => ({
    id: String(row.id),
    classId: row.class_id ?? "",
    date: String(row.reminder_date ?? ""),
    title: String(row.title ?? ""),
    type: String(row.activity_type ?? "Quiz"),
    startTime: String(row.start_time ?? "").slice(0, 5),
    endTime: String(row.end_time ?? "").slice(0, 5),
    participation: String(row.participation ?? "Individual"),
    groups: Array.isArray(row.groups) ? row.groups : [],
  })

  const loadReminderClasses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from("classes")
      .select("id, subject, code")
      .eq("faculty_id", user.id)
      .order("subject", { ascending: true })
    if (error) {
      setReminderNotice(`Unable to load classes: ${error.message}`)
      setReminderClasses([])
      return
    }
    setReminderClasses((data ?? []).map((item: any) => ({
      id: String(item.id),
      subject: String(item.subject ?? "Untitled class"),
      code: String(item.code ?? ""),
    })))
  }

  const loadReminders = async () => {
    setRemindersLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReminders([])
      setRemindersLoading(false)
      return
    }
    const { data, error } = await supabase
      .from("faculty_reminders")
      .select("id, class_id, reminder_date, title, activity_type, start_time, end_time, participation, groups")
      .eq("faculty_id", user.id)
      .order("reminder_date", { ascending: true })
      .order("start_time", { ascending: true })
    if (error) setReminderNotice(`Unable to load reminders: ${error.message}`)
    else setReminders((data ?? []).map(mapReminderRow))
    setRemindersLoading(false)
  }

  useEffect(() => {
    if (editing === -1 && !draft.classId && reminderClasses.length > 0) {
      setDraft((current) => ({ ...current, classId: reminderClasses[0].id }))
    }
  }, [editing, draft.classId, reminderClasses])

  useEffect(() => {
    void loadReminderClasses()
    void loadReminders()
    const channel = supabase
      .channel("faculty-reminders-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "faculty_reminders" }, () => void loadReminders())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  const [studentConcerns, setStudentConcerns] = useState(initialStudentConcerns)
  const [studentConcernsLoading, setStudentConcernsLoading] = useState(true)
  const [requestCategoryFilter, setRequestCategoryFilter] = useState<"All" | "Petition" | "Request" | "Concern">("All")
  const [reviewSavingId, setReviewSavingId] = useState<string | null>(null)

  const formatRequestSubmittedAt = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Recently"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  const loadStudentRequests = async () => {
    setStudentConcernsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStudentConcerns([])
      setStudentConcernsLoading(false)
      return
    }
    const { data, error } = await supabase
      .from("student_requests")
      .select("id, student_id, student_name, category, message, section, status, faculty_reply, created_at")
      .eq("faculty_id", user.id)
      .order("created_at", { ascending: false })
    if (error) {
      showToast(`Unable to load student requests: ${error.message}`, "error")
      setStudentConcerns([])
    } else {
      setStudentConcerns((data ?? []).map((row: any) => ({
        id: String(row.id),
        studentId: String(row.student_id ?? ""),
        studentName: String(row.student_name ?? "Student"),
        category: String(row.category ?? "Student request"),
        message: String(row.message ?? ""),
        section: String(row.section ?? "Unassigned class"),
        submittedAt: formatRequestSubmittedAt(String(row.created_at ?? "")),
        createdAt: String(row.created_at ?? ""),
        status: row.status === "Accepted" || row.status === "Denied" ? row.status : "Open",
        facultyReply: String(row.faculty_reply ?? ""),
      })))
    }
    setStudentConcernsLoading(false)
  }

  useEffect(() => {
    void loadStudentRequests()
    const channel = supabase
      .channel("faculty-student-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, () => void loadStudentRequests())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  const submitRequestReview = async (concern: StudentConcern) => {
    const decision = concernDecisions[concern.id]
    const reply = concernReplies[concern.id]?.trim()
    if (!decision || !reply) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showMessage("Your session expired. Please sign in again.")
      return
    }
    setReviewSavingId(concern.id)
    const { error } = await supabase
      .from("student_requests")
      .update({
        status: decision,
        faculty_reply: reply,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", concern.id)
      .eq("faculty_id", user.id)
    setReviewSavingId(null)
    if (error) {
      showToast(`Unable to send review: ${error.message}`, "error")
      return
    }
    setExpandedConcernId(null)
    setConcernDecisions((current) => {
      const next = { ...current }
      delete next[concern.id]
      return next
    })
    setConcernReplies((current) => {
      const next = { ...current }
      delete next[concern.id]
      return next
    })
    showToast(`Request ${decision.toLowerCase()} successfully.`)
    await loadStudentRequests()
  }

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
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(true)
  const loadJoinRequests = async () => {
    setJoinRequestsLoading(true)
    const { data, error } = await supabase
      .from("class_join_requests")
      .select("id, class_id, student_id, student_number, student_name, status, created_at, classes(subject, code)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
    if (!error) setJoinRequests(data ?? [])
    setJoinRequestsLoading(false)
  }
  useEffect(() => {
    void loadJoinRequests()
    const channel = supabase
      .channel("faculty-class-join-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_join_requests" },
        () => void loadJoinRequests(),
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])
  const reviewJoinRequest = async (request: any, status: "accepted" | "declined") => {
    const { error } = await supabase
      .from("class_join_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", request.id)
    if (!error) await loadJoinRequests()
  }

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
    setDraft({ ...createActivityDraft(), classId: reminderClasses[0]?.id ?? "" })
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

  const saveReminder = async () => {
    if (!draft.title.trim()) {
      showToast("Enter a reminder title.", "error")
      return
    }
    if (!draft.classId) {
      showToast("Select a class before saving the reminder.", "error")
      return
    }
    if (!draft.date || !draft.startTime || !draft.endTime) {
      showToast("Complete the required date and time fields.", "error")
      return
    }
    if (draft.endTime <= draft.startTime) {
      showToast("End time must be later than start time.", "error")
      return
    }
    if (draft.participation === "Group" && draft.groups.length === 0) {
      showToast("Add at least one group for a group activity.", "error")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReminderNotice("Your session expired. Sign in again before saving.")
      return
    }

    setReminderSaving(true)
    setReminderNotice("")
    const payload = {
      faculty_id: user.id,
      class_id: String(draft.classId),
      reminder_date: draft.date,
      title: draft.title.trim(),
      activity_type: draft.type,
      start_time: draft.startTime,
      end_time: draft.endTime,
      participation: draft.participation,
      groups: draft.groups,
      updated_at: new Date().toISOString(),
    }

    const result = draft.id
      ? await supabase.from("faculty_reminders").update(payload).eq("id", draft.id).eq("faculty_id", user.id)
      : await supabase.from("faculty_reminders").insert(payload)

    setReminderSaving(false)
    if (result.error) {
      showToast(`Unable to save reminder: ${result.error.message}`, "error")
      return
    }
    setEditing(null)
    showToast(draft.id ? "Reminder updated successfully." : "Reminder added successfully.")
    await loadReminders()
  }

  const deleteReminder = async () => {
    if (!reminderToDelete?.id) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast("Your session expired. Sign in again.", "error")
      return
    }
    setReminderDeleting(true)
    const { error } = await supabase
      .from("faculty_reminders")
      .delete()
      .eq("id", reminderToDelete.id)
      .eq("faculty_id", user.id)
    setReminderDeleting(false)
    if (error) {
      showToast(`Unable to delete reminder: ${error.message}`, "error")
      return
    }
    setReminderToDelete(null)
    showToast("Reminder deleted successfully.")
    await loadReminders()
  }

const reminderFormValid = Boolean(
    draft.title.trim() &&
    draft.classId &&
    draft.date &&
    draft.startTime &&
    draft.endTime &&
    draft.endTime > draft.startTime &&
    (draft.participation !== "Group" || draft.groups.length > 0),
  )

  return (
    <>
      <Header
        title="Activities"
        onNotify={() => setPage("notifications")}
        onProfile={() => setPage("profile")}
      />
      <div className="page-intro">
        <div>
          <p className="eyebrow">Faculty calendar</p>
          <h2>Assessments & reminders</h2>
          <p>Schedule exams, quizzes, and activities for your classes.</p>
        </div>
        <button className="primary-button" onClick={openNewReminder} disabled={reminderClasses.length === 0}>
          <Icon name="plus" /> {reminderClasses.length === 0 ? "Create a class first" : "Add reminder"}
        </button>
      </div>
      <section className="enrollment-operations" aria-labelledby="enrollment-title">
        <div className="enrollment-operations-heading">
          <div>
            <p className="eyebrow">Enrollment operations</p>
            <h2 id="enrollment-title">Student access requests</h2>
          </div>
        </div>
        <div className="join-request-panel">
          {joinRequestsLoading ? (
            <p>Loading requests...</p>
          ) : joinRequests.length === 0 ? (
            <div className="enrollment-empty-state">
              <Icon name="users" size={24} />
              <strong>No pending requests</strong>
              <p>Requests appear here when students join with a class access code.</p>
            </div>
          ) : (
            joinRequests.map((request) => (
              <article className="join-request-card" key={request.id}>
                <div>
                  <p className="eyebrow">Student join request</p>
                  <h3>{request.student_name}</h3>
                  <p>{request.student_number}</p>
                  <p>{request.classes?.subject ?? "Class"} · {request.classes?.code ?? request.class_id}</p>
                </div>
                <div className="join-request-actions">
                  <button type="button" className="secondary-button" onClick={() => void reviewJoinRequest(request, "declined")}>Decline</button>
                  <button type="button" className="primary-button" onClick={() => void reviewJoinRequest(request, "accepted")}>Accept</button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <div className="activities-workspace">
        <section className="concerns-section" aria-labelledby="concerns-title">
          <div className="concerns-heading">
            <div>
              <p className="eyebrow">Student requests</p>
              <h2 id="concerns-title">Student Concerns / Requests</h2>
            </div>
            <span className="concerns-count">
              {
                studentConcerns.filter((concern) => concern.status === "Open")
                  .length
              }{" "}
              open
            </span>
          </div>
          <div className="request-category-filter" aria-label="Filter student requests">
            {(["All", "Petition", "Request", "Concern"] as const).map((category) => (
              <button
                key={category}
                type="button"
                className={requestCategoryFilter === category ? "active" : ""}
                aria-pressed={requestCategoryFilter === category}
                onClick={() => setRequestCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="concerns-list">
            {studentConcernsLoading ? (
              <p className="concerns-empty-state">Loading student requests...</p>
            ) : studentConcerns.length === 0 ? (
              <div className="concerns-empty-state">
                <Icon name="clipboard" size={22} />
                <strong>No student requests</strong>
                <span>New petitions, requests, and concerns will appear here.</span>
              </div>
            ) : studentConcerns
                .filter((concern) => requestCategoryFilter === "All" || studentRequestCategoryLabel(concern.category) === requestCategoryFilter)
                .map((concern) => {
              const student = {
                id: concern.studentId,
                name: concern.studentName || "Student",
              }
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
                      <span className={`request-category-badge ${normalizeStudentRequestCategory(concern.category)}`}>{studentRequestCategoryLabel(concern.category)}</span>
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
                            reviewSavingId === concern.id ||
                            !decision ||
                            !concernReplies[concern.id]?.trim()
                          }
                          onClick={() => void submitRequestReview(concern)}
                        >
                          {reviewSavingId === concern.id ? "Sending..." : "Send review"}
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
          {remindersLoading ? (
            <p className="reminder-list-state">Loading reminders...</p>
          ) : reminders.length === 0 ? (
            <p className="reminder-list-state">No reminders yet. Select Add reminder to create one.</p>
          ) : reminders.map((a, i) => (
            <article key={a.id ?? `${a.title}-${i}`}>
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
                          .replace(/ /g, "-")}`}
                      >
                        {status}
                      </span>
                      <h3>{a.title}</h3>
                      <p>
                        {a.type} ·{" "}
                        {reminderClasses.find((item) => item.id === a.classId)?.code ??
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
                    <div className="reminder-card-actions">
                      <button
                        type="button"
                        aria-label={`Edit ${a.title}`}
                        onClick={() => {
                          setDraft({ ...a, groups: a.groups.map((group) => ({ ...group, studentIds: [...group.studentIds] })) })
                          setActiveGroupId(null)
                          setEditing(i)
                        }}
                      >
                        <Icon name="edit" size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="reminder-delete-button"
                        aria-label={`Delete ${a.title}`}
                        onClick={() => setReminderToDelete(a)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )
              })()}
            </article>
          ))}
        </div>
      </div>
      {reminderToDelete && (
        <div
          className="modal-backdrop confirmation-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && !reminderDeleting && setReminderToDelete(null)}
        >
          <section className="confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-reminder-title" aria-describedby="delete-reminder-description">
            <span className="confirmation-modal-icon"><Icon name="minus" size={20} /></span>
            <h2 id="delete-reminder-title">Delete reminder?</h2>
            <p id="delete-reminder-description">
              “{reminderToDelete.title}” will be permanently removed. This action cannot be undone.
            </p>
            <div className="confirmation-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setReminderToDelete(null)} disabled={reminderDeleting}>Cancel</button>
              <button type="button" className="danger-button" onClick={() => void deleteReminder()} disabled={reminderDeleting}>
                {reminderDeleting ? "Deleting..." : "Delete reminder"}
              </button>
            </div>
          </section>
        </div>
      )}
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
              <span className="reminder-field-label">Title <em>Required</em></span>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                required
              />
            </label>
            <label>
              <span className="reminder-field-label">Activity type <em>Required</em></span>
              <select required
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
              <span className="reminder-field-label">Class <em>Required</em></span>
              <select required
                value={draft.classId}
                onChange={(e) =>
                  setDraft({ ...draft, classId: e.target.value })
                }
              >
                <option value="">Select a class</option>
                {reminderClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.subject} · {item.code}
                  </option>
                ))}
              </select>
              {reminderClasses.length === 0 ? (
                <small className="reminder-field-error">No database classes are available. Create a class first.</small>
              ) : !draft.classId ? (
                <small className="reminder-field-error">Select a class.</small>
              ) : null}
            </label>
            <label>
              <span className="reminder-field-label">Participation <em>Required</em></span>
              <select required
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
              <span className="reminder-field-label">Date <em>Required</em></span>
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
                <span className="reminder-field-label">Start time <em>Required</em></span>
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
                <span className="reminder-field-label">End time <em>Required</em></span>
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
            <button
              type="button"
              className="primary-button"
              onClick={() => void saveReminder()}
              disabled={reminderSaving}
            >
              {reminderSaving ? "Saving..." : editing === -1 ? "Save reminder" : "Save changes"}
            </button>
          </section>
        </div>
      )}
    </>
  )
}

function ProfilePage({ setPage, onLogout }: { setPage: (page: string) => void; onLogout: () => void }) {
  type ProfilePanel = "profile" | "notifications" | "security" | "classes" | "exports" | "attendance" | null
  const [profile, setProfile] = useState<FacultyProfile>(emptyFacultyProfile)
  const [draftProfile, setDraftProfile] = useState<FacultyProfile>(emptyFacultyProfile)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [activePanel, setActivePanel] = useState<ProfilePanel>(null)
  const [notifications, setNotifications] = useState({ classStarts: true, studentRequests: true, attendance: true, reminders: true })
  const [attendanceSettings, setAttendanceSettings] = useState({ lateMinutes: 15, closeMinutes: 30, allowExcused: true })

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const loaded = profileFromUser(user)
    setProfile(loaded)
    setDraftProfile(loaded)
  }
  useEffect(() => { void loadProfile() }, [])

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingProfile(true)
    const updated = {
      ...draftProfile,
      name: draftProfile.name.trim(),
      department: draftProfile.department.trim(),
      facultyNumber: draftProfile.facultyNumber.trim(),
      email: draftProfile.email.trim(),
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSavingProfile(false)
      showMessage("Your session expired. Please sign in again.")
      return
    }

    // Keep the university email read-only here. Updating an authenticated email
    // may require confirmation and can fail as a generic "Error updating user".
    const stableEmail = String(user.email ?? updated.email).trim()
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        full_name: updated.name,
        department: updated.department,
        faculty_number: updated.facultyNumber,
        avatar_url: updated.photoUrl,
      },
    })
    if (metadataError) {
      setSavingProfile(false)
      showMessage(`Unable to save profile: ${metadataError.message}`)
      return
    }

    const { error: profileError } = await supabase
      .from("faculty_profiles")
      .update({
        email: stableEmail,
        full_name: updated.name,
        department: updated.department,
        faculty_number: updated.facultyNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    setSavingProfile(false)
    if (profileError) {
      showMessage(`Unable to save profile details: ${profileError.message}`)
      return
    }
    const savedProfile = { ...updated, email: stableEmail }
    setProfile(savedProfile)
    setDraftProfile(savedProfile)
    setEditingProfile(false)
    showToast("Profile updated successfully.")
  }

  const savePreferencePanel = () => {
    setActivePanel(null)
    showToast("Settings saved successfully.")
  }

  const panelTitle: Record<Exclude<ProfilePanel, null>, string> = {
    profile: "Profile information", notifications: "Notification preferences", security: "Privacy & security",
    classes: "Class defaults", exports: "Records & exports", attendance: "Attendance settings",
  }

  return (<>
    <Header title="Profile" onNotify={() => setPage("notifications")} onProfile={() => setPage("profile")} />
    <main className="profile-page-compact">
    <section className="profile-hero">
      <img src={profile.photoUrl} alt="Faculty profile" />
      <div className="profile-identity">
        <span className="status-pill">Faculty</span>
        {profile.name ? (
          <>
            <h2>{profile.name}</h2>
            <div className="profile-visible-details">
              <span><strong>University email</strong>{profile.email || "Not set"}</span>
              <span><strong>College or department</strong>{profile.department || "Not set"}</span>
              <span><strong>Faculty number</strong>{profile.facultyNumber || "Not set"}</span>
            </div>
          </>
        ) : <div className="profile-hero-loading"><span/><span/><span/></div>}
      </div>
      <button className="secondary-button" disabled={!profile.name} onClick={() => { setDraftProfile(profile); setEditingProfile(true) }}>Edit profile</button>
    </section>

    <div className="profile-panels profile-settings-grid">
      <section className="profile-panel"><p className="eyebrow">Account</p><h3>Personal settings</h3>
        <button onClick={() => setActivePanel("profile")}>Profile information<Icon name="chevron" /></button>
        <button onClick={() => setActivePanel("notifications")}>Notification preferences<Icon name="chevron" /></button>
        <button onClick={() => setActivePanel("security")}>Privacy & security<Icon name="chevron" /></button>
      </section>
      <section className="profile-panel"><p className="eyebrow">Teaching</p><h3>Teaching settings</h3>
        <button onClick={() => setActivePanel("classes")}>Class defaults<Icon name="chevron" /></button>
        <button onClick={() => setActivePanel("exports")}>Records & exports<Icon name="chevron" /></button>
        <button onClick={() => setActivePanel("attendance")}>Attendance settings<Icon name="chevron" /></button>
      </section>
    </div>



    </main>

    {activePanel && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setActivePanel(null)}><section className="profile-settings-modal" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title">
      <button className="modal-close" onClick={() => setActivePanel(null)} aria-label="Close">×</button><p className="eyebrow">Profile settings</p><h2 id="profile-settings-title">{panelTitle[activePanel as Exclude<ProfilePanel, null>]}</h2>
      {activePanel === "profile" && <div className="settings-summary-list"><p><strong>Full name</strong><span>{profile.name || "Not set"}</span></p><p><strong>Email</strong><span>{profile.email || "Not set"}</span></p><p><strong>Department</strong><span>{profile.department || "Not set"}</span></p><p><strong>Faculty number</strong><span>{profile.facultyNumber || "Not set"}</span></p><button className="primary-button" onClick={() => { setDraftProfile(profile); setActivePanel(null); setEditingProfile(true) }}>Edit profile information</button></div>}
      {activePanel === "notifications" && <div className="settings-toggle-list">{[["classStarts","Class-start reminders"],["studentRequests","Student request notifications"],["attendance","Attendance reminders"],["reminders","Activity and quiz reminders"]].map(([key,label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={e => setNotifications({...notifications,[key]:e.target.checked})}/></label>)}<button className="primary-button" onClick={savePreferencePanel}>Save preferences</button></div>}
      {activePanel === "security" && <div className="settings-summary-list"><button onClick={() => showMessage("Use the password-reset link from the sign-in page to change your password.", "info", "Change password")}>Change password<Icon name="chevron" /></button><button onClick={() => void supabase.auth.signOut().then(onLogout)}>Sign out from this device<Icon name="chevron" /></button></div>}
      {activePanel === "classes" && <div className="settings-summary-list"><p><strong>Default semester</strong><span>Use each class semester dates</span></p><p><strong>Default room</strong><span>To be confirmed</span></p><button className="primary-button" onClick={savePreferencePanel}>Save defaults</button></div>}
      {activePanel === "exports" && <div className="settings-summary-list"><p>Export attendance and grade records from the Records page after selecting a class.</p><button className="primary-button" onClick={() => { setActivePanel(null); setPage("records") }}>Open records</button></div>}
      {activePanel === "attendance" && <div className="settings-form-list"><label>Late after (minutes)<input type="number" min="0" max="180" value={attendanceSettings.lateMinutes} onChange={e => setAttendanceSettings({...attendanceSettings,lateMinutes:Number(e.target.value)})}/></label><label>Close attendance after (minutes)<input type="number" min="1" max="240" value={attendanceSettings.closeMinutes} onChange={e => setAttendanceSettings({...attendanceSettings,closeMinutes:Number(e.target.value)})}/></label><label className="settings-checkbox"><input type="checkbox" checked={attendanceSettings.allowExcused} onChange={e => setAttendanceSettings({...attendanceSettings,allowExcused:e.target.checked})}/>Allow excused absences</label><button className="primary-button" onClick={savePreferencePanel}>Save settings</button></div>}
    </section></div>}

    {editingProfile && <div className="modal-backdrop"><section className="profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"><button type="button" className="profile-modal-close" onClick={() => setEditingProfile(false)} aria-label="Close edit profile" title="Close">×</button><p className="eyebrow">Faculty profile</p><h2 id="edit-profile-title">Edit profile</h2><p>Changes synchronize with the header profile card.</p><form onSubmit={saveProfile}><div className="profile-photo-summary"><img src={profile.photoUrl} alt=""/><div><strong>{profile.name}</strong><small>This information comes from the signed-in faculty account.</small></div></div><div className="profile-form-fields"><label><span className="profile-field-heading">Full name <em>Required</em></span><input value={draftProfile.name} onChange={e => setDraftProfile({...draftProfile,name:e.target.value})} required/></label><label><span className="profile-field-heading">University email <em>Required</em></span><input type="email" value={draftProfile.email} readOnly aria-readonly="true" required/><small className="profile-readonly-note">University email is managed by the signed-in account.</small></label><label><span className="profile-field-heading">College or department <em>Required</em></span><input value={draftProfile.department} onChange={e => setDraftProfile({...draftProfile,department:e.target.value})} required/></label><label><span className="profile-field-heading">Faculty number <em>Required</em></span><input value={draftProfile.facultyNumber} onChange={e => setDraftProfile({...draftProfile,facultyNumber:e.target.value})} required/></label></div><div className="profile-form-actions"><button type="button" className="secondary-button" onClick={() => setEditingProfile(false)}>Cancel</button><button className="primary-button" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save changes"}</button></div></form></section></div>}
  </>)
}

function NotificationsPage({ setPage }: { setPage: (page: string) => void }) {
  const [items, setItems] = useState<FacultyNotification[]>([])
  const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); setItems(await loadFacultyNotifications()); setLoading(false) }
  useEffect(() => {
    void load()
    const channel = supabase.channel("faculty-notifications-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_requests" }, load)
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])
  return (<>
    <Header title="Notifications" onNotify={() => setPage("notifications")} onProfile={() => setPage("profile")} />
    <section className="notifications-page" aria-labelledby="notifications-title">
      <div className="section-heading"><div><p className="eyebrow">Teacher updates</p><h2 id="notifications-title">Notifications</h2></div><button onClick={() => void load()}>Refresh</button></div>
      {loading ? <p className="notification-empty">Loading notifications...</p> : items.length === 0 ? <div className="empty-prompt"><span><Icon name="bell"/></span><h3>You’re all caught up</h3><p>New student petitions, requests, and concerns will appear here.</p></div> : <div className="notification-list">{items.map(item => <button key={item.id} className={`notification-item ${item.kind}`} onClick={() => setPage("activities")}><span className="notification-item-icon"><Icon name={item.kind === "concern" ? "users" : "clipboard"}/></span><span><strong>{item.title}</strong><small>{item.message}</small></span><Icon name="chevron" size={16}/></button>)}</div>}
    </section>
  </>)
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
  onEnd: (attendanceSessionId: string | null) => void
  onMinimize: (startedAt: number) => void
  initialStarted?: boolean
  initialStartedAt?: number
  viewOnly?: boolean
}) {
  const [started, setStarted] = useState(initialStarted)
  const [startedAt, setStartedAt] = useState(initialStartedAt)
  const [sessionNow, setSessionNow] = useState(() => Date.now())
  const [scannerMode, setScannerMode] = useState<"attendance" | "performance">(
    "attendance",
  )
  const [activityType, setActivityType] = useState<"recitation" | "handson">("recitation")
  const [selectedPerformanceStudent, setSelectedPerformanceStudent] = useState<any>(null)
  const [recitationScore, setRecitationScore] = useState(0)
  const [handsOnScores, setHandsOnScores] = useState({ accuracy: 0, technique: 0, completion: 0, safety: 0 })
  const [performanceDrafts, setPerformanceDrafts] = useState<any[]>([])
  const [performanceMessage, setPerformanceMessage] = useState("")
  const handsOnTotal = handsOnScores.accuracy + handsOnScores.technique + handsOnScores.completion + handsOnScores.safety

  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null)
  const {
    payload: attendanceQrPayload,
    countdown: attendanceQrCountdown,
    message: attendanceQrMessage,
  } = useAttendanceQr(
    attendanceSessionId,
    String(item.id),
    started && !viewOnly,
  )
  const attendanceSessionIdRef = useRef<string | null>(null)
  const nfcReaderRef = useRef<any>(null)
  const [nfcSessionState, setNfcSessionState] = useState<
    "idle" | "opening" | "active" | "closing" | "error"
  >("idle")
  const [nfcSessionMessage, setNfcSessionMessage] = useState(
    "Start the class, then use an NFC-enabled Android phone to scan registered student cards.",
  )
  const [nfcScannerStatus, setNfcScannerStatus] = useState<
    "idle" | "starting" | "scanning" | "verifying" | "success" | "unsupported" | "error"
  >("idle")
  const [lastCard, setLastCard] = useState("")
  const [liveAttendance, setLiveAttendance] = useState<any[]>([])

  useEffect(() => {
    attendanceSessionIdRef.current = attendanceSessionId
  }, [attendanceSessionId])

  const waitForAttendanceSession = async () => {
    const deadline = Date.now() + 12000
    while (!attendanceSessionIdRef.current && Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 150))
    }
    return attendanceSessionIdRef.current
  }

  const invokeFacultyNfc = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke(
      "faculty-nfc-attendance",
      { body },
    )

    if (error) {
      throw new Error(error.message)
    }

    if (!data?.success) {
      throw new Error(data?.error ?? "The NFC attendance request failed.")
    }

    return data.data ?? {}
  }

  const openMobileNfcSession = async () => {
    setNfcSessionState("opening")

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("Your session expired. Please sign in again.")
      }

      const { data: existingSession, error: existingError } = await supabase
        .from("attendance_sessions")
        .select("id, class_id, started_by, started_at, ended_at, status")
        .eq("class_id", String(item.id))
        .eq("started_by", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingError) throw new Error(existingError.message)

      let session = existingSession

      if (!session) {
        const { data: createdSession, error: createError } = await supabase
          .from("attendance_sessions")
          .insert({
            class_id: String(item.id),
            started_by: user.id,
            started_at: new Date().toISOString(),
            ended_at: null,
            status: "active",
          })
          .select("id, class_id, started_by, started_at, ended_at, status")
          .single()

        if (createError || !createdSession) {
          throw new Error(createError?.message ?? "The database did not return an attendance session.")
        }

        session = createdSession
      }

      const sessionId = String(session.id)
      const parsedStartedAt = Date.parse(String(session.started_at ?? ""))
      const sessionStartedAt = Number.isFinite(parsedStartedAt) ? parsedStartedAt : Date.now()

      attendanceSessionIdRef.current = sessionId
      setAttendanceSessionId(sessionId)
      setStartedAt(sessionStartedAt)
      setSessionNow(Date.now())
      setStarted(true)
      setNfcSessionState("active")
      setNfcSessionMessage(
        "Attendance is ready. On an NFC-enabled Android phone, select Scan student card.",
      )
      return sessionId
    } catch (error) {
      console.error("Unable to open attendance session:", error)
      setNfcSessionState("error")
      setNfcSessionMessage(
        error instanceof Error ? error.message : "The attendance session could not be opened.",
      )
      return null
    }
  }

  const closeMobileNfcSession = async () => {
    const sessionId = attendanceSessionIdRef.current
    if (!sessionId) return true

    setNfcSessionState("closing")

    const { error } = await supabase
      .from("attendance_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) {
      console.error("Unable to close attendance session:", error)
      setNfcSessionState("error")
      setNfcSessionMessage(error.message)
      return false
    }

    attendanceSessionIdRef.current = null
    setAttendanceSessionId(null)
    setNfcSessionState("idle")
    setNfcScannerStatus("idle")
    return true
  }

  const decodeNdefRecord = (record: any) => {
    if (!record?.data) return ""
    const bytes = new Uint8Array(
      record.data.buffer,
      record.data.byteOffset,
      record.data.byteLength,
    )
    // Web NFC already separates NDEF text language/status metadata.
    // Its record.data contains text bytes, so do not strip the first characters.
    const encoding = record.recordType === "text"
      ? String(record.encoding || "utf-8")
      : "utf-8"
    return new TextDecoder(encoding)
      .decode(bytes)
      .replace(/\0/g, "")
      .trim()
  }

  const extractCardToken = (message: any) => {
    for (const record of Array.from(message?.records ?? []) as any[]) {
      const value = decodeNdefRecord(record)
      if (!value) continue

      try {
        const parsed = JSON.parse(value)
        const token = parsed.card_token ?? parsed.cardToken ?? parsed.nfc_token ?? parsed.token
        if (typeof token === "string" && token.trim()) return token.trim()
      } catch {
        // A plain-text NDEF record is also accepted as the registration token.
      }

      if (value.length >= 8) return value
    }

    return ""
  }

  const startNfcScanner = async () => {
    if (!("NDEFReader" in window)) {
      setNfcScannerStatus("unsupported")
      setNfcSessionMessage(
        "NFC scanning is unavailable on this device. Open the faculty dashboard in Chrome on an NFC-enabled Android phone.",
      )
      return
    }

    try {
      if (nfcReaderRef.current) {
        setNfcScannerStatus("scanning")
        setNfcSessionMessage("Scanner active. Hold a registered student NFC card near the phone.")
        return
      }

      setNfcScannerStatus("starting")
      setNfcSessionMessage("Allow NFC access, then hold a registered student card near the phone.")

      const Reader = (window as any).NDEFReader
      const reader = new Reader()
      nfcReaderRef.current = reader
      await reader.scan()

      setNfcScannerStatus("scanning")
      setNfcSessionMessage("Scanner active. Hold a registered student NFC card near the phone.")

      reader.addEventListener("readingerror", () => {
        nfcReaderRef.current = null
        setNfcScannerStatus("error")
        setNfcSessionMessage("The card was detected but could not be read. Try again.")
      }, { once: true })

      reader.addEventListener("reading", async (event: any) => {
        const cardUid = String(event.serialNumber ?? "")
          .replace(/[^0-9a-f]/gi, "")
          .toLowerCase()
        const cardToken = extractCardToken(event.message)

        if (!cardUid) {
          setNfcScannerStatus("error")
          setNfcSessionMessage("The NFC card identifier could not be read.")
          return
        }

        setLastCard(cardUid || "UID unavailable")
        setNfcSessionMessage(
          cardUid
            ? `Card detected. UID: ${cardUid}`
            : "An NFC card was detected, but the browser did not expose its UID.",
        )

        if (!cardToken) {
          setNfcScannerStatus("error")
          setNfcSessionMessage(
            "The card was detected, but no CIT Portal registration token was found. Register the card in the student mobile app first.",
          )
          return
        }

        setNfcScannerStatus("verifying")
        setNfcSessionMessage("Card detected. Verifying the student and recording attendance...")

        try {
          const activeSessionId = await waitForAttendanceSession()
          if (!activeSessionId) {
            throw new Error(
              "The student card was detected, but the shared class session is not ready yet. Keep the class open and scan again.",
            )
          }

          const data = await invokeFacultyNfc({
            action: "scan",
            sessionId: activeSessionId,
            cardUid,
            cardToken,
          })

          if (scannerMode === "performance") {
            const attendance = data?.attendance ?? null
            setSelectedPerformanceStudent({
              id: String(attendance?.student_id ?? ""),
              name: String(attendance?.student_name ?? attendance?.full_name ?? "Scanned student"),
              studentNo: String(attendance?.student_number ?? attendance?.student_no ?? cardUid),
            })
          }
          nfcReaderRef.current = null
          setNfcScannerStatus("success")
          setNfcSessionMessage(
            data?.already_recorded
              ? "This student was already recorded for the active class session."
              : "Attendance recorded successfully.",
          )

          window.setTimeout(() => {
            setNfcScannerStatus("idle")
            setNfcSessionMessage("Ready to scan another registered student card.")
          }, 2500)
        } catch (error) {
          nfcReaderRef.current = null
          setNfcScannerStatus("error")
          setNfcSessionMessage(
            error instanceof Error
              ? error.message
              : "The scanned card could not be verified.",
          )
        }
      }, { once: true })
    } catch (error) {
      nfcReaderRef.current = null
      const errorName = error instanceof DOMException ? error.name : ""
      setNfcScannerStatus(errorName === "NotSupportedError" ? "unsupported" : "error")
      setNfcSessionMessage(
        errorName === "NotAllowedError"
          ? "NFC permission was denied. Allow NFC access in Chrome and try again."
          : errorName === "NotSupportedError"
            ? "NFC scanning is unavailable on this device. Use Chrome on an NFC-enabled Android phone."
            : "NFC scanning could not start. Keep Chrome open in the foreground and try again.",
      )
    }
  }

  const syncActiveAttendanceSession = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data: activeSession, error } = await supabase
        .from("attendance_sessions")
        .select("id, class_id, started_by, started_at, ended_at, status")
        .eq("class_id", String(item.id))
        .eq("started_by", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("Unable to synchronize the active attendance session:", error)
        return null
      }

      if (!activeSession?.id) return null

      const sessionId = String(activeSession.id)
      const synchronizedStartedAt = Date.parse(String(activeSession.started_at ?? ""))
      const timerStart = Number.isFinite(synchronizedStartedAt)
        ? synchronizedStartedAt
        : Date.now()

      attendanceSessionIdRef.current = sessionId
      setAttendanceSessionId(sessionId)
      setStartedAt(timerStart)
      setSessionNow(Date.now())
      setStarted(true)
      setNfcSessionState("active")
      setNfcSessionMessage(
        "This live class session and timer are synchronized across all faculty devices.",
      )
      return sessionId
    } catch (error) {
      console.error("Unable to synchronize the active attendance session:", error)
      return null
    }
  }

  useEffect(() => {
    if (viewOnly) return
    void syncActiveAttendanceSession()

    const refresh = () => {
      if (document.visibilityState === "visible") {
        void syncActiveAttendanceSession()
      }
    }

    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [item.id, viewOnly])

  useEffect(() => {
    if (viewOnly) return

    const applySharedSession = (row: any) => {
      if (!row || String(row.class_id ?? "") !== String(item.id)) return

      const status = String(row.status ?? "active").toLowerCase()
      if (status === "ended" || row.ended_at) {
        attendanceSessionIdRef.current = null
        setAttendanceSessionId(null)
        setStarted(false)
        setStartedAt(undefined)
        setNfcSessionState("idle")
        setNfcScannerStatus("idle")
        setNfcSessionMessage("This class session was ended from another device.")
        return
      }

      const synchronizedStartedAt = Date.parse(String(row.started_at ?? ""))
      const timerStart = Number.isFinite(synchronizedStartedAt)
        ? synchronizedStartedAt
        : Date.now()

      attendanceSessionIdRef.current = String(row.id)
      setAttendanceSessionId(String(row.id))
      setStartedAt(timerStart)
      setSessionNow(Date.now())
      setStarted(true)
      setNfcSessionState("active")
      setNfcSessionMessage("This live class session and timer are synchronized across all faculty devices.")
    }

    const channel = supabase
      .channel(`class-session-timer-${item.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_sessions",
          filter: `class_id=eq.${item.id}`,
        },
        (payload: any) => {
          if (payload.eventType === "DELETE") {
            void syncActiveAttendanceSession()
            return
          }
          applySharedSession(payload.new)
        },
      )
      .subscribe()

    // Fallback for browsers that pause Realtime while they are in the background.
    const refreshTimer = window.setInterval(() => {
      void syncActiveAttendanceSession()
    }, 10_000)

    return () => {
      window.clearInterval(refreshTimer)
      void supabase.removeChannel(channel)
    }
  }, [item.id, viewOnly])

  useEffect(() => {
    if (!started || !startedAt) return
    setSessionNow(Date.now())
    const timer = window.setInterval(() => setSessionNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [started, startedAt])

  useEffect(() => () => {
    nfcReaderRef.current = null
  }, [])

  useEffect(() => {
    if (!attendanceSessionId) {
      setLiveAttendance([])
      return
    }
    let active = true
    const loadAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("session_id", attendanceSessionId)
      if (!active) return
      if (error) {
        console.error("Unable to load live attendance:", error)
        return
      }
      setLiveAttendance(data ?? [])
    }
    void loadAttendance()
    const channel = supabase
      .channel(`live-attendance-${attendanceSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `session_id=eq.${attendanceSessionId}`,
        },
        () => void loadAttendance(),
      )
      .subscribe()
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [attendanceSessionId])
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false)
  const [manualAttendance, setManualAttendance] = useState<Record<string, boolean>>(
    {},
  )
  useEffect(() => {
    if (!performanceMessage) return
    const timer = window.setTimeout(() => setPerformanceMessage(""), 3000)
    return () => window.clearTimeout(timer)
  }, [performanceMessage])

  const liveRoster: Array<{ name: string; id: string; time: string; status: string; method: string }> =
    liveAttendance.map((row: any) => ({
      name: String(row.student_name ?? row.full_name ?? "Verified student"),
      id: String(row.student_number ?? row.student_id ?? ""),
      time: (() => {
        const recordedAt =
          row.checked_in_at ??
          row.recorded_at ??
          row.scanned_at ??
          row.check_in_time ??
          row.created_at ??
          null
        return recordedAt
          ? new Date(recordedAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : "Recorded"
      })(),
      status: String(row.status ?? "Present"),
      method: String(row.method ?? "Mobile NFC"),
    }))
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
              ? `Live session · ${startedAt ? formatSessionDuration(startedAt, sessionNow) : "00:00"}`
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
              <strong>{liveAttendance.filter((row: any) => String(row.status ?? "present").toLowerCase() === "present").length}</strong>
              <small>Present</small>
            </div>
            <div>
              <strong>{liveAttendance.filter((row: any) => String(row.status ?? "").toLowerCase() === "late").length}</strong>
              <small>Late</small>
            </div>
            <div>
              <strong>{Math.max(0, item.attendance - liveAttendance.length)}</strong>
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
                  <span className="nfc-scanner-label">Mobile NFC attendance</span>
                  <strong id="nfc-scanner-title">
                    {nfcSessionState === "opening"
                      ? "Opening session"
                      : nfcSessionState === "closing"
                        ? "Closing session"
                        : nfcSessionState === "error"
                          ? "Web scanning unavailable"
                          : "Attendance session active"} <i aria-hidden="true" />
                  </strong>
                  <small>{nfcSessionMessage}</small>
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
                  <strong>
                    {nfcScannerStatus === "starting"
                      ? "Starting NFC scanner"
                      : nfcScannerStatus === "scanning"
                        ? "Ready for a student card"
                        : nfcScannerStatus === "verifying"
                          ? "Verifying student"
                          : nfcScannerStatus === "success"
                            ? "Attendance recorded"
                            : nfcScannerStatus === "unsupported"
                              ? "NFC scanning unavailable"
                              : nfcScannerStatus === "error"
                                ? "Card could not be verified"
                                : "Scan a registered student card"}
                  </strong>
                  <small>{nfcSessionMessage}</small>
                  {lastCard && <small>Last card: {lastCard}</small>}
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void startNfcScanner()}
                  disabled={
                    nfcScannerStatus === "starting" ||
                    nfcScannerStatus === "scanning" ||
                    nfcScannerStatus === "verifying"
                  }
                >
                  {nfcScannerStatus === "starting"
                    ? "Starting..."
                    : nfcScannerStatus === "scanning"
                      ? "Waiting for card..."
                      : nfcScannerStatus === "verifying"
                        ? "Verifying..."
                        : "Scan student card"}
                </button>
              </div>
            </section>
            {scannerMode === "attendance" ? (
              <section className="qr-card" aria-labelledby="qr-check-in-title">
                <div className="qr-card-heading">
                  <div>
                    <span>Alternative check-in</span>
                    <strong id="qr-check-in-title">Attendance QR</strong>
                  </div>
                  <Icon name="scan" size={18} />
                </div>
                <div className="qr-pattern" aria-label="Attendance QR code">
                  {attendanceQrPayload ? (
                    <QRCodeCanvas
                      value={attendanceQrPayload}
                      size={140}
                      level="H"
                      includeMargin
                    />
                  ) : (
                    <div className="qr-loading-state" role="status" aria-live="polite">
                      <Icon name="clock" size={22} />
                      <span>Preparing secure QR…</span>
                    </div>
                  )}
                </div>
                <p>{attendanceQrMessage}</p>
                <small className="qr-refresh-note">
                  {attendanceQrPayload
                    ? `QR refreshes in ${attendanceQrCountdown}s`
                    : "Waiting for a server-issued attendance QR"}
                </small>
                <div className="progress-label">
                  <span>Attendance recorded</span>
                  <strong>{liveAttendance.length} of {item.attendance}</strong>
                </div>
                <div className="progress">
                  <span style={{ width: `${Math.min(100, item.attendance ? (liveAttendance.length / item.attendance) * 100 : 0)}%` }} />
                </div>
              </section>
            ) : (
              <section className="performance-mode-card" aria-label="Performance mode">
                <span><Icon name="chart" size={20} /></span>
                <div className="performance-mode-content">
                  <small>Performance mode</small>
                  <strong>Ready to log performance</strong>
                  <p>Scan a registered student NFC card to open the performance record.</p>

                  <div className="activity-type-picker" role="group" aria-label="Performance activity type">
                    <button type="button" className={activityType === "recitation" ? "active" : ""} onClick={() => setActivityType("recitation")}>Recitation</button>
                    <button type="button" className={activityType === "handson" ? "active" : ""} onClick={() => setActivityType("handson")}>Hands-On</button>
                  </div>

                  {!selectedPerformanceStudent ? (
                    <p className="performance-awaiting-card">Tap a student NFC card to open the student performance record.</p>
                  ) : (
                    <div className="performance-record">
                      <div className="performance-student-heading">
                        <div>
                          <strong>{selectedPerformanceStudent.name}</strong>
                          <small>{selectedPerformanceStudent.studentNo}</small>
                        </div>
                        <button type="button" className="secondary-button compact" onClick={() => setSelectedPerformanceStudent(null)}>Clear</button>
                      </div>

                      {activityType === "recitation" ? (
                        <div className="recitation-performance-panel">
                          <h5>Recitation</h5>
                          <label className="performance-score-field">
                            <span>Score</span>
                            <input type="number" min="0" max="10" value={recitationScore} onChange={(event) => setRecitationScore(Math.min(10, Math.max(0, Number(event.target.value))))} />
                            <small>Maximum score: 10</small>
                          </label>
                        </div>
                      ) : (
                        <div className="performance-rubric">
                          <h5>Hands-On Activity</h5>
                          {(["accuracy", "technique", "completion", "safety"] as const).map((criterion) => (
                            <label key={criterion}>
                              <span>{criterion[0].toUpperCase() + criterion.slice(1)}: {handsOnScores[criterion]}</span>
                              <output>{handsOnScores[criterion]} / 5</output>
                              <input type="range" min="0" max="5" value={handsOnScores[criterion]} onChange={(event) => setHandsOnScores((scores) => ({ ...scores, [criterion]: Number(event.target.value) }))} />
                            </label>
                          ))}
                          <strong className="performance-total">Total score: {handsOnTotal} / 20</strong>
                        </div>
                      )}

                      {performanceMessage && <p className="performance-save-message" role="status">{performanceMessage}</p>}
                      <button type="button" className="primary-button performance-save-button" onClick={() => {
                        setPerformanceDrafts((records) => [...records, {
                          student: selectedPerformanceStudent,
                          activityType,
                          score: activityType === "recitation" ? recitationScore : handsOnTotal,
                          handsOnScores: activityType === "handson" ? handsOnScores : undefined,
                          status: "Draft",
                          createdAt: new Date().toISOString(),
                        }])
                        setPerformanceMessage("Draft saved")
                        setRecitationScore(0)
                        setHandsOnScores({ accuracy: 0, technique: 0, completion: 0, safety: 0 })
                      }}>Save draft</button>
                    </div>
                  )}

                  {performanceDrafts.length > 0 && (
                    <small className="performance-draft-count">{performanceDrafts.length} performance draft{performanceDrafts.length === 1 ? "" : "s"} in this session</small>
                  )}
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
            else if (started) {
              void closeMobileNfcSession().then((closed) => {
                if (closed) onEnd(attendanceSessionId)
              })
            } else {
              // Start Web NFC from this user gesture. Session creation continues in parallel.
              void startNfcScanner()
              void openMobileNfcSession().then((sessionId) => {
                if (!sessionId) return
                setSessionNow(Date.now())
                setScannerMode("attendance")
                setStarted(true)
              })
            }
          }}
          disabled={nfcSessionState === "opening" || nfcSessionState === "closing"}
        >
          {viewOnly ? (
            "Close overview"
          ) : nfcSessionState === "opening" ? (
            "Opening attendance..."
          ) : nfcSessionState === "closing" ? (
            "Closing attendance..."
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

function LandingPage({
  onSignIn,
  onRegistrationComplete,
}: {
  onSignIn: () => void
  onRegistrationComplete: () => void
}) {
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const isSignUp = authMode === "signUp"

  return (
    <main className="landing-page">
      <MessageDialogHost />
      {/* Left Intro Panel with Background Image & Bleeding Vignette Effect */}
      <section className="landing-intro">
        <img
          src={citBuilding}
          alt="College of Industrial Technology building"
          className="landing-building-image"
        />
        <div className="landing-background-overlay" aria-hidden="true" />
        <div className="landing-brand">
          <span
            className="landing-logo-placeholder"
            aria-hidden="true"
            style={{ width: "100px", height: "100px", display: "flex" }}
          >
            <img
              src={citLogo}
              alt="CIT Logo"
              className="landing-cit-logo"
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

  const form = event.currentTarget
  const formData = new FormData(form)

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

      onRegistrationComplete()

      await registerFaculty({
        email,
        password,
        fullName,
        facultyNumber,
        department,
      })

      // Supabase may create a session immediately when email confirmation is disabled.
      // Registration must not grant dashboard access, so always end that session.
      await supabase.auth.signOut({ scope: "local" })
      form.reset()
      setAuthMode("signIn")
      setShowPassword(false)
      setShowConfirmation(false)

      showMessage(
        "Faculty account created. Please sign in using the account you just created."
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
    showMessage(message)
  }
}}
  >
    {isSignUp && (
      <label>
        Full name
        <input
          type="text"
          name="fullName"
          placeholder="Enter your full name"
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
  const [authChecking, setAuthChecking] = useState(true)
  const registrationLogoutInProgress = useRef(false)
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
  const localDateKey = () => {
    const date = new Date()
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-")
  }
  const [endedClassIds, setEndedClassIds] = useState<string[]>([])
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let active = true

    const loadEndedClasses = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setEndedClassIds([])
        return
      }
      const { data, error } = await supabase
        .from("class_session_status")
        .select("class_id")
        .eq("faculty_id", user.id)
        .eq("session_date", localDateKey())
        .eq("status", "ended")
      if (!active) return
      if (error) {
        console.error("Unable to synchronize ended classes:", error)
        return
      }
      setEndedClassIds([...(new Set((data ?? []).map((row: any) => String(row.class_id))))])
    }

    void loadEndedClasses()
    const channel = supabase
      .channel("class-session-status-cross-device")
      .on("postgres_changes", { event: "*", schema: "public", table: "class_session_status" }, () => void loadEndedClasses())
      .subscribe()

    const refreshSessionState = () => void loadEndedClasses()
    window.addEventListener("focus", refreshSessionState)
    document.addEventListener("visibilitychange", refreshSessionState)
    return () => {
      active = false
      window.removeEventListener("focus", refreshSessionState)
      document.removeEventListener("visibilitychange", refreshSessionState)
      void supabase.removeChannel(channel)
    }
  }, [signedIn])

  const endClassAcrossDevices = async (
    displayedClassId: string,
    attendanceSessionId?: string | null,
  ) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      showMessage(
        "Your session expired. Please sign in again.",
        "error",
        "Class could not be ended",
      )
      return false
    }

    // The attendance-session UUID and class UUID are different values.
    // When a mobile NFC attendance session exists, use its class_id as the
    // authoritative class UUID before writing class_session_status.
    let realClassId = displayedClassId

    if (attendanceSessionId) {
      const { data: sessionRow, error: sessionLookupError } = await supabase
        .from("attendance_sessions")
        .select("id, class_id")
        .eq("id", attendanceSessionId)
        .maybeSingle()

      if (sessionLookupError || !sessionRow?.class_id) {
        showMessage(
          sessionLookupError?.message ??
            "The active attendance session could not be found.",
          "error",
          "Class could not be ended",
        )
        return false
      }

      realClassId = String(sessionRow.class_id)
    }

    // Guard against stale UI data or an accidental attendance-session UUID.
    const { data: classRow, error: classLookupError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", realClassId)
      .eq("faculty_id", user.id)
      .maybeSingle()

    if (classLookupError || !classRow) {
      showMessage(
        classLookupError?.message ??
          "The selected class no longer exists. Refresh the page and open the class again.",
        "error",
        "Class could not be ended",
      )
      return false
    }

    const timestamp = new Date().toISOString()
    const { error } = await supabase
      .from("class_session_status")
      .upsert(
        {
          class_id: realClassId,
          faculty_id: user.id,
          session_date: localDateKey(),
          status: "ended",
          ended_at: timestamp,
          updated_at: timestamp,
        },
        { onConflict: "class_id,session_date" },
      )

    if (error) {
      showMessage(
        `Unable to end class: ${error.message}`,
        "error",
        "Class could not be ended",
      )
      return false
    }

    setEndedClassIds((ids) =>
      ids.includes(realClassId) ? ids : [...ids, realClassId],
    )
    return true
  }

  const resetSignedInState = () => {
    setSignedIn(false)
    setPage("home")
    setActiveClass(null)
    setActiveSessionStartedAt(null)
    setMinimizedSession(null)
    setOmrScannerOpen(false)
    setOmrDraftScores({})
  }

  const validateAuthenticatedAccount = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      await supabase.auth.signOut({ scope: "local" })
      resetSignedInState()
      return false
    }

    const { data: facultyProfile, error: profileError } = await supabase
      .from("faculty_profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle()

    if (
      profileError ||
      !facultyProfile ||
      String(facultyProfile.role).toLowerCase() !== "faculty"
    ) {
      await supabase.auth.signOut({ scope: "local" })
      resetSignedInState()
      return false
    }

    setSignedIn(true)
    return true
  }

  useEffect(() => {
    let mounted = true

    const checkAccount = async () => {
      await validateAuthenticatedAccount()
      if (mounted) setAuthChecking(false)
    }

    void checkAccount()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (registrationLogoutInProgress.current) {
        if (event === "SIGNED_OUT" || !session?.user) {
          registrationLogoutInProgress.current = false
          resetSignedInState()
          setAuthChecking(false)
        }
        return
      }

      if (event === "SIGNED_OUT" || !session?.user) {
        resetSignedInState()
        setAuthChecking(false)
        return
      }

      // SIGNED_IN is also emitted by signUp when email confirmation is disabled.
      // Dashboard access is granted only by the explicit Sign in form callback.
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void validateAuthenticatedAccount()
      }
    })

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void validateAuthenticatedAccount()
      }
    }

    window.addEventListener("focus", handleVisibilityOrFocus)
    document.addEventListener("visibilitychange", handleVisibilityOrFocus)
    const validationTimer = window.setInterval(
      () => void validateAuthenticatedAccount(),
      60_000,
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener("focus", handleVisibilityOrFocus)
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus)
      window.clearInterval(validationTimer)
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut({ scope: "local" })
    resetSignedInState()
  }

  const openClass = (item: ClassItem) => {
    const isOpeningMinimizedClass =
      minimizedSession && String(minimizedSession.item.id) === String(item.id)

    if (isOpeningMinimizedClass) {
      setActiveClass(minimizedSession.item)
      setActiveSessionStartedAt(minimizedSession.startedAt)
      setMinimizedSession(null)
      return
    }

    // Opening another class must not redirect to the minimized live class.
    // The minimized session stays available in the tray after this class closes.
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
    if (page === "notifications") return <NotificationsPage setPage={setPage} />
    return (
<Dashboard
        onStart={openClass}
  setPage={setPage}
  endedClassIds={endedClassIds}
  activities={activities}
/>
    )
  }

  if (authChecking) {
    return (
      <div className="auth-checking-screen" role="status" aria-live="polite">
        <span className="auth-checking-spinner" aria-hidden="true" />
        <p>Checking your account...</p>
      </div>
    )
  }

  if (!signedIn) {
    return (
      <LandingPage
        onSignIn={() => {
          setAuthChecking(true)
          void validateAuthenticatedAccount().finally(() => setAuthChecking(false))
        }}
        onRegistrationComplete={() => {
          registrationLogoutInProgress.current = true
          resetSignedInState()
          setAuthChecking(false)
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <MessageDialogHost />
      <ToastHost />
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
            endedClassIds.includes(String(activeClass.id)) ||
            hasSemesterEnded(activeClass)
          }
          initialStarted={activeSessionStartedAt !== null}
          initialStartedAt={activeSessionStartedAt ?? undefined}
          onClose={() => {
            setActiveClass(null)
            setActiveSessionStartedAt(null)
          }}
          onEnd={(attendanceSessionId) => {
            const displayedClassId = String(activeClass.id)
            void endClassAcrossDevices(
              displayedClassId,
              attendanceSessionId,
            ).then((saved) => {
              if (!saved) return
              setActiveClass(null)
              setActiveSessionStartedAt(null)
              setMinimizedSession(null)
              showToast("Class ended and synchronized across devices.")
            })
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

