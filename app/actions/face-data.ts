"use server"

// Define the FastAPI server base URL
const FASTAPI_BASE_URL = "https://fastapi.biscuitbobby.eu.org"

// Retry configuration
const MAX_RETRIES = 3 // Maximum number of retry attempts
const RETRY_INTERVAL_MS = 2000 // 2 seconds between retries

// Update the StoredFaceData interface to include 'group' and 'fullName'
interface StoredFaceData {
  label: string
  fullName: string // Added fullName property
  group: string
  descriptors: number[][]
}

// Define a new type for the in-memory labeled descriptors that includes the group and fullName
interface LabeledFaceWithGroup {
  label: string
  fullName: string // Added fullName property
  group: string
  descriptors: Float32Array[]
}

export async function saveFaceData(data: LabeledFaceWithGroup[]): Promise<{ success: boolean; message: string }> {
  try {
    const serializableData: StoredFaceData[] = data.map((ld) => ({
      label: ld.label,
      fullName: ld.fullName, // Include fullName here
      group: ld.group,
      descriptors: ld.descriptors.map((d) => Array.from(d)),
    }))

    const jsonString = JSON.stringify(serializableData)
    const blob = new Blob([jsonString], { type: "application/json" })

    const formData = new FormData()
    formData.append("file", blob, "face_recognition_data.json")

    const response = await fetch(`${FASTAPI_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload data: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    return { success: true, message: `Face data saved to FastAPI server successfully! ${result.filename}` }
  } catch (error) {
    console.error("Error saving face data to FastAPI server:", error)
    return {
      success: false,
      message: `Failed to save face data to FastAPI server. Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function loadFaceData(): Promise<{
  success: boolean
  data: LabeledFaceWithGroup[] | null
  message: string
}> {
  let attempts = 0
  let lastError: any = null

  while (attempts <= MAX_RETRIES) {
    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/download`, {
        method: "GET",
      })

      if (response.status === 404) {
        return { success: true, data: [], message: "No face data found on FastAPI server." }
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to download data: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const jsonString = await response.text()
      const parsedData: StoredFaceData[] = JSON.parse(jsonString)

      const loadedDescriptors: LabeledFaceWithGroup[] = parsedData.map((data) => ({
        label: data.label,
        fullName: data.fullName || "", // Ensure fullName is present, default to empty string
        group: data.group,
        descriptors: data.descriptors.map((d) => new Float32Array(d)),
      }))

      return {
        success: true,
        data: loadedDescriptors,
        message: `Successfully loaded ${loadedDescriptors.length} known faces from FastAPI server.`,
      }
    } catch (error) {
      lastError = error
      console.warn(`Attempt ${attempts + 1} failed to load face data:`, error)
      attempts++
      if (attempts <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS))
      }
    }
  }

  return {
    success: false,
    data: null,
    message: `Failed to load face data from FastAPI server after ${MAX_RETRIES} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  }
}
