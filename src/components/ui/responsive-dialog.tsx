import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

interface ResponsiveDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogTitleProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const ResponsiveDialog = ({ open, onOpenChange, children, trigger }: ResponsiveDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        {children}
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {children}
    </Dialog>
  );
};

const ResponsiveDialogContent = ({ className, children }: ResponsiveDialogContentProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetContent 
        side="bottom" 
        className={cn("h-[95vh] rounded-t-xl", className)}
      >
        {children}
      </SheetContent>
    );
  }

  return (
    <DialogContent className={className}>
      {children}
    </DialogContent>
  );
};

const ResponsiveDialogHeader = ({ className, children }: ResponsiveDialogHeaderProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetHeader className={cn("relative", className)}>
        {children}
        <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
      </SheetHeader>
    );
  }

  return (
    <DialogHeader className={className}>
      {children}
      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
    </DialogHeader>
  );
};

const ResponsiveDialogTitle = ({ className, style, children }: ResponsiveDialogTitleProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetTitle className={className} style={style}>{children}</SheetTitle>;
  }

  return <DialogTitle className={className} style={style}>{children}</DialogTitle>;
};

const ResponsiveDialogTrigger = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetTrigger asChild>{children}</SheetTrigger>;
  }

  return <DialogTrigger asChild>{children}</DialogTrigger>;
};

const ResponsiveDialogClose = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetClose asChild>{children}</SheetClose>;
  }

  return <DialogClose asChild>{children}</DialogClose>;
};

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
};