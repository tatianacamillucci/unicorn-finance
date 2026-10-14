"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { NAV_GROUPS, NAV_ITEMS, isNavActive } from "@/lib/nav-items";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

/** Barra in basso su mobile: 4 voci + "Altro". Nascosta da lg in su (c'e' la Sidebar). */
export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Chiude il menu "Altro" quando cambia pagina.
  React.useEffect(() => setOpen(false), [pathname]);

  const primary = NAV_ITEMS.filter((i) => i.primary);
  const secondary = NAV_ITEMS.filter((i) => !i.primary);
  const altroActive = secondary.some((i) => isNavActive(i.href, pathname));

  return (
    <div className="lg:hidden">
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="rounded-t-2xl border-t bg-background p-4 pb-24"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Altro</p>
              <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {NAV_GROUPS.map((g) => {
                const items = secondary.filter((i) => i.group === g);
                if (items.length === 0) return null;
                return (
                  <div key={g} className="mb-2">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {g}
                    </p>
                    <ul className="grid grid-cols-2 gap-1">
                      {items.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                          <Link
                            href={href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                              isNavActive(href, pathname) ? "bg-accent" : "text-muted-foreground",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 border-t pt-2">
              <ThemeToggle withLabel />
            </div>
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-[60] border-t bg-background">
        <ul className="mx-auto flex max-w-md items-stretch justify-between">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(href, pathname);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-xs font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={cn(
                "flex w-full flex-col items-center gap-1 py-3 text-xs font-medium",
                altroActive || open ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal size={22} />
              Altro
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
