"use server"

// Local file configuration
const LOCAL_FILE_PATH = "./recognition_data.json"

interface StoredFaceData {
  label: string
  fullName: string
  group: string
  descriptors: number[][]
}

interface LabeledFaceWithGroup {
  label: string
  fullName: string
  group: string
  descriptors: Float32Array[]
}

export async function saveFaceData(data: LabeledFaceWithGroup[]): Promise<{ success: boolean; message: string }> {
  try {
    const serializableData: StoredFaceData[] = data.map((ld) => ({
      label: ld.label,
      fullName: ld.fullName,
      group: ld.group,
      descriptors: ld.descriptors.map((d) => Array.from(d)),
    }))

    const jsonString = JSON.stringify(serializableData, null, 2)

    const fs = await import('fs/promises')
    await fs.writeFile(LOCAL_FILE_PATH, jsonString, 'utf8')

    return { success: true, message: `Face data saved to local file successfully! ${LOCAL_FILE_PATH}` }
  } catch (error) {
    console.error("Error saving face data to local file:", error)
    return {
      success: false,
      message: `Failed to save face data to local file. Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function loadFaceData(): Promise<{
  success: boolean
  data: LabeledFaceWithGroup[] | null
  message: string
}> {
  try {
    const fs = await import('fs/promises')

    try {
      await fs.access(LOCAL_FILE_PATH)
    } catch (accessError) {
      return { success: true, data: [], message: "No face data file found. Starting with empty data." }
    }

    const jsonString = await fs.readFile(LOCAL_FILE_PATH, 'utf8')

    if (!jsonString.trim()) {
      return { success: true, data: [], message: "Face data file is empty. Starting with empty data." }
    }

    const parsedData: StoredFaceData[] = JSON.parse(jsonString)

    const loadedDescriptors: LabeledFaceWithGroup[] = parsedData.map((data) => ({
      label: data.label,
      fullName: data.fullName || "",
      group: data.group,
      descriptors: data.descriptors.map((d) => new Float32Array(d)),
    }))

    return {
      success: true,
      data: loadedDescriptors,
      message: `Successfully loaded ${loadedDescriptors.length} known faces from local file.`,
    }
  } catch (error) {
    console.error("Error loading face data from local file:", error)
    return {
      success: false,
      data: null,
      message: `Failed to load face data from local file. Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
