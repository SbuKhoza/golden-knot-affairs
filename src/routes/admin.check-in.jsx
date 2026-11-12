import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CheckInPanel } from "@/components/admin/CheckInPanel";

export const Route = createFileRoute("/admin/check-in")({
  head: () => ({
    meta: [
      { title: "Entrance check-in — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell title="Entrance check-in">
      <CheckInPanel />
    </AdminShell>
  ),
});
