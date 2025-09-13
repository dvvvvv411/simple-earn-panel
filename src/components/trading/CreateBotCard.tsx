import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Bot } from "lucide-react";
import { CreateBotDialog } from "./CreateBotDialog";

interface CreateBotCardProps {
  userBalance: number;
  onBotCreated: () => void;
}

export function CreateBotCard({ userBalance, onBotCreated }: CreateBotCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Card 
        className="relative overflow-hidden border-2 border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 transition-all duration-300 cursor-pointer hover:border-primary/50 group"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] p-6 space-y-4">
          <div className="relative">
            {/* Background Circle */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              </div>
            </div>
            
            {/* Bot Icon Overlay */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              Neuen Trading-Bot erstellen
            </h3>
            <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">
              Starten Sie einen KI-gestützten Trading-Bot für automatisierte Krypto-Trades
            </p>
          </div>
          
          {/* Subtle animated elements */}
          <div className="flex items-center gap-2 opacity-50 group-hover:opacity-70 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </CardContent>
      </Card>

      <CreateBotDialog 
        userBalance={userBalance} 
        onBotCreated={() => {
          onBotCreated();
          setIsDialogOpen(false);
        }}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}