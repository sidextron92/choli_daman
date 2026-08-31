import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { BrandIcon } from "@/components/brand-icon";
import { NavLinks } from "@/components/nav-links";

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><BrandIcon size={36} /></div>
          <div><strong>Choli Daman</strong><small>Design house</small></div>
        </div>
        <NavLinks />
        <div className="sidebar-footer">
          <span title={email}>{email}</span>
          <form action={logoutAction}>
            <button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
          </form>
        </div>
      </aside>
      <div className="main-column">
        <header className="mobile-header">
          <div className="brand"><div className="brand-mark"><BrandIcon size={31} /></div><strong>Choli Daman</strong></div>
          <form className="mobile-logout" action={logoutAction}>
            <button className="icon-button" title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
          </form>
        </header>
        <main className="content">{children}</main>
        <div className="mobile-nav"><NavLinks /></div>
      </div>
    </div>
  );
}
