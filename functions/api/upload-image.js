/* FORCE_REFRESH_BUILD v1.2.3 2026-04-29 13:10:31 */
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

function sanitizeFilename(name = "upload") {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").toLowerCase();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!(await checkAuth(request, env))) return unauthorized();

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file uploaded." }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const key = `restoration/${Date.now()}-${sanitizeFilename(file.name || "photo")}`;
    await env.RESTORATION_IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" }
    });

    const publicBase = env.R2_PUBLIC_BASE_URL || "";
    const url = publicBase
      ? `${publicBase.replace(/\/$/, "")}/${key}`
      : `/api/image/${encodeURIComponent(key)}`;

    return new Response(JSON.stringify({ ok: true, key, url }), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to upload image." }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
}
