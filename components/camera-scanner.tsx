"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Camera, ScanSearch } from "lucide-react"
import BottomNavigation from "@/components/bottom-navigation"
import type * as faceapi from "@vladmandic/face-api"
import { useFaceData } from "@/app/context/FaceDataContext" // Import the context hook
import { useRouter } from "next/navigation"

// CDN for face-api.js models
const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

// Define the interface for a single match result
interface MatchResult {
  label: string
  distance: number
  group?: string // Add group property
  fullName?: string // Add fullName property
}

// Define the interface for a history entry
interface ScanHistoryEntry {
  timestamp: number // Unix timestamp
  results: MatchResult[]
}

export default function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null) // Use ref for MediaStream

  // Use data from context instead of local state
  const { labeledDescriptors, dataLoading, dataMessage } = useFaceData()

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loading, setLoading] = useState(false) // Local loading for image processing/saving
  const [message, setMessage] = useState("Loading models...") // Local message for image processing/saving
  const [capturedImageSrc, setCapturedImageSrc] = useState<string | null>(null)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]) // Keep for local state if needed
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  // Use a ref to store the dynamically imported faceapi module
  const faceapiRef = useRef<typeof faceapi | null>(null)

  const router = useRouter()

  // Load models on component mount (only models, data is from context)
  useEffect(() => {
    const loadModels = async () => {
      if (typeof window === "undefined") return // Ensure this runs only on the client

      setLoading(true)
      setMessage("Loading models...")
      try {
        const importedFaceApi = await import("@vladmandic/face-api")
        faceapiRef.current = importedFaceApi

        await importedFaceApi.nets.tinyFaceDetector.load(MODEL_URL)
        await importedFaceApi.nets.faceLandmark68Net.load(MODEL_URL)
        await importedFaceApi.nets.faceRecognitionNet.load(MODEL_URL)
        setModelsLoaded(true)
        setMessage("Models loaded successfully! Ready to scan.")
      } catch (error) {
        console.error("Error loading models:", error)
        setMessage("Failed to load models. Please check console for details.")
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [])

  // Start camera stream
  useEffect(() => {
    const startCamera = async () => {
      // Only start if models are loaded AND no stream is active
      if (!modelsLoaded || mediaStreamRef.current) return

      setLoading(true)
      setMessage("Starting camera...")
      try {
        // Try to get the environment (back) camera first
        let mediaStream: MediaStream
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          })
          setMessage("Back camera started. Capture a photo to scan.")
        } catch (envError) {
          console.warn("Failed to get environment camera, trying user camera:", envError)
          // Fallback to user (front) camera if environment camera fails
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "user" },
            })
            setMessage("Front camera started. Capture a photo to scan.")
          } catch (userError) {
            console.warn("Failed to get user camera, trying any available camera:", userError)
            // Fallback to any available camera if user camera fails
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setMessage("Any camera started. Capture a photo to scan.")
          }
        }

        mediaStreamRef.current = mediaStream // Store stream in ref
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          // Set display size once video metadata is loaded
          videoRef.current.onloadedmetadata = () => {
            setDisplaySize({
              width: videoRef.current!.videoWidth,
              height: videoRef.current!.videoHeight,
            })
          }
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
        setMessage("Failed to access camera. Please ensure permissions are granted and no other app is using it.")
      } finally {
        setLoading(false)
      }
    }

    startCamera()

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
    }
  }, [modelsLoaded])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [])

  const processImageForMatch = useCallback(
    async (imageElement: HTMLImageElement) => {
      const currentFaceApi = faceapiRef.current
      if (!modelsLoaded || !currentFaceApi) {
        setMessage("Models not loaded yet or face-api not initialized.")
        return null
      }
      if (labeledDescriptors.length === 0) {
        setMessage("No known faces loaded. Please add data from admin page first.")
        return null
      }

      setLoading(true)
      setMessage("Processing image for match...")
      clearCanvas()

      const canvas = canvasRef.current
      if (!canvas) {
        setMessage("Canvas not found.")
        setLoading(false)
        return null
      }

      canvas.width = imageElement.width
      canvas.height = imageElement.height

      currentFaceApi.matchDimensions(canvas, displaySize)

      await new Promise((resolve) => setTimeout(resolve, 50))

      try {
        const detections = await currentFaceApi
          .detectAllFaces(imageElement, new currentFaceApi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()

        const resizedDetections = currentFaceApi.resizeResults(detections, displaySize)
        const ctx = canvas.getContext("2d")
        if (ctx) {
          currentFaceApi.draw.drawDetections(canvas, resizedDetections)
          currentFaceApi.draw.drawFaceLandmarks(canvas, resizedDetections)
        }

        if (detections.length > 0) {
          const faceApiLabeledDescriptors = labeledDescriptors.map(
            (ld) => new currentFaceApi.LabeledFaceDescriptors(ld.label, ld.descriptors),
          )
          const faceMatcher = new currentFaceApi.FaceMatcher(faceApiLabeledDescriptors, 0.45)
          const results = detections.map((d) => faceMatcher.findBestMatch(d.descriptor))

          const newMatchResults: MatchResult[] = results.map((match) => {
            // Find the corresponding labeledDescriptor to get the group and fullName
            const matchedFaceData = labeledDescriptors.find((ld) => ld.label === match.label)
            return {
              label: match.label,
              distance: Number.parseFloat(match.distance.toFixed(2)),
              group: matchedFaceData?.group, // Include the group
              fullName: matchedFaceData?.fullName, // Include the fullName
            }
          })
          setMatchResults(newMatchResults)

          if (typeof window !== "undefined") {
            const currentHistoryString = localStorage.getItem("scanHistory")
            const currentHistory: ScanHistoryEntry[] = currentHistoryString ? JSON.parse(currentHistoryString) : []
            const newHistoryEntry: ScanHistoryEntry = {
              timestamp: Date.now(),
              results: newMatchResults,
            }
            currentHistory.unshift(newHistoryEntry)
            localStorage.setItem("scanHistory", JSON.stringify(currentHistory))
          }

          setMessage(`Matching complete. Found ${newMatchResults.length} match(es). Redirecting to results...`)
          localStorage.setItem("scanMatchResults", JSON.stringify(newMatchResults))
          router.push("/home/scan/results")
        } else {
          setMessage("No faces detected in the captured image.")
          setMatchResults([])
        }
        return detections
      } catch (error) {
        console.error("Error during face detection:", error)
        setMessage("Error processing image. Make sure it contains clear faces.")
        return null
      } finally {
        setLoading(false)
      }
    },
    [modelsLoaded, labeledDescriptors, clearCanvas, displaySize, router],
  )

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !faceapiRef.current) {
      setMessage("Video or canvas or face-api not ready.")
      return
    }

    setLoading(true)
    setMessage("Capturing photo...")
    setMatchResults([])

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      setMessage("Canvas context not available.")
      setLoading(false)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageDataUrl = canvas.toDataURL("image/jpeg")
    setCapturedImageSrc(imageDataUrl)

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const tempImg = new Image()
        tempImg.crossOrigin = "anonymous"
        tempImg.onload = () => resolve(tempImg)
        tempImg.onerror = (err) => reject(err)
        tempImg.src = imageDataUrl
      })

      await processImageForMatch(img)
    } catch (error) {
      console.error("Error loading or processing captured image:", error)
      setMessage("Failed to load or process captured image.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-center h-16 border-b bg-white">
        <h1 className="text-lg font-semibold">Scan User ID</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-16 space-y-6">
        <Card className="w-full max-w-md p-4 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-xl">Live Camera Feed</CardTitle>
            <CardDescription>Make sure the face is clearly visible on the ID</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ display: mediaStreamRef.current ? "block" : "none" }}
              />
              {!mediaStreamRef.current && (
                <div className="absolute text-white text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p>{loading || dataLoading ? message || dataMessage : "Waiting for camera..."}</p>
                </div>
              )}
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-contain"></canvas>
            </div>

            <Button
              onClick={handleCapturePhoto}
              disabled={
                !mediaStreamRef.current || loading || dataLoading || !modelsLoaded || labeledDescriptors.length === 0
              }
              className="w-full h-12 rounded-lg bg-black text-white flex items-center justify-center gap-2 text-base font-semibold"
            >
              <ScanSearch className="w-5 h-5" />
              {loading ? "Scanning..." : "Capture & Scan"}
            </Button>

            <Separator />

            <div className="grid gap-2">
              <p className="text-sm text-gray-500">
                Known ID data is loaded automatically from the cloud storage.
                <br />
                Currently loaded: {labeledDescriptors.length} ID's.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNavigation />
    </div>
  )
}
