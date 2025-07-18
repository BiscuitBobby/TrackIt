import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./ClientLayout"
import { FaceDataProvider } from "@/app/context/FaceDataContext" // Import the provider

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <FaceDataProvider>
      {" "}
      {/* Wrap with FaceDataProvider */}
      <ClientLayout>{children}</ClientLayout>
    </FaceDataProvider>
  )
}
