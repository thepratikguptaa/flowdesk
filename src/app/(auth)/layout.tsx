import type { ReactNode } from "react";

import { BrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: brand panel (hidden on small screens) */}
      <aside className="relative hidden items-center justify-center bg-muted px-10 lg:flex">
        <BrandPanel />
      </aside>

      {/* Right: form area */}
      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
