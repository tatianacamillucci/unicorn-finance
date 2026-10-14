import {
  CalendarCheck,
  Users,
  FileText,
  Receipt,
  HandCoins,
  Landmark,
  Wallet,
  TrendingUp,
  Scale,
  Mail,
  Settings,
  CalendarClock,
  BarChart3,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "Panoramica" | "Vendite" | "Acquisti" | "Fisco" | "Personale" | "Impostazioni";

export const NAV_GROUPS: NavGroup[] = ["Panoramica", "Vendite", "Acquisti", "Fisco", "Personale", "Impostazioni"];

export interface NavItem {
  href: string;
  /** Sezione della navigazione (come in un gestionale). */
  group: NavGroup;
  label: string;
  icon: LucideIcon;
  /** true = sta nella barra in basso su mobile; false = nel menu "Altro". */
  primary: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", group: "Panoramica", label: "Oggi", icon: CalendarCheck, primary: true },
  { href: "/scadenzario", group: "Panoramica", label: "Scadenzario", icon: CalendarClock, primary: false },
  { href: "/report", group: "Panoramica", label: "Report", icon: BarChart3, primary: false },
  { href: "/clienti", group: "Vendite", label: "Clienti", icon: Users, primary: false },
  { href: "/preventivi", group: "Vendite", label: "Preventivi", icon: FileText, primary: false },
  { href: "/fatture", group: "Vendite", label: "Fatture", icon: Receipt, primary: true },
  { href: "/incassi", group: "Vendite", label: "Incassi", icon: HandCoins, primary: true },
  { href: "/servizi", group: "Vendite", label: "Servizi", icon: Package, primary: false },
  { href: "/spese", group: "Acquisti", label: "Spese", icon: ShoppingCart, primary: false },
  { href: "/tasse", group: "Fisco", label: "Tasse", icon: Landmark, primary: true },
  { href: "/normativa", group: "Fisco", label: "Normativa", icon: Scale, primary: false },
  { href: "/commercialista", group: "Fisco", label: "Commercialista", icon: Mail, primary: false },
  { href: "/personale", group: "Personale", label: "Finanze personali", icon: Wallet, primary: false },
  { href: "/investimenti", group: "Personale", label: "Investimenti", icon: TrendingUp, primary: false },
  { href: "/impostazioni", group: "Impostazioni", label: "Impostazioni", icon: Settings, primary: false },
];

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  // Le vecchie pagine personali restano sotto la voce "Personale".
  if (href === "/personale") {
    return pathname.startsWith("/personale") || pathname.startsWith("/transazioni") || pathname.startsWith("/budget");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
