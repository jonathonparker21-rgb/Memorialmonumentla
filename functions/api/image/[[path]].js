export async function onRequestGet(context) {
  const { env, params, request } = context;

  if (!env.RESTORATION_IMAGES) {
    return new Response("Missing RESTORATION_IMAGES binding", { status: 500 });
  }

  let key = params.path;
  if (Array.isArray(key)) key = key.join("/");
  if (!key) {
    const url = new URL(request.url);
    key = url.pathname.replace(/^\/api\/image\//, "");
  }
  key = decodeURIComponent(key || "");

  const object = await env.RESTORATION_IMAGES.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
