import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, User } from "lucide-react";

interface Consultant {
  id: string;
  name: string;
}

interface ConsultantAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultants: Consultant[];
  currentConsultantId?: string | null;
  onAssign: (consultantId: string) => void;
}

export function ConsultantAssignDialog({
  open,
  onOpenChange,
  consultants,
  currentConsultantId,
  onAssign
}: ConsultantAssignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Berater zuweisen</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {consultants.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Keine Berater verfügbar
            </p>
          ) : (
            consultants.map((consultant) => (
              <Button
                key={consultant.id}
                variant={consultant.id === currentConsultantId ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onAssign(consultant.id);
                  onOpenChange(false);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                {consultant.name}
                {consultant.id === currentConsultantId && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
