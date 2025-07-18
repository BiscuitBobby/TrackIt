"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password"

export async function login(prevState: { message: string }, formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Set a secure, httpOnly cookie for authentication
    cookies().set("auth_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })
    redirect("/admin")
  } else {
    return { message: "Invalid username or password." }
  }
}

export async function logout() {
  cookies().delete("auth_session")
  redirect("/")
}
