"use client"

import { Camera, ScanSearch } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BottomNavigation from "@/components/bottom-navigation"
import { useRouter } from "next/navigation"

export default function HomePageClient() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-center h-16 border-b bg-white">
        <h1 className="text-lg font-semibold">Home</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-16">
        <Card className="w-full max-w-sm aspect-square flex flex-col items-center justify-center p-6 shadow-md rounded-xl">
          <CardContent className="flex flex-col items-center justify-center gap-6 p-0">
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
            <Button
              className="w-full max-w-[200px] h-12 rounded-full bg-black text-white flex items-center justify-center gap-2 text-base font-semibold"
              onClick={() => router.push("/home/scan")} // Navigate to the new scan page
            >
              <ScanSearch className="w-5 h-5" />
              Scan User ID
            </Button>
          </CardContent>
        </Card>
      </main>
      <BottomNavigation />
    </div>
  )
}
