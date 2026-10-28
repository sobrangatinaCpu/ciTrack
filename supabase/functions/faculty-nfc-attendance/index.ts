import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method !== "POST") {
    return json({ success: false, error: "METHOD_NOT_ALLOWED" }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const authorization = request.headers.get("Authorization") ?? ""

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ success: false, error: "SERVER_CONFIGURATION_MISSING" }, 500)
    }

    if (!authorization.startsWith("Bearer ")) {
      return json({ success: false, error: "AUTH_REQUIRED" }, 401)
    }

    const accessToken = authorization.slice("Bearer ".length)
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } =
      await authClient.auth.getUser(accessToken)

    if (userError || !userData.user) {
      return json({ success: false, error: "AUTH_REQUIRED" }, 401)
    }

    const actorId = userData.user.id
    const payload = await request.json().catch(() => ({}))
    const action = String(payload.action ?? "")

    if (!['scanner_context', 'session_open', 'session_close', 'scan'].includes(action)) {
      return json({ success: false, error: "ACTION_NOT_ALLOWED" }, 400)
    }

    let rpcBody: Record<string, unknown> = {}

    if (action === "scanner_context") {
      rpcBody = {}
    }

    if (action === "session_open") {
      const classId = String(payload.classId ?? "")
      if (!classId) {
        return json({ success: false, error: "CLASS_ID_REQUIRED" }, 400)
      }
      rpcBody = { class_id: classId }
    }

    if (action === "session_close") {
      const sessionId = String(payload.sessionId ?? "")
      if (!sessionId) {
        return json({ success: false, error: "SESSION_ID_REQUIRED" }, 400)
      }
      rpcBody = { session_id: sessionId }
    }

    if (action === "scan") {
      const sessionId = String(payload.sessionId ?? "")
      const cardUid = String(payload.cardUid ?? "")
        .replace(/[^0-9a-f]/gi, "")
        .toLowerCase()
      const cardToken = String(payload.cardToken ?? "").trim()

      if (!sessionId || !cardUid || !cardToken) {
        return json({ success: false, error: "CARD_SCAN_DATA_REQUIRED" }, 400)
      }

      if (!/^[0-9a-f]{8,32}$/.test(cardUid) || cardUid.length % 2 !== 0) {
        return json({ success: false, error: "INVALID_CARD_UID" }, 400)
      }

      rpcBody = {
        session_id: sessionId,
        card_uid: cardUid,
        token_hash: await sha256(cardToken),
      }
    }

    const { data, error } = await adminClient.rpc("nfc_attendance_api", {
      p_actor: actorId,
      p_action: action,
      p_body: rpcBody,
    })

    if (error) {
      console.error("nfc_attendance_api failed", error)
      return json({ success: false, error: error.message }, 400)
    }

    return json({ success: true, data })
  } catch (error) {
    console.error("faculty-nfc-attendance failed", error)
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      500,
    )
  }
})
