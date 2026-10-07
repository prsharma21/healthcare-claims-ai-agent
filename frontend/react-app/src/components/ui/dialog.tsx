import type { ComponentProps } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({
  className,
  children,
  hideClose = false,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/50" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-card p-5 shadow-lg focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 pr-6", className)} {...props} />;
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-base font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger };
