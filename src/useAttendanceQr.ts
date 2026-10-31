import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

type QrState = {
  binding: string
  payload: string | null
  expiresAt: number
  message: string
}

type QrPayload = {
  type: "COMPTECH:ATTENDANCE:QR:V1"
  sessionId: string
  classId: string
  token: string
}

type QrFunctionResponse = {
  success?: boolean
  payload?: QrPayload
  expires_at?: string
  server_now?: string
  grace_ends_at?: string
  error?: string
  code?: string
  message?: string
  details?: string
}

type ParsedFunctionError = { code: string; message: string; status: number }

const PERMANENT_ERROR_CODES = new Set([
  "AUTH_REQUIRED", "PROFILE_REQUIRED", "PROFILE_QUERY_FAILED", "FACULTY_REQUIRED",
  "SESSION_NOT_OWNED", "CLASS_NOT_OWNED", "SESSION_POLICY_REQUIRED",
  "INVALID_SESSION_ID", "INVALID_CLASS_ID", "QR_TOKEN_CREATE_FAILED",
  "QR_TOKEN_REVOKE_FAILED", "PERMISSION_DENIED", "SERVER_CONFIGURATION_MISSING",
])
const TERMINAL_SESSION_CODES = new Set(["GRACE_PERIOD_ENDED", "SESSION_NOT_ACTIVE"])

const getPermanentErrorMessage = (code: string, backendMessage?: string): string => {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Your login session has expired. Sign in again.",
    PROFILE_REQUIRED: "The faculty profile could not be verified.",
    PROFILE_QUERY_FAILED: "The QR service could not check the faculty profile.",
    FACULTY_REQUIRED: "This account is not authorized to issue attendance QR codes.",
    SESSION_NOT_OWNED: "This attendance session is unavailable for the signed-in account.",
    CLASS_NOT_OWNED: "This class is unavailable for the signed-in account.",
    SESSION_POLICY_REQUIRED: "This attendance session has no valid QR attendance policy.",
    INVALID_SESSION_ID: "The attendance session ID is invalid.",
    INVALID_CLASS_ID: "The class ID is invalid.",
    QR_TOKEN_CREATE_FAILED: "The QR token could not be created. Check the QR token table configuration.",
    QR_TOKEN_REVOKE_FAILED: "The previous QR token could not be closed. Check the QR token table configuration.",
    PERMISSION_DENIED: "The QR service does not have permission to access the attendance token table.",
    SERVER_CONFIGURATION_MISSING: "The QR service is missing its required server configuration.",
  }
  return messages[code] ?? backendMessage ?? "Attendance QR is unavailable."
}

const readFunctionError = async (error: unknown): Promise<ParsedFunctionError> => {
  let code = ""
  let message = ""
  let status = 0
  try {
    const functionError = error as { context?: Response; message?: string }
    const response = functionError.context
    if (response instanceof Response) {
      status = response.status
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
      if (contentType.includes("application/json")) {
        const body = (await response.clone().json()) as Record<string, unknown>
        code = String(body.error ?? body.code ?? "")
        message = String(body.message ?? body.details ?? "")
      } else message = await response.clone().text()
    }
    if (!message && functionError.message) message = functionError.message
  } catch {
    message = String((error as { message?: string })?.message ?? "")
  }
  return { code, message, status }
}

