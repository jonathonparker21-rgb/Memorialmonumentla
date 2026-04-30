/* FORCE_REFRESH_BUILD v1.2.6 2026-04-29 13:10:31 */
function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function checkAuth(request, env) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Basic ")) return false;
  const raw = atob(auth.slice(6));
  const splitAt = raw.indexOf(":");
  if (splitAt === -1) return false;
  const username = raw.slice(0, splitAt);
  const password = raw.slice(splitAt + 1);

  const expectedUser = env.OWNER_USERNAME || "admin";
  const expectedPass = env.OWNER_PASSWORD || "ChangeMe123!";
  return username === expectedUser && password === expectedPass;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await checkAuth(request, env))) return unauthorized();

  try {
    const { key } = await request.json();
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing key." }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
    await env.RESTORATION_IMAGES.delete(key);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to delete image." }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
}
