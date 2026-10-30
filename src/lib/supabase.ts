import { createClient } from "@supabase/supabase-js"
if (import.meta.env.DEV) {
  console.log(
    "Connected Supabase project:",
    import.meta.env.VITE_SUPABASE_URL,
  )
}
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseKey) {
  throw new Error(
    "VITE_SUPABASE_PUBLISHABLE_KEY is missing from the environment variables."
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)