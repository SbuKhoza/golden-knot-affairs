import { createFileRoute } from "@tanstack/react-router";

// Firebase Storage buckets don't send CORS headers by default, so the browser
// can't fetch the uploaded invitation template directly. This same-origin
// proxy fetches it server-side and streams the bytes back.
const ALLOWED_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
]);

export const Route = createFileRoute("/api/public/invitation-template")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url) return new Response("Missing url", { status: 400 });

        let target: URL;
        try {
          target = new URL(url);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }

        if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
          return new Response("Forbidden host", { status: 403 });
        }

        const upstream = await fetch(target.toString());
        if (!upstream.ok) {
          return new Response(`Upstream error ${upstream.status}`, { status: 502 });
        }

        const bytes = await upstream.arrayBuffer();
        return new Response(bytes, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
