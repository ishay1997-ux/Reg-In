import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-teal-600 data-[state=unchecked]:bg-slate-200 focus-visible:ring-ring/50 inline-flex h-5 w-9 shrink-0 items-center rounded-full shadow-xs transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
          "data-[state=unchecked]:translate-x-0.5 data-[state=checked]:translate-x-[18px]",
          "rtl:data-[state=unchecked]:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-[18px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
