export async function onRequestGet(context) {
  const { env, request } = context;

  if (!env.RESTORATION_IMAGES) {
    return new Response("Missing RESTORATION_IMAGES binding", { status: 500 });
  }

  const url = new URL(request.url);
  let key = url.searchParams.get("key") || "";
  key = decodeURIComponent(key);

  if (!key) {
    return new Response("Missing image key", { status: 400 });
  }

  const object = await env.RESTORATION_IMAGES.get(key);
  if (!object) {
    return new Response("Image not found: " + key, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.get("content-type")) headers.set("content-type", "image/jpeg");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
