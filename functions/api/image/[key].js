/* FORCE_REFRESH_BUILD v1.4.6 2026-04-29 13:10:31 */
export async function onRequestGet(context) {
  const { env, params } = context;
  const key = params.key;
  const object = await env.RESTORATION_IMAGES.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
