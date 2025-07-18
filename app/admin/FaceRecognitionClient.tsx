"use client"

import dynamic from "next/dynamic"

const FaceRecognitionComponent = dynamic(() => import("@/components/face-recognition"), {
  ssr: false,
  loading: () => <p>Loading Face Recognition...</p>,
})

export default function FaceRecognitionClient() {
  return <FaceRecognitionComponent />
}
