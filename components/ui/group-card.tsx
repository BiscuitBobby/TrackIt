import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image" // Import Image component

interface GroupCardProps {
  name: string
  href: string
}

export function GroupCard({ name, href }: GroupCardProps) {
  const logoSrc =
    name === "amFOSS"
      ? "/images/amfoss-logo.png"
      : name === "bi0s"
        ? "/images/bi0s-logo.png"
        : "/placeholder.svg?height=48&width=48" // Fallback placeholder

  return (
    <Link href={href} className="block">
      <Card className="w-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Image
              src={logoSrc || "/placeholder.svg"}
              alt={`${name} logo`}
              width={48}
              height={48}
              className="object-contain rounded-md"
            />
          </div>
          <span className="text-lg font-medium">{name}</span>
        </CardContent>
      </Card>
    </Link>
  )
}
