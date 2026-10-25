import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://imdigrgakhikhzjukygp.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseKey) {
  throw new Error(
    "VITE_SUPABASE_PUBLISHABLE_KEY is missing from the environment variables."
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)