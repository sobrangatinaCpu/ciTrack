import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

type QrState = {
  binding: string
  payload: string | null
  expiresAt: number
  deadline: number
  message: string
}

/** One shared server-issued QR per session, valid only during its grace period. */
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
    deadline: 0,
    message: "Preparing attendance QR…",
  })
  const [tick, setTick] = useState(() => performance.now())

  useEffect(() => {
    let active = true
    let pending = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    setState({
      binding,
      payload: null,
      expiresAt: 0,
      deadline: 0,
      message: "Preparing attendance QR…",
    })

    if (!sessionId || !enabled) {
      return () => {
        active = false
      }
    }

    async function refresh() {
      if (!active || pending) return
      if (timer) clearTimeout(timer)

      pending = true
      const started = performance.now()
      controller = new AbortController()
      const abortTimer = setTimeout(() => controller?.abort(), 12_000)
      let retryMs = 3_000

      try {
        const { data, error } = await supabase.functions.invoke(
          "qr-attendance",
          {
            body: {
              action: "issue",
              session_id: sessionId,
              class_id: classId,
            },
            signal: controller.signal,
          },
        )

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
            // Display the connection fallback.
          }

          if (["GRACE_PERIOD_ENDED", "SESSION_NOT_ACTIVE"].includes(code)) {
            retryMs = 15_000
            throw new Error(
              code === "GRACE_PERIOD_ENDED"
                ? "Grace period ended. QR check-in is closed."
                : "This attendance session has ended.",
            )
          }

          throw new Error(
            code === "SESSION_POLICY_REQUIRED"
              ? "This session has no shared attendance policy. Check the session backend."
              : "Attendance QR unavailable. Check the connection; retrying…",
          )
        }

        const expiry = Date.parse(String(data?.expires_at ?? ""))
        const serverNow = Date.parse(String(data?.server_now ?? ""))
        const grace = Date.parse(String(data?.grace_ends_at ?? ""))

        if (
          !Number.isFinite(expiry) ||
          !Number.isFinite(serverNow) ||
          !Number.isFinite(grace) ||
          data?.payload?.type !== "COMPTECH:ATTENDANCE:QR:V1" ||
          data.payload.sessionId !== sessionId ||
          data.payload.classId !== classId ||
          !/^[0-9a-f]{64}$/.test(String(data.payload.token ?? ""))
        ) {
          throw new Error("The server returned an invalid QR response.")
        }

        // Use a monotonic local deadline; subtract the entire request time conservatively.
        const remaining = Math.max(
          0,
          Math.min(expiry, grace) -
            serverNow -
            (performance.now() - started),
        )

        setState({
          binding,
          payload: JSON.stringify(data.payload),
          expiresAt: performance.now() + remaining,
          deadline: grace,
          message: "Scan during the attendance grace period.",
        })

        retryMs = Math.max(300, Math.min(10_000, remaining + 100))
      } catch (error) {
        if (active) {
          setState({
            binding,
            payload: null,
            expiresAt: 0,
            deadline: 0,
            message:
              error instanceof Error
                ? error.message
                : "Attendance QR unavailable. Retrying…",
          })
        }
      } finally {
        clearTimeout(abortTimer)
        controller = undefined
        pending = false

        if (active) {
          timer = setTimeout(() => {
            void refresh()
          }, retryMs)
        }
      }
    }

    void refresh()

    const visibility = () => {
      if (document.visibilityState === "visible") void refresh()
    }

    window.addEventListener("focus", visibility)
    document.addEventListener("visibilitychange", visibility)

    return () => {
      active = false
      if (timer) clearTimeout(timer)
      controller?.abort()
      window.removeEventListener("focus", visibility)
      document.removeEventListener("visibilitychange", visibility)
    }
  }, [sessionId, classId, enabled, binding])

  useEffect(() => {
    const timer = setInterval(() => setTick(performance.now()), 250)
    return () => clearInterval(timer)
  }, [])

  const current = state.binding === binding
  const remaining = current
    ? Math.max(0, Math.ceil((state.expiresAt - tick) / 1_000))
    : 0

  return {
    payload: enabled && remaining > 0 ? state.payload : null,
    countdown: remaining,
    message: current ? state.message : "Preparing attendance QR…",
  }
}
