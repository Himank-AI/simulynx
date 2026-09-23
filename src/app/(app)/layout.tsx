import { AppShell } from "@/components/layout/AppShell";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
