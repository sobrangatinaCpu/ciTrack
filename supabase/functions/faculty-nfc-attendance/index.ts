import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type FacultyNfcAction =
  | "scanner_context"
  | "session_open"
  | "session_close"
  | "scan"

type RequestPayload = {
  action?: FacultyNfcAction
  classId?: string
  class_id?: string
  sessionId?: string
  session_id?: string
  cardUid?: string
  card_uid?: string
  cardToken?: string
  card_token?: string
}

type JsonObject = Record<string, unknown>

const json = (
  body: JsonObject,
  status = 200,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )

const normalizeCardUid = (value: unknown): string =>
  String(value ?? "")
    .replace(/[^0-9a-f]/gi, "")
    .toLowerCase()

const sha256 = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes,
  )

  return Array.from(new Uint8Array(digest))
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("")
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (request.method !== "POST") {
    return json(
      {
        success: false,
        error: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are supported.",
      },
      405,
    )
  }

  try {
    const supabaseUrl = Deno.env.get(
      "SUPABASE_URL",
    )

    const anonKey = Deno.env.get(
      "SUPABASE_ANON_KEY",
    )

    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    )

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      console.error(
        "Required Supabase environment variables are missing.",
      )

      return json(
        {
          success: false,
          error: "SERVER_CONFIGURATION_MISSING",
          message:
            "The attendance service is not configured correctly.",
        },
        500,
      )
    }

    const authorization =
      request.headers.get("Authorization") ?? ""

    if (!authorization.startsWith("Bearer ")) {
      return json(
        {
          success: false,
          error: "AUTH_REQUIRED",
          message:
            "A valid authenticated faculty session is required.",
        },
        401,
      )
    }

    const accessToken = authorization.slice(
      "Bearer ".length,
    )

    /*
     * Auth-scoped client:
     * Used only to validate the caller.
     */
    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    /*
     * Admin client:
     * Used for controlled server-side database work.
     * Every operation is explicitly filtered using actorId.
     */
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(
      accessToken,
    )

    if (userError || !user) {
      console.error(
        "Faculty authentication failed:",
        userError,
      )

      return json(
        {
          success: false,
          error: "AUTH_REQUIRED",
          message:
            userError?.message ??
            "The faculty login session is invalid or expired.",
        },
        401,
      )
    }

    const actorId = String(user.id)

    /*
     * faculty_profiles.id matches auth.users.id
     * according to the database results you shared.
     */
    const {
      data: facultyProfile,
      error: profileError,
    } = await adminClient
      .from("faculty_profiles")
      .select(`
        id,
        email,
        full_name,
        faculty_number,
        department,
        role
      `)
      .eq("id", actorId)
      .maybeSingle()

    if (profileError) {
      console.error(
        "Faculty profile lookup failed:",
        {
          actorId,
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        },
      )

      return json(
        {
          success: false,
          error: "PROFILE_QUERY_FAILED",
          message:
            "The faculty profile could not be checked.",
          details: profileError.message,
        },
        500,
      )
    }

    if (!facultyProfile) {
      console.warn(
        "No faculty profile exists for the authenticated user.",
        {
          actorId,
          email: user.email,
        },
      )

      return json(
        {
          success: false,
          error: "PROFILE_REQUIRED",
          message:
            "No faculty profile is connected to this account.",
        },
        403,
      )
    }

    const normalizedRole = String(
      facultyProfile.role ?? "",
    ).toLowerCase()

    if (
      normalizedRole !== "faculty" &&
      normalizedRole !== "professor" &&
      normalizedRole !== "admin" &&
      normalizedRole !== "administrator"
    ) {
      return json(
        {
          success: false,
          error: "FACULTY_REQUIRED",
          message:
            "This account is not authorized to manage faculty attendance.",
        },
        403,
      )
    }

    let payload: RequestPayload

    try {
      payload =
        (await request.json()) as RequestPayload
    } catch {
      return json(
        {
          success: false,
          error: "INVALID_JSON",
          message:
            "The request body must contain valid JSON.",
        },
        400,
      )
    }

    const action = String(
      payload.action ?? "",
    ) as FacultyNfcAction

    const allowedActions: FacultyNfcAction[] = [
      "scanner_context",
      "session_open",
      "session_close",
      "scan",
    ]

    if (!allowedActions.includes(action)) {
      return json(
        {
          success: false,
          error: "ACTION_NOT_ALLOWED",
          message: `Unsupported attendance action: ${action || "empty"}`,
        },
        400,
      )
    }

    /*
     * SCANNER CONTEXT
     *
     * Restores every active class session belonging
     * to the authenticated faculty account.
     */
    if (action === "scanner_context") {
      const {
        data: sessions,
        error: sessionsError,
      } = await adminClient
        .from("attendance_sessions")
        .select(`
          id,
          class_id,
          started_by,
          started_at,
          ended_at,
          status
        `)
        .eq("started_by", actorId)
        .is("ended_at", null)
        .order("started_at", {
          ascending: false,
        })

      if (sessionsError) {
        console.error(
          "Unable to retrieve active sessions:",
          sessionsError,
        )

        return json(
          {
            success: false,
            error:
              "ACTIVE_SESSION_QUERY_FAILED",
            message:
              "The active class sessions could not be retrieved.",
            details: sessionsError.message,
          },
          500,
        )
      }

      const activeSessions = sessions ?? []

      if (activeSessions.length === 0) {
        return json({
          success: true,
          data: {
            sessions: [],
            classes: [],
          },
        })
      }

      const classIds = [
        ...new Set(
          activeSessions
            .map((session) =>
              String(session.class_id ?? ""),
            )
            .filter(Boolean),
        ),
      ]

      const {
        data: classes,
        error: classesError,
      } = await adminClient
        .from("classes")
        .select(`
          *,
          class_schedules (
            id,
            meeting_days,
            start_time,
            end_time,
            room
          )
        `)
        .in("id", classIds)
        .eq("faculty_id", actorId)

      if (classesError) {
        console.error(
          "Unable to retrieve session classes:",
          classesError,
        )

        return json(
          {
            success: false,
            error:
              "SESSION_CLASS_QUERY_FAILED",
            message:
              "The live-session classes could not be retrieved.",
            details: classesError.message,
          },
          500,
        )
      }

      const classesWithSessions = (
        classes ?? []
      ).map((classRow) => ({
        ...classRow,
        sessions: activeSessions.filter(
          (session) =>
            String(session.class_id) ===
            String(classRow.id),
        ),
      }))

      return json({
        success: true,
        data: {
          sessions: activeSessions,
          classes: classesWithSessions,
        },
      })
    }

    /*
     * SESSION OPEN
     */
    if (action === "session_open") {
      const classId = String(
        payload.classId ??
          payload.class_id ??
          "",
      ).trim()

      if (!classId) {
        return json(
          {
            success: false,
            error: "CLASS_ID_REQUIRED",
            message:
              "A class ID is required to start the session.",
          },
          400,
        )
      }

      if (!isUuid(classId)) {
        return json(
          {
            success: false,
            error: "INVALID_CLASS_ID",
            message:
              "The selected class does not have a valid UUID.",
          },
          400,
        )
      }

      const {
        data: ownedClass,
        error: classError,
      } = await adminClient
        .from("classes")
        .select("id, subject, code, faculty_id")
        .eq("id", classId)
        .eq("faculty_id", actorId)
        .maybeSingle()

      if (classError) {
        console.error(
          "Class ownership check failed:",
          classError,
        )

        return json(
          {
            success: false,
            error:
              "CLASS_OWNERSHIP_QUERY_FAILED",
            message:
              "The selected class could not be verified.",
            details: classError.message,
          },
          500,
        )
      }

      if (!ownedClass) {
        return json(
          {
            success: false,
            error: "CLASS_NOT_OWNED",
            message:
              "The selected class does not belong to this faculty account.",
          },
          403,
        )
      }

      /*
       * Reuse the existing active session.
       */
      const {
        data: existingSession,
        error: existingError,
      } = await adminClient
        .from("attendance_sessions")
        .select(`
          id,
          class_id,
          started_by,
          started_at,
          ended_at,
          status
        `)
        .eq("class_id", classId)
        .eq("started_by", actorId)
        .is("ended_at", null)
        .order("started_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (existingError) {
        console.error(
          "Existing-session lookup failed:",
          existingError,
        )

        return json(
          {
            success: false,
            error:
              "ACTIVE_SESSION_QUERY_FAILED",
            message:
              "The existing class session could not be checked.",
            details: existingError.message,
          },
          500,
        )
      }

      if (existingSession) {
        return json({
          success: true,
          reused: true,
          data: {
            session_id: existingSession.id,
            session: existingSession,
            class: ownedClass,
          },
        })
      }

      const startedAt =
        new Date().toISOString()

      const {
        data: newSession,
        error: insertError,
      } = await adminClient
        .from("attendance_sessions")
        .insert({
          class_id: classId,
          started_by: actorId,
          started_at: startedAt,
          ended_at: null,
          status: "active",
        })
        .select(`
          id,
          class_id,
          started_by,
          started_at,
          ended_at,
          status
        `)
        .single()

      if (insertError || !newSession) {
        console.error(
          "Attendance-session creation failed:",
          insertError,
        )

        /*
         * Handle a concurrent second request by trying
         * to recover the session created by that request.
         */
        if (insertError?.code === "23505") {
          const {
            data: concurrentSession,
            error: concurrentError,
          } = await adminClient
            .from("attendance_sessions")
            .select("*")
            .eq("class_id", classId)
            .eq("started_by", actorId)
            .is("ended_at", null)
            .order("started_at", {
              ascending: false,
            })
            .limit(1)
            .maybeSingle()

          if (
            !concurrentError &&
            concurrentSession
          ) {
            return json({
              success: true,
              reused: true,
              data: {
                session_id:
                  concurrentSession.id,
                session:
                  concurrentSession,
                class: ownedClass,
              },
            })
          }
        }

        return json(
          {
            success: false,
            error:
              "SESSION_CREATION_FAILED",
            message:
              "The class attendance session could not be created.",
            details:
              insertError?.message ??
              "No session row was returned.",
          },
          500,
        )
      }

      /*
       * Keep the existing NFC backend test-session
       * requirement available for card scanning.
       */
      const expiresAt = new Date(
        Date.now() + 30 * 60 * 1000,
      ).toISOString()

      const {
        error: nfcTestError,
      } = await adminClient
        .from(
          "nfc_attendance_test_sessions",
        )
        .upsert(
          {
            session_id: newSession.id,
            expires_at: expiresAt,
          },
          {
            onConflict: "session_id",
          },
        )

      if (nfcTestError) {
        console.warn(
          "The session was created, but the NFC test window could not be initialized:",
          nfcTestError,
        )
      }

      return json(
        {
          success: true,
          reused: false,
          data: {
            session_id: newSession.id,
            session: newSession,
            class: ownedClass,
          },
        },
        201,
      )
    }

    /*
     * SESSION CLOSE
     */
    if (action === "session_close") {
      const sessionId = String(
        payload.sessionId ??
          payload.session_id ??
          "",
      ).trim()

      if (!sessionId) {
        return json(
          {
            success: false,
            error: "SESSION_ID_REQUIRED",
            message:
              "A session ID is required to end the class.",
          },
          400,
        )
      }

      if (!isUuid(sessionId)) {
        return json(
          {
            success: false,
            error: "INVALID_SESSION_ID",
            message:
              "The attendance session ID is invalid.",
          },
          400,
        )
      }

      const {
        data: existingSession,
        error: sessionError,
      } = await adminClient
        .from("attendance_sessions")
        .select(`
          id,
          class_id,
          started_by,
          started_at,
          ended_at,
          status
        `)
        .eq("id", sessionId)
        .eq("started_by", actorId)
        .maybeSingle()

      if (sessionError) {
        console.error(
          "Session ownership check failed:",
          sessionError,
        )

        return json(
          {
            success: false,
            error:
              "SESSION_OWNERSHIP_QUERY_FAILED",
            message:
              "The attendance session could not be verified.",
            details: sessionError.message,
          },
          500,
        )
      }

      if (!existingSession) {
        return json(
          {
            success: false,
            error: "SESSION_NOT_OWNED",
            message:
              "The attendance session does not belong to this faculty account.",
          },
          403,
        )
      }

      if (existingSession.ended_at) {
        return json({
          success: true,
          alreadyEnded: true,
          data: {
            closed: true,
            session: existingSession,
          },
        })
      }

      const endedAt =
        new Date().toISOString()

      const {
        data: endedSession,
        error: updateError,
      } = await adminClient
        .from("attendance_sessions")
        .update({
          status: "ended",
          ended_at: endedAt,
        })
        .eq("id", sessionId)
        .eq("started_by", actorId)
        .select("*")
        .single()

      if (updateError) {
        console.error(
          "Unable to close the attendance session:",
          updateError,
        )

        return json(
          {
            success: false,
            error: "SESSION_CLOSE_FAILED",
            message:
              "The class attendance session could not be ended.",
            details: updateError.message,
          },
          500,
        )
      }

      const { error: windowError } =
        await adminClient
          .from(
            "nfc_attendance_ready_windows",
          )
          .update({
            closed_at: endedAt,
          })
          .eq("session_id", sessionId)
          .is("closed_at", null)

      if (windowError) {
        console.warn(
          "The session ended, but some NFC windows could not be closed:",
          windowError,
        )
      }

      return json({
        success: true,
        data: {
          closed: true,
          session: endedSession,
        },
      })
    }

    /*
     * SCAN
     *
     * The student mobile application registers the card.
     * The faculty's NFC-enabled phone scans the student's
     * physical card during the live class.
     */
    if (action === "scan") {
      const sessionId = String(
        payload.sessionId ??
          payload.session_id ??
          "",
      ).trim()

      const cardUid = normalizeCardUid(
        payload.cardUid ??
          payload.card_uid,
      )

      const cardToken = String(
        payload.cardToken ??
          payload.card_token ??
          "",
      ).trim()

      if (
        !sessionId ||
        !cardUid ||
        !cardToken
      ) {
        return json(
          {
            success: false,
            error:
              "CARD_SCAN_DATA_REQUIRED",
            message:
              "Session ID, card UID, and card token are required.",
          },
          400,
        )
      }

      if (!isUuid(sessionId)) {
        return json(
          {
            success: false,
            error: "INVALID_SESSION_ID",
            message:
              "The attendance session ID is invalid.",
          },
          400,
        )
      }

      if (
        !/^[0-9a-f]{8,32}$/.test(
          cardUid,
        ) ||
        cardUid.length % 2 !== 0
      ) {
        return json(
          {
            success: false,
            error: "INVALID_CARD_UID",
            message:
              "The NFC card identifier is invalid.",
          },
          400,
        )
      }

      const tokenHash =
        await sha256(cardToken)

      const { data, error } =
        await adminClient.rpc(
          "nfc_attendance_api",
          {
            p_actor: actorId,
            p_action: "scan",
            p_body: {
              session_id: sessionId,
              card_uid: cardUid,
              token_hash: tokenHash,
            },
          },
        )

      if (error) {
        console.error(
          "nfc_attendance_api scan failed:",
          {
            actorId,
            sessionId,
            cardUid,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        )

        const status =
          error.message.includes(
            "PROFILE_REQUIRED",
          )
            ? 403
            : error.message.includes(
                  "CLASS_NOT_OWNED",
                )
              ? 403
              : error.message.includes(
                    "ACTIVE_CARD_REQUIRED",
                  ) ||
                  error.message.includes(
                    "CARD_UID_MISMATCH",
                  )
                ? 422
                : 400

        return json(
          {
            success: false,
            error:
              error.message.includes(
                "PROFILE_REQUIRED",
              )
                ? "PROFILE_REQUIRED"
                : error.message,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
          status,
        )
      }

      const rpcResult =
        data &&
        typeof data === "object"
          ? (data as JsonObject)
          : null

      if (
        rpcResult &&
        rpcResult.success === false
      ) {
        const rpcError = String(
          rpcResult.error ??
            "ATTENDANCE_SCAN_FAILED",
        )

        return json(
          {
            success: false,
            ...rpcResult,
          },
          rpcError === "PROFILE_REQUIRED"
            ? 403
            : 400,
        )
      }

      return json({
        success: true,
        data,
      })
    }

    return json(
      {
        success: false,
        error: "ACTION_NOT_ALLOWED",
      },
      400,
    )
  } catch (error) {
    console.error(
      "faculty-nfc-attendance failed:",
      error,
    )

    return json(
      {
        success: false,
        error: "UNKNOWN_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected NFC attendance error occurred.",
      },
      500,
    )
  }
})