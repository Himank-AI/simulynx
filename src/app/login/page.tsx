"use client";

import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/layout/AppShell";
import { Disclaimer } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md">
        <Wordmark />
        <h1 className="mt-10 font-display text-4xl">Welcome back, Alex.</h1>
        <p className="mt-2 text-muted">Workforce decision intelligence for Northstar Labs.</p>
        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard");
          }}
        >
          <label className="block text-sm">
            Email
            <input
              defaultValue="alex@northstar.labs"
              className="glass mt-1 h-12 w-full rounded-2xl px-4 outline-none"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              type="password"
              defaultValue="••••••••"
              className="glass mt-1 h-12 w-full rounded-2xl px-4 outline-none"
            />
          </label>
          <button
            type="submit"
            className="btn-primary mt-2 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-medium"
          >
            Continue
          </button>
        </form>
        <Disclaimer className="mt-8" />
      </div>
    </div>
  );
}
