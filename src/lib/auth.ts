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
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
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

  return data
}

export async function loginFaculty(
  email: string,
  password: string,
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
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