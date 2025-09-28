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
        className={cn("h-screen w-full rounded-none flex flex-col", className)}
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
      </SheetHeader>
    );
  }

  return (
    <DialogHeader className={className}>
      {children}
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