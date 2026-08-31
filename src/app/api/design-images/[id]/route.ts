import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await createAdminClient().from("designs").select("image_url,sequence_number").eq("id", id).single();
  if (error || !data) return new Response("Image not found", { status: 404 });

  let upstream: Response;
  try {
    // Large legacy images exceed Next.js' 2 MB data-cache item limit. The
    // same-origin response and next/image optimizer provide the cache layer.
    upstream = await fetch(data.image_url, { cache: "no-store" });
  } catch {
    return new Response("Image source unavailable", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) return new Response("Image source unavailable", { status: 502 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const isSvg = contentType.includes("svg");
  const extension = isSvg ? "svg" : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      ...(isSvg ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox" } : {}),
      ...(download ? { "Content-Disposition": `attachment; filename="design-${data.sequence_number}.${extension}"` } : {}),
    },
  });
}
