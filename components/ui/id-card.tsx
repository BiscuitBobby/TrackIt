import { Card, CardContent } from "@/components/ui/card"

interface IdCardProps {
  id: string
}

export function IdCard({ id }: IdCardProps) {
  return (
    <Card className="w-full rounded-xl shadow-sm border border-black">
      <CardContent className="flex items-center justify-center p-4">
        <span className="text-base font-medium">{id}</span>
      </CardContent>
    </Card>
  )
}
