"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, Shirt, Users } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/designs", label: "Designs", icon: Images },
  { href: "/karigars", label: "Karigars", icon: Users },
  { href: "/cloth-types", label: "Cloth Types", icon: Shirt },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav-links" aria-label="Primary navigation">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : undefined}>
            <Icon size={19} /> <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
