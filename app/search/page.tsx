"use client"

import type React from "react"

import { SearchInput } from "@/components/ui/search-input"
import { GroupCard } from "@/components/ui/group-card"
import BottomNavigation from "@/components/bottom-navigation"
import { useFaceData } from "@/app/context/FaceDataContext"
import { useState, useMemo } from "react"

export default function SearchPage() {
  const { labeledDescriptors, dataLoading, dataMessage } = useFaceData()
  const [searchTerm, setSearchTerm] = useState("")

  const allGroups = useMemo(() => {
    if (!labeledDescriptors) return []
    const groupsSet = new Set<string>()
    labeledDescriptors.forEach((face) => {
      if (face.group) {
        groupsSet.add(face.group)
      }
    })
    return Array.from(groupsSet).sort()
  }, [labeledDescriptors])

  const filteredGroups = useMemo(() => {
    if (!searchTerm) {
      return allGroups
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allGroups.filter((groupName) => groupName.toLowerCase().includes(lowerCaseSearchTerm))
  }, [allGroups, searchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex flex-col items-start justify-center h-24 px-4 border-b bg-white">
        <h1 className="text-2xl font-bold mb-2">Search for ID</h1>
        <SearchInput value={searchTerm} onChange={handleSearchChange} placeholder="Search for group" />
      </header>
      <main className="flex-1 p-4 space-y-4">
        <h2 className="text-xl font-bold">Groups</h2>
        {dataLoading ? (
          <p className="text-center text-blue-500">{dataMessage}</p>
        ) : filteredGroups.length === 0 && allGroups.length > 0 ? (
          <p className="text-center text-gray-500">No groups found matching "{searchTerm}".</p>
        ) : filteredGroups.length === 0 && allGroups.length === 0 ? (
          <p className="text-center text-gray-500">No groups found. Add faces with groups from the admin page.</p>
        ) : (
          <div className="grid gap-3">
            {filteredGroups.map((groupName) => (
              <GroupCard key={groupName} name={groupName} href={`/search/${groupName}`} />
            ))}
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  )
}
