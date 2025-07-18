"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { loadFaceData } from "@/app/actions/face-data" // Import the server action

// Define a new type for the in-memory labeled descriptors that includes the group
interface LabeledFaceWithGroup {
  label: string
  group: string
  descriptors: Float32Array[]
}

interface FaceDataContextType {
  labeledDescriptors: LabeledFaceWithGroup[]
  dataLoading: boolean
  dataMessage: string
  setLabeledDescriptors: React.Dispatch<React.SetStateAction<LabeledFaceWithGroup[]>>
  // Add a function to trigger a reload if needed (e.g., after admin saves new data)
  reloadData: () => Promise<void>
}

const FaceDataContext = createContext<FaceDataContextType | undefined>(undefined)

export function FaceDataProvider({ children }: { children: React.ReactNode }) {
  const [labeledDescriptors, setLabeledDescriptors] = useState<LabeledFaceWithGroup[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataMessage, setDataMessage] = useState("Initializing data...")

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    setDataMessage("Loading saved face data from cloud...")
    try {
      const { success, data, message: loadMsg } = await loadFaceData()
      if (success && data) {
        setLabeledDescriptors(data)
        setDataMessage(loadMsg)
      } else {
        setLabeledDescriptors([]) // Ensure it's an empty array if no data or failed
        setDataMessage(loadMsg || "No saved data found or failed to load.")
      }
    } catch (error) {
      console.error("Error loading face data in context:", error)
      setDataMessage("Failed to load face data. Please check console.")
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const reloadData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return (
    <FaceDataContext.Provider
      value={{ labeledDescriptors, dataLoading, dataMessage, setLabeledDescriptors, reloadData }}
    >
      {children}
    </FaceDataContext.Provider>
  )
}

export function useFaceData() {
  const context = useContext(FaceDataContext)
  if (context === undefined) {
    throw new Error("useFaceData must be used within a FaceDataProvider")
  }
  return context
}
