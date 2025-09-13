import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TradingSidebar } from "./TradingSidebar";
import { TradingGuard } from "./TradingGuard";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { CoinMarketCapProvider } from "@/contexts/CoinMarketCapContext";

export function TradingLayout() {
  return (
    <TradingGuard>
      <BrandingProvider>
        <CoinMarketCapProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
              <TradingSidebar />
              
              <div className="flex-1 flex flex-col">
                <header className="h-20 flex items-center justify-between border-b border-border bg-background px-8">
                  <div className="flex items-center gap-6">
                    <SidebarTrigger className="h-8 w-8" />
                    <div className="flex flex-col">
                      <h1 className="text-2xl font-bold text-foreground">Trading Dashboard</h1>
                      <p className="text-sm text-muted-foreground">Professionelles Krypto-Portfolio Management</p>
                    </div>
                  </div>
                </header>

                <main className="flex-1 p-8 bg-background">
                  <div className="max-w-7xl mx-auto">
                    <Outlet />
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </CoinMarketCapProvider>
      </BrandingProvider>
    </TradingGuard>
  );
}