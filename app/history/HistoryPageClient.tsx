"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import BottomNavigation from "@/components/bottom-navigation"

// Define the interface for a single match result
interface MatchResult {
  label: string
  distance: number
}

// Define the interface for a history entry
interface ScanHistoryEntry {
  timestamp: number // Unix timestamp
  results: MatchResult[]
}

export default function HistoryPageClient() {
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedHistoryString = localStorage.getItem("scanHistory")
      if (storedHistoryString) {
        try {
          const parsedHistory = JSON.parse(storedHistoryString)
          // Validate and clean the data
          const validHistory = parsedHistory.filter((entry: any) => 
            entry && 
            typeof entry.timestamp === 'number' && 
            Array.isArray(entry.results)
          )
          setScanHistory(validHistory)
        } catch (error) {
          console.error("Error parsing scan history:", error)
          // Clear invalid data
          localStorage.removeItem("scanHistory")
        }
      }
    }
  }, [])

  const handleClearHistory = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("scanHistory")
      setScanHistory([])
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString() // Formats to local date and time string
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-center h-16 border-b bg-white">
        <h1 className="text-lg font-semibold">Scan History</h1>
      </header>
      <main className="flex-1 p-4 space-y-4">
        {scanHistory.length === 0 ? (
          <Card className="w-full rounded-xl shadow-md">
            <CardContent className="flex items-center justify-center h-32 text-gray-500">
              No scan history available. Perform a scan on the Home page to see results here.
            </CardContent>
          </Card>
        ) : (
          <>
            <Button onClick={handleClearHistory} variant="outline" className="w-full mb-4 bg-transparent">
              Clear History
            </Button>
            <div className="space-y-4">
              {scanHistory.map((entry, index) => (
                <Card key={index} className="w-full rounded-xl shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Scan on {formatTimestamp(entry.timestamp)}</CardTitle>
                    <CardDescription>Detected ID'd and their matches.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {!entry.results || entry.results.length === 0 ? (
                      <p className="text-gray-500 text-sm">No faces detected in this scan.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Label</TableHead>
                              <TableHead>Distance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.results.map((result, resIndex) => (
                              <TableRow key={resIndex}>
                                <TableCell className="font-medium">{result.label}</TableCell>
                                <TableCell>{result.distance}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
      <BottomNavigation />
    </div>
  )
}
