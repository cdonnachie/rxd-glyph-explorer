"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { GlyphUI } from "@/lib/services/glyph-service"
import { Calendar, Hash, Layers, X, Tag, Mail, Globe, MapPin } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface UserDetailProps {
  user: GlyphUI
  onClose: () => void
}

export function UserDetail({ user, onClose }: UserDetailProps) {
  const imageSrc = user.image || user.imageUrl || "/radiant-logo.png?height=400&width=400"
  const embedType = user.embedType?.includes("image")
    ? "image"
    : user.embedType?.includes("text")
      ? "text"
      : user.embedType?.includes("audio")
        ? "audio"
        : "unknown"

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              User Details
              {user.spent && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Spent
                </Badge>
              )}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="flex flex-wrap items-center">
            <span className="mr-1">User ID:</span>
            <Link
              href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_TX_URL}${user.ref}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline truncate max-w-[180px] sm:max-w-full"
              title={user.ref}
            >
              {user.ref}
            </Link>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted">
            <Image
              src={embedType === "image" && imageSrc ? imageSrc : "/radiant-logo.png?height=100&width=100"}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">Joined: {user.createdAt}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">About</h4>
          <p className="text-sm text-muted-foreground">{user.description}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Joined:</span>
            <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>

          {user.transactionHash && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Transaction:</span>
              <Link
                href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_TX_URL}${user.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-medium truncate max-w-[200px] sm:max-w-[400px] inline-block overflow-hidden text-ellipsis whitespace-nowrap"
                title={user.transactionHash}
              >
                {user.transactionHash}
              </Link>
            </div>
          )}

          {user.blockNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Block:</span>
              <Link
                href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_BLOCK_URL}${user.blockNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline font-medium"
              >
                {user.blockNumber}
              </Link>
            </div>
          )}
        </div>

        {user.attributes && user.attributes.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Profile Information</h4>
              <div className="space-y-2">
                {user.attributes.map((attr, index) => {
                  let icon = <Tag className="h-4 w-4 text-muted-foreground" />

                  if (attr.trait_type.toLowerCase() === "email") {
                    icon = <Mail className="h-4 w-4 text-muted-foreground" />
                  } else if (attr.trait_type.toLowerCase() === "website") {
                    icon = <Globe className="h-4 w-4 text-muted-foreground" />
                  } else if (attr.trait_type.toLowerCase() === "location") {
                    icon = <MapPin className="h-4 w-4 text-muted-foreground" />
                  }

                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {icon}
                      <span className="text-muted-foreground">{attr.trait_type}:</span>
                      <span className="font-medium">{attr.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