export function useAttendanceQr(sessionId: string | null, classId: string, enabled: boolean) {
  const normalizedSessionId = String(sessionId ?? "").trim()
  const normalizedClassId = String(classId ?? "").trim()
  const binding = `${normalizedSessionId}:${normalizedClassId}`
  const [state, setState] = useState<QrState>({
    binding, payload: null, expiresAt: 0, message: "Preparing attendance QR...",
  })
  const [tick, setTick] = useState(() => performance.now())

  useEffect(() => {
    let active = true
    let requestPending = false
    let stoppedPermanently = false
    let retryTimer: number | undefined
    let controller: AbortController | undefined

    const clearRetryTimer = () => {
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer)
        retryTimer = undefined
      }
    }

    const idleMessage = !enabled
      ? "Start the class to open QR attendance."
      : !normalizedSessionId
        ? "Waiting for a database attendance session. Retry Start class if this continues."
        : !normalizedClassId ? "The class information is unavailable." : "Preparing attendance QR..."

    setState({ binding, payload: null, expiresAt: 0, message: idleMessage })
    if (!enabled || !normalizedSessionId || !normalizedClassId) {
      return () => { active = false }
    }

    const scheduleRefresh = (delayMs: number) => {
      clearRetryTimer()
      if (!active || stoppedPermanently || delayMs <= 0) return
      retryTimer = window.setTimeout(() => void refreshQr(), delayMs)
    }

    async function refreshQr() {
      if (!active || requestPending || stoppedPermanently) return
      clearRetryTimer()
      requestPending = true
      controller = new AbortController()
      const abortTimer = window.setTimeout(() => controller?.abort(), 12_000)
      let retryMs = 3_000

      try {
        const { data, error } = await supabase.functions.invoke<QrFunctionResponse>("qr-attendance", {
          body: { action: "issue", session_id: normalizedSessionId, class_id: normalizedClassId },
          signal: controller.signal,
        })
        if (!active) return

        if (error) {
          const functionError = await readFunctionError(error)
          const code = functionError.code.trim()
          const backendMessage = functionError.message.trim()
          const normalizedMessage = backendMessage.toLowerCase()
          if (normalizedMessage.includes("permission denied for table attendance_qr_tokens")) {
            stoppedPermanently = true; retryMs = 0
            throw new Error("The QR service cannot access the attendance_qr_tokens table. Run the required Supabase permission SQL.")
          }
          if (normalizedMessage.includes("relation") && normalizedMessage.includes("attendance_qr_tokens") && normalizedMessage.includes("does not exist")) {
            stoppedPermanently = true; retryMs = 0
            throw new Error("The attendance_qr_tokens table does not exist. Run the QR database setup SQL.")
          }
          if (PERMANENT_ERROR_CODES.has(code)) {
            stoppedPermanently = true; retryMs = 0
            throw new Error(getPermanentErrorMessage(code, backendMessage))
          }
          if (TERMINAL_SESSION_CODES.has(code)) {
            stoppedPermanently = true; retryMs = 0
            throw new Error(code === "GRACE_PERIOD_ENDED" ? "Grace period ended. QR check-in is closed." : "This attendance session has ended.")
          }
          if (functionError.status === 401 || functionError.status === 403) {
            stoppedPermanently = true; retryMs = 0
            throw new Error(backendMessage || "The QR request was not authorized. Sign in again and verify the faculty profile.")
          }
          throw new Error(backendMessage || (code ? `Attendance QR unavailable (${code}). Retrying...` : "Attendance QR unavailable. Check the connection; retrying..."))
        }

        if (data?.success === false) {
          const code = String(data.error ?? data.code ?? "").trim()
          const backendMessage = String(data.message ?? data.details ?? "").trim()
          const normalizedMessage = backendMessage.toLowerCase()
          if (normalizedMessage.includes("permission denied for table attendance_qr_tokens")) {
            stoppedPermanently = true; retryMs = 0
            throw new Error("The QR service cannot access the attendance_qr_tokens table. Run the required Supabase permission SQL.")
          }
          if (PERMANENT_ERROR_CODES.has(code)) {
            stoppedPermanently = true; retryMs = 0
            throw new Error(getPermanentErrorMessage(code, backendMessage))
          }
          if (TERMINAL_SESSION_CODES.has(code)) {
            stoppedPermanently = true; retryMs = 0
            throw new Error(code === "GRACE_PERIOD_ENDED" ? "Grace period ended. QR check-in is closed." : "This attendance session has ended.")
          }
          throw new Error(backendMessage || (code ? `Attendance QR unavailable (${code}). Retrying...` : "Attendance QR unavailable. Retrying..."))
        }

        const expiry = Date.parse(String(data?.expires_at ?? ""))
        const serverNow = Date.parse(String(data?.server_now ?? ""))
        const graceEnd = Date.parse(String(data?.grace_ends_at ?? ""))
        const qrPayload = data?.payload
        const payloadIsValid = qrPayload?.type === "COMPTECH:ATTENDANCE:QR:V1" &&
          qrPayload.sessionId === normalizedSessionId && qrPayload.classId === normalizedClassId &&
          /^[0-9a-f]{64}$/i.test(String(qrPayload.token ?? ""))

        if (!Number.isFinite(expiry) || !Number.isFinite(serverNow) || !Number.isFinite(graceEnd) || !payloadIsValid) {
          throw new Error("The server returned an invalid QR response.")
        }

        // server_now is created with the token, so do not subtract the whole HTTP request time.
        // Doing so caused a new 60-second QR to begin around 49-53 seconds on slow/cold requests.
        const remainingMs = Math.max(0, Math.min(expiry, graceEnd) - serverNow)
        if (remainingMs <= 0) {
          retryMs = 500
          setState({ binding, payload: null, expiresAt: 0, message: "Refreshing attendance QR..." })
          return
        }

        const clientExpiry = performance.now() + remainingMs
        setTick(performance.now())
        setState({
          binding,
          payload: JSON.stringify(qrPayload),
          expiresAt: clientExpiry,
          message: "Scan during the attendance grace period.",
        })

        // Refresh only when this token expires. The old 10-second cap caused premature rotation.
        retryMs = remainingMs + 150
      } catch (error) {
        if (!active) return
        const isAbortError = error instanceof DOMException && error.name === "AbortError"
        setState({
          binding, payload: null, expiresAt: 0,
          message: isAbortError ? "Attendance QR request timed out. Retrying..." :
            error instanceof Error ? error.message : "Attendance QR unavailable. Retrying...",
        })
      } finally {
        window.clearTimeout(abortTimer)
        controller = undefined
        requestPending = false
        if (active && !stoppedPermanently && retryMs > 0) scheduleRefresh(retryMs)
      }
    }

    void refreshQr()
    const refreshWhenVisible = () => {
      // Do not replace a still-valid QR merely because the window regained focus.
      const currentQrStillValid = state.binding === binding && state.payload && state.expiresAt > performance.now() + 500
      if (document.visibilityState === "visible" && !requestPending && !stoppedPermanently && !currentQrStillValid) {
        void refreshQr()
      }
    }
    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => {
      active = false
      clearRetryTimer()
      controller?.abort()
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [binding, enabled, normalizedClassId, normalizedSessionId])

  useEffect(() => {
    const countdownTimer = window.setInterval(() => setTick(performance.now()), 250)
    return () => window.clearInterval(countdownTimer)
  }, [])

  const current = state.binding === binding
  const countdown = current ? Math.max(0, Math.ceil((state.expiresAt - tick) / 1_000)) : 0
  return {
    payload: enabled && current && countdown > 0 ? state.payload : null,
    countdown,
    message: current ? state.message : "Preparing attendance QR...",
  }
}
