import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckInPanel } from "@/components/admin/CheckInPanel";
import { Loader } from "@/components/common/Loader";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminSignOut } from "@/services/authService";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Entrance Scanner — Wedding" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScanRoute,
});

/** Entrance page for "scan-admin" staff (full admins may use it too). */
function ScanRoute() {
  const { loading, user, role } = useAdminAuth();
  const navigate = useNavigate();

  if (loading) return <Loader full label="Checking your access…" />;

  if (!user || !role) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl">Scanner access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please sign in with a scanner or administrator account.</p>
          <Link
            to="/admin/login"
            className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-xs uppercase tracking-[0.25em] text-primary-foreground"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl">Entrance check-in</h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await adminSignOut();
            navigate({ to: "/admin/login" });
          }}
          className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-secondary"
        >
          Logout
        </button>
      </header>
      <main className="p-4 sm:p-6">
        <CheckInPanel />
      </main>
    </div>
  );
}
