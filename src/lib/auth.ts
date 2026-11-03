import { supabase } from "./supabase"

export type FacultyRegistration = {
  email: string
  password: string
  fullName: string
  facultyNumber: string
  department: string
}

export async function registerFaculty({
  email,
  password,
  fullName,
  facultyNumber,
  department,
}: FacultyRegistration) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName.trim(),
        faculty_number: facultyNumber.trim(),
        department: department.trim(),
        role: "faculty",
      },
    },
  })

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error("Faculty account was not created.")
  }

  return data
}

export async function loginFaculty(
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

  if (error) {
    throw error
  }

  return data
}

export async function logoutFaculty() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}