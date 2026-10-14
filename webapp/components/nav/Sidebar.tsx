"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, NAV_ITEMS, isNavActive } from "@/lib/nav-items";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

/** Sidebar fissa, solo da lg in su. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-background p-4 lg:flex">
      <p className="mb-6 px-3 text-lg font-bold tracking-tight">Conti</p>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_GROUPS.map((g) => {
          const items = NAV_ITEMS.filter((i) => i.group === g);
          return (
            <div key={g} className="flex flex-col gap-0.5">
              {g !== "Impostazioni" && (
                <p className="mt-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:mt-0">
                  {g}
                </p>
              )}
              {items.map(({ href, label, icon: Icon }) => {
                const active = isNavActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="border-t pt-3">
        <ThemeToggle withLabel />
      </div>
    </aside>
  );
}
