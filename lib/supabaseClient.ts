'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🧪 supabaseUrl:', supabaseUrl)
console.log('🧪 supabaseAnonKey:', supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase env vars are missing!")
  throw new Error("Missing environment variables for Supabase.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)