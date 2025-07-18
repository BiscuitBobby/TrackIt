"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ScanLine, CreditCard, User, Users } from "lucide-react"
import Image from "next/image" // Import Image component
import BottomNavigation from "@/components/bottom-navigation" // Import BottomNavigation component

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const group = searchParams.get("group")
  const fullName = searchParams.get("fullName") // Get fullName from query params

  const handleScanNewID = () => {
    router.push("/home/scan")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-start h-16 border-b bg-white px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Profile Details</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start p-4 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/placeholder.svg?height=120&width=120"
            alt="Profile Placeholder"
            width={120}
            height={120}
            className="rounded-full border-2 border-gray-300"
          />
          <h2 className="mb-4 text-sm font-bold uppercase text-gray-700">MEMBER DETAILS</h2>
        </div>
        <Card className="w-full max-w-md p-4">
          <CardContent className="flex flex-col space-y-4 p-0">
            <div className="flex items-center">
              <CreditCard className="mr-3 h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-800">Roll Number:</span>
              <span className="ml-auto text-gray-600">{decodeURIComponent(id)}</span>
            </div>
            <div className="flex items-center">
              <User className="mr-3 h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-800">Full Name:</span>
              <span className="ml-auto text-gray-600">{fullName ? decodeURIComponent(fullName) : "N/A"}</span>
            </div>
            <div className="flex items-center">
              <Users className="mr-3 h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-800">Club:</span>
              <span className="ml-auto text-gray-600">{group ? decodeURIComponent(group) : "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleScanNewID}
          className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white text-lg h-12 rounded-xl flex items-center justify-center space-x-2"
        >
          <ScanLine className="mr-2 h-5 w-5" />
          Scan New ID
        </Button>
      </main>
      <BottomNavigation />
    </div>
  )
}
