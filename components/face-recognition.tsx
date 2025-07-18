"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import * as faceapi from "@vladmandic/face-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { saveFaceData } from "@/app/actions/face-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFaceData } from "@/app/context/FaceDataContext"

// CDN for face-api.js models
const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

// Define a new type for the in-memory labeled descriptors that includes the group and fullName
interface LabeledFaceWithGroup {
  label: string
  fullName: string // Added fullName property
  group: string
  descriptors: Float32Array[]
}

export default function FaceRecognitionComponent() {
  const { labeledDescriptors, dataLoading, dataMessage, setLabeledDescriptors, reloadData } = useFaceData()

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null)
  const [currentImageNameInput, setCurrentImageNameInput] = useState("") // This is for ID number
  const [fullNameInput, setFullNameInput] = useState("") // New state for Full Name
  const [detectedFacesForSave, setDetectedFacesForSave] = useState<faceapi.FullFaceDescription[] | null>(null)
  const [matchResults, setMatchResults] = useState<Array<{ label: string; distance: number }>>([])
  const [selectedGroup, setSelectedGroup] = useState<string>("amFOSS")

  const inputImageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadModels = async () => {
      setLoading(true)
      setMessage("Loading models...")
      try {
        await faceapi.nets.tinyFaceDetector.load(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.load(MODEL_URL)
        await faceapi.nets.faceRecognitionNet.load(MODEL_URL)
        setModelsLoaded(true)
        setMessage("Models loaded successfully!")
      } catch (error) {
        console.error("Error loading models:", error)
        setMessage("Failed to load models. Please check console for details.")
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [])

  const processImage = useCallback(
    async (imageElement: HTMLImageElement) => {
      if (!modelsLoaded) {
        setMessage("Models not loaded yet.")
        return null
      }

      setLoading(true)
      setMessage("Processing image...")
      clearCanvas()

      const canvas = canvasRef.current
      if (!canvas) {
        setMessage("Canvas not found.")
        setLoading(false)
        return null
      }

      canvas.width = imageElement.width
      canvas.height = imageElement.height

      const displaySize = { width: imageElement.width, height: imageElement.height }
      faceapi.matchDimensions(canvas, displaySize)

      let attempts = 0
      const maxAttempts = 30
      while (!faceapi.nets.tinyFaceDetector.isLoaded && attempts < maxAttempts) {
        console.warn("Waiting for TinyFaceDetector model to be truly loaded...")
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        setMessage("TinyFaceDetector model failed to load or initialize properly after multiple attempts.")
        console.error("TinyFaceDetector model is still not loaded after waiting.")
        setLoading(false)
        return null
      }

      await new Promise((resolve) => setTimeout(resolve, 50))

      try {
        const detections = await faceapi
          .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()

        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const ctx = canvas.getContext("2d")
        if (ctx) {
          faceapi.draw.drawDetections(canvas, resizedDetections)
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        }

        setMessage(`Detected ${detections.length} face(s).`)
        return detections
      } catch (error) {
        console.error("Error during face detection:", error)
        setMessage("Error processing image. Make sure it contains clear faces.")
        return null
      } finally {
        setLoading(false)
      }
    },
    [modelsLoaded, clearCanvas],
  )

  const loadAndDrawImage = useCallback(async (file: File) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imgElement = inputImageRef.current
        if (!imgElement) {
          reject(new Error("Image ref not available"))
          return
        }
        imgElement.src = e.target?.result as string
        imgElement.crossOrigin = "anonymous"

        imgElement.onload = () => {
          setCurrentImageSrc(imgElement.src)
          resolve(imgElement)
        }
        imgElement.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
  }, [])

  const handleImageUploadForSave = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setDetectedFacesForSave(null)
    setCurrentImageNameInput("")
    setFullNameInput("") // Clear full name input
    setMatchResults([])

    try {
      const imgElement = await loadAndDrawImage(file)
      const detections = await processImage(imgElement)
      if (detections && detections.length > 0) {
        setDetectedFacesForSave(detections)
        setMessage(`Detected ${detections.length} face(s). Enter details and save.`)
      } else {
        setMessage("No faces detected in the image.")
      }
    } catch (error) {
      console.error("Error loading image for save:", error)
      setMessage("Failed to load image.")
    }
  }

  const handleSaveFace = () => {
    if (!detectedFacesForSave || detectedFacesForSave.length === 0) {
      setMessage("No faces detected to save. Please upload an image first.")
      return
    }
    if (!currentImageNameInput.trim()) {
      setMessage("Please enter an ID number for the face.")
      return
    }
    if (!fullNameInput.trim()) {
      setMessage("Please enter a Full Name for the face.")
      return
    }
    if (!selectedGroup) {
      setMessage("Please select a group for the face.")
      return
    }

    const newDescriptors = detectedFacesForSave.map((d) => d.descriptor)
    const existingLabeledDescriptorIndex = labeledDescriptors.findIndex(
      (ld) => ld.label === currentImageNameInput.trim() && ld.group === selectedGroup,
    )

    if (existingLabeledDescriptorIndex !== -1) {
      const updatedDescriptors = [...labeledDescriptors]
      updatedDescriptors[existingLabeledDescriptorIndex].descriptors.push(...newDescriptors)
      // Update full name if it changed for an existing entry
      updatedDescriptors[existingLabeledDescriptorIndex].fullName = fullNameInput.trim()
      setLabeledDescriptors(updatedDescriptors)
      setMessage(
        `Added new descriptors for "${currentImageNameInput.trim()}" (${fullNameInput.trim()}) in group "${selectedGroup}".`,
      )
    } else {
      const newLabeledFace: LabeledFaceWithGroup = {
        label: currentImageNameInput.trim(),
        fullName: fullNameInput.trim(), // Include full name
        group: selectedGroup,
        descriptors: newDescriptors,
      }
      setLabeledDescriptors((prev) => [...prev, newLabeledFace])
      setMessage(
        `Saved face for "${currentImageNameInput.trim()}" (${fullNameInput.trim()}) in group "${selectedGroup}".`,
      )
    }

    setDetectedFacesForSave(null)
    setCurrentImageNameInput("")
    setFullNameInput("") // Clear full name input
    setCurrentImageSrc(null)
    clearCanvas()
  }

  const handleImageUploadForMatch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setMatchResults([])

    if (labeledDescriptors.length === 0) {
      setMessage("No known faces to match against. Please add some faces first or upload data.")
      return
    }

    try {
      const imgElement = await loadAndDrawImage(file)
      const detections = await processImage(imgElement)

      if (detections && detections.length > 0) {
        const faceApiLabeledDescriptors = labeledDescriptors.map(
          (ld) => new faceapi.LabeledFaceDescriptors(ld.label, ld.descriptors),
        )
        const faceMatcher = new faceapi.FaceMatcher(faceApiLabeledDescriptors, 0.6)
        const results = detections.map((d) => faceMatcher.findBestMatch(d.descriptor))

        const newMatchResults = results.map((match) => ({
          label: match.label,
          distance: Number.parseFloat(match.distance.toFixed(2)),
        }))
        setMatchResults(newMatchResults)
        setMessage(`Matching complete. Found ${newMatchResults.length} match(es).`)
      } else {
        setMessage("No faces detected in the image for matching.")
      }
    } catch (error) {
      console.error("Error loading image for match:", error)
      setMessage("Failed to load image for matching.")
    }
  }

  const handleSaveDataToCloud = async () => {
    if (labeledDescriptors.length === 0) {
      setMessage("No data to save to cloud.")
      return
    }
    setLoading(true)
    setMessage("Saving data to cloud...")
    const { success, message: saveMsg } = await saveFaceData(labeledDescriptors)
    setMessage(saveMsg)
    setLoading(false)
    reloadData()
  }

  const handleUploadData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage("Uploading data from local file...")

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string
        const parsedData: LabeledFaceWithGroup[] = JSON.parse(jsonString)

        const loadedDescriptors: LabeledFaceWithGroup[] = parsedData.map((data) => ({
          label: data.label,
          fullName: data.fullName || "", // Ensure fullName is present, default to empty string
          group: data.group,
          descriptors: data.descriptors.map((d) => new Float32Array(d)),
        }))

        setLabeledDescriptors(loadedDescriptors)
        setMessage(`Successfully loaded ${loadedDescriptors.length} known faces from local file.`)
      } catch (error) {
        console.error("Error parsing uploaded data:", error)
        setMessage("Failed to load data from local file. Invalid JSON file.")
      } finally {
        setLoading(false)
      }
    }
    reader.onerror = (err) => {
      console.error("Error reading file:", err)
      setMessage("Error reading file.")
      setLoading(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Face ID Recognition</CardTitle>
          <CardDescription>
            Upload ID card to extract face vectors, store them, and match new images against stored data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(loading || dataLoading) && <p className="text-center text-blue-500">Loading: {message || dataMessage}</p>}
          {!(loading || dataLoading) && (message || dataMessage) && (
            <p className="text-center text-sm text-gray-600">{message || dataMessage}</p>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Display Area */}
            <div className="flex flex-col items-center justify-center border rounded-lg p-4 bg-gray-100 min-h-[300px] relative">
              <img
                ref={inputImageRef}
                src={currentImageSrc || "/placeholder.svg?height=300&width=300"}
                alt="Uploaded for processing"
                className="max-w-full max-h-[400px] object-contain rounded-md"
                style={{ display: currentImageSrc ? "block" : "none" }}
                onLoad={(e) => {
                  const img = e.currentTarget
                  const canvas = canvasRef.current
                  if (canvas) {
                    canvas.width = img.naturalWidth
                    canvas.height = img.naturalHeight
                  }
                }}
              />
              {!currentImageSrc && <p className="absolute text-gray-500">Upload an image to see it here.</p>}
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-contain"></canvas>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Add New Face Section */}
              <Card className="p-4">
                <CardTitle className="text-lg mb-2">Add New Face</CardTitle>
                <CardDescription className="mb-4">
                  Upload an image, enter a name, and save the face vector.
                </CardDescription>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="image-upload-save">Upload Image</Label>
                    <Input
                      id="image-upload-save"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUploadForSave}
                      disabled={!modelsLoaded || loading || dataLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="face-name">ID number</Label>
                    <Input
                      id="face-name"
                      type="text"
                      placeholder="e.g., 12345"
                      value={currentImageNameInput}
                      onChange={(e) => setCurrentImageNameInput(e.target.value)}
                      disabled={!detectedFacesForSave || loading || dataLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="e.g., John Doe"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      disabled={!detectedFacesForSave || loading || dataLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="face-group">Group</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                      disabled={!detectedFacesForSave || loading || dataLoading}
                    >
                      <SelectTrigger id="face-group">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amFOSS">amFOSS</SelectItem>
                        <SelectItem value="bi0s">bi0s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSaveFace}
                    disabled={
                      !detectedFacesForSave ||
                      !currentImageNameInput.trim() ||
                      !fullNameInput.trim() || // Ensure full name is also entered
                      loading ||
                      dataLoading
                    }
                  >
                    Save Face
                  </Button>
                </div>
              </Card>

              {/* Match Faces Section */}
              <Card className="p-4">
                <CardTitle className="text-lg mb-2">Match Faces</CardTitle>
                <CardDescription className="mb-4">
                  Upload an image to find matches against stored faces.
                </CardDescription>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="image-upload-match">Upload Image for Matching</Label>
                    <Input
                      id="image-upload-match"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUploadForMatch}
                      disabled={!modelsLoaded || loading || dataLoading}
                    />
                  </div>
                  {matchResults.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Match Results:</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Label</TableHead>
                            <TableHead>Distance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matchResults.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell>{result.label}</TableCell>
                              <TableCell>{result.distance}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </Card>

              {/* Data Management */}
              <Card className="p-4">
                <CardTitle className="text-lg mb-2">Manage Data</CardTitle>
                <CardDescription className="mb-4">
                  Save your face recognition data to cloud or upload from a local file.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleSaveDataToCloud} disabled={loading || dataLoading} className="flex-1">
                    Save Data to Cloud
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="upload-data" className="sr-only">
                      Upload Data
                    </Label>
                    <Input
                      id="upload-data"
                      type="file"
                      accept=".json"
                      onChange={handleUploadData}
                      disabled={loading || dataLoading}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Stored Faces Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stored Faces ({labeledDescriptors.length})</CardTitle>
              <CardDescription>List of all faces currently stored in memory.</CardDescription>
            </CardHeader>
            <CardContent>
              {labeledDescriptors.length === 0 ? (
                <p className="text-center text-gray-500">No faces stored yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Number</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Descriptors Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labeledDescriptors.map((ld, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{ld.label}</TableCell>
                          <TableCell>{ld.fullName}</TableCell>
                          <TableCell>{ld.group}</TableCell>
                          <TableCell>{ld.descriptors.length}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
