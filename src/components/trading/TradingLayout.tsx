import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TradingSidebar } from "./TradingSidebar";
import { TradingGuard } from "./TradingGuard";
import { BrandingProvider } from "@/contexts/BrandingContext";

export function TradingLayout() {
  return (
    <TradingGuard>
      <BrandingProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <TradingSidebar />
            
            <div className="flex-1 flex flex-col">
              <header className="h-16 flex items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="h-8 w-8" />
                  <div className="flex flex-col">
                    <h1 className="text-lg font-semibold text-foreground">Trading Dashboard</h1>
                    <p className="text-xs text-muted-foreground">Kryptowährungen & Portfolio-Management</p>
                  </div>
                </div>
              </header>

              <main className="flex-1 p-6 bg-muted/20">
                <div className="max-w-7xl mx-auto">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrandingProvider>
    </TradingGuard>
  );
}