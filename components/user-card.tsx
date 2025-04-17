"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GlyphUI } from "@/lib/services/glyph-service"
import Image from "next/image"
import { useQRCode } from "next-qrcode"

interface UserCardProps {
  user: GlyphUI
  onClick: () => void
}

export function UserCard({ user, onClick }: UserCardProps) {
  const { Canvas } = useQRCode()
  const imageSrc = user.image || user.imageUrl || "/radiant-logo.png?height=400&width=400"
  const embedType = user.embedType?.includes("image")
    ? "image"
    : user.embedType?.includes("text")
      ? "text"
      : user.embedType?.includes("audio")
        ? "audio"
        : "unknown"

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${user.spent ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      <div className="relative aspect-square bg-muted">
        {user.spent && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
            <Badge variant="secondary" className="bg-black/70 text-white">
              Spent
            </Badge>
          </div>
        )}
        {embedType === "image" && (
          <Image src={imageSrc || "/radiant-logo.png"} alt={user.name} fill className="object-scale-down" />
        )}
        {embedType === "text" && (
          <div className="flex items-center justify-center h-full">
            <textarea 
              className="text-md overflow-auto p-2 text-center w-full h-full resize-none" 
              defaultValue={user.image 
                ? Buffer.from(user.image.replace(/^data:text\/plain;base64,/, ""), "base64").toString("utf-8") 
                : ""
              }
              readOnly
            />
          </div>
        )}
        {embedType === "audio" && (
          <div className="flex items-center justify-center h-full">
            <div className="text-md flex items-center justify-center w-full">
              <audio controls className="w-3/4">
                <source src={user.image} type="audio/ogg" />
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{user.name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          Joined: {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-sm text-muted-foreground truncate">ID: {user.ref.substring(0, 10)}...</p>
      </CardFooter>
    </Card>
  )
}
