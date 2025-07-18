"use client"

import type React from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
  value?: string // Add value prop
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void // Add onChange prop
}

export function SearchInput({ placeholder = "Search for ID", value, onChange, ...props }: SearchInputProps) {
  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-3 h-5 w-5 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus-visible:ring-offset-0 focus-visible:ring-transparent"
        value={value} // Pass value
        onChange={onChange} // Pass onChange
        {...props}
      />
      <SlidersHorizontal className="absolute right-3 h-5 w-5 text-gray-400 cursor-pointer" />
    </div>
  )
}
