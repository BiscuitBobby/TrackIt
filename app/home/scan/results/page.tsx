"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, ScanLine } from "lucide-react"
import BottomNavigation from "@/components/bottom-navigation"
import Image from "next/image" // Import Image component

// Define the interface for a single match result
interface MatchResult {
  label: string
  distance: number
  group?: string
  fullName?: string // Add fullName property
}

export default function ScanResultsPage() {
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedResults = localStorage.getItem("scanMatchResults")
      if (storedResults) {
        setMatchResults(JSON.parse(storedResults))
      }
    }
  }, [])

  const handleScanNewID = () => {
    router.push("/home/scan")
  }

  const handleRowClick = (id: string, group?: string, fullName?: string) => {
    const queryParams = new URLSearchParams()
    if (group) queryParams.append("group", group)
    if (fullName) queryParams.append("fullName", fullName)
    router.push(`/profile/${encodeURIComponent(id)}?${queryParams.toString()}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-start h-16 border-b bg-white px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-lg font-semibold ml-2">Scan Results</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
        <Card className="w-full max-w-md p-4">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-xl">Match Results</CardTitle>
            <CardDescription>Detected ID's matched against known data.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {matchResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchResults.map((result, index) => (
                    <TableRow
                      key={index}
                      onClick={() => handleRowClick(result.label, result.group, result.fullName)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <TableCell>
                        <Image
                          src="/placeholder.svg?height=40&width=40"
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{result.label}</TableCell>
                      <TableCell>{result.fullName || "N/A"}</TableCell>
                      <TableCell>{result.group || "N/A"}</TableCell>
                      <TableCell>{result.distance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500">No faces detected or no matches found.</p>
            )}
          </CardContent>
        </Card>
        <Button
          onClick={handleScanNewID}
          className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white text-lg h-12 rounded-xl flex items-center justify-center space-x-2"
        >
          <ScanLine className="h-6 w-6" />
          <span>Scan New ID</span>
        </Button>
      </main>
      <BottomNavigation />
    </div>
  )
}
