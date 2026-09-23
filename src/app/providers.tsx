"use client";

import { AmbientBackground, CursorGlow } from "@/components/layout/AmbientBackground";
import { AppProvider } from "@/context/AppContext";
import { PageTransition } from "@/components/layout/PageTransition";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AmbientBackground />
      <CursorGlow />
      <div className="relative z-20">
        <PageTransition>{children}</PageTransition>
      </div>
    </AppProvider>
  );
}
