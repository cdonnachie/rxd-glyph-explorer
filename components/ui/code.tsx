import type React from "react"
import { cn } from "@/lib/utils"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
}

export function Code({ className, children, ...props }: CodeProps) {
  return (
    <pre className={cn("rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm", className)} {...props}>
      <code>{children}</code>
    </pre>
  )
}
