/* FORCE_REFRESH_BUILD v1.2.5 2026-04-29 13:10:31 */
export async function onRequestGet(context) {
  const { env } = context;
  try {
    const kvContent = env.SITE_CONTENT ? await env.SITE_CONTENT.get("site-content", "text") : null;
    if (kvContent) {
      return new Response(kvContent, {
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
      });
    }

    const fallbackUrl = new URL("/site-content.json", context.request.url);
    const fallback = await fetch(fallbackUrl.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
    const text = await fallback.text();
    return new Response(text, {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to load content." }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
}
