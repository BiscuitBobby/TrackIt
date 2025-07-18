"use client"

import type React from "react"

import { SearchInput } from "@/components/ui/search-input"
import { IdCard } from "@/components/ui/id-card"
import BottomNavigation from "@/components/bottom-navigation"
import { useFaceData } from "@/app/context/FaceDataContext"
import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button" // Added import for Button
import { ChevronLeft } from "lucide-react" // Added import for ChevronLeft
import { useRouter } from "next/navigation" // Added import for useRouter

export default function GroupDetailPage() {
  const { groupName } = useParams<{ groupName: string }>()
  const router = useRouter() // Initialize useRouter
  const { labeledDescriptors, dataLoading, dataMessage } = useFaceData()
  const [searchTerm, setSearchTerm] = useState("")

  const allIdsInGroup = useMemo(() => {
    if (!labeledDescriptors) return []
    const idsSet = new Set<string>()
    labeledDescriptors.forEach((face) => {
      if (face.group === groupName) {
        idsSet.add(face.label)
      }
    })
    return Array.from(idsSet).sort()
  }, [labeledDescriptors, groupName])

  const filteredIds = useMemo(() => {
    if (!searchTerm) {
      return allIdsInGroup
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allIdsInGroup.filter((id) => id.toLowerCase().includes(lowerCaseSearchTerm))
  }, [allIdsInGroup, searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex flex-col items-start justify-center h-24 px-4 border-b bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">{decodeURIComponent(groupName)}</h1>
        </div>
        <SearchInput value={searchTerm} onChange={handleSearchChange} placeholder="Search for ID" />
      </header>
      <main className="flex-1 p-4 space-y-4">
        <h2 className="text-xl font-bold">IDs</h2>
        {dataLoading ? (
          <p className="text-center text-blue-500">{dataMessage}</p>
        ) : filteredIds.length === 0 && allIdsInGroup.length > 0 ? (
          <p className="text-center text-gray-500">No IDs found matching "{searchTerm}" in this group.</p>
        ) : filteredIds.length === 0 && allIdsInGroup.length === 0 ? (
          <p className="text-center text-gray-500">
            No IDs found in this group. Add faces to this group from the admin page.
          </p>
        ) : (
          <div className="grid gap-3">
            {filteredIds.map((id) => (
              <IdCard key={id} id={id} />
            ))}
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  )
}
