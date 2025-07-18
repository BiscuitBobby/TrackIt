"use client"
import { useActionState } from "react" // Import useActionState
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { login } from "@/app/actions/auth" // Import the login server action

export default function LoginPage() {
  const [state, formAction] = useActionState(login, { message: "" }) // Use useActionState
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter admin credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            {" "}
            {/* Use formAction */}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                name="username" // Add name attribute
                placeholder="admin"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password" // Add name attribute
                placeholder="password"
                required
              />
            </div>
            {state?.message && <p className="text-sm text-red-500 text-center">{state.message}</p>}{" "}
            {/* Display message from state */}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => router.push("/home")}>
            Continue to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
