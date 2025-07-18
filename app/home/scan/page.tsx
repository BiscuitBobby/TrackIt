import type { Metadata } from "next"
import CameraScannerClient from "./CameraScannerClient" // Import the new client component

export const metadata: Metadata = {
  title: "Scan User ID",
  description: "Capture a photo and scan for user ID.",
}

export default function ScanPage() {
  return <CameraScannerClient /> // Render the client component
}
