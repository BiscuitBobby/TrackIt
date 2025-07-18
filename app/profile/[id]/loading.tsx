"use client"

import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
      <p className="mt-4 text-gray-600">Loading profile...</p>
    </div>
  )
}
