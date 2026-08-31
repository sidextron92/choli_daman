import { BrandIcon } from "@/components/brand-icon";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark large-mark"><BrandIcon size={50} /></div>
        <p className="eyebrow">Design house</p>
        <h1>Choli Daman</h1>
        <p className="muted">Sign in to manage designs, karigars and cloth pricing.</p>
        <LoginForm />
      </section>
    </main>
  );
}
