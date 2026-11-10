"use client";

import { usePathname } from "next/navigation";

import { MORE_NAV, PRIMARY_NAV, SOS_HREF, isActivePath } from "@/components/layout/nav-items";
import type { TKey } from "@/lib/i18n";
import { useT } from "@/providers/i18n-provider";

const PAGES: { href: string; label: TKey }[] = [
  ...PRIMARY_NAV,
  ...MORE_NAV,
  { href: SOS_HREF, label: "nav.emergency" },
  { href: "/login", label: "auth.signIn" },
  { href: "/register", label: "auth.createAccount" },
  { href: "/forgot-password", label: "auth.forgotTitle" },
  { href: "/reset-password", label: "auth.setNewPassword" },
];

/**
 * Names the browser tab after the current page, in the chosen language.
 * The language lives in the browser, so the root metadata has no title of its own:
 * React places this <title> in the document head.
 */
export function DocumentTitle() {
  const pathname = usePathname();
  const { t } = useT();
  const page = PAGES.find((p) => isActivePath(pathname, p.href));
  return <title>{page ? `${t(page.label)} · ZERNO` : `ZERNO · ${t("brand.tagline")}`}</title>;
}
