import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

type QrState = {
  binding: string
  payload: string | null
  expiresAt: number
  message: string
}

export function useAttendanceQr(
  sessionId: string | null,
  classId: string,
  enabled: boolean,
) {
  const binding = `${sessionId ?? ""}:${classId}`
  const [state, setState] = useState<QrState>({
    binding,
    payload: null,
    expiresAt: 0,
    message: "Preparing attendance QR…",
  })
  const [tick, setTick] = useState(() => performance.now())

  useEffect(() => {
    let active = true
    let pending = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    const idleMessage = !enabled
      ? "Start the class to open QR attendance."
      : !sessionId
        ? "Waiting for a database attendance session. Retry Start class if this continues."
        : "Preparing attendance QR…"

    setState({ binding, payload: null, expiresAt: 0, message: idleMessage })

    if (!sessionId || !enabled) {
      return () => {
        active = false
      }
    }

    async function refresh() {
      if (!active || pending) return
      if (retryTimer) clearTimeout(retryTimer)

      pending = true
      const requestStarted = performance.now()
      controller = new AbortController()
      const abortTimer = window.setTimeout(() => controller?.abort(), 12_000)
      let retryMs = 3_000

      try {
        const { data, error } = await supabase.functions.invoke("qr-attendance", {
          body: {
            action: "issue",
            session_id: sessionId,
            class_id: classId,
          },
          signal: controller.signal,
        })

        if (!active) return

        if (error) {
          let code = ""
          try {
            const response = (error as { context?: Response }).context
            if (response instanceof Response) {
              const body = await response.clone().json()
              code = String(body?.error ?? "")
            }
          } catch {
            // Use the connection fallback below.
          }

          if (code === "GRACE_PERIOD_ENDED") {
            retryMs = 15_000
            throw new Error("Grace period ended. QR check-in is closed.")
          }
          if (code === "SESSION_NOT_ACTIVE") {
            retryMs = 15_000
            throw new Error("This attendance session has ended.")
          }
          if (code === "SESSION_POLICY_REQUIRED") {
            throw new Error("This session has no shared attendance policy.")
          }

          throw new Error(
            code
              ? `Attendance QR unavailable (${code}). Retrying…`
              : "Attendance QR unavailable. Check the connection; retrying…",
          )
        }

        const expiry = Date.parse(String(data?.expires_at ?? ""))
        const serverNow = Date.parse(String(data?.server_now ?? ""))
        const graceEnd = Date.parse(String(data?.grace_ends_at ?? ""))
        const payload = data?.payload

        if (
          !Number.isFinite(expiry) ||
          !Number.isFinite(serverNow) ||
          !Number.isFinite(graceEnd) ||
          payload?.type !== "COMPTECH:ATTENDANCE:QR:V1" ||
          payload.sessionId !== sessionId ||
          payload.classId !== classId ||
          !/^[0-9a-f]{64}$/i.test(String(payload.token ?? ""))
        ) {
          throw new Error("The server returned an invalid QR response.")
        }

        const remainingMs = Math.max(
          0,
          Math.min(expiry, graceEnd) -
            serverNow -
            (performance.now() - requestStarted),
        )

        setState({
          binding,
          payload: JSON.stringify(payload),
          expiresAt: performance.now() + remainingMs,
          message: "Scan during the attendance grace period.",
        })

        retryMs = Math.max(300, Math.min(10_000, remainingMs + 100))
      } catch (error) {
        if (active) {
          setState({
            binding,
            payload: null,
            expiresAt: 0,
            message:
              error instanceof Error
                ? error.message
                : "Attendance QR unavailable. Retrying…",
          })
        }
      } finally {
        window.clearTimeout(abortTimer)
        controller = undefined
        pending = false
        if (active) retryTimer = setTimeout(() => void refresh(), retryMs)
      }
    }

    void refresh()

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }

    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      active = false
      if (retryTimer) clearTimeout(retryTimer)
      controller?.abort()
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [binding, classId, enabled, sessionId])

  useEffect(() => {
    const timer = window.setInterval(() => setTick(performance.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  const current = state.binding === binding
  const countdown = current
    ? Math.max(0, Math.ceil((state.expiresAt - tick) / 1_000))
    : 0

  return {
    payload: enabled && countdown > 0 ? state.payload : null,
    countdown,
    message: current ? state.message : "Preparing attendance QR…",
  }
}
