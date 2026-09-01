import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminSignIn } from "@/services/authService";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { friendlyError } from "@/utils/format";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Wedding Dashboard" },
      { name: "description", content: "Administrator sign in for the wedding invitation dashboard." },
      { property: "og:title", content: "Admin Login" },
      { property: "og:description", content: "Administrator sign in for the wedding invitation dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && isAdmin) navigate({ to: "/admin/dashboard" });
  }, [user, isAdmin, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await adminSignIn(email, password);
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      setError(
        err?.code === "not-admin"
          ? "That account doesn't have administrator access."
          : friendlyError(err, "We couldn't sign you in. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm"
        noValidate
      >
        <h1 className="text-center font-display text-2xl">Administrator sign in</h1>
        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-md border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring/40"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-md border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring/40"
              required
            />
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-5 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-md bg-primary py-3.5 text-xs uppercase tracking-[0.25em] text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Admin accounts are created in the Firebase console — see FIREBASE_SETUP.md.
        </p>
      </form>
    </main>
  );
}
