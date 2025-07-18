import type { Metadata } from "next"
import { cookies } from "next/headers" // Import cookies
import { redirect } from "next/navigation" // Import redirect
import FaceRecognitionClient from "./FaceRecognitionClient"
import { Button } from "@/components/ui/button" // Import Button
import { logout } from "@/app/actions/auth" // Import logout action

export const metadata: Metadata = {
  title: "Face Recognition App",
  description: "An application for facial recognition using face-api.js",
}

export default function HomePage() {
  const isAuthenticated = cookies().get("auth_session")?.value === "true"

  if (!isAuthenticated) {
    redirect("/") // Redirect to login if not authenticated
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50">
      <div className="absolute top-4 right-4">
        <form action={logout}>
          {" "}
          {/* Logout form */}
          <Button type="submit" variant="outline">
            Logout
          </Button>
        </form>
      </div>
      <FaceRecognitionClient />
    </main>
  )
}
