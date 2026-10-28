import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type IssueQrRequest = {
  action?: string
  session_id?: string
  class_id?: string
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

const createSecureToken = (): string => {
  const bytes = crypto.getRandomValues(
    new Uint8Array(32),
  )

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("")
}

const sha256 = async (
  value: string,
): Promise<string> => {
  const encoded = new TextEncoder().encode(value)

  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoded,
  )

  return Array.from(
    new Uint8Array(digest),
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("")
}

Deno.serve(
  async (
    request: Request,
  ): Promise<Response> => {
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
          message:
            "Only POST requests are supported.",
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
          "Missing Supabase environment variables.",
        )

        return json(
          {
            success: false,
            error:
              "SERVER_CONFIGURATION_MISSING",
            message:
              "The QR service is not configured correctly.",
          },
          500,
        )
      }

      const authorization =
        request.headers.get(
          "Authorization",
        ) ?? ""

      if (
        !authorization.startsWith(
          "Bearer ",
        )
      ) {
        return json(
          {
            success: false,
            error: "AUTH_REQUIRED",
            message:
              "A valid faculty login session is required.",
          },
          401,
        )
      }

      const accessToken =
        authorization.slice(
          "Bearer ".length,
        )

      const authClient = createClient(
        supabaseUrl,
        anonKey,
        {
          global: {
            headers: {
              Authorization:
                authorization,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        },
      )

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
      } =
        await authClient.auth.getUser(
          accessToken,
        )

      if (userError || !user) {
        console.error(
          "QR authentication failed:",
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
       * The database results confirmed:
       *
       * faculty_profiles.id =
       * auth.users.id
       *
       * faculty_number is optional and is
       * deliberately not required here.
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

      console.log(
        "QR faculty profile lookup:",
        {
          actorId,
          email: user.email,
          profileFound:
            Boolean(facultyProfile),
          profileError:
            profileError?.message ??
            null,
        },
      )

      if (profileError) {
        return json(
          {
            success: false,
            error:
              "PROFILE_QUERY_FAILED",
            message:
              profileError.message,
            details:
              profileError.details,
            hint: profileError.hint,
          },
          500,
        )
      }

      if (!facultyProfile) {
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

      const role = String(
        facultyProfile.role ?? "",
      ).toLowerCase()

      if (
        role !== "faculty" &&
        role !== "professor" &&
        role !== "admin" &&
        role !== "administrator"
      ) {
        return json(
          {
            success: false,
            error: "FACULTY_REQUIRED",
            message:
              "This account is not authorized to issue attendance QR codes.",
          },
          403,
        )
      }

      let body: IssueQrRequest

      try {
        body =
          (await request.json()) as IssueQrRequest
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
        body.action ?? "",
      )

      if (action !== "issue") {
        return json(
          {
            success: false,
            error: "ACTION_NOT_ALLOWED",
            message:
              `Unsupported QR action: ${action || "empty"}`,
          },
          400,
        )
      }

      const sessionId = String(
        body.session_id ?? "",
      ).trim()

      const classId = String(
        body.class_id ?? "",
      ).trim()

      if (!sessionId) {
        return json(
          {
            success: false,
            error: "SESSION_ID_REQUIRED",
            message:
              "A database attendance session is required.",
          },
          400,
        )
      }

      if (!classId) {
        return json(
          {
            success: false,
            error: "CLASS_ID_REQUIRED",
            message:
              "A class ID is required.",
          },
          400,
        )
      }

      if (!isUuid(sessionId)) {
        return json(
          {
            success: false,
            error:
              "INVALID_SESSION_ID",
            message:
              "The attendance session ID is invalid.",
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
              "The class ID is invalid.",
          },
          400,
        )
      }

      /*
       * Authoritative session validation.
       *
       * attendance_sessions uses:
       * - class_id
       * - started_by
       * - started_at
       * - ended_at
       * - status
       */
      const {
        data: session,
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
        .eq("class_id", classId)
        .eq("started_by", actorId)
        .maybeSingle()

      if (sessionError) {
        console.error(
          "QR session query failed:",
          sessionError,
        )

        return json(
          {
            success: false,
            error:
              "SESSION_QUERY_FAILED",
            message:
              "The attendance session could not be checked.",
            details:
              sessionError.message,
          },
          500,
        )
      }

      if (!session) {
        return json(
          {
            success: false,
            error:
              "SESSION_NOT_OWNED",
            message:
              "The attendance session was not found or does not belong to this faculty account.",
          },
          403,
        )
      }

      if (
        session.ended_at ||
        String(
          session.status ?? "",
        ).toLowerCase() !== "active"
      ) {
        return json(
          {
            success: false,
            error:
              "SESSION_NOT_ACTIVE",
            message:
              "This attendance session has ended.",
          },
          409,
        )
      }

      const {
        data: ownedClass,
        error: classError,
      } = await adminClient
        .from("classes")
        .select(
          "id, subject, code, faculty_id",
        )
        .eq("id", classId)
        .eq("faculty_id", actorId)
        .maybeSingle()

      if (classError) {
        return json(
          {
            success: false,
            error:
              "CLASS_QUERY_FAILED",
            message:
              classError.message,
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

      const serverNow = new Date()

      /*
       * The QR rotates every 60 seconds.
       */
      const tokenLifetimeMs =
        60 * 1000

      /*
       * Attendance remains available for
       * 30 minutes after the session starts.
       *
       * If the session started more than
       * 30 minutes ago, QR check-in closes.
       */
      const gracePeriodMs =
        30 * 60 * 1000

      const sessionStartMs =
        Date.parse(
          String(session.started_at),
        )

      if (
        !Number.isFinite(
          sessionStartMs,
        )
      ) {
        return json(
          {
            success: false,
            error:
              "SESSION_POLICY_REQUIRED",
            message:
              "The attendance session has no valid start time.",
          },
          422,
        )
      }

      const graceEndsAt = new Date(
        sessionStartMs + gracePeriodMs,
      )

      if (
        serverNow.getTime() >=
        graceEndsAt.getTime()
      ) {
        await adminClient
          .from("attendance_qr_tokens")
          .update({
            revoked_at:
              serverNow.toISOString(),
          })
          .eq("session_id", sessionId)
          .is("revoked_at", null)

        return json(
          {
            success: false,
            error:
              "GRACE_PERIOD_ENDED",
            message:
              "QR check-in is closed because the attendance grace period has ended.",
          },
          409,
        )
      }

      /*
       * Immediately revoke the previously
       * issued token for this session.
       */
      const {
        error: revokeError,
      } = await adminClient
        .from("attendance_qr_tokens")
        .update({
          revoked_at:
            serverNow.toISOString(),
        })
        .eq("session_id", sessionId)
        .is("revoked_at", null)

      if (revokeError) {
        console.error(
          "Unable to revoke old QR token:",
          revokeError,
        )

        return json(
          {
            success: false,
            error:
              "QR_TOKEN_REVOKE_FAILED",
            message:
              revokeError.message,
          },
          500,
        )
      }

      const rawToken =
        createSecureToken()

      const tokenHash =
        await sha256(rawToken)

      const expiresAt = new Date(
        Math.min(
          serverNow.getTime() +
            tokenLifetimeMs,
          graceEndsAt.getTime(),
        ),
      )

      const {
        error: tokenError,
      } = await adminClient
        .from("attendance_qr_tokens")
        .insert({
          session_id: sessionId,
          class_id: classId,
          token_hash: tokenHash,
          issued_by: actorId,
          expires_at:
            expiresAt.toISOString(),
          revoked_at: null,
          created_at:
            serverNow.toISOString(),
        })

      if (tokenError) {
        console.error(
          "Unable to store QR token:",
          tokenError,
        )

        return json(
          {
            success: false,
            error:
              "QR_TOKEN_CREATE_FAILED",
            message:
              tokenError.message,
            details:
              tokenError.details,
          },
          500,
        )
      }

      const qrPayload = {
        type:
          "COMPTECH:ATTENDANCE:QR:V1",
        sessionId,
        classId,
        token: rawToken,
      }

      console.log(
        "Attendance QR issued:",
        {
          actorId,
          sessionId,
          classId,
          expiresAt:
            expiresAt.toISOString(),
        },
      )

      return json({
        success: true,
        payload: qrPayload,
        expires_at:
          expiresAt.toISOString(),
        server_now:
          serverNow.toISOString(),
        grace_ends_at:
          graceEndsAt.toISOString(),
      })
    } catch (error) {
      console.error(
        "qr-attendance failed:",
        error,
      )

      return json(
        {
          success: false,
          error: "UNKNOWN_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected QR attendance error occurred.",
        },
        500,
      )
    }
  },
)