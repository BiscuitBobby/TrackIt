import type { Metadata } from "next"
import FaceRecognitionClient from "./FaceRecognitionClient" // Import the new client component

export const metadata: Metadata = {
  title: "Face Recognition App",
  description: "An application for facial recognition using face-api.js",
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-50">
      <FaceRecognitionClient /> {/* Render the client component */}
    </main>
  )
}
