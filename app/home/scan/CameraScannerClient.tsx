"use client"

import dynamic from "next/dynamic"

const CameraScanner = dynamic(() => import("@/components/camera-scanner"), {
  ssr: false,
  loading: () => <p>Loading Camera...</p>,
})

export default function CameraScannerClient() {
  return <CameraScanner />
}
