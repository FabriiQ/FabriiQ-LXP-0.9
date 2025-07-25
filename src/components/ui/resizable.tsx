"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

import { cn } from "@/lib/utils";

// Simplified versions without forwardRef to avoid TypeScript issues
const ResizablePanelGroup = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PanelGroup>) => (
  <PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  >
    {children}
  </PanelGroup>
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

const ResizablePanel = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Panel>) => (
  <Panel
    className={cn("flex h-full w-full flex-col", className)}
    {...props}
  >
    {children}
  </Panel>
);
ResizablePanel.displayName = "ResizablePanel";

const ResizableHandle = ({
  className,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle>) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
      <GripVertical className="h-2.5 w-2.5" />
    </div>
  </PanelResizeHandle>
);
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
